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

import {
  assertCapacityBucket
} from "./CapacityBucket.js";

import {
  CapacityAllocation
} from "./CapacityAllocation.js";

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

/**
 * Mutable, diagnosis-run-local ledger that prevents the same capacity
 * minutes from being allocated more than once.
 *
 * The identity and initial capacity are immutable. Only private allocation
 * state changes through allocate().
 */
export class CapacityLedger {
  #allocatedMinutes = 0;
  #allocations = [];
  #allocationIds = new Set();

  constructor({
    factoryId,
    equipmentId,
    date,
    shiftId = null,
    availableMinutes
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

    if (
      availableMinutes === null ||
      availableMinutes === undefined ||
      availableMinutes === ""
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_CAPACITY_LEDGER,
        "CapacityLedger requires known availableMinutes.",
        { availableMinutes }
      );
    }

    this.availableMinutes = assertNonNegativeInteger(
      availableMinutes,
      ERROR_CODES.INVALID_CAPACITY_LEDGER,
      "availableMinutes"
    );

    Object.freeze(this);
  }

  static fromBucket(bucket) {
    const validBucket = assertCapacityBucket(bucket);

    if (validBucket.availableMinutes === null) {
      throw createDomainError(
        ERROR_CODES.INVALID_CAPACITY_LEDGER,
        "A CapacityLedger cannot be created from an unknown CapacityBucket.",
        { bucket: validBucket.toSnapshot() }
      );
    }

    return new CapacityLedger({
      factoryId: validBucket.factoryId,
      equipmentId: validBucket.equipmentId,
      date: validBucket.date,
      shiftId: validBucket.shiftId,
      availableMinutes: validBucket.availableMinutes
    });
  }

  get key() {
    return [
      this.factoryId,
      this.equipmentId,
      this.date,
      this.shiftId ?? "DAY"
    ].join("::");
  }

  get allocatedMinutes() {
    return this.#allocatedMinutes;
  }

  get remainingMinutes() {
    return this.availableMinutes -
      this.#allocatedMinutes;
  }

  get allocationCount() {
    return this.#allocations.length;
  }

  allocate({
    allocationId,
    plannedOperationId,
    requestedMinutes,
    allocationReason,
    sequence
  } = {}) {
    const validAllocationId = assertIdentifier(
      allocationId,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "allocationId"
    );

    if (this.#allocationIds.has(validAllocationId)) {
      throw createDomainError(
        ERROR_CODES.DUPLICATE_CAPACITY_ALLOCATION,
        "The same capacity allocation ID cannot be recorded twice.",
        {
          ledgerKey: this.key,
          allocationId: validAllocationId
        }
      );
    }

    const validPlannedOperationId = assertIdentifier(
      plannedOperationId,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "plannedOperationId"
    );

    const validRequestedMinutes = assertNonNegativeInteger(
      requestedMinutes,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "requestedMinutes"
    );

    const validReason = assertNonEmptyString(
      allocationReason,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "allocationReason"
    );

    const validSequence = assertPositiveInteger(
      sequence,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION,
      "sequence"
    );

    const remainingBeforeAllocation =
      this.remainingMinutes;

    const allocatedMinutes = Math.min(
      validRequestedMinutes,
      remainingBeforeAllocation
    );

    const shortageMinutes =
      validRequestedMinutes - allocatedMinutes;

    const remainingMinutesAfterAllocation =
      remainingBeforeAllocation - allocatedMinutes;

    const allocation = new CapacityAllocation({
      allocationId: validAllocationId,
      plannedOperationId: validPlannedOperationId,
      factoryId: this.factoryId,
      equipmentId: this.equipmentId,
      date: this.date,
      shiftId: this.shiftId,
      sequence: validSequence,
      requestedMinutes: validRequestedMinutes,
      allocatedMinutes,
      shortageMinutes,
      remainingMinutesAfterAllocation,
      allocationReason: validReason
    });

    const nextAllocatedMinutes =
      this.#allocatedMinutes + allocatedMinutes;

    if (nextAllocatedMinutes > this.availableMinutes) {
      throw createDomainError(
        ERROR_CODES.CAPACITY_ALLOCATION_EXCEEDED,
        "Capacity allocation exceeded availableMinutes.",
        {
          ledgerKey: this.key,
          availableMinutes: this.availableMinutes,
          nextAllocatedMinutes
        }
      );
    }

    this.#allocations.push(allocation);
    this.#allocationIds.add(validAllocationId);
    this.#allocatedMinutes = nextAllocatedMinutes;

    return allocation;
  }

  hasAllocation(allocationId) {
    if (typeof allocationId !== "string") {
      return false;
    }

    return this.#allocationIds.has(allocationId);
  }

  getAllocations() {
    return Object.freeze([...this.#allocations]);
  }

  toSnapshot() {
    return Object.freeze({
      factoryId: this.factoryId,
      equipmentId: this.equipmentId,
      date: this.date,
      shiftId: this.shiftId,
      availableMinutes: this.availableMinutes,
      allocatedMinutes: this.allocatedMinutes,
      remainingMinutes: this.remainingMinutes,
      allocations: Object.freeze(
        this.#allocations.map((allocation) =>
          allocation.toSnapshot()
        )
      )
    });
  }
}

export function assertCapacityLedger(value) {
  if (!(value instanceof CapacityLedger)) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_LEDGER,
      "value must be a CapacityLedger.",
      { value }
    );
  }

  return value;
}
