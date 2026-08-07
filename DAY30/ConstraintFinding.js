import {
  CONSTRAINT_CATEGORY,
  CONSTRAINT_SEVERITY,
  DATA_CONFIDENCE,
  FINDING_CONFIRMATION_STATUS,
  FINDING_SOURCE_TYPE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertBoolean,
  assertCodeValue,
  assertFiniteNumber,
  assertNonEmptyString,
  createDomainError
} from "./DiagnosisErrors.js";

import { assertDateTime } from "./DateTimeUtils.js";

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

function optionalIdentifier(value, code, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return assertIdentifier(value, code, label);
}

function optionalText(value, label) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (typeof value !== "string") {
    throw createDomainError(
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      `${label} must be a string.`,
      { value, label }
    );
  }
  return value.trim();
}

function normalizeMetrics({ requiredValue, availableValue, shortageValue, unit }) {
  const supplied = [requiredValue, availableValue, shortageValue, unit].some(
    (value) => value !== null && value !== undefined && value !== ""
  );

  if (!supplied) {
    return Object.freeze({
      requiredValue: null,
      availableValue: null,
      shortageValue: null,
      unit: null
    });
  }

  const required = assertFiniteNumber(
    requiredValue,
    ERROR_CODES.INVALID_FINDING_METRICS,
    "requiredValue",
    { min: 0 }
  );
  const available = assertFiniteNumber(
    availableValue,
    ERROR_CODES.INVALID_FINDING_METRICS,
    "availableValue",
    { min: 0 }
  );
  const shortage = assertFiniteNumber(
    shortageValue,
    ERROR_CODES.INVALID_FINDING_METRICS,
    "shortageValue",
    { min: 0 }
  );
  const normalizedUnit = assertNonEmptyString(
    unit,
    ERROR_CODES.INVALID_FINDING_METRICS,
    "unit"
  );

  const expectedShortage = Math.max(required - available, 0);
  if (Math.abs(shortage - expectedShortage) > 1e-9) {
    throw createDomainError(
      ERROR_CODES.INVALID_FINDING_METRICS,
      "shortageValue must equal max(requiredValue - availableValue, 0).",
      { requiredValue: required, availableValue: available, shortageValue: shortage }
    );
  }

  return Object.freeze({
    requiredValue: required,
    availableValue: available,
    shortageValue: shortage,
    unit: normalizedUnit
  });
}

/** Immutable explanation of one detected constraint. */
export class ConstraintFinding {
  constructor({
    findingId,
    plannedOperationId,
    category,
    reasonCode,
    severity,
    confirmationStatus,
    title,
    description,
    blocking = true,
    preventsExecution = false,
    sourceType,
    sourceId = null,
    observedAt,
    dataConfidence = DATA_CONFIDENCE.C,
    requiredValue = null,
    availableValue = null,
    shortageValue = null,
    unit = null,
    evidence = "",
    recommendedAction = ""
  } = {}) {
    this.findingId = assertIdentifier(
      findingId,
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "findingId"
    );
    this.plannedOperationId = assertIdentifier(
      plannedOperationId,
      ERROR_CODES.INVALID_PLANNED_OPERATION_ID,
      "plannedOperationId"
    );
    this.category = assertCodeValue(
      category,
      CONSTRAINT_CATEGORY,
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "category"
    );
    this.reasonCode = assertNonEmptyString(
      reasonCode,
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "reasonCode"
    );
    this.severity = assertCodeValue(
      severity,
      CONSTRAINT_SEVERITY,
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "severity"
    );
    this.confirmationStatus = assertCodeValue(
      confirmationStatus,
      FINDING_CONFIRMATION_STATUS,
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "confirmationStatus"
    );
    this.title = assertNonEmptyString(
      title,
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "title"
    );
    this.description = assertNonEmptyString(
      description,
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "description"
    );
    this.blocking = assertBoolean(
      blocking,
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "blocking"
    );
    this.preventsExecution = assertBoolean(
      preventsExecution,
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "preventsExecution"
    );

    if (this.preventsExecution && !this.blocking) {
      throw createDomainError(
        ERROR_CODES.INVALID_CONSTRAINT_FINDING,
        "A finding that prevents execution must be blocking.",
        { blocking, preventsExecution }
      );
    }

    this.sourceType = assertCodeValue(
      sourceType,
      FINDING_SOURCE_TYPE,
      ERROR_CODES.INVALID_FINDING_SOURCE,
      "sourceType"
    );
    this.sourceId = optionalIdentifier(
      sourceId,
      ERROR_CODES.INVALID_FINDING_SOURCE,
      "sourceId"
    );
    this.observedAt = assertDateTime(
      observedAt,
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "observedAt"
    );
    this.dataConfidence = assertCodeValue(
      dataConfidence,
      DATA_CONFIDENCE,
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "dataConfidence"
    );

    const metrics = normalizeMetrics({
      requiredValue,
      availableValue,
      shortageValue,
      unit
    });
    this.requiredValue = metrics.requiredValue;
    this.availableValue = metrics.availableValue;
    this.shortageValue = metrics.shortageValue;
    this.unit = metrics.unit;
    this.evidence = optionalText(evidence, "evidence");
    this.recommendedAction = optionalText(
      recommendedAction,
      "recommendedAction"
    );

    Object.freeze(this);
  }

  hasQuantifiedShortage() {
    return this.shortageValue !== null && this.shortageValue > 0;
  }

  requiresImmediateAction() {
    return this.blocking && [
      CONSTRAINT_SEVERITY.CRITICAL,
      CONSTRAINT_SEVERITY.HIGH
    ].includes(this.severity);
  }

  toSnapshot() {
    return Object.freeze({ ...this });
  }
}

export function assertConstraintFinding(value) {
  if (!(value instanceof ConstraintFinding)) {
    throw createDomainError(
      ERROR_CODES.INVALID_CONSTRAINT_FINDING,
      "value must be a ConstraintFinding.",
      { value }
    );
  }
  return value;
}
