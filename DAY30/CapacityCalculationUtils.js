import {
  CAPACITY_RATE_BASIS,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertCodeValue,
  assertFiniteNumber,
  assertPlainObject,
  assertPositiveInteger,
  createDomainError
} from "./DiagnosisErrors.js";

const DISCRETE_QUANTITY_UNITS = Object.freeze([
  QUANTITY_UNIT.PIECE,
  QUANTITY_UNIT.LOT
]);

const FLOATING_POINT_EPSILON = 1e-10;

function normalizePositiveNumber(value, code, label) {
  return assertFiniteNumber(
    value,
    code,
    label,
    { min: Number.MIN_VALUE }
  );
}

export function assertCalculationQuantity({
  quantity,
  quantityUnit,
  label = "quantity"
} = {}) {
  const validQuantityUnit = assertCodeValue(
    quantityUnit,
    QUANTITY_UNIT,
    ERROR_CODES.INVALID_QUANTITY_UNIT,
    "quantityUnit"
  );

  const validQuantity = normalizePositiveNumber(
    quantity,
    ERROR_CODES.INVALID_PLANNED_QUANTITY,
    label
  );

  if (
    DISCRETE_QUANTITY_UNITS.includes(validQuantityUnit) &&
    !Number.isInteger(validQuantity)
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_PLANNED_QUANTITY,
      `${validQuantityUnit} ${label} must be an integer.`,
      {
        quantity: validQuantity,
        quantityUnit: validQuantityUnit,
        label
      }
    );
  }

  return Object.freeze({
    quantity: validQuantity,
    quantityUnit: validQuantityUnit
  });
}

export function normalizeCapacityRuleForCalculation(
  capacityRule
) {
  const rule = assertPlainObject(
    capacityRule,
    ERROR_CODES.INVALID_CAPACITY_RULE,
    "capacityRule"
  );

  const quantityUnit = assertCodeValue(
    rule.quantityUnit,
    QUANTITY_UNIT,
    ERROR_CODES.INVALID_QUANTITY_UNIT,
    "capacityRule.quantityUnit"
  );

  const capacityBasis = assertCodeValue(
    rule.capacityBasis,
    CAPACITY_RATE_BASIS,
    ERROR_CODES.INVALID_CAPACITY_RULE,
    "capacityRule.capacityBasis"
  );

  const capacityValue = normalizePositiveNumber(
    rule.capacityValue,
    ERROR_CODES.INVALID_CAPACITY_VALUE,
    "capacityRule.capacityValue"
  );

  const capacityMultiplier = normalizePositiveNumber(
    rule.capacityMultiplier ?? 1,
    ERROR_CODES.INVALID_CAPACITY_MULTIPLIER,
    "capacityRule.capacityMultiplier"
  );

  const effectiveCapacity =
    capacityValue * capacityMultiplier;

  if (!Number.isFinite(effectiveCapacity) || effectiveCapacity <= 0) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_RULE,
      "Effective capacity must be a positive finite number.",
      {
        capacityValue,
        capacityMultiplier,
        effectiveCapacity
      }
    );
  }

  return Object.freeze({
    capacityRuleId:
      typeof rule.capacityRuleId === "string" &&
      rule.capacityRuleId.trim() !== ""
        ? rule.capacityRuleId.trim()
        : null,
    capacityValue,
    quantityUnit,
    capacityBasis,
    capacityMultiplier,
    effectiveCapacity
  });
}

export function resolveBasisMinutes({
  capacityBasis,
  standardShiftMinutes = null,
  standardDayMinutes = null
} = {}) {
  if (capacityBasis === CAPACITY_RATE_BASIS.HOUR) {
    return 60;
  }

  if (capacityBasis === CAPACITY_RATE_BASIS.SHIFT) {
    return assertPositiveInteger(
      standardShiftMinutes,
      ERROR_CODES.INVALID_STANDARD_DURATION,
      "standardShiftMinutes"
    );
  }

  if (capacityBasis === CAPACITY_RATE_BASIS.DAY) {
    return assertPositiveInteger(
      standardDayMinutes,
      ERROR_CODES.INVALID_STANDARD_DURATION,
      "standardDayMinutes"
    );
  }

  throw createDomainError(
    ERROR_CODES.INVALID_CAPACITY_RULE,
    "Unsupported capacity basis.",
    { capacityBasis }
  );
}

export function assertCapacityUnitMatches(
  quantityUnit,
  capacityQuantityUnit
) {
  if (quantityUnit !== capacityQuantityUnit) {
    throw createDomainError(
      ERROR_CODES.CAPACITY_UNIT_MISMATCH,
      "Planned quantity unit and capacity rule quantity unit must match.",
      {
        quantityUnit,
        capacityQuantityUnit
      }
    );
  }
}

export function ceilMinutes(value) {
  return Math.ceil(value - FLOATING_POINT_EPSILON);
}

export function floorToPrecision(value, precision) {
  const factor = 10 ** precision;
  return Math.floor(
    (value + FLOATING_POINT_EPSILON) * factor
  ) / factor;
}

export function normalizeDecimal(value, precision = 12) {
  return Number(value.toFixed(precision));
}

export function isDiscreteQuantityUnit(quantityUnit) {
  return DISCRETE_QUANTITY_UNITS.includes(quantityUnit);
}
