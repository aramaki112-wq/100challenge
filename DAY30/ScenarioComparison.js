import {
  DIAGNOSIS_STATUS,
  OPERATION_COMPARISON_OUTCOME,
  RESULT_VALIDITY_STATUS,
  SCENARIO_COMPARISON_OUTCOME
} from "./DiagnosisCodes.js";
import {
  ERROR_CODES,
  assertNonEmptyString,
  createDomainError
} from "./DiagnosisErrors.js";
import { assertDiagnosisScenario } from "./DiagnosisScenario.js";
import { assertDateTime } from "./DateTimeUtils.js";
import { assertDiagnosisResult } from "./DiagnosisResult.js";

const STATUS_RANK = Object.freeze({
  [DIAGNOSIS_STATUS.INFEASIBLE]: 0,
  [DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE]: 1,
  [DIAGNOSIS_STATUS.FEASIBLE]: 2
});

function deepFreeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(deepFreeze));
  if (value !== null && typeof value === "object") {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = deepFreeze(child);
    }
    return Object.freeze(result);
  }
  return value;
}

function numericDelta(before, after) {
  return before === null || after === null || before === undefined || after === undefined
    ? null
    : after - before;
}

function compareStatus(before, after) {
  if (before === DIAGNOSIS_STATUS.UNKNOWN || after === DIAGNOSIS_STATUS.UNKNOWN) {
    return OPERATION_COMPARISON_OUTCOME.UNCERTAIN;
  }
  const delta = STATUS_RANK[after] - STATUS_RANK[before];
  if (delta > 0) return OPERATION_COMPARISON_OUTCOME.IMPROVED;
  if (delta < 0) return OPERATION_COMPARISON_OUTCOME.WORSENED;
  return null;
}

function deriveOperationOutcome(before, after, deltas) {
  if (before === null) return OPERATION_COMPARISON_OUTCOME.ADDED;
  if (after === null) return OPERATION_COMPARISON_OUTCOME.REMOVED;

  const statusOutcome = compareStatus(before.status, after.status);
  if (statusOutcome === OPERATION_COMPARISON_OUTCOME.UNCERTAIN) {
    return statusOutcome;
  }

  const improvedSignals = [
    statusOutcome === OPERATION_COMPARISON_OUTCOME.IMPROVED,
    deltas.diagnosedExecutableQuantity !== null && deltas.diagnosedExecutableQuantity > 0,
    deltas.diagnosedShortageQuantity !== null && deltas.diagnosedShortageQuantity < 0,
    deltas.shortageMinutes !== null && deltas.shortageMinutes < 0,
    deltas.allocatedMinutes !== null && deltas.allocatedMinutes > 0
  ].filter(Boolean).length;

  const worsenedSignals = [
    statusOutcome === OPERATION_COMPARISON_OUTCOME.WORSENED,
    deltas.diagnosedExecutableQuantity !== null && deltas.diagnosedExecutableQuantity < 0,
    deltas.diagnosedShortageQuantity !== null && deltas.diagnosedShortageQuantity > 0,
    deltas.shortageMinutes !== null && deltas.shortageMinutes > 0,
    deltas.allocatedMinutes !== null && deltas.allocatedMinutes < 0
  ].filter(Boolean).length;

  if (improvedSignals > 0 && worsenedSignals > 0) {
    return OPERATION_COMPARISON_OUTCOME.MIXED;
  }
  if (improvedSignals > 0) return OPERATION_COMPARISON_OUTCOME.IMPROVED;
  if (worsenedSignals > 0) return OPERATION_COMPARISON_OUTCOME.WORSENED;
  return OPERATION_COMPARISON_OUTCOME.UNCHANGED;
}

function buildOperationComparison(plannedOperationId, before, after) {
  if (before !== null && after !== null && before.quantityUnit !== after.quantityUnit) {
    throw createDomainError(
      ERROR_CODES.INVALID_SCENARIO_COMPARISON,
      "The same Planned Operation must use the same quantity unit in both results.",
      { plannedOperationId, beforeUnit: before.quantityUnit, afterUnit: after.quantityUnit }
    );
  }

  const deltas = {
    plannedQuantity: numericDelta(before?.plannedQuantity, after?.plannedQuantity),
    capacityExecutableQuantity: numericDelta(
      before?.capacityExecutableQuantity,
      after?.capacityExecutableQuantity
    ),
    diagnosedExecutableQuantity: numericDelta(
      before?.diagnosedExecutableQuantity,
      after?.diagnosedExecutableQuantity
    ),
    diagnosedShortageQuantity: numericDelta(
      before?.diagnosedShortageQuantity,
      after?.diagnosedShortageQuantity
    ),
    requiredMinutes: numericDelta(before?.requiredMinutes, after?.requiredMinutes),
    allocatedMinutes: numericDelta(before?.allocatedMinutes, after?.allocatedMinutes),
    shortageMinutes: numericDelta(before?.shortageMinutes, after?.shortageMinutes),
    constraintFindingCount: numericDelta(
      before?.constraintFindings.length,
      after?.constraintFindings.length
    ),
    assumptionFindingCount: numericDelta(
      before?.assumptionFindings.length,
      after?.assumptionFindings.length
    ),
    nextCheckCount: numericDelta(before?.nextChecks.length, after?.nextChecks.length)
  };

  return deepFreeze({
    plannedOperationId,
    orderId: after?.orderId ?? before?.orderId ?? null,
    equipmentId: after?.equipmentId ?? before?.equipmentId ?? null,
    plannedDate: after?.plannedDate ?? before?.plannedDate ?? null,
    quantityUnit: after?.quantityUnit ?? before?.quantityUnit ?? null,
    beforeStatus: before?.status ?? null,
    afterStatus: after?.status ?? null,
    beforePrimaryReasonCode: before?.primaryReasonCode ?? null,
    afterPrimaryReasonCode: after?.primaryReasonCode ?? null,
    primaryReasonChanged:
      before !== null && after !== null &&
      before.primaryReasonCode !== after.primaryReasonCode,
    deltas,
    outcome: deriveOperationOutcome(before, after, deltas)
  });
}

function deriveOverallOutcome(operationComparisons, validityStatus) {
  if (validityStatus === RESULT_VALIDITY_STATUS.INVALID) {
    return SCENARIO_COMPARISON_OUTCOME.NOT_COMPARABLE;
  }

  const counts = Object.fromEntries(
    Object.values(OPERATION_COMPARISON_OUTCOME).map((code) => [code, 0])
  );
  for (const row of operationComparisons) counts[row.outcome] += 1;

  const changed = counts.IMPROVED + counts.WORSENED + counts.MIXED +
    counts.UNCERTAIN + counts.ADDED + counts.REMOVED;
  if (changed === 0) return SCENARIO_COMPARISON_OUTCOME.UNCHANGED;

  if (
    counts.IMPROVED > 0 &&
    counts.WORSENED === 0 &&
    counts.MIXED === 0 &&
    counts.UNCERTAIN === 0 &&
    counts.ADDED === 0 &&
    counts.REMOVED === 0
  ) return SCENARIO_COMPARISON_OUTCOME.IMPROVED;

  if (
    counts.WORSENED > 0 &&
    counts.IMPROVED === 0 &&
    counts.MIXED === 0 &&
    counts.UNCERTAIN === 0 &&
    counts.ADDED === 0 &&
    counts.REMOVED === 0
  ) return SCENARIO_COMPARISON_OUTCOME.WORSENED;

  if (
    counts.UNCERTAIN > 0 &&
    counts.IMPROVED === 0 &&
    counts.WORSENED === 0 &&
    counts.MIXED === 0 &&
    counts.ADDED === 0 &&
    counts.REMOVED === 0
  ) return SCENARIO_COMPARISON_OUTCOME.UNCERTAIN;

  return SCENARIO_COMPARISON_OUTCOME.MIXED;
}

function deriveValidity(baseResult, comparisonResult) {
  if (
    baseResult.validityStatus === RESULT_VALIDITY_STATUS.INVALID ||
    comparisonResult.validityStatus === RESULT_VALIDITY_STATUS.INVALID
  ) return RESULT_VALIDITY_STATUS.INVALID;

  if (
    baseResult.validityStatus === RESULT_VALIDITY_STATUS.STALE ||
    comparisonResult.validityStatus === RESULT_VALIDITY_STATUS.STALE
  ) return RESULT_VALIDITY_STATUS.STALE;

  return RESULT_VALIDITY_STATUS.CURRENT;
}

function summaryDeltas(baseSummary, comparisonSummary) {
  const statusCounts = {};
  for (const code of Object.values(DIAGNOSIS_STATUS)) {
    statusCounts[code] = comparisonSummary.statusCounts[code] - baseSummary.statusCounts[code];
  }

  const quantityTotalsByUnit = {};
  for (const unit of Object.keys(baseSummary.quantityTotalsByUnit)) {
    const before = baseSummary.quantityTotalsByUnit[unit];
    const after = comparisonSummary.quantityTotalsByUnit[unit];
    quantityTotalsByUnit[unit] = Object.fromEntries(
      Object.keys(before).map((key) => [key, after[key] - before[key]])
    );
  }

  const minutesSummary = Object.fromEntries(
    Object.keys(baseSummary.minutesSummary).map((key) => [
      key,
      comparisonSummary.minutesSummary[key] - baseSummary.minutesSummary[key]
    ])
  );

  const findingSummary = {
    constraintFindingCount:
      comparisonSummary.findingSummary.constraintFindingCount -
      baseSummary.findingSummary.constraintFindingCount,
    blockingConstraintFindingCount:
      comparisonSummary.findingSummary.blockingConstraintFindingCount -
      baseSummary.findingSummary.blockingConstraintFindingCount,
    assumptionFindingCount:
      comparisonSummary.findingSummary.assumptionFindingCount -
      baseSummary.findingSummary.assumptionFindingCount,
    blockingAssumptionFindingCount:
      comparisonSummary.findingSummary.blockingAssumptionFindingCount -
      baseSummary.findingSummary.blockingAssumptionFindingCount,
    constraintSeverityCounts: Object.fromEntries(
      Object.keys(baseSummary.findingSummary.constraintSeverityCounts).map((key) => [
        key,
        comparisonSummary.findingSummary.constraintSeverityCounts[key] -
        baseSummary.findingSummary.constraintSeverityCounts[key]
      ])
    )
  };

  const nextCheckSummary = {
    nextCheckCount:
      comparisonSummary.nextCheckSummary.nextCheckCount -
      baseSummary.nextCheckSummary.nextCheckCount,
    openNextCheckCount:
      comparisonSummary.nextCheckSummary.openNextCheckCount -
      baseSummary.nextCheckSummary.openNextCheckCount,
    overdueNextCheckCount:
      comparisonSummary.nextCheckSummary.overdueNextCheckCount -
      baseSummary.nextCheckSummary.overdueNextCheckCount,
    statusCounts: Object.fromEntries(
      Object.keys(baseSummary.nextCheckSummary.statusCounts).map((key) => [
        key,
        comparisonSummary.nextCheckSummary.statusCounts[key] -
        baseSummary.nextCheckSummary.statusCounts[key]
      ])
    )
  };

  return deepFreeze({
    statusCounts,
    quantityTotalsByUnit,
    minutesSummary,
    findingSummary,
    nextCheckSummary,
    requiresActionOperationCount:
      comparisonSummary.requiresActionOperationCount -
      baseSummary.requiresActionOperationCount
  });
}

/** Immutable comparison between two formal Diagnosis Results. */
export class ScenarioComparison {
  constructor({
    scenarioComparisonId,
    baseScenario,
    comparisonScenario,
    baseResult,
    comparisonResult,
    comparedAt
  } = {}) {
    this.scenarioComparisonId = assertNonEmptyString(
      scenarioComparisonId,
      ERROR_CODES.INVALID_SCENARIO_COMPARISON,
      "scenarioComparisonId"
    );
    const base = assertDiagnosisScenario(baseScenario);
    const comparison = assertDiagnosisScenario(comparisonScenario);
    const before = assertDiagnosisResult(baseResult);
    const after = assertDiagnosisResult(comparisonResult);

    if (base.diagnosisScenarioId === comparison.diagnosisScenarioId) {
      throw createDomainError(
        ERROR_CODES.INVALID_SCENARIO_COMPARISON,
        "A Scenario cannot be compared with itself.",
        { diagnosisScenarioId: base.diagnosisScenarioId }
      );
    }
    if (base.planVersionId !== comparison.planVersionId) {
      throw createDomainError(
        ERROR_CODES.INVALID_SCENARIO_COMPARISON,
        "Scenarios must belong to the same Plan Version.",
        { basePlanVersionId: base.planVersionId, comparisonPlanVersionId: comparison.planVersionId }
      );
    }
    if (
      comparison.baseDiagnosisScenarioId !== null &&
      comparison.baseDiagnosisScenarioId !== base.diagnosisScenarioId
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_SCENARIO_COMPARISON,
        "Comparison Scenario references a different base Scenario.",
        {
          expectedBaseScenarioId: comparison.baseDiagnosisScenarioId,
          actualBaseScenarioId: base.diagnosisScenarioId
        }
      );
    }
    if (
      before.diagnosisScenarioId !== base.diagnosisScenarioId ||
      after.diagnosisScenarioId !== comparison.diagnosisScenarioId ||
      before.planVersionId !== base.planVersionId ||
      after.planVersionId !== comparison.planVersionId ||
      before.targetMonth !== after.targetMonth
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_SCENARIO_COMPARISON,
        "Scenario and Diagnosis Result sources are inconsistent.",
        {}
      );
    }

    this.baseScenario = deepFreeze(base.toSnapshot());
    this.comparisonScenario = deepFreeze(comparison.toSnapshot());
    this.baseResult = deepFreeze({
      diagnosisResultId: before.diagnosisResultId,
      status: before.status,
      validityStatus: before.validityStatus,
      diagnosedAt: before.diagnosedAt
    });
    this.comparisonResult = deepFreeze({
      diagnosisResultId: after.diagnosisResultId,
      status: after.status,
      validityStatus: after.validityStatus,
      diagnosedAt: after.diagnosedAt
    });
    this.comparedAt = assertDateTime(
      comparedAt,
      ERROR_CODES.INVALID_SCENARIO_COMPARISON,
      "comparedAt"
    );
    this.validityStatus = deriveValidity(before, after);

    const baseMap = new Map(before.operationResults.map((row) => [row.plannedOperationId, row]));
    const comparisonMap = new Map(after.operationResults.map((row) => [row.plannedOperationId, row]));
    const operationIds = [...new Set([...baseMap.keys(), ...comparisonMap.keys()])].sort();
    this.operationComparisons = Object.freeze(operationIds.map((id) =>
      buildOperationComparison(id, baseMap.get(id) ?? null, comparisonMap.get(id) ?? null)
    ));

    this.operationOutcomeCounts = deepFreeze(Object.fromEntries(
      Object.values(OPERATION_COMPARISON_OUTCOME).map((code) => [
        code,
        this.operationComparisons.filter((row) => row.outcome === code).length
      ])
    ));
    this.summaryDeltas = summaryDeltas(before.summary, after.summary);
    this.outcome = deriveOverallOutcome(this.operationComparisons, this.validityStatus);
    this.changedOperationCount = this.operationComparisons.filter(
      (row) => row.outcome !== OPERATION_COMPARISON_OUTCOME.UNCHANGED
    ).length;
    this.changeSummary = comparison.changeSummary;

    Object.freeze(this);
  }

  toSnapshot() {
    return deepFreeze({ ...this });
  }
}

export function assertScenarioComparison(value) {
  if (!(value instanceof ScenarioComparison)) {
    throw createDomainError(
      ERROR_CODES.INVALID_SCENARIO_COMPARISON,
      "value must be a ScenarioComparison.",
      { value }
    );
  }
  return value;
}
