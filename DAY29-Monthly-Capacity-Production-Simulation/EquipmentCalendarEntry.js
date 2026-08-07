import { ApplicationError, ERROR_CODES, assertFiniteNumber, assertNonEmptyString } from "./errors.js";
import { EQUIPMENT_CALENDAR_STATES } from "./Day29Constants.js";
import { dateKey } from "./Day29DateTime.js";

export class EquipmentCalendarEntry {
  constructor({ equipmentId, date, shiftId, state = EQUIPMENT_CALENDAR_STATES.AVAILABLE, capacityMultiplier = 1, stopReasonId = null, note = "" }) {
    this.equipmentId = assertNonEmptyString(equipmentId, ERROR_CODES.INVALID_EQUIPMENT_ID, "equipmentId");
    this.date = dateKey(date);
    this.shiftId = assertNonEmptyString(shiftId, ERROR_CODES.INVALID_SHIFT_ID, "shiftId");
    if (!Object.values(EQUIPMENT_CALENDAR_STATES).includes(state)) throw new ApplicationError(ERROR_CODES.INVALID_CALENDAR_ENTRY, "Invalid equipment calendar state.", { state });
    this.state = state;
    this.capacityMultiplier = assertFiniteNumber(Number(capacityMultiplier), ERROR_CODES.INVALID_CAPACITY_VALUE, "capacityMultiplier", { min: 0 });
    this.stopReasonId = stopReasonId == null ? null : String(stopReasonId);
    this.note = typeof note === "string" ? note : "";
    Object.freeze(this);
  }
  isAvailable() { return [EQUIPMENT_CALENDAR_STATES.AVAILABLE, EQUIPMENT_CALENDAR_STATES.DEGRADED].includes(this.state) && this.capacityMultiplier > 0; }
  toPlainObject() { return { ...this }; }
}
