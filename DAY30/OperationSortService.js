import {
  DIAGNOSIS_GRANULARITY
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertNonEmptyString,
  assertPlainObject,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate
} from "./DateTimeUtils.js";

import {
  assertPlannedOperation
} from "./PlannedOperation.js";

const GRANULARITY_RANK = Object.freeze({
  [DIAGNOSIS_GRANULARITY.TIME]: 0,
  [DIAGNOSIS_GRANULARITY.SHIFT]: 1,
  [DIAGNOSIS_GRANULARITY.DAY]: 2,
  [DIAGNOSIS_GRANULARITY.UNAVAILABLE]: 3
});

const LAST_PRIORITY = Number.MAX_SAFE_INTEGER;
const LAST_SEQUENCE = Number.MAX_SAFE_INTEGER;
const LAST_DATE = "9999-12-31";
const LAST_TIME = "23:59";

function normalizeOptionalPriority(value, label) {
  if (value === null || value === undefined || value === "") {
    return LAST_PRIORITY;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw createDomainError(
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      `${label} must be null or an integer greater than or equal to 1.`,
      { label, value }
    );
  }

  return value;
}

function normalizeOptionalSequence(value, label) {
  if (value === null || value === undefined || value === "") {
    return LAST_SEQUENCE;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw createDomainError(
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      `${label} must be null or a non-negative integer.`,
      { label, value }
    );
  }

  return value;
}

function normalizeOptionalDueDate(value, label) {
  if (value === null || value === undefined || value === "") {
    return LAST_DATE;
  }

  return assertDate(
    value,
    ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
    label
  );
}

function createUniqueMap(items, {
  idField,
  label
}) {
  const map = new Map();

  items.forEach((item, index) => {
    const record = assertPlainObject(
      item,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      `${label}[${index}]`
    );

    const id = assertNonEmptyString(
      record[idField],
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      `${label}[${index}].${idField}`
    );

    if (map.has(id)) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        `${label} must not contain duplicate ${idField} values.`,
        { idField, id, label }
      );
    }

    map.set(id, record);
  });

  return map;
}

function comparePrimitive(left, right) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function buildSortKey(operation, orderMap, routingMap) {
  const granularity = operation.getDiagnosisGranularity();
  const order = orderMap.get(operation.orderId) ?? null;
  const routingOperation =
    routingMap.get(operation.routingOperationId) ?? null;

  const granularityRank = GRANULARITY_RANK[granularity];

  if (granularityRank === undefined) {
    throw createDomainError(
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      "Planned Operation has an unsupported diagnosis granularity.",
      {
        plannedOperationId: operation.plannedOperationId,
        granularity
      }
    );
  }

  return Object.freeze({
    granularityRank,
    operationPriority: normalizeOptionalPriority(
      operation.priority,
      `${operation.plannedOperationId}.priority`
    ),
    orderPriority: normalizeOptionalPriority(
      order?.priority,
      `${operation.orderId}.priority`
    ),
    dueDate: normalizeOptionalDueDate(
      order?.dueDate,
      `${operation.orderId}.dueDate`
    ),
    plannedStartTime:
      operation.plannedStartTime ?? LAST_TIME,
    routingSequence: normalizeOptionalSequence(
      routingOperation?.sequence,
      `${operation.routingOperationId}.sequence`
    ),
    plannedOperationId: operation.plannedOperationId
  });
}

function compareSortKeys(left, right) {
  return (
    comparePrimitive(left.granularityRank, right.granularityRank) ||
    comparePrimitive(left.operationPriority, right.operationPriority) ||
    comparePrimitive(left.orderPriority, right.orderPriority) ||
    comparePrimitive(left.dueDate, right.dueDate) ||
    comparePrimitive(left.plannedStartTime, right.plannedStartTime) ||
    comparePrimitive(left.routingSequence, right.routingSequence) ||
    comparePrimitive(left.plannedOperationId, right.plannedOperationId)
  );
}

/**
 * Capacity競合時の診断順を決定的に固定する。
 * 最適化ではなく、同一入力から同一診断結果を得るためのService。
 */
export class OperationSortService {
  sort({
    plannedOperations,
    orders = [],
    routingOperations = []
  } = {}) {
    const operations = assertArray(
      plannedOperations,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      "plannedOperations"
    ).map((operation) => assertPlannedOperation(operation));

    const seenOperationIds = new Set();

    for (const operation of operations) {
      if (seenOperationIds.has(operation.plannedOperationId)) {
        throw createDomainError(
          ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
          "plannedOperations must not contain duplicate IDs.",
          { plannedOperationId: operation.plannedOperationId }
        );
      }

      seenOperationIds.add(operation.plannedOperationId);
    }

    const orderMap = createUniqueMap(
      assertArray(
        orders,
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "orders"
      ),
      { idField: "orderId", label: "orders" }
    );

    const routingMap = createUniqueMap(
      assertArray(
        routingOperations,
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "routingOperations"
      ),
      {
        idField: "routingOperationId",
        label: "routingOperations"
      }
    );

    const decorated = operations.map((operation) => ({
      operation,
      key: buildSortKey(operation, orderMap, routingMap)
    }));

    decorated.sort((left, right) =>
      compareSortKeys(left.key, right.key)
    );

    return Object.freeze(
      decorated.map(({ operation }) => operation)
    );
  }
}
