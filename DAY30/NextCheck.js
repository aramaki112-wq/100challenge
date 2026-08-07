import {
  NEXT_CHECK_PRIORITY,
  NEXT_CHECK_SOURCE_TYPE,
  NEXT_CHECK_STATUS,
  NEXT_CHECK_TYPE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertCodeValue,
  assertNonEmptyString,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate,
  assertDateTime,
  compareDates,
  compareDateTimes
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
      ERROR_CODES.INVALID_NEXT_CHECK,
      `${label} must be a string.`,
      { value, label }
    );
  }
  return value.trim();
}

function optionalDate(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return assertDate(value, ERROR_CODES.INVALID_NEXT_CHECK, label);
}

function optionalDateTime(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return assertDateTime(value, ERROR_CODES.INVALID_NEXT_CHECK, label);
}

/** Immutable action item generated from diagnosis uncertainty or constraint. */
export class NextCheck {
  constructor({
    nextCheckId,
    plannedOperationId,
    sourceType,
    sourceId = null,
    checkType,
    priority = NEXT_CHECK_PRIORITY.NORMAL,
    status = NEXT_CHECK_STATUS.OPEN,
    title,
    description,
    owner = "",
    dueDate = null,
    createdAt,
    completedAt = null,
    completedBy = "",
    result = "",
    evidence = "",
    note = ""
  } = {}) {
    this.nextCheckId = assertIdentifier(
      nextCheckId,
      ERROR_CODES.INVALID_NEXT_CHECK,
      "nextCheckId"
    );
    this.plannedOperationId = assertIdentifier(
      plannedOperationId,
      ERROR_CODES.INVALID_PLANNED_OPERATION_ID,
      "plannedOperationId"
    );
    this.sourceType = assertCodeValue(
      sourceType,
      NEXT_CHECK_SOURCE_TYPE,
      ERROR_CODES.INVALID_NEXT_CHECK,
      "sourceType"
    );
    this.sourceId = optionalIdentifier(
      sourceId,
      ERROR_CODES.INVALID_NEXT_CHECK,
      "sourceId"
    );
    this.checkType = assertCodeValue(
      checkType,
      NEXT_CHECK_TYPE,
      ERROR_CODES.INVALID_NEXT_CHECK,
      "checkType"
    );
    this.priority = assertCodeValue(
      priority,
      NEXT_CHECK_PRIORITY,
      ERROR_CODES.INVALID_NEXT_CHECK,
      "priority"
    );
    this.status = assertCodeValue(
      status,
      NEXT_CHECK_STATUS,
      ERROR_CODES.INVALID_NEXT_CHECK_STATE,
      "status"
    );
    this.title = assertNonEmptyString(
      title,
      ERROR_CODES.INVALID_NEXT_CHECK,
      "title"
    );
    this.description = assertNonEmptyString(
      description,
      ERROR_CODES.INVALID_NEXT_CHECK,
      "description"
    );
    this.owner = optionalText(owner, "owner");
    this.dueDate = optionalDate(dueDate, "dueDate");
    this.createdAt = assertDateTime(
      createdAt,
      ERROR_CODES.INVALID_NEXT_CHECK,
      "createdAt"
    );
    this.completedAt = optionalDateTime(completedAt, "completedAt");
    this.completedBy = optionalText(completedBy, "completedBy");
    this.result = optionalText(result, "result");
    this.evidence = optionalText(evidence, "evidence");
    this.note = optionalText(note, "note");

    const isCompleted = this.status === NEXT_CHECK_STATUS.COMPLETED;
    const isClosedWithoutCompletion = [
      NEXT_CHECK_STATUS.NOT_REQUIRED,
      NEXT_CHECK_STATUS.CANNOT_CONFIRM
    ].includes(this.status);

    if (isCompleted) {
      if (
        this.completedAt === null ||
        this.completedBy === "" ||
        this.result === ""
      ) {
        throw createDomainError(
          ERROR_CODES.INVALID_NEXT_CHECK_STATE,
          "COMPLETED requires completedAt, completedBy, and result.",
          { status: this.status }
        );
      }
    } else if (isClosedWithoutCompletion) {
      if (this.result === "") {
        throw createDomainError(
          ERROR_CODES.INVALID_NEXT_CHECK_STATE,
          `${this.status} requires a result explaining closure.`,
          { status: this.status }
        );
      }
      if (this.completedAt !== null || this.completedBy !== "") {
        throw createDomainError(
          ERROR_CODES.INVALID_NEXT_CHECK_STATE,
          `${this.status} must not use completion metadata.`,
          { status: this.status }
        );
      }
    } else if (
      this.completedAt !== null ||
      this.completedBy !== "" ||
      this.result !== ""
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_NEXT_CHECK_STATE,
        "OPEN or IN_PROGRESS must not contain closure metadata.",
        { status: this.status }
      );
    }

    if (
      this.completedAt !== null &&
      compareDateTimes(this.completedAt, this.createdAt) < 0
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_NEXT_CHECK_STATE,
        "completedAt must not be before createdAt.",
        { createdAt: this.createdAt, completedAt: this.completedAt }
      );
    }

    Object.freeze(this);
  }

  isOpen() {
    return [
      NEXT_CHECK_STATUS.OPEN,
      NEXT_CHECK_STATUS.IN_PROGRESS
    ].includes(this.status);
  }

  isOverdue(evaluationDate) {
    const date = assertDate(
      evaluationDate,
      ERROR_CODES.INVALID_NEXT_CHECK,
      "evaluationDate"
    );
    return this.isOpen() &&
      this.dueDate !== null &&
      compareDates(date, this.dueDate) > 0;
  }

  toSnapshot() {
    return Object.freeze({ ...this });
  }
}

export function assertNextCheck(value) {
  if (!(value instanceof NextCheck)) {
    throw createDomainError(
      ERROR_CODES.INVALID_NEXT_CHECK,
      "value must be a NextCheck.",
      { value }
    );
  }
  return value;
}
