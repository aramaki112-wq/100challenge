import {
  ASSUMPTION_TARGET_TYPE
} from "./DiagnosisCodes.js";
import {
  ERROR_CODES,
  createRepositoryError
} from "./DiagnosisErrors.js";
import { assertDateTime } from "./DateTimeUtils.js";
import { ProductionPlan } from "./ProductionPlan.js";
import { ProductionPlanVersion } from "./ProductionPlanVersion.js";
import { PlannedOperation } from "./PlannedOperation.js";
import { Assumption } from "./Assumption.js";
import { DiagnosisScenario } from "./DiagnosisScenario.js";
import { ScenarioAssumptionRelation } from "./ScenarioAssumptionRelation.js";
import { ConstraintFinding } from "./ConstraintFinding.js";
import { AssumptionFinding } from "./AssumptionFinding.js";
import { NextCheck } from "./NextCheck.js";
import { OperationDiagnosisResult } from "./OperationDiagnosisResult.js";
import { DiagnosisSummary } from "./DiagnosisSummary.js";
import { DiagnosisResult } from "./DiagnosisResult.js";
import { assertInMemoryEntityRepository } from "./InMemoryEntityRepository.js";

export const DIAGNOSIS_BACKUP_SCHEMA_VERSION = 1;
export const DIAGNOSIS_BACKUP_APPLICATION = "DAY30_PRODUCTION_PLAN_DIAGNOSIS";

const REPOSITORY_ORDER = Object.freeze([
  "productionPlans",
  "planVersions",
  "plannedOperations",
  "assumptions",
  "diagnosisScenarios",
  "scenarioAssumptionRelations",
  "diagnosisResults"
]);

const ID_FIELD_BY_REPOSITORY = Object.freeze({
  productionPlans: "planId",
  planVersions: "planVersionId",
  plannedOperations: "plannedOperationId",
  assumptions: "assumptionId",
  diagnosisScenarios: "diagnosisScenarioId",
  scenarioAssumptionRelations: "relationId",
  diagnosisResults: "diagnosisResultId"
});

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    for (const child of value) deepFreeze(child);
  } else {
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return Object.freeze(value);
}

function assertPlainObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw createRepositoryError(
      ERROR_CODES.INVALID_REPOSITORY_SNAPSHOT,
      `${label} must be a plain object.`,
      { label, value }
    );
  }
  return value;
}

function assertRepositorySet(repositories) {
  assertPlainObject(repositories, "repositories");
  for (const name of REPOSITORY_ORDER) {
    try {
      assertInMemoryEntityRepository(repositories[name]);
    } catch (cause) {
      throw createRepositoryError(
        ERROR_CODES.INVALID_REPOSITORY_SNAPSHOT,
        `${name} must be an InMemoryEntityRepository.`,
        { name },
        cause
      );
    }
  }
  return repositories;
}

function assertRepositoryDocument(document, name) {
  const value = assertPlainObject(document, `repositories.${name}`);
  if (!Number.isInteger(value.revision) || value.revision < 0) {
    throw createRepositoryError(
      ERROR_CODES.INVALID_REPOSITORY_SNAPSHOT,
      `${name}.revision must be a non-negative integer.`,
      { name, revision: value.revision }
    );
  }
  if (!Array.isArray(value.items)) {
    throw createRepositoryError(
      ERROR_CODES.INVALID_REPOSITORY_SNAPSHOT,
      `${name}.items must be an array.`,
      { name, items: value.items }
    );
  }
  return value;
}

function hydrateOperationResult(snapshot) {
  const source = assertPlainObject(snapshot, "operationResult");
  return new OperationDiagnosisResult({
    ...source,
    constraintFindings: (source.constraintFindings ?? []).map(
      (finding) => new ConstraintFinding(finding)
    ),
    assumptionFindings: (source.assumptionFindings ?? []).map(
      (finding) => new AssumptionFinding(finding)
    ),
    nextChecks: (source.nextChecks ?? []).map(
      (nextCheck) => new NextCheck(nextCheck)
    )
  });
}

function hydrateDiagnosisResult(snapshot) {
  const source = assertPlainObject(snapshot, "diagnosisResult");
  const operationResults = (source.operationResults ?? []).map(
    hydrateOperationResult
  );
  const summarySource = assertPlainObject(source.summary, "diagnosisResult.summary");
  const summary = new DiagnosisSummary({
    diagnosisSummaryId: summarySource.diagnosisSummaryId,
    diagnosisScenarioId: summarySource.diagnosisScenarioId,
    planVersionId: summarySource.planVersionId,
    operationResults,
    generatedAt: summarySource.generatedAt
  });
  return new DiagnosisResult({
    ...source,
    operationResults,
    summary
  });
}

const HYDRATORS = Object.freeze({
  productionPlans: (snapshot) => new ProductionPlan(snapshot),
  planVersions: (snapshot) => new ProductionPlanVersion(snapshot),
  plannedOperations: (snapshot) => new PlannedOperation(snapshot),
  assumptions: (snapshot) => new Assumption(snapshot),
  diagnosisScenarios: (snapshot) => new DiagnosisScenario(snapshot),
  scenarioAssumptionRelations: (snapshot) => {
    const source = assertPlainObject(snapshot, "scenarioAssumptionRelation");
    return new ScenarioAssumptionRelation({
      diagnosisScenarioId: source.diagnosisScenarioId,
      assumptionId: source.assumptionId,
      active: source.active,
      note: source.note
    });
  },
  diagnosisResults: hydrateDiagnosisResult
});

function entityId(name, entity) {
  if (name === "scenarioAssumptionRelations") return entity.relationId;
  return entity[ID_FIELD_BY_REPOSITORY[name]];
}

function mapById(name, entities) {
  const map = new Map();
  for (const entity of entities) {
    const id = entityId(name, entity);
    if (map.has(id)) {
      throw createRepositoryError(
        ERROR_CODES.INVALID_REPOSITORY_SNAPSHOT,
        `${name} contains a duplicate ID.`,
        { name, id }
      );
    }
    map.set(id, entity);
  }
  return map;
}

function assertReference(map, id, label, details = {}) {
  if (!map.has(id)) {
    throw createRepositoryError(
      ERROR_CODES.INVALID_REPOSITORY_SNAPSHOT,
      `${label} references a missing entity.`,
      { ...details, id, label }
    );
  }
}

function validateReferences(entityMaps) {
  const plans = entityMaps.productionPlans;
  const versions = entityMaps.planVersions;
  const operations = entityMaps.plannedOperations;
  const assumptions = entityMaps.assumptions;
  const scenarios = entityMaps.diagnosisScenarios;

  for (const version of versions.values()) {
    assertReference(plans, version.planId, "ProductionPlanVersion.planId", {
      planVersionId: version.planVersionId
    });
  }
  for (const operation of operations.values()) {
    assertReference(versions, operation.planVersionId, "PlannedOperation.planVersionId", {
      plannedOperationId: operation.plannedOperationId
    });
  }
  for (const scenario of scenarios.values()) {
    assertReference(versions, scenario.planVersionId, "DiagnosisScenario.planVersionId", {
      diagnosisScenarioId: scenario.diagnosisScenarioId
    });
    if (scenario.baseDiagnosisScenarioId !== null) {
      assertReference(
        scenarios,
        scenario.baseDiagnosisScenarioId,
        "DiagnosisScenario.baseDiagnosisScenarioId",
        { diagnosisScenarioId: scenario.diagnosisScenarioId }
      );
    }
  }
  for (const assumption of assumptions.values()) {
    if (assumption.targetType === ASSUMPTION_TARGET_TYPE.PRODUCTION_PLAN) {
      assertReference(plans, assumption.targetId, "Assumption.targetId(PRODUCTION_PLAN)", {
        assumptionId: assumption.assumptionId
      });
    } else if (assumption.targetType === ASSUMPTION_TARGET_TYPE.PLAN_VERSION) {
      assertReference(versions, assumption.targetId, "Assumption.targetId(PLAN_VERSION)", {
        assumptionId: assumption.assumptionId
      });
    } else if (assumption.targetType === ASSUMPTION_TARGET_TYPE.PLANNED_OPERATION) {
      assertReference(operations, assumption.targetId, "Assumption.targetId(PLANNED_OPERATION)", {
        assumptionId: assumption.assumptionId
      });
    }
  }
  for (const relation of entityMaps.scenarioAssumptionRelations.values()) {
    assertReference(scenarios, relation.diagnosisScenarioId, "Relation.diagnosisScenarioId", {
      relationId: relation.relationId
    });
    assertReference(assumptions, relation.assumptionId, "Relation.assumptionId", {
      relationId: relation.relationId
    });
  }
  for (const result of entityMaps.diagnosisResults.values()) {
    assertReference(scenarios, result.diagnosisScenarioId, "DiagnosisResult.diagnosisScenarioId", {
      diagnosisResultId: result.diagnosisResultId
    });
    assertReference(versions, result.planVersionId, "DiagnosisResult.planVersionId", {
      diagnosisResultId: result.diagnosisResultId
    });
  }
}

function normalizeSnapshot(snapshot) {
  const root = assertPlainObject(snapshot, "snapshot");
  if (root.application !== DIAGNOSIS_BACKUP_APPLICATION) {
    throw createRepositoryError(
      ERROR_CODES.INVALID_BACKUP_DOCUMENT,
      "The backup application identifier is invalid.",
      { application: root.application }
    );
  }
  if (root.schemaVersion !== DIAGNOSIS_BACKUP_SCHEMA_VERSION) {
    throw createRepositoryError(
      ERROR_CODES.UNSUPPORTED_BACKUP_SCHEMA_VERSION,
      "The backup schema version is not supported.",
      {
        expected: DIAGNOSIS_BACKUP_SCHEMA_VERSION,
        actual: root.schemaVersion
      }
    );
  }
  const exportedAt = assertDateTime(
    root.exportedAt,
    ERROR_CODES.INVALID_REPOSITORY_SNAPSHOT,
    "exportedAt"
  );
  const documents = assertPlainObject(root.repositories, "snapshot.repositories");
  const normalized = {};
  for (const name of REPOSITORY_ORDER) {
    normalized[name] = assertRepositoryDocument(documents[name], name);
  }
  return { root, exportedAt, documents: normalized };
}

export class DiagnosisRepositorySnapshotService {
  #repositories;

  constructor({ repositories } = {}) {
    this.#repositories = assertRepositorySet(repositories);
    Object.freeze(this);
  }

  createSnapshot({ exportedAt } = {}) {
    const validExportedAt = assertDateTime(
      exportedAt,
      ERROR_CODES.INVALID_REPOSITORY_SNAPSHOT,
      "exportedAt"
    );
    const repositoryDocuments = {};
    for (const name of REPOSITORY_ORDER) {
      const repository = this.#repositories[name];
      repositoryDocuments[name] = {
        revision: repository.revision,
        items: repository.findAll().map((entity) => entity.toSnapshot())
      };
    }
    return deepFreeze({
      application: DIAGNOSIS_BACKUP_APPLICATION,
      schemaVersion: DIAGNOSIS_BACKUP_SCHEMA_VERSION,
      exportedAt: validExportedAt,
      repositories: repositoryDocuments
    });
  }

  restoreSnapshot(snapshot) {
    const { exportedAt, documents } = normalizeSnapshot(snapshot);
    const hydrated = {};
    const maps = {};
    for (const name of REPOSITORY_ORDER) {
      hydrated[name] = documents[name].items.map((item, index) => {
        try {
          return HYDRATORS[name](item);
        } catch (cause) {
          throw createRepositoryError(
            ERROR_CODES.PERSISTENCE_RESTORE_FAILED,
            `Failed to restore ${name} item.`,
            { name, index },
            cause
          );
        }
      });
      maps[name] = mapById(name, hydrated[name]);
    }
    validateReferences(maps);

    const previousStates = Object.fromEntries(
      REPOSITORY_ORDER.map((name) => [
        name,
        this.#repositories[name].captureState()
      ])
    );

    try {
      for (const name of REPOSITORY_ORDER) {
        this.#repositories[name].restoreState({
          items: maps[name],
          revision: documents[name].revision
        });
      }
    } catch (cause) {
      for (const name of REPOSITORY_ORDER) {
        this.#repositories[name].restoreState(previousStates[name]);
      }
      throw createRepositoryError(
        ERROR_CODES.PERSISTENCE_RESTORE_FAILED,
        "Repository restore failed and the previous state was recovered.",
        {},
        cause
      );
    }

    return deepFreeze({
      restoredAt: exportedAt,
      counts: Object.fromEntries(
        REPOSITORY_ORDER.map((name) => [name, hydrated[name].length])
      ),
      revisions: Object.fromEntries(
        REPOSITORY_ORDER.map((name) => [name, documents[name].revision])
      )
    });
  }
}

export function assertDiagnosisRepositorySnapshotService(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    typeof value.createSnapshot !== "function" ||
    typeof value.restoreSnapshot !== "function"
  ) {
    throw createRepositoryError(
      ERROR_CODES.INVALID_REPOSITORY_SNAPSHOT,
      "value does not satisfy the Diagnosis Repository Snapshot Service contract.",
      {}
    );
  }
  return value;
}
