import { ApplicationError, ERROR_CODES, assertNonEmptyString } from "./errors.js";
import { FACTORY_DAY_TYPES } from "./Day29Constants.js";
import { dateKey } from "./Day29DateTime.js";

export class FactoryCalendarEntry {
  constructor({ factoryId, date, dayType = FACTORY_DAY_TYPES.OPERATING, plannedShiftIds = [], note = "" }) {
    this.factoryId = assertNonEmptyString(factoryId, ERROR_CODES.INVALID_FACTORY_ID, "factoryId");
    this.date = dateKey(date);
    if (!Object.values(FACTORY_DAY_TYPES).includes(dayType)) throw new ApplicationError(ERROR_CODES.INVALID_CALENDAR_ENTRY, "Invalid factory dayType.", { dayType });
    this.dayType = dayType;
    if (!Array.isArray(plannedShiftIds)) throw new ApplicationError(ERROR_CODES.INVALID_CALENDAR_ENTRY, "plannedShiftIds must be an array.");
    this.plannedShiftIds = Object.freeze([...new Set(plannedShiftIds.map(String))]);
    this.note = typeof note === "string" ? note : "";
    Object.freeze(this);
  }
  isOperating() { return [FACTORY_DAY_TYPES.OPERATING, FACTORY_DAY_TYPES.EXTRA_OPERATING].includes(this.dayType); }
  toPlainObject() { return { ...this, plannedShiftIds: [...this.plannedShiftIds] }; }
}
