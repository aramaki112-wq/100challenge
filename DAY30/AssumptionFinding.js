import {
  ASSUMPTION_EFFECTIVE_STATUS,
  ASSUMPTION_IMPACT_LEVEL,
  ASSUMPTION_RESOLUTION_STATUS,
  ASSUMPTION_STATUS,
  ASSUMPTION_TARGET_TYPE,
  ASSUMPTION_TYPE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertBoolean,
  assertCodeValue,
  assertNonEmptyString,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate,
  compareDates
} from "./DateTimeUtils.js";

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

function optionalDate(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return assertDate(value, ERROR_CODES.INVALID_ASSUMPTION_FINDING, label);
}

function optionalText(value, label) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (typeof value !== "string") {
    throw createDomainError(
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      `${label} must be a string.`,
      { value, label }
    );
  }
  return value.trim();
}

function normalizeRelatedIds(values, assumptionId) {
  const ids = assertArray(
    values,
    ERROR_CODES.INVALID_ASSUMPTION_FINDING,
    "relatedAssumptionIds"
  ).map((value, index) =>
    assertIdentifier(
      value,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      `relatedAssumptionIds[${index}]`
    )
  );

  const unique = [...new Set(ids.filter((id) => id !== assumptionId))];
  return Object.freeze(unique);
}

function assertResolutionConsistency(resolutionStatus, effectiveStatus) {
  const valid = {
    [ASSUMPTION_RESOLUTION_STATUS.SATISFIED]: [
      ASSUMPTION_EFFECTIVE_STATUS.EFFECTIVE_CONFIRMED
    ],
    [ASSUMPTION_RESOLUTION_STATUS.REJECTED]: [
      ASSUMPTION_EFFECTIVE_STATUS.REJECTED
    ],
    [ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED]: [
      ASSUMPTION_EFFECTIVE_STATUS.UNKNOWN,
      ASSUMPTION_EFFECTIVE_STATUS.EXPECTED,
      ASSUMPTION_EFFECTIVE_STATUS.EXPIRED,
      ASSUMPTION_EFFECTIVE_STATUS.OUTSIDE_VALIDITY
    ],
    [ASSUMPTION_RESOLUTION_STATUS.CONFLICT]: [
      ASSUMPTION_EFFECTIVE_STATUS.EFFECTIVE_CONFIRMED,
      ASSUMPTION_EFFECTIVE_STATUS.REJECTED
    ],
    [ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE]: [
      ASSUMPTION_EFFECTIVE_STATUS.UNKNOWN,
      ASSUMPTION_EFFECTIVE_STATUS.EXPECTED,
      ASSUMPTION_EFFECTIVE_STATUS.EFFECTIVE_CONFIRMED,
      ASSUMPTION_EFFECTIVE_STATUS.REJECTED,
      ASSUMPTION_EFFECTIVE_STATUS.EXPIRED,
      ASSUMPTION_EFFECTIVE_STATUS.OUTSIDE_VALIDITY
    ]
  };

  if (!valid[resolutionStatus].includes(effectiveStatus)) {
    throw createDomainError(
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "resolutionStatus and effectiveStatus are inconsistent.",
      { resolutionStatus, effectiveStatus }
    );
  }
}

/** Immutable explanation of how one Assumption affected an Operation. */
export class AssumptionFinding {
  constructor({
    findingId,
    plannedOperationId,
    assumptionId,
    assumptionType,
    targetType,
    targetId,
    assumptionStatus,
    effectiveStatus,
    resolutionStatus,
    blocking,
    impactLevel,
    description,
    evaluatedOn,
    owner = "",
    evidence = "",
    confirmationDueDate = null,
    validFrom = null,
    validTo = null,
    relatedAssumptionIds = [],
    recommendedAction = ""
  } = {}) {
    this.findingId = assertIdentifier(
      findingId,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "findingId"
    );
    this.plannedOperationId = assertIdentifier(
      plannedOperationId,
      ERROR_CODES.INVALID_PLANNED_OPERATION_ID,
      "plannedOperationId"
    );
    this.assumptionId = assertIdentifier(
      assumptionId,
      ERROR_CODES.INVALID_ASSUMPTION_ID,
      "assumptionId"
    );
    this.assumptionType = assertCodeValue(
      assumptionType,
      ASSUMPTION_TYPE,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "assumptionType"
    );
    this.targetType = assertCodeValue(
      targetType,
      ASSUMPTION_TARGET_TYPE,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "targetType"
    );
    this.targetId = assertIdentifier(
      targetId,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "targetId"
    );
    this.assumptionStatus = assertCodeValue(
      assumptionStatus,
      ASSUMPTION_STATUS,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "assumptionStatus"
    );
    this.effectiveStatus = assertCodeValue(
      effectiveStatus,
      ASSUMPTION_EFFECTIVE_STATUS,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "effectiveStatus"
    );
    this.resolutionStatus = assertCodeValue(
      resolutionStatus,
      ASSUMPTION_RESOLUTION_STATUS,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "resolutionStatus"
    );
    assertResolutionConsistency(this.resolutionStatus, this.effectiveStatus);

    this.blocking = assertBoolean(
      blocking,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "blocking"
    );
    this.impactLevel = assertCodeValue(
      impactLevel,
      ASSUMPTION_IMPACT_LEVEL,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "impactLevel"
    );
    this.description = assertNonEmptyString(
      description,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "description"
    );
    this.evaluatedOn = assertDate(
      evaluatedOn,
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "evaluatedOn"
    );
    this.owner = optionalText(owner, "owner");
    this.evidence = optionalText(evidence, "evidence");
    this.confirmationDueDate = optionalDate(
      confirmationDueDate,
      "confirmationDueDate"
    );
    this.validFrom = optionalDate(validFrom, "validFrom");
    this.validTo = optionalDate(validTo, "validTo");

    if (
      this.validFrom !== null &&
      this.validTo !== null &&
      compareDates(this.validFrom, this.validTo) > 0
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_ASSUMPTION_FINDING,
        "validFrom must not be after validTo.",
        { validFrom: this.validFrom, validTo: this.validTo }
      );
    }

    this.relatedAssumptionIds = normalizeRelatedIds(
      relatedAssumptionIds,
      this.assumptionId
    );

    if (
      this.resolutionStatus === ASSUMPTION_RESOLUTION_STATUS.CONFLICT &&
      this.relatedAssumptionIds.length === 0
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_ASSUMPTION_FINDING,
        "CONFLICT requires at least one related Assumption.",
        { assumptionId: this.assumptionId }
      );
    }

    this.recommendedAction = optionalText(
      recommendedAction,
      "recommendedAction"
    );

    Object.freeze(this);
  }

  requiresNextCheck() {
    return this.blocking && [
      ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED,
      ASSUMPTION_RESOLUTION_STATUS.CONFLICT
    ].includes(this.resolutionStatus);
  }

  preventsExecution() {
    return this.blocking &&
      this.resolutionStatus === ASSUMPTION_RESOLUTION_STATUS.REJECTED;
  }

  toSnapshot() {
    return Object.freeze({
      ...this,
      relatedAssumptionIds: Object.freeze([...this.relatedAssumptionIds])
    });
  }
}

export function assertAssumptionFinding(value) {
  if (!(value instanceof AssumptionFinding)) {
    throw createDomainError(
      ERROR_CODES.INVALID_ASSUMPTION_FINDING,
      "value must be an AssumptionFinding.",
      { value }
    );
  }
  return value;
}
