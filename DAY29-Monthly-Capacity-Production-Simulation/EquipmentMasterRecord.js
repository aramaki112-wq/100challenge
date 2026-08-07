import { ERROR_CODES, assertBoolean, assertNonEmptyString, assertPositiveInteger } from "./errors.js";
import { EffectivePeriod } from "./EffectivePeriod.js";

export class EquipmentMasterRecord {
  constructor({
    equipmentId, factoryId, processId, name, equipmentType = "GENERAL",
    priority = 100, planningTarget = true, usable = true,
    defaultCapacityRuleId = null, capacityUnit = "PIECE", displayOrder = 1,
    effectivePeriod = {}, active = true, note = ""
  }) {
    this.equipmentId = assertNonEmptyString(equipmentId, ERROR_CODES.INVALID_EQUIPMENT_ID, "equipmentId");
    this.factoryId = assertNonEmptyString(factoryId, ERROR_CODES.INVALID_FACTORY_ID, "factoryId");
    this.processId = assertNonEmptyString(processId, ERROR_CODES.INVALID_PROCESS_ID, "processId");
    this.name = assertNonEmptyString(name, ERROR_CODES.INVALID_EQUIPMENT_NAME, "equipment name");
    this.equipmentType = assertNonEmptyString(equipmentType, ERROR_CODES.INVALID_ARGUMENT, "equipmentType");
    this.priority = assertPositiveInteger(priority, ERROR_CODES.INVALID_EQUIPMENT_PRIORITY, "priority");
    this.planningTarget = assertBoolean(planningTarget, ERROR_CODES.INVALID_ARGUMENT, "planningTarget");
    this.usable = assertBoolean(usable, ERROR_CODES.INVALID_ARGUMENT, "usable");
    this.defaultCapacityRuleId = defaultCapacityRuleId == null ? null : assertNonEmptyString(defaultCapacityRuleId, ERROR_CODES.INVALID_CAPACITY_RULE_ID, "defaultCapacityRuleId");
    this.capacityUnit = assertNonEmptyString(capacityUnit, ERROR_CODES.INVALID_CAPACITY_UNIT, "capacityUnit");
    this.displayOrder = assertPositiveInteger(displayOrder, ERROR_CODES.INVALID_ARGUMENT, "displayOrder");
    this.effectivePeriod = effectivePeriod instanceof EffectivePeriod ? effectivePeriod : new EffectivePeriod(effectivePeriod);
    this.active = assertBoolean(active, ERROR_CODES.INVALID_ARGUMENT, "active");
    this.note = typeof note === "string" ? note : "";
    Object.freeze(this);
  }
  isEffective(date) { return this.active && this.effectivePeriod.contains(date); }
  toPlainObject() { return { ...this, effectivePeriod: this.effectivePeriod.toPlainObject() }; }
}
