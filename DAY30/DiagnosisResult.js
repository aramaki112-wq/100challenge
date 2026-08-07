import {
  DIAGNOSIS_STATUS,
  RESULT_VALIDITY_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertCodeValue,
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPlainObject,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDateTime,
  assertTargetMonth
} from "./DateTimeUtils.js";

import {
  assertOperationDiagnosisResult
} from "./OperationDiagnosisResult.js";

import {
  assertDiagnosisSummary
} from "./DiagnosisSummary.js";

const IDENTIFIER_PATTERN = /^\S+$/;
const REVISION_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

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

function normalizeRevision(value, label) {
  const source = assertPlainObject(
    value,
    ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
    label
  );

  const entries = Object.entries(source);
  if (entries.length === 0) {
    throw createDomainError(
      ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
      `${label} must contain at least one revision.`,
      { value }
    );
  }

  const result = {};
  for (const [key, revision] of entries) {
    if (!REVISION_KEY_PATTERN.test(key)) {
      throw createDomainError(
        ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
        `${label} keys must be identifier-like strings.`,
        { key }
      );
    }
    result[key] = assertNonNegativeInteger(
      revision,
      ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
      `${label}.${key}`
    );
  }

  return Object.freeze(result);
}

function normalizeReasonCodes(values, validityStatus) {
  const reasons = assertArray(
    values,
    ERROR_CODES.INVALID_RESULT_VALIDITY,
    "validityReasonCodes"
  ).map((value, index) =>
    assertNonEmptyString(
      value,
      ERROR_CODES.INVALID_RESULT_VALIDITY,
      `validityReasonCodes[${index}]`
    )
  );

  const unique = [...new Set(reasons)];

  if (
    validityStatus === RESULT_VALIDITY_STATUS.CURRENT &&
    unique.length > 0
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_RESULT_VALIDITY,
      "CURRENT Diagnosis Result must not have validity reasons.",
      { validityStatus, validityReasonCodes: unique }
    );
  }

  if (
    validityStatus !== RESULT_VALIDITY_STATUS.CURRENT &&
    unique.length === 0
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_RESULT_VALIDITY,
      "STALE or INVALID Diagnosis Result requires at least one reason.",
      { validityStatus }
    );
  }

  return Object.freeze(unique);
}

function normalizeOperationResults({
  operationResults,
  diagnosisScenarioId,
  planVersionId
}) {
  const values = assertArray(
    operationResults,
    ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
    "operationResults"
  );

  if (values.length === 0) {
    throw createDomainError(
      ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
      "operationResults must contain at least one result.",
      {}
    );
  }

  const resultIds = new Set();
  const operationIds = new Set();

  const normalized = values.map((value, index) => {
    const result = assertOperationDiagnosisResult(value);

    if (
      result.diagnosisScenarioId !== diagnosisScenarioId ||
      result.planVersionId !== planVersionId
    ) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "Operation result belongs to a different Scenario or Plan Version.",
        {
          index,
          diagnosisScenarioId,
          actualDiagnosisScenarioId: result.diagnosisScenarioId,
          planVersionId,
          actualPlanVersionId: result.planVersionId
        }
      );
    }

    if (
      resultIds.has(result.operationDiagnosisResultId) ||
      operationIds.has(result.plannedOperationId)
    ) {
      throw createDomainError(
        ERROR_CODES.DUPLICATE_OPERATION_DIAGNOSIS_RESULT,
        "Diagnosis Result must not contain duplicate result or operation IDs.",
        {
          operationDiagnosisResultId: result.operationDiagnosisResultId,
          plannedOperationId: result.plannedOperationId
        }
      );
    }

    resultIds.add(result.operationDiagnosisResultId);
    operationIds.add(result.plannedOperationId);
    return result;
  });

  return Object.freeze(normalized);
}

function assertSummaryConsistency(summary, operationResults, diagnosedAt) {
  if (summary.generatedAt !== diagnosedAt) {
    throw createDomainError(
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      "Diagnosis Summary generatedAt must equal Diagnosis Result diagnosedAt.",
      { generatedAt: summary.generatedAt, diagnosedAt }
    );
  }

  if (summary.operationResults.length !== operationResults.length) {
    throw createDomainError(
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      "Diagnosis Summary operation count must match Diagnosis Result.",
      {
        summaryOperationCount: summary.operationResults.length,
        resultOperationCount: operationResults.length
      }
    );
  }

  const summaryResultIds = summary.operationResults.map(
    (result) => result.operationDiagnosisResultId
  );
  const resultIds = operationResults.map(
    (result) => result.operationDiagnosisResultId
  );

  if (summaryResultIds.some((id, index) => id !== resultIds[index])) {
    throw createDomainError(
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      "Diagnosis Summary must contain the same ordered Operation results.",
      { summaryResultIds, resultIds }
    );
  }
}

/**
 * Immutable result of one complete plan diagnosis execution.
 *
 * The result preserves the exact source revisions used during execution.
 * Later changes do not rewrite this object; they produce a STALE/INVALID copy.
 */
export class DiagnosisResult {
  constructor({
    diagnosisResultId,
    diagnosisScenarioId,
    planVersionId,
    capacityScenarioId,
    targetMonth,
    operationResults,
    summary,
    diagnosedAt,
    capacitySnapshotGeneratedAt,
    capacitySourceRevision,
    diagnosisInputRevision,
    validityStatus = RESULT_VALIDITY_STATUS.CURRENT,
    validityReasonCodes = []
  } = {}) {
    this.diagnosisResultId = assertIdentifier(
      diagnosisResultId,
      ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
      "diagnosisResultId"
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
    this.capacityScenarioId = assertIdentifier(
      capacityScenarioId,
      ERROR_CODES.INVALID_CAPACITY_SCENARIO_ID,
      "capacityScenarioId"
    );
    this.targetMonth = assertTargetMonth(
      targetMonth,
      ERROR_CODES.INVALID_TARGET_MONTH,
      "targetMonth"
    );
    this.diagnosedAt = assertDateTime(
      diagnosedAt,
      ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
      "diagnosedAt"
    );
    this.capacitySnapshotGeneratedAt = assertDateTime(
      capacitySnapshotGeneratedAt,
      ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
      "capacitySnapshotGeneratedAt"
    );
    this.capacitySourceRevision = normalizeRevision(
      capacitySourceRevision,
      "capacitySourceRevision"
    );
    this.diagnosisInputRevision = normalizeRevision(
      diagnosisInputRevision,
      "diagnosisInputRevision"
    );
    this.validityStatus = assertCodeValue(
      validityStatus,
      RESULT_VALIDITY_STATUS,
      ERROR_CODES.INVALID_RESULT_VALIDITY,
      "validityStatus"
    );
    this.validityReasonCodes = normalizeReasonCodes(
      validityReasonCodes,
      this.validityStatus
    );

    this.operationResults = normalizeOperationResults({
      operationResults,
      diagnosisScenarioId: this.diagnosisScenarioId,
      planVersionId: this.planVersionId
    });

    this.summary = assertDiagnosisSummary(summary);

    if (
      this.summary.diagnosisScenarioId !== this.diagnosisScenarioId ||
      this.summary.planVersionId !== this.planVersionId
    ) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "Diagnosis Summary belongs to a different Scenario or Plan Version.",
        {
          diagnosisScenarioId: this.diagnosisScenarioId,
          summaryDiagnosisScenarioId: this.summary.diagnosisScenarioId,
          planVersionId: this.planVersionId,
          summaryPlanVersionId: this.summary.planVersionId
        }
      );
    }

    assertSummaryConsistency(
      this.summary,
      this.operationResults,
      this.diagnosedAt
    );

    this.status = assertCodeValue(
      this.summary.status,
      DIAGNOSIS_STATUS,
      ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
      "summary.status"
    );
    this.operationCount = this.operationResults.length;

    Object.freeze(this);
  }

  isCurrent() {
    return this.validityStatus === RESULT_VALIDITY_STATUS.CURRENT;
  }

  isStale() {
    return this.validityStatus === RESULT_VALIDITY_STATUS.STALE;
  }

  isInvalid() {
    return this.validityStatus === RESULT_VALIDITY_STATUS.INVALID;
  }

  withValidity({ validityStatus, validityReasonCodes } = {}) {
    return new DiagnosisResult({
      diagnosisResultId: this.diagnosisResultId,
      diagnosisScenarioId: this.diagnosisScenarioId,
      planVersionId: this.planVersionId,
      capacityScenarioId: this.capacityScenarioId,
      targetMonth: this.targetMonth,
      operationResults: this.operationResults,
      summary: this.summary,
      diagnosedAt: this.diagnosedAt,
      capacitySnapshotGeneratedAt: this.capacitySnapshotGeneratedAt,
      capacitySourceRevision: this.capacitySourceRevision,
      diagnosisInputRevision: this.diagnosisInputRevision,
      validityStatus,
      validityReasonCodes
    });
  }

  toSnapshot() {
    return Object.freeze({
      diagnosisResultId: this.diagnosisResultId,
      diagnosisScenarioId: this.diagnosisScenarioId,
      planVersionId: this.planVersionId,
      capacityScenarioId: this.capacityScenarioId,
      targetMonth: this.targetMonth,
      status: this.status,
      validityStatus: this.validityStatus,
      validityReasonCodes: this.validityReasonCodes,
      operationCount: this.operationCount,
      diagnosedAt: this.diagnosedAt,
      capacitySnapshotGeneratedAt: this.capacitySnapshotGeneratedAt,
      capacitySourceRevision: this.capacitySourceRevision,
      diagnosisInputRevision: this.diagnosisInputRevision,
      operationResults: Object.freeze(
        this.operationResults.map((result) => result.toSnapshot())
      ),
      summary: this.summary.toSnapshot()
    });
  }
}

export function assertDiagnosisResult(value) {
  if (!(value instanceof DiagnosisResult)) {
    throw createDomainError(
      ERROR_CODES.INVALID_DIAGNOSIS_RESULT,
      "value must be a DiagnosisResult.",
      { value }
    );
  }
  return value;
}
