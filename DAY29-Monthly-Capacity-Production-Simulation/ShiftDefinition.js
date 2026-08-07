import { ERROR_CODES, assertBoolean, assertNonEmptyString, assertPositiveInteger } from "./errors.js";
import { combineDateAndTime, durationMinutes } from "./Day29DateTime.js";

export class ShiftDefinition {
  constructor({ shiftId, factoryId, name, startTime, endTime, displayOrder = 1, active = true }) {
    this.shiftId = assertNonEmptyString(shiftId, ERROR_CODES.INVALID_SHIFT_ID, "shiftId");
    this.factoryId = assertNonEmptyString(factoryId, ERROR_CODES.INVALID_FACTORY_ID, "factoryId");
    this.name = assertNonEmptyString(name, ERROR_CODES.INVALID_ARGUMENT, "shift name");
    this.startTime = assertNonEmptyString(startTime, ERROR_CODES.INVALID_TIME, "startTime");
    this.endTime = assertNonEmptyString(endTime, ERROR_CODES.INVALID_TIME, "endTime");
    this.displayOrder = assertPositiveInteger(displayOrder, ERROR_CODES.INVALID_ARGUMENT, "displayOrder");
    this.active = assertBoolean(active, ERROR_CODES.INVALID_ARGUMENT, "active");
    if (this.durationMinutes("2026-01-01") <= 0) throw new Error("Shift duration must be positive within the same date.");
    Object.freeze(this);
  }
  startAt(date) { return combineDateAndTime(date, this.startTime); }
  endAt(date) { return combineDateAndTime(date, this.endTime); }
  durationMinutes(date) { return durationMinutes(this.startAt(date), this.endAt(date)); }
  toPlainObject() { return { ...this }; }
}
