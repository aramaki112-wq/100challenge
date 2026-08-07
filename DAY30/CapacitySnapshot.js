import {
  ERROR_CODES,
  assertArray,
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPlainObject,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate,
  assertDateTime,
  assertTargetMonth,
  isDateInTargetMonth
} from "./DateTimeUtils.js";

import {
  CapacityBucket,
  assertCapacityBucket
} from "./CapacityBucket.js";

const IDENTIFIER_PATTERN = /^\S+$/;
const REVISION_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

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

function normalizeSourceRevision(sourceRevision) {
  const source = assertPlainObject(
    sourceRevision,
    ERROR_CODES.INVALID_SOURCE_REVISION,
    "sourceRevision"
  );

  const entries = Object.entries(source);

  if (entries.length === 0) {
    throw createDomainError(
      ERROR_CODES.INVALID_SOURCE_REVISION,
      "sourceRevision must contain at least one revision.",
      { sourceRevision }
    );
  }

  const result = {};

  for (const [key, value] of entries) {
    if (!REVISION_KEY_PATTERN.test(key)) {
      throw createDomainError(
        ERROR_CODES.INVALID_SOURCE_REVISION,
        "sourceRevision keys must be identifier-like strings.",
        { key }
      );
    }

    result[key] = assertNonNegativeInteger(
      value,
      ERROR_CODES.INVALID_SOURCE_REVISION,
      `sourceRevision.${key}`
    );
  }

  return Object.freeze(result);
}

function normalizeBuckets(buckets, targetMonth) {
  const values = assertArray(
    buckets,
    ERROR_CODES.INVALID_CAPACITY_SNAPSHOT,
    "buckets"
  );

  const normalized = values.map((bucket, index) => {
    try {
      return assertCapacityBucket(bucket);
    } catch (error) {
      throw createDomainError(
        ERROR_CODES.INVALID_CAPACITY_SNAPSHOT,
        `buckets[${index}] must be a CapacityBucket.`,
        { index },
        error
      );
    }
  });

  const keys = new Set();

  for (const bucket of normalized) {
    if (!isDateInTargetMonth(bucket.date, targetMonth)) {
      throw createDomainError(
        ERROR_CODES.INVALID_CAPACITY_SNAPSHOT,
        "Every CapacityBucket date must belong to targetMonth.",
        {
          targetMonth,
          bucketKey: bucket.key,
          date: bucket.date
        }
      );
    }

    if (keys.has(bucket.key)) {
      throw createDomainError(
        ERROR_CODES.DUPLICATE_CAPACITY_BUCKET,
        "CapacitySnapshot must not contain duplicate bucket keys.",
        { bucketKey: bucket.key }
      );
    }

    keys.add(bucket.key);
  }

  return Object.freeze([...normalized]);
}

/**
 * Immutable read-only boundary from DAY29 capacity results into DAY30.
 *
 * DAY30 may query this snapshot but never mutate DAY29 capacity results.
 */
export class CapacitySnapshot {
  #bucketByKey;
  #bucketsByEquipment;

  constructor({
    capacityScenarioId,
    targetMonth,
    generatedAt,
    sourceRevision,
    buckets
  } = {}) {
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

    this.generatedAt = assertDateTime(
      generatedAt,
      ERROR_CODES.INVALID_DATE_TIME,
      "generatedAt"
    );

    this.sourceRevision = normalizeSourceRevision(
      sourceRevision
    );

    this.buckets = normalizeBuckets(
      buckets,
      this.targetMonth
    );

    this.#bucketByKey = new Map(
      this.buckets.map((bucket) => [bucket.key, bucket])
    );

    this.#bucketsByEquipment = new Map();

    for (const bucket of this.buckets) {
      const existing = this.#bucketsByEquipment.get(
        bucket.equipmentId
      ) ?? [];

      existing.push(bucket);
      this.#bucketsByEquipment.set(
        bucket.equipmentId,
        existing
      );
    }

    for (const [equipmentId, values] of this.#bucketsByEquipment) {
      this.#bucketsByEquipment.set(
        equipmentId,
        Object.freeze([...values])
      );
    }

    Object.freeze(this);
  }

  get bucketCount() {
    return this.buckets.length;
  }

  findBucket({
    factoryId,
    equipmentId,
    date,
    shiftId = null
  } = {}) {
    const key = [
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

    return this.#bucketByKey.get(key) ?? null;
  }

  requireBucket(criteria) {
    const bucket = this.findBucket(criteria);

    if (bucket === null) {
      throw createDomainError(
        ERROR_CODES.CAPACITY_BUCKET_NOT_FOUND,
        "CapacityBucket was not found.",
        { criteria }
      );
    }

    return bucket;
  }

  findBucketsForDay({
    equipmentId,
    date,
    factoryId = null
  } = {}) {
    const normalizedEquipmentId = assertIdentifier(
      equipmentId,
      ERROR_CODES.INVALID_EQUIPMENT_ID,
      "equipmentId"
    );

    const normalizedDate = assertDate(
      date,
      ERROR_CODES.INVALID_DATE,
      "date"
    );

    const normalizedFactoryId = assertOptionalIdentifier(
      factoryId,
      ERROR_CODES.INVALID_FACTORY_ID,
      "factoryId"
    );

    const results = (
      this.#bucketsByEquipment.get(normalizedEquipmentId) ?? []
    ).filter((bucket) =>
      bucket.date === normalizedDate &&
      (
        normalizedFactoryId === null ||
        bucket.factoryId === normalizedFactoryId
      )
    );

    return Object.freeze([...results]);
  }

  hasEquipment(equipmentId) {
    const normalizedEquipmentId = assertIdentifier(
      equipmentId,
      ERROR_CODES.INVALID_EQUIPMENT_ID,
      "equipmentId"
    );

    return this.#bucketsByEquipment.has(normalizedEquipmentId);
  }

  toSnapshot() {
    return Object.freeze({
      capacityScenarioId: this.capacityScenarioId,
      targetMonth: this.targetMonth,
      generatedAt: this.generatedAt,
      sourceRevision: Object.freeze({
        ...this.sourceRevision
      }),
      buckets: Object.freeze(
        this.buckets.map((bucket) =>
          bucket.toSnapshot()
        )
      )
    });
  }
}

export function assertCapacitySnapshot(value) {
  if (!(value instanceof CapacitySnapshot)) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_SNAPSHOT,
      "value must be a CapacitySnapshot.",
      { value }
    );
  }

  return value;
}
