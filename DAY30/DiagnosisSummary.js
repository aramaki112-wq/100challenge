import {
  ASSUMPTION_RESOLUTION_STATUS,
  CONSTRAINT_SEVERITY,
  DIAGNOSIS_STATUS,
  NEXT_CHECK_STATUS,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertNonEmptyString,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDateTime
} from "./DateTimeUtils.js";

import {
  assertOperationDiagnosisResult
} from "./OperationDiagnosisResult.js";

const IDENTIFIER_PATTERN = /^\S+$/;

function assertIdentifier(value, code, label) {
  const identifier = assertNonEmptyString(value, code, label);
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw createDomainError(code, `${label} must not contain whitespace.`, {
      value,
      label
    });
  }
  return identifier;
}

function createCountMap(codeMap) {
  const result = {};
  for (const code of Object.values(codeMap)) {
    result[code] = 0;
  }
  return result;
}

function deriveOverallStatus(statusCounts) {
  if (statusCounts[DIAGNOSIS_STATUS.INFEASIBLE] > 0) {
    return DIAGNOSIS_STATUS.INFEASIBLE;
  }
  if (statusCounts[DIAGNOSIS_STATUS.UNKNOWN] > 0) {
    return DIAGNOSIS_STATUS.UNKNOWN;
  }
  if (statusCounts[DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE] > 0) {
    return DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE;
  }
  return DIAGNOSIS_STATUS.FEASIBLE;
}

function createQuantityTotals() {
  const result = {};
  for (const unit of Object.values(QUANTITY_UNIT)) {
    result[unit] = {
      plannedQuantity: 0,
      capacityExecutableQuantity: 0,
      diagnosedExecutableQuantity: 0,
      diagnosedShortageQuantity: 0,
      unknownPlannedQuantity: 0,
      unknownOperationCount: 0
    };
  }
  return result;
}

function freezeNestedObject(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(freezeNestedObject));
  }
  if (value !== null && typeof value === "object") {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = freezeNestedObject(child);
    }
    return Object.freeze(result);
  }
  return value;
}

/** Immutable aggregate calculated from OperationDiagnosisResults. */
export class DiagnosisSummary {
  constructor({
    diagnosisSummaryId,
    diagnosisScenarioId,
    planVersionId,
    operationResults,
    generatedAt
  } = {}) {
    this.diagnosisSummaryId = assertIdentifier(
      diagnosisSummaryId,
      ERROR_CODES.INVALID_DIAGNOSIS_SUMMARY,
      "diagnosisSummaryId"
    );
    this.diagnosisScenarioId = assertIdentifier(
      diagnosisScenarioId,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_ID,
      "diagnosisScenarioId"
    );
    this.planVersionId = assertIdentifier(
      planVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "planVersionId"
    );

    const values = assertArray(
      operationResults,
      ERROR_CODES.INVALID_DIAGNOSIS_SUMMARY,
      "operationResults"
    );

    if (values.length === 0) {
      throw createDomainError(
        ERROR_CODES.INVALID_DIAGNOSIS_SUMMARY,
        "operationResults must contain at least one result.",
        {}
      );
    }

    const normalized = values.map((value, index) => {
      const result = assertOperationDiagnosisResult(value);
      if (
        result.diagnosisScenarioId !== this.diagnosisScenarioId ||
        result.planVersionId !== this.planVersionId
      ) {
        throw createDomainError(
          ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
          "All Operation results must belong to the same Scenario and Plan Version.",
          {
            index,
            expectedDiagnosisScenarioId: this.diagnosisScenarioId,
            actualDiagnosisScenarioId: result.diagnosisScenarioId,
            expectedPlanVersionId: this.planVersionId,
            actualPlanVersionId: result.planVersionId
          }
        );
      }
      return result;
    });

    const resultIds = new Set();
    const operationIds = new Set();
    for (const result of normalized) {
      if (
        resultIds.has(result.operationDiagnosisResultId) ||
        operationIds.has(result.plannedOperationId)
      ) {
        throw createDomainError(
          ERROR_CODES.DUPLICATE_OPERATION_DIAGNOSIS_RESULT,
          "Operation diagnosis results must be unique by result and operation ID.",
          {
            operationDiagnosisResultId: result.operationDiagnosisResultId,
            plannedOperationId: result.plannedOperationId
          }
        );
      }
      resultIds.add(result.operationDiagnosisResultId);
      operationIds.add(result.plannedOperationId);
    }

    this.operationResults = Object.freeze([...normalized]);
    this.generatedAt = assertDateTime(
      generatedAt,
      ERROR_CODES.INVALID_DIAGNOSIS_SUMMARY,
      "generatedAt"
    );

    const statusCounts = createCountMap(DIAGNOSIS_STATUS);
    const assumptionStatusCounts = createCountMap(
      ASSUMPTION_RESOLUTION_STATUS
    );
    const severityCounts = createCountMap(CONSTRAINT_SEVERITY);
    const nextCheckStatusCounts = createCountMap(NEXT_CHECK_STATUS);
    const quantityTotals = createQuantityTotals();

    let knownRequiredMinutes = 0;
    let knownAllocatedMinutes = 0;
    let knownShortageMinutes = 0;
    let unknownRequiredMinutesOperationCount = 0;
    let unknownAllocatedMinutesOperationCount = 0;
    let constraintFindingCount = 0;
    let blockingConstraintFindingCount = 0;
    let assumptionFindingCount = 0;
    let blockingAssumptionFindingCount = 0;
    let nextCheckCount = 0;
    let openNextCheckCount = 0;
    let overdueNextCheckCount = 0;
    const evaluationDate = this.generatedAt.slice(0, 10);

    for (const result of this.operationResults) {
      statusCounts[result.status] += 1;
      assumptionStatusCounts[result.assumptionStatus] += 1;

      const quantity = quantityTotals[result.quantityUnit];
      quantity.plannedQuantity += result.plannedQuantity;
      quantity.capacityExecutableQuantity +=
        result.capacityExecutableQuantity;

      if (result.diagnosedExecutableQuantity === null) {
        quantity.unknownPlannedQuantity += result.plannedQuantity;
        quantity.unknownOperationCount += 1;
      } else {
        quantity.diagnosedExecutableQuantity +=
          result.diagnosedExecutableQuantity;
        quantity.diagnosedShortageQuantity +=
          result.diagnosedShortageQuantity;
      }

      if (result.requiredMinutes === null) {
        unknownRequiredMinutesOperationCount += 1;
      } else {
        knownRequiredMinutes += result.requiredMinutes;
      }

      if (result.allocatedMinutes === null) {
        unknownAllocatedMinutesOperationCount += 1;
      } else {
        knownAllocatedMinutes += result.allocatedMinutes;
      }

      if (result.shortageMinutes !== null) {
        knownShortageMinutes += result.shortageMinutes;
      }

      constraintFindingCount += result.constraintFindings.length;
      for (const finding of result.constraintFindings) {
        severityCounts[finding.severity] += 1;
        if (finding.blocking) {
          blockingConstraintFindingCount += 1;
        }
      }

      assumptionFindingCount += result.assumptionFindings.length;
      for (const finding of result.assumptionFindings) {
        if (finding.blocking) {
          blockingAssumptionFindingCount += 1;
        }
      }

      nextCheckCount += result.nextChecks.length;
      for (const nextCheck of result.nextChecks) {
        nextCheckStatusCounts[nextCheck.status] += 1;
        if (nextCheck.isOpen()) {
          openNextCheckCount += 1;
        }
        if (nextCheck.isOverdue(evaluationDate)) {
          overdueNextCheckCount += 1;
        }
      }
    }

    this.operationCount = this.operationResults.length;
    this.status = deriveOverallStatus(statusCounts);
    this.statusCounts = freezeNestedObject(statusCounts);
    this.assumptionStatusCounts = freezeNestedObject(
      assumptionStatusCounts
    );
    this.quantityTotalsByUnit = freezeNestedObject(quantityTotals);
    this.minutesSummary = freezeNestedObject({
      knownRequiredMinutes,
      knownAllocatedMinutes,
      knownShortageMinutes,
      unknownRequiredMinutesOperationCount,
      unknownAllocatedMinutesOperationCount
    });
    this.findingSummary = freezeNestedObject({
      constraintFindingCount,
      blockingConstraintFindingCount,
      assumptionFindingCount,
      blockingAssumptionFindingCount,
      constraintSeverityCounts: severityCounts
    });
    this.nextCheckSummary = freezeNestedObject({
      nextCheckCount,
      openNextCheckCount,
      overdueNextCheckCount,
      statusCounts: nextCheckStatusCounts
    });
    this.requiresActionOperationCount = this.operationResults.filter(
      (result) => result.requiresAction()
    ).length;
    this.hasUnknownOperations =
      statusCounts[DIAGNOSIS_STATUS.UNKNOWN] > 0;
    this.hasConfirmedInfeasibleOperations =
      statusCounts[DIAGNOSIS_STATUS.INFEASIBLE] > 0;
    this.hasOpenNextChecks = openNextCheckCount > 0;

    Object.freeze(this);
  }

  toSnapshot() {
    return Object.freeze({
      ...this,
      operationResults: Object.freeze(
        this.operationResults.map((result) => result.toSnapshot())
      )
    });
  }
}

export function assertDiagnosisSummary(value) {
  if (!(value instanceof DiagnosisSummary)) {
    throw createDomainError(
      ERROR_CODES.INVALID_DIAGNOSIS_SUMMARY,
      "value must be a DiagnosisSummary.",
      { value }
    );
  }
  return value;
}
