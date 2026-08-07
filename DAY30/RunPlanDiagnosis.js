import {
  ERROR_CODES,
  assertNonEmptyString,
  createApplicationError,
  isApplicationError,
  wrapUnexpectedError
} from "./DiagnosisErrors.js";

import {
  assertProductionPlanRepository,
  assertProductionPlanVersionRepository,
  assertPlannedOperationRepository,
  assertAssumptionRepository,
  assertDiagnosisScenarioRepository,
  assertScenarioAssumptionRelationRepository,
  assertDiagnosisResultRepository
} from "./DiagnosisRepositoryContracts.js";

import {
  assertInMemoryRepositoryTransactionManager
} from "./InMemoryRepositoryTransactionManager.js";

import {
  assertClock,
  readClockNow
} from "./Clock.js";

import {
  assertDiagnosisExecutionDataProvider,
  loadDiagnosisExecutionData
} from "./DiagnosisExecutionDataProvider.js";

function assertEngine(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    typeof value.diagnose !== "function"
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_RUN_PLAN_DIAGNOSIS,
      "planDiagnosisEngine must implement diagnose(input).",
      { requiredMethod: "diagnose" }
    );
  }
  return value;
}

function assertIdentifier(value, label) {
  const identifier = assertNonEmptyString(
    value,
    ERROR_CODES.INVALID_RUN_PLAN_DIAGNOSIS,
    label
  );

  if (/\s/.test(identifier)) {
    throw createApplicationError(
      ERROR_CODES.INVALID_RUN_PLAN_DIAGNOSIS,
      `${label} must not contain whitespace.`,
      { value, label }
    );
  }

  return identifier;
}

function assertRepositoryRevision(repository, name) {
  const revision = repository?.revision;
  if (!Number.isInteger(revision) || revision < 0) {
    throw createApplicationError(
      ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
      `${name} must expose a non-negative integer revision.`,
      { name, revision }
    );
  }
  return revision;
}

function freezeRevision(value) {
  return Object.freeze({ ...value });
}

/**
 * Repositoryから診断対象を読込み、PlanDiagnosisEngineを実行し、
 * DiagnosisResultを一つのTransactionで保存するApplication Service。
 */
export class RunPlanDiagnosis {
  #transactionManager;
  #repositories;
  #planDiagnosisEngine;
  #dataProvider;
  #clock;

  constructor({
    transactionManager,
    planDiagnosisEngine,
    diagnosisExecutionDataProvider,
    clock
  } = {}) {
    this.#transactionManager =
      assertInMemoryRepositoryTransactionManager(transactionManager);
    this.#repositories = this.#assertRepositories(
      this.#transactionManager.repositories
    );
    this.#planDiagnosisEngine = assertEngine(planDiagnosisEngine);
    this.#dataProvider = assertDiagnosisExecutionDataProvider(
      diagnosisExecutionDataProvider
    );
    this.#clock = assertClock(clock);

    Object.freeze(this);
  }

  async execute({ diagnosisScenarioId } = {}) {
    const scenarioId = assertIdentifier(
      diagnosisScenarioId,
      "diagnosisScenarioId"
    );

    const baselineRevision = this.#captureInputRevision();
    const scenario = this.#repositories.diagnosisScenarios.getById(scenarioId);

    if (!scenario.active || scenario.isArchived()) {
      throw createApplicationError(
        ERROR_CODES.DIAGNOSIS_EXECUTION_NOT_ALLOWED,
        "Inactive or archived Diagnosis Scenario cannot be executed.",
        { diagnosisScenarioId: scenarioId }
      );
    }

    const planVersion = this.#repositories.planVersions.getById(
      scenario.planVersionId
    );
    const productionPlan = this.#repositories.productionPlans.getById(
      planVersion.planId
    );

    if (!productionPlan.active) {
      throw createApplicationError(
        ERROR_CODES.DIAGNOSIS_EXECUTION_NOT_ALLOWED,
        "Inactive Production Plan cannot be diagnosed.",
        { productionPlanId: productionPlan.planId }
      );
    }

    if (!planVersion.active) {
      throw createApplicationError(
        ERROR_CODES.DIAGNOSIS_EXECUTION_NOT_ALLOWED,
        "Inactive Plan Version cannot be diagnosed.",
        { planVersionId: planVersion.planVersionId }
      );
    }

    const plannedOperations =
      this.#repositories.plannedOperations.findByPlanVersionId(
        planVersion.planVersionId
      );

    if (plannedOperations.length === 0) {
      throw createApplicationError(
        ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
        "The Plan Version has no Planned Operations.",
        { planVersionId: planVersion.planVersionId }
      );
    }

    const scenarioAssumptionRelations =
      this.#repositories.scenarioAssumptionRelations
        .findActiveByScenarioId(scenarioId);
    const assumptions = this.#loadRelatedAssumptions(
      scenarioAssumptionRelations
    );

    const executionData = await loadDiagnosisExecutionData(
      this.#dataProvider,
      Object.freeze({
        diagnosisScenarioId: scenario.diagnosisScenarioId,
        planVersionId: planVersion.planVersionId,
        productionPlanId: productionPlan.planId,
        capacityScenarioId: scenario.capacityScenarioId,
        targetMonth: productionPlan.targetMonth,
        plannedOperationIds: Object.freeze(
          plannedOperations.map((operation) => operation.plannedOperationId)
        )
      })
    );

    this.#assertSourceIdentity({
      productionPlan,
      diagnosisScenario: scenario,
      executionData
    });
    this.#assertUnchanged(baselineRevision);

    const diagnosisInputRevision = this.#mergeDiagnosisInputRevision(
      baselineRevision,
      executionData.externalInputRevision
    );
    const diagnosedAt = readClockNow(this.#clock);

    let diagnosisResult;
    try {
      diagnosisResult = this.#planDiagnosisEngine.diagnose({
        diagnosisScenario: scenario,
        plannedOperations,
        productionPlanId: productionPlan.planId,
        assumptions,
        scenarioAssumptionRelations,
        diagnosisInputRevision,
        diagnosedAt,
        ...executionData.toEngineInput(),
        defaultFactoryId:
          executionData.defaultFactoryId ?? productionPlan.primaryFactoryId
      });
    } catch (error) {
      if (isApplicationError(error)) {
        throw error;
      }
      throw wrapUnexpectedError(error, {
        component: "RunPlanDiagnosis",
        operation: "planDiagnosisEngine.diagnose",
        diagnosisScenarioId: scenarioId
      });
    }

    this.#assertUnchanged(baselineRevision);

    return this.#transactionManager.execute((repositories) => {
      this.#assertUnchanged(baselineRevision);
      repositories.diagnosisResults.add(diagnosisResult);
      return diagnosisResult;
    });
  }

  #assertRepositories(repositories) {
    const required = [
      "productionPlans",
      "planVersions",
      "plannedOperations",
      "assumptions",
      "diagnosisScenarios",
      "scenarioAssumptionRelations",
      "diagnosisResults"
    ];

    for (const name of required) {
      if (!(name in repositories)) {
        throw createApplicationError(
          ERROR_CODES.INVALID_RUN_PLAN_DIAGNOSIS,
          `transactionManager.repositories.${name} is required.`,
          { name }
        );
      }
    }

    assertProductionPlanRepository(repositories.productionPlans);
    assertProductionPlanVersionRepository(repositories.planVersions);
    assertPlannedOperationRepository(repositories.plannedOperations);
    assertAssumptionRepository(repositories.assumptions);
    assertDiagnosisScenarioRepository(repositories.diagnosisScenarios);
    assertScenarioAssumptionRelationRepository(
      repositories.scenarioAssumptionRelations
    );
    assertDiagnosisResultRepository(repositories.diagnosisResults);

    return repositories;
  }

  #captureInputRevision() {
    return freezeRevision({
      plan: assertRepositoryRevision(
        this.#repositories.productionPlans,
        "productionPlans"
      ),
      planVersion: assertRepositoryRevision(
        this.#repositories.planVersions,
        "planVersions"
      ),
      plannedOperation: assertRepositoryRevision(
        this.#repositories.plannedOperations,
        "plannedOperations"
      ),
      assumption: assertRepositoryRevision(
        this.#repositories.assumptions,
        "assumptions"
      ),
      diagnosisScenario: assertRepositoryRevision(
        this.#repositories.diagnosisScenarios,
        "diagnosisScenarios"
      ),
      scenarioAssumptionRelation: assertRepositoryRevision(
        this.#repositories.scenarioAssumptionRelations,
        "scenarioAssumptionRelations"
      )
    });
  }

  #assertUnchanged(baselineRevision) {
    const current = this.#captureInputRevision();
    const changed = Object.keys(baselineRevision).filter(
      (key) => current[key] !== baselineRevision[key]
    );

    if (changed.length > 0) {
      throw createApplicationError(
        ERROR_CODES.DIAGNOSIS_SOURCE_CHANGED_DURING_EXECUTION,
        "Diagnosis source repositories changed during execution.",
        {
          changed,
          baselineRevision,
          currentRevision: current
        }
      );
    }
  }

  #loadRelatedAssumptions(relations) {
    const assumptionIds = [...new Set(
      relations.map((relation) => relation.assumptionId)
    )];

    return Object.freeze(assumptionIds.map((assumptionId) => {
      const assumption = this.#repositories.assumptions.findById(assumptionId);
      if (assumption === null) {
        throw createApplicationError(
          ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
          "Scenario–Assumption Relation references a missing Assumption.",
          { assumptionId }
        );
      }
      return assumption;
    }));
  }

  #assertSourceIdentity({
    productionPlan,
    diagnosisScenario,
    executionData
  }) {
    const snapshot = executionData.capacitySnapshot;

    if (snapshot.capacityScenarioId !== diagnosisScenario.capacityScenarioId) {
      throw createApplicationError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "Execution data and Diagnosis Scenario reference different Capacity Scenarios.",
        {
          scenarioCapacityScenarioId: diagnosisScenario.capacityScenarioId,
          snapshotCapacityScenarioId: snapshot.capacityScenarioId
        }
      );
    }

    if (snapshot.targetMonth !== productionPlan.targetMonth) {
      throw createApplicationError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "Capacity Snapshot targetMonth must equal Production Plan targetMonth.",
        {
          planTargetMonth: productionPlan.targetMonth,
          snapshotTargetMonth: snapshot.targetMonth
        }
      );
    }
  }

  #mergeDiagnosisInputRevision(repositoryRevision, externalRevision) {
    const duplicated = Object.keys(externalRevision).filter(
      (key) => key in repositoryRevision
    );

    if (duplicated.length > 0) {
      throw createApplicationError(
        ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
        "External input revisions must not overwrite Repository revisions.",
        { duplicated }
      );
    }

    return freezeRevision({
      ...repositoryRevision,
      ...externalRevision
    });
  }
}
