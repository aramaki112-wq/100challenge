import {
  CONSTRAINT_SEVERITY,
  NEXT_CHECK_PRIORITY,
  NEXT_CHECK_STATUS
} from "./DiagnosisCodes.js";
import {
  ERROR_CODES,
  createRepositoryError,
  assertNonEmptyString
} from "./DiagnosisErrors.js";
import { assertDate } from "./DateTimeUtils.js";
import {
  assertRepositoryContract,
  PRODUCTION_PLAN_REPOSITORY_CONTRACT,
  PRODUCTION_PLAN_VERSION_REPOSITORY_CONTRACT,
  PLANNED_OPERATION_REPOSITORY_CONTRACT,
  ASSUMPTION_REPOSITORY_CONTRACT,
  DIAGNOSIS_SCENARIO_REPOSITORY_CONTRACT,
  SCENARIO_ASSUMPTION_RELATION_REPOSITORY_CONTRACT,
  DIAGNOSIS_RESULT_REPOSITORY_CONTRACT
} from "./DiagnosisRepositoryContracts.js";
import { DiagnosisReadModel } from "./DiagnosisReadModel.js";
import { ScenarioComparison } from "./ScenarioComparison.js";

function deepFreeze(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(deepFreeze));
  }
  if (value !== null && typeof value === "object") {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = deepFreeze(child);
    }
    return Object.freeze(result);
  }
  return value;
}

function optionalText(value, label) {
  if (value === null || value === undefined || value === "") return null;
  return assertNonEmptyString(value, ERROR_CODES.INVALID_ARGUMENT, label);
}

function latestResultForScenarios(resultRepository, scenarios) {
  const results = scenarios.flatMap((scenario) =>
    resultRepository.findByScenarioId(scenario.diagnosisScenarioId)
  );
  return results.length === 0
    ? null
    : [...results].sort((a, b) => a.diagnosedAt.localeCompare(b.diagnosedAt)).at(-1);
}

function resultOverview(result) {
  if (result === null) return null;
  const summary = result.summary;
  return deepFreeze({
    diagnosisResultId: result.diagnosisResultId,
    status: result.status,
    validityStatus: result.validityStatus,
    validityReasonCodes: result.validityReasonCodes,
    diagnosedAt: result.diagnosedAt,
    operationCount: result.operationCount,
    statusCounts: summary.statusCounts,
    quantityTotalsByUnit: summary.quantityTotalsByUnit,
    minutesSummary: summary.minutesSummary,
    findingSummary: summary.findingSummary,
    nextCheckSummary: summary.nextCheckSummary,
    requiresActionOperationCount: summary.requiresActionOperationCount
  });
}

const ACTION_PRIORITY_SCORE = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4
});

export const ACTION_ITEM_TYPE = Object.freeze({
  CONSTRAINT: "CONSTRAINT",
  ASSUMPTION: "ASSUMPTION",
  NEXT_CHECK: "NEXT_CHECK"
});

export class RepositoryDiagnosisReadModel extends DiagnosisReadModel {
  constructor({ repositories } = {}) {
    super();
    if (repositories === null || typeof repositories !== "object") {
      throw createRepositoryError(
        ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
        "repositories are required.",
        { repositories }
      );
    }

    assertRepositoryContract(repositories.productionPlans, PRODUCTION_PLAN_REPOSITORY_CONTRACT);
    assertRepositoryContract(repositories.planVersions, PRODUCTION_PLAN_VERSION_REPOSITORY_CONTRACT);
    assertRepositoryContract(repositories.plannedOperations, PLANNED_OPERATION_REPOSITORY_CONTRACT);
    assertRepositoryContract(repositories.assumptions, ASSUMPTION_REPOSITORY_CONTRACT);
    assertRepositoryContract(repositories.diagnosisScenarios, DIAGNOSIS_SCENARIO_REPOSITORY_CONTRACT);
    assertRepositoryContract(repositories.scenarioAssumptionRelations, SCENARIO_ASSUMPTION_RELATION_REPOSITORY_CONTRACT);
    assertRepositoryContract(repositories.diagnosisResults, DIAGNOSIS_RESULT_REPOSITORY_CONTRACT);
    this.repositories = repositories;
    Object.freeze(this);
  }

  listPlanSummaries({ targetMonth = null, activeOnly = false } = {}) {
    const plans = targetMonth === null
      ? this.repositories.productionPlans.findAll()
      : this.repositories.productionPlans.findByTargetMonth(targetMonth);

    const rows = plans
      .filter((plan) => !activeOnly || plan.active)
      .map((plan) => {
        const versions = this.repositories.planVersions.findByPlanId(plan.planId);
        const latestVersion = versions.length === 0 ? null : versions.at(-1);
        const scenarios = latestVersion === null
          ? []
          : this.repositories.diagnosisScenarios.findByPlanVersionId(latestVersion.planVersionId);
        const latestResult = latestResultForScenarios(this.repositories.diagnosisResults, scenarios);
        return {
          ...plan.toSnapshot(),
          versionCount: versions.length,
          latestPlanVersionId: latestVersion?.planVersionId ?? null,
          latestVersionNumber: latestVersion?.versionNumber ?? null,
          latestVersionStatus: latestVersion?.status ?? null,
          activeScenarioCount: scenarios.filter((scenario) => scenario.active).length,
          latestDiagnosis: resultOverview(latestResult)
        };
      })
      .sort((a, b) =>
        b.targetMonth.localeCompare(a.targetMonth) ||
        a.name.localeCompare(b.name, "ja") ||
        a.planId.localeCompare(b.planId)
      );

    return deepFreeze(rows);
  }

  listScenarioSummaries({ planVersionId, activeOnly = false } = {}) {
    const id = assertNonEmptyString(
      planVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "planVersionId"
    );
    this.repositories.planVersions.getById(id);

    const rows = this.repositories.diagnosisScenarios
      .findByPlanVersionId(id)
      .filter((scenario) => !activeOnly || scenario.active)
      .map((scenario) => {
        const relations = this.repositories.scenarioAssumptionRelations
          .findActiveByScenarioId(scenario.diagnosisScenarioId);
        const latestResult = this.repositories.diagnosisResults
          .findLatestByScenarioId(scenario.diagnosisScenarioId);
        return {
          ...scenario.toSnapshot(),
          activeAssumptionCount: relations.length,
          latestDiagnosis: resultOverview(latestResult)
        };
      })
      .sort((a, b) =>
        Number(b.active) - Number(a.active) ||
        a.name.localeCompare(b.name, "ja") ||
        a.diagnosisScenarioId.localeCompare(b.diagnosisScenarioId)
      );

    return deepFreeze(rows);
  }

  getLatestDiagnosisOverview({ diagnosisScenarioId } = {}) {
    const id = assertNonEmptyString(
      diagnosisScenarioId,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_ID,
      "diagnosisScenarioId"
    );
    const scenario = this.repositories.diagnosisScenarios.getById(id);
    const latestResult = this.repositories.diagnosisResults.findLatestByScenarioId(id);
    return deepFreeze({
      diagnosisScenarioId: scenario.diagnosisScenarioId,
      scenarioName: scenario.name,
      planVersionId: scenario.planVersionId,
      capacityScenarioId: scenario.capacityScenarioId,
      hasDiagnosisResult: latestResult !== null,
      latestDiagnosis: resultOverview(latestResult)
    });
  }

  getScenarioComparison({ comparisonScenarioId } = {}) {
    const id = assertNonEmptyString(
      comparisonScenarioId,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_ID,
      "comparisonScenarioId"
    );
    const comparisonScenario = this.repositories.diagnosisScenarios.getById(id);
    const baseScenarioId = comparisonScenario.baseDiagnosisScenarioId;

    if (baseScenarioId === null) {
      return deepFreeze({
        comparisonAvailable: false,
        comparisonScenarioId: id,
        baseScenarioId: null,
        reasonCode: "BASE_SCENARIO_NOT_CONFIGURED",
        message: "比較元Scenarioが設定されていません。"
      });
    }

    const baseScenario = this.repositories.diagnosisScenarios.getById(baseScenarioId);
    const baseResult = this.repositories.diagnosisResults.findLatestByScenarioId(baseScenarioId);
    const comparisonResult = this.repositories.diagnosisResults.findLatestByScenarioId(id);

    if (baseResult === null || comparisonResult === null) {
      const missing = [];
      if (baseResult === null) missing.push("BASE_DIAGNOSIS_NOT_FOUND");
      if (comparisonResult === null) missing.push("COMPARISON_DIAGNOSIS_NOT_FOUND");
      return deepFreeze({
        comparisonAvailable: false,
        comparisonScenarioId: id,
        baseScenarioId,
        reasonCode: missing.join("+"),
        message: "比較元と比較先の両方を診断してください。"
      });
    }

    const comparedAt = [baseResult.diagnosedAt, comparisonResult.diagnosedAt]
      .sort()
      .at(-1);
    const comparison = new ScenarioComparison({
      scenarioComparisonId:
        `SCMP::${baseResult.diagnosisResultId}::${comparisonResult.diagnosisResultId}`,
      baseScenario,
      comparisonScenario,
      baseResult,
      comparisonResult,
      comparedAt
    });

    return deepFreeze({
      comparisonAvailable: true,
      comparisonScenarioId: id,
      baseScenarioId,
      comparison: comparison.toSnapshot()
    });
  }

  getDiagnosisResultDetail({ diagnosisResultId } = {}) {
    const id = assertNonEmptyString(
      diagnosisResultId,
      ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
      "diagnosisResultId"
    );
    const result = this.repositories.diagnosisResults.getById(id);
    const scenario = this.repositories.diagnosisScenarios.getById(result.diagnosisScenarioId);
    const version = this.repositories.planVersions.getById(result.planVersionId);
    const plan = this.repositories.productionPlans.getById(version.planId);

    return deepFreeze({
      diagnosisResultId: result.diagnosisResultId,
      plan: plan.toSnapshot(),
      planVersion: version.toSnapshot(),
      scenario: scenario.toSnapshot(),
      metadata: {
        status: result.status,
        validityStatus: result.validityStatus,
        validityReasonCodes: result.validityReasonCodes,
        diagnosedAt: result.diagnosedAt,
        capacitySnapshotGeneratedAt: result.capacitySnapshotGeneratedAt,
        capacitySourceRevision: result.capacitySourceRevision,
        diagnosisInputRevision: result.diagnosisInputRevision
      },
      summary: result.summary.toSnapshot(),
      operationResults: [...result.operationResults]
        .sort((a, b) =>
          a.plannedDate.localeCompare(b.plannedDate) ||
          a.equipmentId.localeCompare(b.equipmentId) ||
          a.plannedOperationId.localeCompare(b.plannedOperationId)
        )
        .map((operationResult) => operationResult.toSnapshot())
    });
  }

  listActionItems({
    diagnosisResultId,
    includeClosed = false,
    evaluationDate = null
  } = {}) {
    const id = assertNonEmptyString(
      diagnosisResultId,
      ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
      "diagnosisResultId"
    );
    const result = this.repositories.diagnosisResults.getById(id);
    const date = evaluationDate === null
      ? result.diagnosedAt.slice(0, 10)
      : assertDate(evaluationDate, ERROR_CODES.INVALID_DATE, "evaluationDate");
    const items = [];

    for (const operation of result.operationResults) {
      for (const finding of operation.constraintFindings) {
        if (!finding.blocking && !finding.requiresImmediateAction()) continue;
        items.push({
          actionItemId: `CONSTRAINT:${finding.findingId}`,
          type: ACTION_ITEM_TYPE.CONSTRAINT,
          plannedOperationId: operation.plannedOperationId,
          orderId: operation.orderId,
          priority: finding.severity,
          status: finding.confirmationStatus,
          title: finding.title,
          description: finding.description,
          owner: null,
          dueDate: null,
          overdue: false,
          recommendedAction: optionalText(finding.recommendedAction, "recommendedAction")
        });
      }

      for (const finding of operation.assumptionFindings) {
        if (!finding.requiresNextCheck() && !finding.preventsExecution()) continue;
        items.push({
          actionItemId: `ASSUMPTION:${finding.findingId}`,
          type: ACTION_ITEM_TYPE.ASSUMPTION,
          plannedOperationId: operation.plannedOperationId,
          orderId: operation.orderId,
          priority: finding.impactLevel,
          status: finding.resolutionStatus,
          title: finding.description,
          description: finding.description,
          owner: finding.owner || null,
          dueDate: finding.confirmationDueDate,
          overdue: finding.confirmationDueDate !== null && date > finding.confirmationDueDate,
          recommendedAction: optionalText(finding.recommendedAction, "recommendedAction")
        });
      }

      for (const nextCheck of operation.nextChecks) {
        const closed = [
          NEXT_CHECK_STATUS.COMPLETED,
          NEXT_CHECK_STATUS.NOT_REQUIRED,
          NEXT_CHECK_STATUS.CANNOT_CONFIRM
        ].includes(nextCheck.status);
        if (!includeClosed && closed) continue;
        items.push({
          actionItemId: `NEXT_CHECK:${nextCheck.nextCheckId}`,
          type: ACTION_ITEM_TYPE.NEXT_CHECK,
          plannedOperationId: operation.plannedOperationId,
          orderId: operation.orderId,
          priority: nextCheck.priority,
          status: nextCheck.status,
          title: nextCheck.title,
          description: nextCheck.description,
          owner: nextCheck.owner || null,
          dueDate: nextCheck.dueDate,
          overdue: nextCheck.isOverdue(date),
          recommendedAction: null
        });
      }
    }

    items.sort((a, b) =>
      Number(b.overdue) - Number(a.overdue) ||
      (ACTION_PRIORITY_SCORE[a.priority] ?? 99) - (ACTION_PRIORITY_SCORE[b.priority] ?? 99) ||
      (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31") ||
      a.plannedOperationId.localeCompare(b.plannedOperationId) ||
      a.actionItemId.localeCompare(b.actionItemId)
    );

    return deepFreeze(items);
  }
}

export function assertRepositoryDiagnosisReadModel(value) {
  if (!(value instanceof RepositoryDiagnosisReadModel)) {
    throw createRepositoryError(
      ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
      "value must be a RepositoryDiagnosisReadModel.",
      { value }
    );
  }
  return value;
}
