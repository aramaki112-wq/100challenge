import {
  ERROR_CODES,
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPositiveInteger,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate
} from "./DateTimeUtils.js";

const IDENTIFIER_PATTERN = /^\S+$/;

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

function assertAllocationConsistency({
  requestedMinutes,
  allocatedMinutes,
  shortageMinutes
}) {
  if (allocatedMinutes > requestedMinutes) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "allocatedMinutes must not exceed requestedMinutes.",
      {
        requestedMinutes,
        allocatedMinutes
      }
    );
  }

  if (
    allocatedMinutes + shortageMinutes !==
    requestedMinutes
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "allocatedMinutes plus shortageMinutes must equal requestedMinutes.",
      {
        requestedMinutes,
        allocatedMinutes,
        shortageMinutes
      }
    );
  }
}

/**
 * Immutable record of one Planned Operation allocation against one
 * equipment/date/shift capacity ledger.
 */
export class CapacityAllocation {
  constructor({
    allocationId,
    plannedOperationId,
    factoryId,
    equipmentId,
    date,
    shiftId = null,
    sequence,
    requestedMinutes,
    allocatedMinutes,
    shortageMinutes,
    remainingMinutesAfterAllocation,
    allocationReason
  } = {}) {
    this.allocationId = assertIdentifier(
      allocationId,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "allocationId"
    );

    this.plannedOperationId = assertIdentifier(
      plannedOperationId,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "plannedOperationId"
    );

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

    this.sequence = assertPositiveInteger(
      sequence,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "sequence"
    );

    this.requestedMinutes = assertNonNegativeInteger(
      requestedMinutes,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "requestedMinutes"
    );

    this.allocatedMinutes = assertNonNegativeInteger(
      allocatedMinutes,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "allocatedMinutes"
    );

    this.shortageMinutes = assertNonNegativeInteger(
      shortageMinutes,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "shortageMinutes"
    );

    this.remainingMinutesAfterAllocation =
      assertNonNegativeInteger(
        remainingMinutesAfterAllocation,
        ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
        "remainingMinutesAfterAllocation"
      );

    this.allocationReason = assertNonEmptyString(
      allocationReason,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "allocationReason"
    );

    assertAllocationConsistency(this);

    Object.freeze(this);
  }

  get ledgerKey() {
    return [
      this.factoryId,
      this.equipmentId,
      this.date,
      this.shiftId ?? "DAY"
    ].join("::");
  }

  isFullAllocation() {
    return this.shortageMinutes === 0;
  }

  isPartialAllocation() {
    return this.allocatedMinutes > 0 &&
      this.shortageMinutes > 0;
  }

  isZeroAllocation() {
    return this.allocatedMinutes === 0;
  }

  toSnapshot() {
    return Object.freeze({
      allocationId: this.allocationId,
      plannedOperationId: this.plannedOperationId,
      factoryId: this.factoryId,
      equipmentId: this.equipmentId,
      date: this.date,
      shiftId: this.shiftId,
      sequence: this.sequence,
      requestedMinutes: this.requestedMinutes,
      allocatedMinutes: this.allocatedMinutes,
      shortageMinutes: this.shortageMinutes,
      remainingMinutesAfterAllocation:
        this.remainingMinutesAfterAllocation,
      allocationReason: this.allocationReason
    });
  }
}

export function assertCapacityAllocation(value) {
  if (!(value instanceof CapacityAllocation)) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "value must be a CapacityAllocation.",
      { value }
    );
  }

  return value;
}
