import {
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertFiniteNumber,
  assertNonNegativeInteger
} from "./DiagnosisErrors.js";

import {
  assertCalculationQuantity,
  assertCapacityUnitMatches,
  floorToPrecision,
  isDiscreteQuantityUnit,
  normalizeCapacityRuleForCalculation,
  normalizeDecimal,
  resolveBasisMinutes
} from "./CapacityCalculationUtils.js";

function assertQuantityPrecision(value, quantityUnit) {
  if (isDiscreteQuantityUnit(quantityUnit)) {
    return 0;
  }

  return assertNonNegativeInteger(
    value ?? 3,
    ERROR_CODES.INVALID_QUANTITY_PRECISION,
    "quantityPrecision"
  );
}

/**
 * Converts allocated minutes back into executable quantity.
 *
 * Executable quantity is rounded down so the diagnosis never claims more
 * production than the allocated time can support.
 */
export class ExecutableQuantityCalculator {
  calculate({
    allocatedMinutes,
    plannedQuantity,
    quantityUnit,
    capacityRule,
    standardShiftMinutes = null,
    standardDayMinutes = null,
    quantityPrecision = null
  } = {}) {
    const validAllocatedMinutes = assertFiniteNumber(
      allocatedMinutes,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION_REQUEST,
      "allocatedMinutes",
      { min: 0 }
    );

    const quantity = assertCalculationQuantity({
      quantity: plannedQuantity,
      quantityUnit,
      label: "plannedQuantity"
    });

    const rule = normalizeCapacityRuleForCalculation(
      capacityRule
    );

    assertCapacityUnitMatches(
      quantity.quantityUnit,
      rule.quantityUnit
    );

    const basisMinutes = resolveBasisMinutes({
      capacityBasis: rule.capacityBasis,
      standardShiftMinutes,
      standardDayMinutes
    });

    const precision = assertQuantityPrecision(
      quantityPrecision,
      quantity.quantityUnit
    );

    const rawExecutableQuantity =
      validAllocatedMinutes /
      basisMinutes *
      rule.effectiveCapacity;

    const roundedExecutableQuantity =
      floorToPrecision(
        rawExecutableQuantity,
        precision
      );

    const executableQuantity = Math.min(
      quantity.quantity,
      roundedExecutableQuantity
    );

    const shortageQuantity = normalizeDecimal(
      quantity.quantity - executableQuantity
    );

    return Object.freeze({
      allocatedMinutes: validAllocatedMinutes,
      plannedQuantity: quantity.quantity,
      executableQuantity,
      shortageQuantity,
      quantityUnit: quantity.quantityUnit,
      quantityPrecision: precision,
      capacityRuleId: rule.capacityRuleId,
      effectiveCapacity: rule.effectiveCapacity,
      capacityBasis: rule.capacityBasis,
      basisMinutes,
      rawExecutableQuantity: normalizeDecimal(
        rawExecutableQuantity
      ),
      quantityRounding:
        quantity.quantityUnit === QUANTITY_UNIT.KILOGRAM
          ? "FLOOR_TO_CONFIGURED_PRECISION"
          : "FLOOR_TO_WHOLE_QUANTITY"
    });
  }
}
