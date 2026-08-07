import {
  ERROR_CODES,
  assertArray,
  assertNonEmptyString,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate
} from "./DateTimeUtils.js";

import {
  assertCapacitySnapshot
} from "./CapacitySnapshot.js";

import {
  CapacityLedger,
  assertCapacityLedger
} from "./CapacityLedger.js";

import {
  assertCapacityBucket
} from "./CapacityBucket.js";

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

function buildKey({
  factoryId,
  equipmentId,
  date,
  shiftId = null
}) {
  return [
    assertIdentifier(
      factoryId,
      ERROR_CODES.INVALID_FACTORY_ID,
      "factoryId"
    ),
    assertIdentifier(
      equipmentId,
      ERROR_CODES.INVALID_EQUIPMENT_ID,
      "equipmentId"
    ),
    assertDate(
      date,
      ERROR_CODES.INVALID_DATE,
      "date"
    ),
    assertOptionalIdentifier(
      shiftId,
      ERROR_CODES.INVALID_SHIFT_ID,
      "shiftId"
    ) ?? "DAY"
  ].join("::");
}

function buildDayKey({ factoryId, equipmentId, date }) {
  return [
    assertIdentifier(
      factoryId,
      ERROR_CODES.INVALID_FACTORY_ID,
      "factoryId"
    ),
    assertIdentifier(
      equipmentId,
      ERROR_CODES.INVALID_EQUIPMENT_ID,
      "equipmentId"
    ),
    assertDate(
      date,
      ERROR_CODES.INVALID_DATE,
      "date"
    )
  ].join("::");
}

function compareByShift(left, right) {
  if (left.shiftId === null && right.shiftId !== null) {
    return -1;
  }

  if (left.shiftId !== null && right.shiftId === null) {
    return 1;
  }

  return (left.shiftId ?? "").localeCompare(
    right.shiftId ?? ""
  );
}

/**
 * Diagnosis-run-local registry of mutable CapacityLedgers and immutable
 * unknown CapacityBuckets.
 *
 * Known zero-minute buckets become Ledgers. Unknown-minute buckets are kept
 * separately so UNKNOWN is never silently converted to zero capacity.
 */
export class CapacityLedgerRegistry {
  #ledgerByKey;
  #ledgersByDay;
  #unknownBucketByKey;
  #unknownBucketsByDay;

  constructor({
    ledgers,
    unknownBuckets
  } = {}) {
    const validLedgers = assertArray(
      ledgers,
      ERROR_CODES.INVALID_CAPACITY_LEDGER,
      "ledgers"
    ).map((ledger) => assertCapacityLedger(ledger));

    const validUnknownBuckets = assertArray(
      unknownBuckets,
      ERROR_CODES.INVALID_CAPACITY_SNAPSHOT,
      "unknownBuckets"
    ).map((bucket) => assertCapacityBucket(bucket));

    this.#ledgerByKey = new Map();
    this.#ledgersByDay = new Map();
    this.#unknownBucketByKey = new Map();
    this.#unknownBucketsByDay = new Map();

    for (const ledger of validLedgers) {
      if (this.#ledgerByKey.has(ledger.key)) {
        throw createDomainError(
          ERROR_CODES.DUPLICATE_CAPACITY_BUCKET,
          "CapacityLedgerRegistry must not contain duplicate Ledger keys.",
          { ledgerKey: ledger.key }
        );
      }

      this.#ledgerByKey.set(ledger.key, ledger);

      const dayKey = [
        ledger.factoryId,
        ledger.equipmentId,
        ledger.date
      ].join("::");

      const values = this.#ledgersByDay.get(dayKey) ?? [];
      values.push(ledger);
      this.#ledgersByDay.set(dayKey, values);
    }

    for (const bucket of validUnknownBuckets) {
      if (bucket.availableMinutes !== null) {
        throw createDomainError(
          ERROR_CODES.INVALID_CAPACITY_SNAPSHOT,
          "unknownBuckets must contain only buckets with unknown availableMinutes.",
          { bucket: bucket.toSnapshot() }
        );
      }

      if (this.#unknownBucketByKey.has(bucket.key)) {
        throw createDomainError(
          ERROR_CODES.DUPLICATE_CAPACITY_BUCKET,
          "CapacityLedgerRegistry must not contain duplicate unknown Bucket keys.",
          { bucketKey: bucket.key }
        );
      }

      this.#unknownBucketByKey.set(bucket.key, bucket);

      const dayKey = [
        bucket.factoryId,
        bucket.equipmentId,
        bucket.date
      ].join("::");

      const values = this.#unknownBucketsByDay.get(dayKey) ?? [];
      values.push(bucket);
      this.#unknownBucketsByDay.set(dayKey, values);
    }

    for (const values of this.#ledgersByDay.values()) {
      values.sort(compareByShift);
    }

    for (const values of this.#unknownBucketsByDay.values()) {
      values.sort(compareByShift);
    }

    Object.freeze(this);
  }

  get ledgerCount() {
    return this.#ledgerByKey.size;
  }

  get unknownBucketCount() {
    return this.#unknownBucketByKey.size;
  }

  findLedger(criteria) {
    return this.#ledgerByKey.get(
      buildKey(criteria)
    ) ?? null;
  }

  requireLedger(criteria) {
    const ledger = this.findLedger(criteria);

    if (ledger === null) {
      throw createDomainError(
        ERROR_CODES.CAPACITY_LEDGER_NOT_FOUND,
        "CapacityLedger was not found.",
        { criteria }
      );
    }

    return ledger;
  }

  findUnknownBucket(criteria) {
    return this.#unknownBucketByKey.get(
      buildKey(criteria)
    ) ?? null;
  }

  findLedgersForDay(criteria) {
    const values = this.#ledgersByDay.get(
      buildDayKey(criteria)
    ) ?? [];

    return Object.freeze([...values]);
  }

  findUnknownBucketsForDay(criteria) {
    const values = this.#unknownBucketsByDay.get(
      buildDayKey(criteria)
    ) ?? [];

    return Object.freeze([...values]);
  }

  getLedgers() {
    return Object.freeze([
      ...this.#ledgerByKey.values()
    ]);
  }

  getUnknownBuckets() {
    return Object.freeze([
      ...this.#unknownBucketByKey.values()
    ]);
  }

  toSnapshot() {
    return Object.freeze({
      ledgers: Object.freeze(
        this.getLedgers().map((ledger) => ledger.toSnapshot())
      ),
      unknownBuckets: Object.freeze(
        this.getUnknownBuckets().map((bucket) => bucket.toSnapshot())
      )
    });
  }
}

export class CapacityLedgerFactory {
  createFromSnapshot(capacitySnapshot) {
    const snapshot = assertCapacitySnapshot(capacitySnapshot);
    const ledgers = [];
    const unknownBuckets = [];

    for (const bucket of snapshot.buckets) {
      if (bucket.availableMinutes === null) {
        unknownBuckets.push(bucket);
        continue;
      }

      ledgers.push(CapacityLedger.fromBucket(bucket));
    }

    return new CapacityLedgerRegistry({
      ledgers,
      unknownBuckets
    });
  }
}

export function assertCapacityLedgerRegistry(value) {
  if (!(value instanceof CapacityLedgerRegistry)) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_LEDGER,
      "value must be a CapacityLedgerRegistry.",
      { value }
    );
  }

  return value;
}
