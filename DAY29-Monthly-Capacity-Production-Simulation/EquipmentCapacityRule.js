import { ApplicationError, ERROR_CODES, assertBoolean, assertFiniteNumber, assertNonEmptyString, assertPositiveInteger } from "./errors.js";
import { CAPACITY_BASES, VALID_CAPACITY_BASES, VALID_CAPACITY_UNITS } from "./Day29Constants.js";
import { EffectivePeriod } from "./EffectivePeriod.js";

const CONDITION_FIELDS = Object.freeze([
  "productGroup", "materialGroup", "dimensionGroup", "outsideDiameterMin",
  "outsideDiameterMax", "wallThicknessMin", "wallThicknessMax", "processingType",
  "difficultyClass", "operationType"
]);

function normalizeConditions(conditions = {}) {
  const result = {};
  for (const key of CONDITION_FIELDS) {
    const value = conditions[key];
    if (value !== undefined && value !== null && value !== "") result[key] = value;
  }
  return Object.freeze(result);
}

function numericRangeMatches(contextValue, minValue, maxValue) {
  if (minValue == null && maxValue == null) return true;
  if (!Number.isFinite(Number(contextValue))) return false;
  const value = Number(contextValue);
  if (minValue != null && value < Number(minValue)) return false;
  if (maxValue != null && value > Number(maxValue)) return false;
  return true;
}

export class EquipmentCapacityRule {
  constructor({
    capacityRuleId, equipmentId, capacityValue, unit, basis,
    effectivePeriod = {}, priority = 100, active = true,
    conditions = {}, capacityMultiplier = 1, isDefault = false
  }) {
    this.capacityRuleId = assertNonEmptyString(capacityRuleId, ERROR_CODES.INVALID_CAPACITY_RULE_ID, "capacityRuleId");
    this.equipmentId = assertNonEmptyString(equipmentId, ERROR_CODES.INVALID_EQUIPMENT_ID, "equipmentId");
    this.capacityValue = assertFiniteNumber(Number(capacityValue), ERROR_CODES.INVALID_CAPACITY_VALUE, "capacityValue", { min: Number.EPSILON });
    this.unit = assertNonEmptyString(unit, ERROR_CODES.INVALID_CAPACITY_UNIT, "unit");
    if (!VALID_CAPACITY_UNITS.includes(this.unit)) {
      throw new ApplicationError(ERROR_CODES.INVALID_CAPACITY_UNIT, "Unsupported capacity unit.", { unit, validUnits: VALID_CAPACITY_UNITS });
    }
    this.basis = assertNonEmptyString(basis, ERROR_CODES.INVALID_CAPACITY_BASIS, "basis");
    if (!VALID_CAPACITY_BASES.includes(this.basis)) {
      throw new ApplicationError(ERROR_CODES.INVALID_CAPACITY_BASIS, "Unsupported capacity basis.", { basis, validBases: VALID_CAPACITY_BASES });
    }
    this.effectivePeriod = effectivePeriod instanceof EffectivePeriod ? effectivePeriod : new EffectivePeriod(effectivePeriod);
    this.priority = assertPositiveInteger(priority, ERROR_CODES.INVALID_ARGUMENT, "priority");
    this.active = assertBoolean(active, ERROR_CODES.INVALID_ARGUMENT, "active");
    this.conditions = normalizeConditions(conditions);
    this.capacityMultiplier = assertFiniteNumber(Number(capacityMultiplier), ERROR_CODES.INVALID_CAPACITY_VALUE, "capacityMultiplier", { min: 0 });
    this.isDefault = assertBoolean(Boolean(isDefault), ERROR_CODES.INVALID_ARGUMENT, "isDefault");
    Object.freeze(this);
  }

  isEffective(date) { return this.active && this.effectivePeriod.contains(date); }
  specificity() { return Object.keys(this.conditions).length; }

  matches(context = {}) {
    for (const [key, expected] of Object.entries(this.conditions)) {
      if (key === "outsideDiameterMin" || key === "outsideDiameterMax" || key === "wallThicknessMin" || key === "wallThicknessMax") continue;
      if (context[key] !== expected) return false;
    }
    if (!numericRangeMatches(context.outsideDiameter, this.conditions.outsideDiameterMin, this.conditions.outsideDiameterMax)) return false;
    if (!numericRangeMatches(context.wallThickness, this.conditions.wallThicknessMin, this.conditions.wallThicknessMax)) return false;
    return true;
  }

  calculateQuantity({ availableMinutes, shiftMinutes, standardDailyMinutes, calendarMultiplier = 1 }) {
    const effectiveMultiplier = this.capacityMultiplier * Number(calendarMultiplier);
    if (this.basis === CAPACITY_BASES.HOUR) return this.capacityValue * (availableMinutes / 60) * effectiveMultiplier;
    if (this.basis === CAPACITY_BASES.SHIFT) return this.capacityValue * (availableMinutes / shiftMinutes) * effectiveMultiplier;
    return this.capacityValue * (availableMinutes / standardDailyMinutes) * effectiveMultiplier;
  }

  toPlainObject() {
    return {
      capacityRuleId: this.capacityRuleId,
      equipmentId: this.equipmentId,
      capacityValue: this.capacityValue,
      unit: this.unit,
      basis: this.basis,
      effectivePeriod: this.effectivePeriod.toPlainObject(),
      priority: this.priority,
      active: this.active,
      conditions: { ...this.conditions },
      capacityMultiplier: this.capacityMultiplier,
      isDefault: this.isDefault
    };
  }
}
