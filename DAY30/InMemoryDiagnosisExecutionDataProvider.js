import {
  ERROR_CODES,
  assertNonEmptyString,
  createApplicationError
} from "./DiagnosisErrors.js";

import {
  DiagnosisExecutionData,
  assertDiagnosisExecutionData
} from "./DiagnosisExecutionData.js";

import {
  DiagnosisExecutionDataProvider
} from "./DiagnosisExecutionDataProvider.js";

function assertIdentifier(value, label) {
  const identifier = assertNonEmptyString(
    value,
    ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_PROVIDER,
    label
  );

  if (/\s/.test(identifier)) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_PROVIDER,
      `${label} must not contain whitespace.`,
      { value, label }
    );
  }

  return identifier;
}

function keyOf(capacityScenarioId, targetMonth) {
  return `${capacityScenarioId}::${targetMonth}`;
}

/**
 * Test・Browser Demo向けのInMemory Adapter。
 */
export class InMemoryDiagnosisExecutionDataProvider extends DiagnosisExecutionDataProvider {
  #items;
  #revision;

  constructor({ data = [] } = {}) {
    super();
    this.#items = new Map();
    this.#revision = 0;

    for (const item of data) {
      this.set(item);
    }
  }

  get revision() {
    return this.#revision;
  }

  get count() {
    return this.#items.size;
  }

  set(value) {
    const data = value instanceof DiagnosisExecutionData
      ? value
      : new DiagnosisExecutionData(value);
    const key = keyOf(
      data.capacitySnapshot.capacityScenarioId,
      data.capacitySnapshot.targetMonth
    );
    const previous = this.#items.get(key);

    if (previous === data) {
      return data;
    }

    this.#items.set(key, data);
    this.#revision += 1;
    return data;
  }

  listAll() {
    return Object.freeze([...this.#items.values()]);
  }

  captureState() {
    return Object.freeze({
      items: new Map(this.#items),
      revision: this.#revision
    });
  }

  restoreState(state) {
    if (
      state === null ||
      typeof state !== "object" ||
      !(state.items instanceof Map) ||
      !Number.isInteger(state.revision) ||
      state.revision < 0
    ) {
      throw createApplicationError(
        ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_PROVIDER,
        "state must contain a Map and a non-negative revision.",
        { state }
      );
    }
    const next = new Map();
    for (const [key, value] of state.items.entries()) {
      next.set(key, assertDiagnosisExecutionData(value));
    }
    this.#items = next;
    this.#revision = state.revision;
    return this;
  }

  replaceAll(values, { revision = null } = {}) {
    if (!Array.isArray(values)) {
      throw createApplicationError(
        ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_PROVIDER,
        "values must be an array.",
        { values }
      );
    }
    if (revision !== null && (!Number.isInteger(revision) || revision < 0)) {
      throw createApplicationError(
        ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_PROVIDER,
        "revision must be null or a non-negative integer.",
        { revision }
      );
    }
    const next = new Map();
    for (const value of values) {
      const data = value instanceof DiagnosisExecutionData
        ? value
        : new DiagnosisExecutionData(value);
      const key = keyOf(
        data.capacitySnapshot.capacityScenarioId,
        data.capacitySnapshot.targetMonth
      );
      if (next.has(key)) {
        throw createApplicationError(
          ERROR_CODES.DUPLICATE_DIAGNOSIS_EXECUTION_DATA,
          "values contain a duplicate Scenario and month.",
          { key }
        );
      }
      next.set(key, data);
    }
    this.#items = next;
    this.#revision = revision ?? (this.#revision + 1);
    return this.listAll();
  }

  async load({ capacityScenarioId, targetMonth } = {}) {
    const scenarioId = assertIdentifier(
      capacityScenarioId,
      "capacityScenarioId"
    );
    const month = assertIdentifier(targetMonth, "targetMonth");
    const data = this.#items.get(keyOf(scenarioId, month)) ?? null;

    if (data === null) {
      throw createApplicationError(
        ERROR_CODES.ENTITY_NOT_FOUND,
        "Diagnosis execution data was not found.",
        { capacityScenarioId: scenarioId, targetMonth: month }
      );
    }

    return assertDiagnosisExecutionData(data);
  }

  delete({ capacityScenarioId, targetMonth } = {}) {
    const scenarioId = assertIdentifier(
      capacityScenarioId,
      "capacityScenarioId"
    );
    const month = assertIdentifier(targetMonth, "targetMonth");
    const deleted = this.#items.delete(keyOf(scenarioId, month));
    if (deleted) {
      this.#revision += 1;
    }
    return deleted;
  }
}
