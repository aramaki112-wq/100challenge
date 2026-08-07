export const ERROR_CODES = Object.freeze({
  INVALID_ARGUMENT: "INVALID_ARGUMENT",
  INVALID_SKILL_ID: "INVALID_SKILL_ID",
  INVALID_SKILL_NAME: "INVALID_SKILL_NAME",
  INVALID_WORKER_ID: "INVALID_WORKER_ID",
  INVALID_WORKER_NAME: "INVALID_WORKER_NAME",
  INVALID_WORKER_SKILL_IDS: "INVALID_WORKER_SKILL_IDS",
  DUPLICATE_WORKER_SKILL: "DUPLICATE_WORKER_SKILL",
  INVALID_EQUIPMENT_ID: "INVALID_EQUIPMENT_ID",
  INVALID_EQUIPMENT_NAME: "INVALID_EQUIPMENT_NAME",
  INVALID_REQUIRED_WORKER_COUNT: "INVALID_REQUIRED_WORKER_COUNT",
  INVALID_REQUIRED_SKILL_COUNT: "INVALID_REQUIRED_SKILL_COUNT",
  DUPLICATE_REQUIRED_SKILL: "DUPLICATE_REQUIRED_SKILL",
  REQUIRED_SKILL_COUNT_EXCEEDS_REQUIRED_WORKER_COUNT:
    "REQUIRED_SKILL_COUNT_EXCEEDS_REQUIRED_WORKER_COUNT",
  INVALID_EQUIPMENT_PRIORITY: "INVALID_EQUIPMENT_PRIORITY",
  INVALID_ROLE_SLOT: "INVALID_ROLE_SLOT",
  WORKER_ALREADY_RESERVED: "WORKER_ALREADY_RESERVED",
  INVALID_FACTORY_EVENT: "INVALID_FACTORY_EVENT",
  STORAGE_DATA_INVALID: "STORAGE_DATA_INVALID",
  INVALID_TIME: "INVALID_TIME",
  INVALID_TIME_SLOT: "INVALID_TIME_SLOT",
  INVALID_INTERVAL_MINUTES: "INVALID_INTERVAL_MINUTES",
  OVERLAPPING_TIME_SLOT: "OVERLAPPING_TIME_SLOT",
  INVALID_CAPACITY_VALUE: "INVALID_CAPACITY_VALUE",
  INVALID_CAPACITY_STATE: "INVALID_CAPACITY_STATE",
  INVALID_CAPACITY_CALENDAR: "INVALID_CAPACITY_CALENDAR",
  INVALID_FACTORY_ID: "INVALID_FACTORY_ID",
  INVALID_PROCESS_ID: "INVALID_PROCESS_ID",
  INVALID_SHIFT_ID: "INVALID_SHIFT_ID",
  INVALID_CAPACITY_RULE_ID: "INVALID_CAPACITY_RULE_ID",
  INVALID_CAPACITY_UNIT: "INVALID_CAPACITY_UNIT",
  INVALID_CAPACITY_BASIS: "INVALID_CAPACITY_BASIS",
  INVALID_EFFECTIVE_PERIOD: "INVALID_EFFECTIVE_PERIOD",
  CAPACITY_RULE_CONFLICT: "CAPACITY_RULE_CONFLICT",
  INVALID_CALENDAR_ENTRY: "INVALID_CALENDAR_ENTRY",
  INVALID_ASSIGNMENT: "INVALID_ASSIGNMENT",
  INVALID_ORDER: "INVALID_ORDER",
  INVALID_ROUTING: "INVALID_ROUTING",
  INVALID_SCENARIO: "INVALID_SCENARIO",
  REPOSITORY_CONTRACT_VIOLATION: "REPOSITORY_CONTRACT_VIOLATION",
  IMPORT_VALIDATION_FAILED: "IMPORT_VALIDATION_FAILED"
});

export class ApplicationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
    this.details = details;
  }
}

export function isApplicationError(error) {
  return error instanceof ApplicationError;
}

export function assertNonEmptyString(value, code, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApplicationError(code, `${label} must be a non-empty string.`, {
      value
    });
  }
  return value.trim();
}

export function assertNonNegativeInteger(value, code, label) {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new ApplicationError(code, `${label} must be a non-negative integer.`, {
      value
    });
  }
  return value;
}

export function assertPositiveInteger(value, code, label) {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new ApplicationError(code, `${label} must be a positive integer.`, {
      value
    });
  }
  return value;
}

export function assertFiniteNumber(value, code, label, { min = -Infinity } = {}) {
  if (!Number.isFinite(value) || value < min) {
    throw new ApplicationError(code, `${label} must be a finite number >= ${min}.`, { value });
  }
  return value;
}

export function assertBoolean(value, code, label) {
  if (typeof value !== "boolean") {
    throw new ApplicationError(code, `${label} must be boolean.`, { value });
  }
  return value;
}
