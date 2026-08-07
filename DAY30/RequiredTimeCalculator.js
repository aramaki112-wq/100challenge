import {
  assertCalculationQuantity,
  assertCapacityUnitMatches,
  ceilMinutes,
  normalizeCapacityRuleForCalculation,
  normalizeDecimal,
  resolveBasisMinutes
} from "./CapacityCalculationUtils.js";

/**
 * Converts planned quantity into required whole minutes.
 *
 * Required minutes are always rounded upward so the diagnosis never
 * understates the time needed to execute the plan.
 */
export class RequiredTimeCalculator {
  calculate({
    plannedQuantity,
    quantityUnit,
    capacityRule,
    standardShiftMinutes = null,
    standardDayMinutes = null
  } = {}) {
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

    const rawRequiredMinutes =
      quantity.quantity /
      rule.effectiveCapacity *
      basisMinutes;

    const requiredMinutes = ceilMinutes(
      rawRequiredMinutes
    );

    return Object.freeze({
      plannedQuantity: quantity.quantity,
      quantityUnit: quantity.quantityUnit,
      capacityRuleId: rule.capacityRuleId,
      capacityValue: rule.capacityValue,
      capacityMultiplier: rule.capacityMultiplier,
      effectiveCapacity: rule.effectiveCapacity,
      capacityBasis: rule.capacityBasis,
      basisMinutes,
      rawRequiredMinutes: normalizeDecimal(
        rawRequiredMinutes
      ),
      requiredMinutes,
      minuteRounding: "CEIL_TO_WHOLE_MINUTE"
    });
  }
}
