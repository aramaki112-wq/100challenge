import {
  ERROR_CODES,
  createApplicationError
} from "./DiagnosisErrors.js";
import { assertDateTime } from "./DateTimeUtils.js";
import { CapacityBucket } from "./CapacityBucket.js";
import { CapacitySnapshot } from "./CapacitySnapshot.js";
import { DiagnosisExecutionData } from "./DiagnosisExecutionData.js";
import { InMemoryDiagnosisExecutionDataProvider } from "./InMemoryDiagnosisExecutionDataProvider.js";

export const DIAGNOSIS_EXECUTION_DATA_APPLICATION =
  "DAY30_DIAGNOSIS_EXECUTION_DATA";
export const DIAGNOSIS_EXECUTION_DATA_SCHEMA_VERSION = 1;

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    for (const child of value) deepFreeze(child);
  } else {
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return Object.freeze(value);
}

function assertPlainObject(value, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_SNAPSHOT,
      `${label} must be a plain object.`,
      { label, value }
    );
  }
  return value;
}

function assertProvider(value) {
  const methods = [
    "listAll",
    "replaceAll",
    "captureState",
    "restoreState"
  ];
  if (
    !(value instanceof InMemoryDiagnosisExecutionDataProvider) ||
    methods.some((method) => typeof value[method] !== "function")
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_PROVIDER,
      "executionDataProvider must support snapshot persistence.",
      { methods }
    );
  }
  return value;
}

function hydrateExecutionData(snapshot, index) {
  try {
    const source = assertPlainObject(
      snapshot,
      `executionData.items[${index}]`
    );
    const capacitySource = assertPlainObject(
      source.capacitySnapshot,
      `executionData.items[${index}].capacitySnapshot`
    );
    const capacitySnapshot = new CapacitySnapshot({
      ...capacitySource,
      buckets: (capacitySource.buckets ?? []).map(
        (bucket) => new CapacityBucket(bucket)
      )
    });
    return new DiagnosisExecutionData({
      ...source,
      capacitySnapshot
    });
  } catch (cause) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_SNAPSHOT,
      "External diagnosis data could not be restored.",
      { index },
      cause
    );
  }
}

function normalizeSnapshot(snapshot) {
  const root = assertPlainObject(snapshot, "externalDataSnapshot");
  if (root.application !== DIAGNOSIS_EXECUTION_DATA_APPLICATION) {
    throw createApplicationError(
      ERROR_CODES.INVALID_EXTERNAL_DATA_DOCUMENT,
      "The external data application identifier is invalid.",
      { application: root.application }
    );
  }
  if (root.schemaVersion !== DIAGNOSIS_EXECUTION_DATA_SCHEMA_VERSION) {
    throw createApplicationError(
      ERROR_CODES.UNSUPPORTED_EXTERNAL_DATA_SCHEMA_VERSION,
      "The external data schema version is not supported.",
      {
        expected: DIAGNOSIS_EXECUTION_DATA_SCHEMA_VERSION,
        actual: root.schemaVersion
      }
    );
  }
  const exportedAt = assertDateTime(
    root.exportedAt,
    ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_SNAPSHOT,
    "exportedAt"
  );
  if (!Number.isInteger(root.providerRevision) || root.providerRevision < 0) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_SNAPSHOT,
      "providerRevision must be a non-negative integer.",
      { providerRevision: root.providerRevision }
    );
  }
  if (!Array.isArray(root.items)) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_SNAPSHOT,
      "items must be an array.",
      { items: root.items }
    );
  }
  const items = root.items.map(hydrateExecutionData);
  const keys = new Set();
  for (const item of items) {
    const key = `${item.capacitySnapshot.capacityScenarioId}::${item.capacitySnapshot.targetMonth}`;
    if (keys.has(key)) {
      throw createApplicationError(
        ERROR_CODES.DUPLICATE_DIAGNOSIS_EXECUTION_DATA,
        "External diagnosis data contains a duplicate Scenario and month.",
        { key }
      );
    }
    keys.add(key);
  }
  return { root, exportedAt, providerRevision: root.providerRevision, items };
}

export class DiagnosisExecutionDataSnapshotService {
  #provider;

  constructor({ executionDataProvider } = {}) {
    this.#provider = assertProvider(executionDataProvider);
    Object.freeze(this);
  }

  createSnapshot({ exportedAt } = {}) {
    const validExportedAt = assertDateTime(
      exportedAt,
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_SNAPSHOT,
      "exportedAt"
    );
    return deepFreeze({
      application: DIAGNOSIS_EXECUTION_DATA_APPLICATION,
      schemaVersion: DIAGNOSIS_EXECUTION_DATA_SCHEMA_VERSION,
      exportedAt: validExportedAt,
      providerRevision: this.#provider.revision,
      items: this.#provider.listAll().map((item) => item.toSnapshot())
    });
  }

  validateSnapshot(snapshot) {
    const normalized = normalizeSnapshot(snapshot);
    return deepFreeze({
      exportedAt: normalized.exportedAt,
      providerRevision: normalized.providerRevision,
      count: normalized.items.length,
      items: normalized.items,
      summaries: normalized.items.map((item) => ({
        capacityScenarioId: item.capacitySnapshot.capacityScenarioId,
        targetMonth: item.capacitySnapshot.targetMonth,
        generatedAt: item.capacitySnapshot.generatedAt,
        bucketCount: item.capacitySnapshot.bucketCount,
        equipmentCount: item.equipments.length,
        orderCount: item.orders.length,
        routingOperationCount: item.routingOperations.length,
        shiftCount: item.shifts.length,
        capacityRuleCount: item.capacityRules.length
      }))
    });
  }

  restoreSnapshot(snapshot) {
    const normalized = normalizeSnapshot(snapshot);
    const previousState = this.#provider.captureState();
    try {
      this.#provider.replaceAll(normalized.items, {
        revision: normalized.providerRevision
      });
    } catch (cause) {
      this.#provider.restoreState(previousState);
      throw createApplicationError(
        ERROR_CODES.EXTERNAL_DATA_RESTORE_FAILED,
        "External diagnosis data restore failed and the previous state was recovered.",
        {},
        cause
      );
    }
    return deepFreeze({
      restoredAt: normalized.exportedAt,
      count: normalized.items.length,
      providerRevision: normalized.providerRevision
    });
  }

  parseJson({ jsonText } = {}) {
    if (typeof jsonText !== "string" || jsonText.trim() === "") {
      throw createApplicationError(
        ERROR_CODES.INVALID_EXTERNAL_DATA_DOCUMENT,
        "jsonText must be a non-empty JSON string.",
        { jsonTextType: typeof jsonText }
      );
    }
    try {
      return JSON.parse(jsonText);
    } catch (cause) {
      throw createApplicationError(
        ERROR_CODES.INVALID_EXTERNAL_DATA_DOCUMENT,
        "The external data JSON could not be parsed.",
        {},
        cause
      );
    }
  }
}

export function assertDiagnosisExecutionDataSnapshotService(value) {
  const methods = [
    "createSnapshot",
    "validateSnapshot",
    "restoreSnapshot",
    "parseJson"
  ];
  if (
    value === null ||
    typeof value !== "object" ||
    methods.some((method) => typeof value[method] !== "function")
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_SNAPSHOT_SERVICE,
      "value does not satisfy the execution data snapshot service contract.",
      { methods }
    );
  }
  return value;
}
