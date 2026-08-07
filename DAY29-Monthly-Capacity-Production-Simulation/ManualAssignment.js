import { ApplicationError, ERROR_CODES, assertNonEmptyString } from "./errors.js";
import { dateKey, durationMinutes } from "./Day29DateTime.js";

export class ManualAssignment {
  constructor({ assignmentId, date, shiftId, factoryId, equipmentId, workerId, roleSkillId = "GENERAL", startAt, endAt }) {
    this.assignmentId = assertNonEmptyString(assignmentId, ERROR_CODES.INVALID_ASSIGNMENT, "assignmentId");
    this.date = dateKey(date);
    this.shiftId = assertNonEmptyString(shiftId, ERROR_CODES.INVALID_SHIFT_ID, "shiftId");
    this.factoryId = assertNonEmptyString(factoryId, ERROR_CODES.INVALID_FACTORY_ID, "factoryId");
    this.equipmentId = assertNonEmptyString(equipmentId, ERROR_CODES.INVALID_EQUIPMENT_ID, "equipmentId");
    this.workerId = assertNonEmptyString(workerId, ERROR_CODES.INVALID_WORKER_ID, "workerId");
    this.roleSkillId = assertNonEmptyString(roleSkillId, ERROR_CODES.INVALID_SKILL_ID, "roleSkillId");
    this.startAt = assertNonEmptyString(startAt, ERROR_CODES.INVALID_TIME, "startAt");
    this.endAt = assertNonEmptyString(endAt, ERROR_CODES.INVALID_TIME, "endAt");
    if (durationMinutes(this.startAt, this.endAt) <= 0) throw new ApplicationError(ERROR_CODES.INVALID_ASSIGNMENT, "Assignment duration must be positive.");
    Object.freeze(this);
  }
  toPlainObject() { return { ...this }; }
}
