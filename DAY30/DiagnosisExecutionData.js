import {
  ERROR_CODES,
  assertArray,
  assertNonNegativeInteger,
  assertPlainObject,
  assertPositiveInteger,
  createApplicationError
} from "./DiagnosisErrors.js";

import {
  assertCapacitySnapshot
} from "./CapacitySnapshot.js";

const IDENTIFIER_PATTERN = /^\S+$/;
const REVISION_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

function normalizeOptionalIdentifier(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (
    typeof value !== "string" ||
    value.trim() === "" ||
    value !== value.trim() ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA,
      `${label} must be null or a non-empty identifier without whitespace.`,
      { label, value }
    );
  }

  return value;
}

function freezeValue(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(freezeValue));
  }

  if (
    value !== null &&
    typeof value === "object" &&
    (
      Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null
    )
  ) {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = freezeValue(child);
    }
    return Object.freeze(result);
  }

  return value;
}

function normalizeArray(value, label) {
  return Object.freeze(
    assertArray(
      value,
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA,
      label
    ).map(freezeValue)
  );
}

function normalizeMap(value, label) {
  return freezeValue(assertPlainObject(
    value,
    ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA,
    label
  ));
}

function normalizeOptionalDuration(value, label) {
  if (value === null || value === undefined) {
    return null;
  }

  return assertPositiveInteger(
    value,
    ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA,
    label
  );
}

function normalizeOptionalPrecision(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return assertNonNegativeInteger(
    value,
    ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA,
    "quantityPrecision"
  );
}

function normalizeRevision(value) {
  const source = assertPlainObject(
    value,
    ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA,
    "externalInputRevision"
  );
  const result = {};

  for (const [key, revision] of Object.entries(source)) {
    if (!REVISION_KEY_PATTERN.test(key)) {
      throw createApplicationError(
        ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA,
        "externalInputRevision keys must be identifier-like strings.",
        { key }
      );
    }

    result[key] = assertNonNegativeInteger(
      revision,
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA,
      `externalInputRevision.${key}`
    );
  }

  return Object.freeze(result);
}

/**
 * Application PortからPlanDiagnosisEngineへ渡す外部Read Model一式。
 *
 * Production Plan・Version・Operation・Assumption・ScenarioはRepositoryから
 * 読み込むため、このObjectにはDAY29 SnapshotとMaster／Rule／補助Mapだけを持つ。
 */
export class DiagnosisExecutionData {
  constructor({
    capacitySnapshot,
    defaultFactoryId = null,
    factoryIdByOperation = {},
    equipments = [],
    orders = [],
    routingOperations = [],
    shifts = [],
    capacityRules = [],
    requiredConditionsByOperation = {},
    targetContextByOperation = {},
    confirmedConstraintsByOperation = {},
    constraintFindingsByOperation = {},
    assumptionFindingsByOperation = {},
    nextChecksByOperation = {},
    standardShiftMinutes = null,
    standardDayMinutes = null,
    quantityPrecision = null,
    externalInputRevision = {}
  } = {}) {
    this.capacitySnapshot = assertCapacitySnapshot(capacitySnapshot);
    this.defaultFactoryId = normalizeOptionalIdentifier(
      defaultFactoryId,
      "defaultFactoryId"
    );
    this.factoryIdByOperation = normalizeMap(
      factoryIdByOperation,
      "factoryIdByOperation"
    );
    this.equipments = normalizeArray(equipments, "equipments");
    this.orders = normalizeArray(orders, "orders");
    this.routingOperations = normalizeArray(
      routingOperations,
      "routingOperations"
    );
    this.shifts = normalizeArray(shifts, "shifts");
    this.capacityRules = normalizeArray(capacityRules, "capacityRules");
    this.requiredConditionsByOperation = normalizeMap(
      requiredConditionsByOperation,
      "requiredConditionsByOperation"
    );
    this.targetContextByOperation = normalizeMap(
      targetContextByOperation,
      "targetContextByOperation"
    );
    this.confirmedConstraintsByOperation = normalizeMap(
      confirmedConstraintsByOperation,
      "confirmedConstraintsByOperation"
    );
    this.constraintFindingsByOperation = normalizeMap(
      constraintFindingsByOperation,
      "constraintFindingsByOperation"
    );
    this.assumptionFindingsByOperation = normalizeMap(
      assumptionFindingsByOperation,
      "assumptionFindingsByOperation"
    );
    this.nextChecksByOperation = normalizeMap(
      nextChecksByOperation,
      "nextChecksByOperation"
    );
    this.standardShiftMinutes = normalizeOptionalDuration(
      standardShiftMinutes,
      "standardShiftMinutes"
    );
    this.standardDayMinutes = normalizeOptionalDuration(
      standardDayMinutes,
      "standardDayMinutes"
    );
    this.quantityPrecision = normalizeOptionalPrecision(quantityPrecision);
    this.externalInputRevision = normalizeRevision(externalInputRevision);

    Object.freeze(this);
  }

  toSnapshot() {
    return Object.freeze({
      capacitySnapshot: this.capacitySnapshot.toSnapshot(),
      defaultFactoryId: this.defaultFactoryId,
      factoryIdByOperation: this.factoryIdByOperation,
      equipments: this.equipments,
      orders: this.orders,
      routingOperations: this.routingOperations,
      shifts: this.shifts,
      capacityRules: this.capacityRules,
      requiredConditionsByOperation: this.requiredConditionsByOperation,
      targetContextByOperation: this.targetContextByOperation,
      confirmedConstraintsByOperation: this.confirmedConstraintsByOperation,
      constraintFindingsByOperation: this.constraintFindingsByOperation,
      assumptionFindingsByOperation: this.assumptionFindingsByOperation,
      nextChecksByOperation: this.nextChecksByOperation,
      standardShiftMinutes: this.standardShiftMinutes,
      standardDayMinutes: this.standardDayMinutes,
      quantityPrecision: this.quantityPrecision,
      externalInputRevision: this.externalInputRevision
    });
  }

  toEngineInput() {
    return Object.freeze({
      capacitySnapshot: this.capacitySnapshot,
      defaultFactoryId: this.defaultFactoryId,
      factoryIdByOperation: this.factoryIdByOperation,
      equipments: this.equipments,
      orders: this.orders,
      routingOperations: this.routingOperations,
      shifts: this.shifts,
      capacityRules: this.capacityRules,
      requiredConditionsByOperation: this.requiredConditionsByOperation,
      targetContextByOperation: this.targetContextByOperation,
      confirmedConstraintsByOperation: this.confirmedConstraintsByOperation,
      constraintFindingsByOperation: this.constraintFindingsByOperation,
      assumptionFindingsByOperation: this.assumptionFindingsByOperation,
      nextChecksByOperation: this.nextChecksByOperation,
      standardShiftMinutes: this.standardShiftMinutes,
      standardDayMinutes: this.standardDayMinutes,
      quantityPrecision: this.quantityPrecision
    });
  }
}

export function assertDiagnosisExecutionData(value) {
  if (!(value instanceof DiagnosisExecutionData)) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA,
      "value must be a DiagnosisExecutionData.",
      { value }
    );
  }

  return value;
}
