import { ERROR_CODES, assertBoolean, assertNonEmptyString, assertPositiveInteger } from "./errors.js";

export class FactoryDefinition {
  constructor({ factoryId, name, displayOrder = 1, active = true, standardDailyMinutes = 480, note = "" }) {
    this.factoryId = assertNonEmptyString(factoryId, ERROR_CODES.INVALID_FACTORY_ID, "factoryId");
    this.name = assertNonEmptyString(name, ERROR_CODES.INVALID_ARGUMENT, "factory name");
    this.displayOrder = assertPositiveInteger(displayOrder, ERROR_CODES.INVALID_ARGUMENT, "displayOrder");
    this.active = assertBoolean(active, ERROR_CODES.INVALID_ARGUMENT, "active");
    this.standardDailyMinutes = assertPositiveInteger(standardDailyMinutes, ERROR_CODES.INVALID_ARGUMENT, "standardDailyMinutes");
    this.note = typeof note === "string" ? note : "";
    Object.freeze(this);
  }
  toPlainObject() { return { ...this }; }
}
