import {
  CAPACITY_RESOURCE_STATUS,
  DATA_CONFIDENCE,
  EQUIPMENT_AVAILABILITY_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertCodeValue,
  assertNonEmptyString,
  assertNonNegativeInteger,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate
} from "./DateTimeUtils.js";

const IDENTIFIER_PATTERN = /^\S+$/;
const REASON_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

function assertIdentifier(value, code, label) {
  const identifier = assertNonEmptyString(
    value,
    code,
    label
  );

  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw createDomainError(
      code,
      `${label} must not contain whitespace.`,
      { value, label }
    );
  }

  return identifier;
}

function assertOptionalIdentifier(value, code, label) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return assertIdentifier(value, code, label);
}

function normalizeAvailableMinutes(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return assertNonNegativeInteger(
    value,
    ERROR_CODES.INVALID_CAPACITY_BUCKET,
    "availableMinutes"
  );
}

function normalizeReasonCodes(reasonCodes) {
  const values = assertArray(
    reasonCodes,
    ERROR_CODES.INVALID_CAPACITY_REASON_CODE,
    "reasonCodes"
  );

  const normalized = values.map((value, index) => {
    const code = assertNonEmptyString(
      value,
      ERROR_CODES.INVALID_CAPACITY_REASON_CODE,
      `reasonCodes[${index}]`
    );

    if (!REASON_CODE_PATTERN.test(code)) {
      throw createDomainError(
        ERROR_CODES.INVALID_CAPACITY_REASON_CODE,
        "Capacity reason code must use uppercase snake case.",
        { value, index }
      );
    }

    return code;
  });

  if (new Set(normalized).size !== normalized.length) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_REASON_CODE,
      "Capacity reason codes must not contain duplicates.",
      { reasonCodes: normalized }
    );
  }

  return Object.freeze(normalized);
}

function hasUnknownStatus(statuses) {
  return statuses.includes(EQUIPMENT_AVAILABILITY_STATUS.UNKNOWN) ||
    statuses.includes(CAPACITY_RESOURCE_STATUS.UNKNOWN);
}

function hasUnsatisfiedResource(statuses) {
  return statuses.includes(CAPACITY_RESOURCE_STATUS.UNSATISFIED);
}

function assertStateConsistency({
  availableMinutes,
  availabilityStatus,
  workerStatus,
  skillStatus,
  assignmentStatus
}) {
  const statuses = [
    availabilityStatus,
    workerStatus,
    skillStatus,
    assignmentStatus
  ];

  if (
    availableMinutes === null &&
    !hasUnknownStatus(statuses)
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_BUCKET_STATE,
      "availableMinutes may be unknown only when at least one capacity condition is UNKNOWN.",
      {
        availableMinutes,
        availabilityStatus,
        workerStatus,
        skillStatus,
        assignmentStatus
      }
    );
  }

  if (
    availabilityStatus ===
      EQUIPMENT_AVAILABILITY_STATUS.UNAVAILABLE &&
    availableMinutes !== 0
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_BUCKET_STATE,
      "UNAVAILABLE equipment must have zero availableMinutes.",
      { availabilityStatus, availableMinutes }
    );
  }

  if (
    hasUnsatisfiedResource(statuses) &&
    availableMinutes !== 0
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_BUCKET_STATE,
      "An UNSATISFIED capacity resource must result in zero availableMinutes.",
      {
        availableMinutes,
        workerStatus,
        skillStatus,
        assignmentStatus
      }
    );
  }

  if (
    availableMinutes !== null &&
    availableMinutes > 0 &&
    availabilityStatus ===
      EQUIPMENT_AVAILABILITY_STATUS.UNKNOWN
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_BUCKET_STATE,
      "Positive availableMinutes require known equipment availability.",
      { availabilityStatus, availableMinutes }
    );
  }
}

/**
 * Immutable DAY30 representation of one DAY29 capacity time bucket.
 *
 * Zero means confirmed no usable capacity. Null means the amount itself
 * cannot currently be determined and must never be treated as zero.
 */
export class CapacityBucket {
  constructor({
    factoryId,
    equipmentId,
    date,
    shiftId = null,
    availableMinutes,
    availabilityStatus,
    workerStatus,
    skillStatus,
    assignmentStatus,
    reasonCodes = [],
    dataConfidence = DATA_CONFIDENCE.A
  } = {}) {
    this.factoryId = assertIdentifier(
      factoryId,
      ERROR_CODES.INVALID_FACTORY_ID,
      "factoryId"
    );

    this.equipmentId = assertIdentifier(
      equipmentId,
      ERROR_CODES.INVALID_EQUIPMENT_ID,
      "equipmentId"
    );

    this.date = assertDate(
      date,
      ERROR_CODES.INVALID_DATE,
      "date"
    );

    this.shiftId = assertOptionalIdentifier(
      shiftId,
      ERROR_CODES.INVALID_SHIFT_ID,
      "shiftId"
    );

    this.availableMinutes = normalizeAvailableMinutes(
      availableMinutes
    );

    this.availabilityStatus = assertCodeValue(
      availabilityStatus,
      EQUIPMENT_AVAILABILITY_STATUS,
      ERROR_CODES.INVALID_CAPACITY_BUCKET,
      "availabilityStatus"
    );

    this.workerStatus = assertCodeValue(
      workerStatus,
      CAPACITY_RESOURCE_STATUS,
      ERROR_CODES.INVALID_CAPACITY_BUCKET,
      "workerStatus"
    );

    this.skillStatus = assertCodeValue(
      skillStatus,
      CAPACITY_RESOURCE_STATUS,
      ERROR_CODES.INVALID_CAPACITY_BUCKET,
      "skillStatus"
    );

    this.assignmentStatus = assertCodeValue(
      assignmentStatus,
      CAPACITY_RESOURCE_STATUS,
      ERROR_CODES.INVALID_CAPACITY_BUCKET,
      "assignmentStatus"
    );

    this.reasonCodes = normalizeReasonCodes(reasonCodes);

    this.dataConfidence = assertCodeValue(
      dataConfidence,
      DATA_CONFIDENCE,
      ERROR_CODES.INVALID_CAPACITY_BUCKET,
      "dataConfidence"
    );

    assertStateConsistency(this);

    Object.freeze(this);
  }

  get key() {
    return [
      this.factoryId,
      this.equipmentId,
      this.date,
      this.shiftId ?? "DAY"
    ].join("::");
  }

  hasUnknownCondition() {
    return [
      this.availabilityStatus,
      this.workerStatus,
      this.skillStatus,
      this.assignmentStatus
    ].some((status) =>
      status === EQUIPMENT_AVAILABILITY_STATUS.UNKNOWN ||
      status === CAPACITY_RESOURCE_STATUS.UNKNOWN
    );
  }

  isKnown() {
    return this.availableMinutes !== null &&
      !this.hasUnknownCondition();
  }

  isUsable() {
    return this.isKnown() &&
      this.availableMinutes > 0 &&
      this.availabilityStatus !==
        EQUIPMENT_AVAILABILITY_STATUS.UNAVAILABLE &&
      ![
        this.workerStatus,
        this.skillStatus,
        this.assignmentStatus
      ].includes(CAPACITY_RESOURCE_STATUS.UNSATISFIED);
  }

  hasReasonCode(reasonCode) {
    return this.reasonCodes.includes(reasonCode);
  }

  toSnapshot() {
    return Object.freeze({
      factoryId: this.factoryId,
      equipmentId: this.equipmentId,
      date: this.date,
      shiftId: this.shiftId,
      availableMinutes: this.availableMinutes,
      availabilityStatus: this.availabilityStatus,
      workerStatus: this.workerStatus,
      skillStatus: this.skillStatus,
      assignmentStatus: this.assignmentStatus,
      reasonCodes: Object.freeze([...this.reasonCodes]),
      dataConfidence: this.dataConfidence
    });
  }
}

export function assertCapacityBucket(value) {
  if (!(value instanceof CapacityBucket)) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_BUCKET,
      "value must be a CapacityBucket.",
      { value }
    );
  }

  return value;
}
