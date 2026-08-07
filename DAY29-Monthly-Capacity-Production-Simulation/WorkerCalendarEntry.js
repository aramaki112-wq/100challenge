import { ApplicationError, ERROR_CODES, assertNonEmptyString } from "./errors.js";
import { WORKER_CALENDAR_STATES } from "./Day29Constants.js";
import { dateKey, durationMinutes } from "./Day29DateTime.js";

export class WorkerCalendarEntry {
  constructor({ workerId, date, shiftId, status = WORKER_CALENDAR_STATES.PRESENT, placementFactoryId, startAt, endAt, note = "" }) {
    this.workerId = assertNonEmptyString(workerId, ERROR_CODES.INVALID_WORKER_ID, "workerId");
    this.date = dateKey(date);
    this.shiftId = assertNonEmptyString(shiftId, ERROR_CODES.INVALID_SHIFT_ID, "shiftId");
    if (!Object.values(WORKER_CALENDAR_STATES).includes(status)) throw new ApplicationError(ERROR_CODES.INVALID_CALENDAR_ENTRY, "Invalid worker calendar status.", { status });
    this.status = status;
    this.placementFactoryId = assertNonEmptyString(placementFactoryId, ERROR_CODES.INVALID_FACTORY_ID, "placementFactoryId");
    this.startAt = assertNonEmptyString(startAt, ERROR_CODES.INVALID_TIME, "startAt");
    this.endAt = assertNonEmptyString(endAt, ERROR_CODES.INVALID_TIME, "endAt");
    if (durationMinutes(this.startAt, this.endAt) <= 0) throw new ApplicationError(ERROR_CODES.INVALID_CALENDAR_ENTRY, "Worker calendar duration must be positive.");
    this.note = typeof note === "string" ? note : "";
    Object.freeze(this);
  }
  isWorking() { return [WORKER_CALENDAR_STATES.PRESENT, WORKER_CALENDAR_STATES.LATE, WORKER_CALENDAR_STATES.EARLY_LEAVE, WORKER_CALENDAR_STATES.OVERTIME, WORKER_CALENDAR_STATES.PARTIAL, WORKER_CALENDAR_STATES.SUPPORT_IN, WORKER_CALENDAR_STATES.SUPPORT_OUT].includes(this.status); }
  toPlainObject() { return { ...this }; }
}
