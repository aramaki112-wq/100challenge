import {
  CAPACITY_STATUS,
  DIAGNOSIS_GRANULARITY,
  ID_NAMESPACE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPositiveInteger,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  generateId,
  assertIdGenerator
} from "./IdGenerator.js";

import {
  assertPlannedOperation
} from "./PlannedOperation.js";

import {
  assertCapacityLedgerRegistry
} from "./CapacityLedgerFactory.js";

const IDENTIFIER_PATTERN = /^\S+$/;

export const CAPACITY_ALLOCATION_REASON = Object.freeze({
  TIME_FIXED_BUCKET: "TIME_FIXED_BUCKET",
  SHIFT_FIXED_BUCKET: "SHIFT_FIXED_BUCKET",
  DAY_SINGLE_BUCKET: "DAY_SINGLE_BUCKET",
  DAY_ACROSS_SHIFTS: "DAY_ACROSS_SHIFTS"
});

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

function decideStatus({
  requestedMinutes,
  allocatedMinutes,
  hasUnknownCandidate
}) {
  if (allocatedMinutes >= requestedMinutes) {
    return CAPACITY_STATUS.FEASIBLE;
  }

  if (hasUnknownCandidate) {
    return CAPACITY_STATUS.UNKNOWN;
  }

  if (allocatedMinutes > 0) {
    return CAPACITY_STATUS.PARTIALLY_FEASIBLE;
  }

  return CAPACITY_STATUS.INFEASIBLE;
}

function createResult({
  plannedOperation,
  granularity,
  requestedMinutes,
  allocatedMinutes,
  allocations,
  candidateLedgerKeys,
  unknownBucketKeys,
  reasonCode,
  scheduleLimitMinutes = null,
  statusOverride = null
}) {
  const shortageMinutes = Math.max(
    0,
    requestedMinutes - allocatedMinutes
  );

  const status = statusOverride ?? decideStatus({
    requestedMinutes,
    allocatedMinutes,
    hasUnknownCandidate: unknownBucketKeys.length > 0
  });

  return Object.freeze({
    plannedOperationId: plannedOperation.plannedOperationId,
    granularity,
    status,
    requestedMinutes,
    allocatedMinutes,
    shortageMinutes,
    scheduleLimitMinutes,
    reasonCode,
    allocations: Object.freeze([...allocations]),
    candidateLedgerKeys: Object.freeze([...candidateLedgerKeys]),
    unknownBucketKeys: Object.freeze([...unknownBucketKeys])
  });
}

/**
 * Allocates required minutes against a diagnosis-run-local Ledger Registry.
 *
 * TIME and SHIFT are fixed to one Shift bucket. DAY may consume multiple
 * Shift buckets in deterministic Shift-ID order. Unknown capacity never
 * becomes zero; it keeps the allocation result UNKNOWN when known capacity
 * cannot fully satisfy the request.
 */
export class CapacityAllocationService {
  #idGenerator;

  constructor({ idGenerator } = {}) {
    this.#idGenerator = assertIdGenerator(idGenerator);
    Object.freeze(this);
  }

  allocate({
    plannedOperation,
    factoryId,
    requiredMinutes,
    ledgerRegistry,
    sequenceStart = 1
  } = {}) {
    const operation = assertPlannedOperation(plannedOperation);
    const validFactoryId = assertIdentifier(
      factoryId,
      ERROR_CODES.INVALID_FACTORY_ID,
      "factoryId"
    );
    const validRequiredMinutes = assertNonNegativeInteger(
      requiredMinutes,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION_REQUEST,
      "requiredMinutes"
    );
    const registry = assertCapacityLedgerRegistry(ledgerRegistry);
    const validSequenceStart = assertPositiveInteger(
      sequenceStart,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION_REQUEST,
      "sequenceStart"
    );

    const granularity = operation.getDiagnosisGranularity();

    if (
      granularity === DIAGNOSIS_GRANULARITY.TIME ||
      granularity === DIAGNOSIS_GRANULARITY.SHIFT
    ) {
      return this.#allocateFixedBucket({
        operation,
        factoryId: validFactoryId,
        requiredMinutes: validRequiredMinutes,
        registry,
        sequenceStart: validSequenceStart,
        granularity
      });
    }

    if (granularity === DIAGNOSIS_GRANULARITY.DAY) {
      return this.#allocateDay({
        operation,
        factoryId: validFactoryId,
        requiredMinutes: validRequiredMinutes,
        registry,
        sequenceStart: validSequenceStart
      });
    }

    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION_REQUEST,
      "Unsupported diagnosis granularity for capacity allocation.",
      { granularity }
    );
  }

  #allocateFixedBucket({
    operation,
    factoryId,
    requiredMinutes,
    registry,
    sequenceStart,
    granularity
  }) {
    if (operation.shiftId === null) {
      throw createDomainError(
        ERROR_CODES.CAPACITY_ALLOCATION_TARGET_AMBIGUOUS,
        `${granularity} allocation requires shiftId.`,
        {
          plannedOperationId: operation.plannedOperationId,
          granularity
        }
      );
    }

    const criteria = {
      factoryId,
      equipmentId: operation.equipmentId,
      date: operation.plannedDate,
      shiftId: operation.shiftId
    };

    const ledger = registry.findLedger(criteria);
    const unknownBucket = registry.findUnknownBucket(criteria);

    if (ledger === null) {
      return createResult({
        plannedOperation: operation,
        granularity,
        requestedMinutes: requiredMinutes,
        allocatedMinutes: 0,
        allocations: [],
        candidateLedgerKeys: [],
        unknownBucketKeys:
          unknownBucket === null ? [] : [unknownBucket.key],
        reasonCode:
          unknownBucket === null
            ? "CAPACITY_BUCKET_NOT_FOUND"
            : "CAPACITY_UNKNOWN",
        scheduleLimitMinutes:
          granularity === DIAGNOSIS_GRANULARITY.TIME
            ? operation.plannedDurationMinutes
            : null,
        statusOverride:
          unknownBucket === null
            ? CAPACITY_STATUS.UNKNOWN
            : null
      });
    }

    const scheduleLimitMinutes =
      granularity === DIAGNOSIS_GRANULARITY.TIME
        ? operation.plannedDurationMinutes
        : null;

    const bucketRequest =
      scheduleLimitMinutes === null
        ? requiredMinutes
        : Math.min(requiredMinutes, scheduleLimitMinutes);

    const allocation = ledger.allocate({
      allocationId: generateId(
        this.#idGenerator,
        ID_NAMESPACE.CAPACITY_ALLOCATION
      ),
      plannedOperationId: operation.plannedOperationId,
      requestedMinutes: bucketRequest,
      allocationReason:
        granularity === DIAGNOSIS_GRANULARITY.TIME
          ? CAPACITY_ALLOCATION_REASON.TIME_FIXED_BUCKET
          : CAPACITY_ALLOCATION_REASON.SHIFT_FIXED_BUCKET,
      sequence: sequenceStart
    });

    return createResult({
      plannedOperation: operation,
      granularity,
      requestedMinutes: requiredMinutes,
      allocatedMinutes: allocation.allocatedMinutes,
      allocations: [allocation],
      candidateLedgerKeys: [ledger.key],
      unknownBucketKeys: [],
      reasonCode:
        scheduleLimitMinutes !== null &&
        requiredMinutes > scheduleLimitMinutes
          ? "TIME_WINDOW_SHORTAGE"
          : allocation.shortageMinutes > 0
            ? "CAPACITY_SHORTAGE"
            : "CAPACITY_ALLOCATED",
      scheduleLimitMinutes
    });
  }

  #allocateDay({
    operation,
    factoryId,
    requiredMinutes,
    registry,
    sequenceStart
  }) {
    const criteria = {
      factoryId,
      equipmentId: operation.equipmentId,
      date: operation.plannedDate
    };

    const ledgers = registry.findLedgersForDay(criteria);
    const unknownBuckets = registry.findUnknownBucketsForDay(criteria);

    const hasDayLevel = [
      ...ledgers,
      ...unknownBuckets
    ].some((value) => value.shiftId === null);

    const hasShiftLevel = [
      ...ledgers,
      ...unknownBuckets
    ].some((value) => value.shiftId !== null);

    if (hasDayLevel && hasShiftLevel) {
      throw createDomainError(
        ERROR_CODES.CAPACITY_ALLOCATION_TARGET_AMBIGUOUS,
        "DAY allocation cannot mix aggregate DAY capacity with Shift capacity for the same equipment and date.",
        {
          plannedOperationId: operation.plannedOperationId,
          factoryId,
          equipmentId: operation.equipmentId,
          date: operation.plannedDate
        }
      );
    }

    if (ledgers.length === 0) {
      return createResult({
        plannedOperation: operation,
        granularity: DIAGNOSIS_GRANULARITY.DAY,
        requestedMinutes: requiredMinutes,
        allocatedMinutes: 0,
        allocations: [],
        candidateLedgerKeys: [],
        unknownBucketKeys: unknownBuckets.map((bucket) => bucket.key),
        reasonCode:
          unknownBuckets.length > 0
            ? "CAPACITY_UNKNOWN"
            : "CAPACITY_BUCKET_NOT_FOUND",
        statusOverride:
          unknownBuckets.length === 0
            ? CAPACITY_STATUS.UNKNOWN
            : null
      });
    }

    if (hasDayLevel) {
      const [ledger] = ledgers;
      const allocation = ledger.allocate({
        allocationId: generateId(
          this.#idGenerator,
          ID_NAMESPACE.CAPACITY_ALLOCATION
        ),
        plannedOperationId: operation.plannedOperationId,
        requestedMinutes: requiredMinutes,
        allocationReason:
          CAPACITY_ALLOCATION_REASON.DAY_SINGLE_BUCKET,
        sequence: sequenceStart
      });

      return createResult({
        plannedOperation: operation,
        granularity: DIAGNOSIS_GRANULARITY.DAY,
        requestedMinutes: requiredMinutes,
        allocatedMinutes: allocation.allocatedMinutes,
        allocations: [allocation],
        candidateLedgerKeys: [ledger.key],
        unknownBucketKeys: unknownBuckets.map((bucket) => bucket.key),
        reasonCode:
          allocation.shortageMinutes > 0
            ? "CAPACITY_SHORTAGE"
            : "CAPACITY_ALLOCATED"
      });
    }

    let remainingMinutes = requiredMinutes;
    let allocatedMinutes = 0;
    let sequence = sequenceStart;
    const allocations = [];

    for (const ledger of ledgers) {
      if (remainingMinutes === 0) {
        break;
      }

      const requestForLedger = Math.min(
        remainingMinutes,
        ledger.remainingMinutes
      );

      if (requestForLedger === 0) {
        continue;
      }

      const allocation = ledger.allocate({
        allocationId: generateId(
          this.#idGenerator,
          ID_NAMESPACE.CAPACITY_ALLOCATION
        ),
        plannedOperationId: operation.plannedOperationId,
        requestedMinutes: requestForLedger,
        allocationReason:
          CAPACITY_ALLOCATION_REASON.DAY_ACROSS_SHIFTS,
        sequence
      });

      allocations.push(allocation);
      allocatedMinutes += allocation.allocatedMinutes;
      remainingMinutes -= allocation.allocatedMinutes;
      sequence += 1;
    }

    return createResult({
      plannedOperation: operation,
      granularity: DIAGNOSIS_GRANULARITY.DAY,
      requestedMinutes: requiredMinutes,
      allocatedMinutes,
      allocations,
      candidateLedgerKeys: ledgers.map((ledger) => ledger.key),
      unknownBucketKeys: unknownBuckets.map((bucket) => bucket.key),
      reasonCode:
        remainingMinutes === 0
          ? "CAPACITY_ALLOCATED"
          : unknownBuckets.length > 0
            ? "CAPACITY_UNKNOWN"
            : allocatedMinutes > 0
              ? "CAPACITY_SHORTAGE"
              : "NO_AVAILABLE_CAPACITY"
    });
  }
}
