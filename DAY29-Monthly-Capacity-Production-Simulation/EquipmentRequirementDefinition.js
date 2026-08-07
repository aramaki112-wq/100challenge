import { ApplicationError, ERROR_CODES, assertNonEmptyString, assertNonNegativeInteger } from "./errors.js";

export class EquipmentRequirementDefinition {
  constructor({ equipmentId, requiredWorkerCount = 0, roleRequirements = [] }) {
    this.equipmentId = assertNonEmptyString(equipmentId, ERROR_CODES.INVALID_EQUIPMENT_ID, "equipmentId");
    this.requiredWorkerCount = assertNonNegativeInteger(requiredWorkerCount, ERROR_CODES.INVALID_REQUIRED_WORKER_COUNT, "requiredWorkerCount");
    if (!Array.isArray(roleRequirements)) throw new ApplicationError(ERROR_CODES.INVALID_ARGUMENT, "roleRequirements must be an array.");
    this.roleRequirements = Object.freeze(roleRequirements.map((item) => ({
      skillId: assertNonEmptyString(item.skillId, ERROR_CODES.INVALID_SKILL_ID, "skillId"),
      requiredCount: Number(item.requiredCount)
    })));
    const roleTotal = this.roleRequirements.reduce((sum, item) => sum + item.requiredCount, 0);
    if (this.roleRequirements.some((item) => !Number.isInteger(item.requiredCount) || item.requiredCount <= 0)) {
      throw new ApplicationError(ERROR_CODES.INVALID_REQUIRED_SKILL_COUNT, "requiredCount must be a positive integer.");
    }
    if (roleTotal > this.requiredWorkerCount) {
      throw new ApplicationError(ERROR_CODES.REQUIRED_SKILL_COUNT_EXCEEDS_REQUIRED_WORKER_COUNT, "Role total exceeds required worker count.");
    }
    Object.freeze(this);
  }
  toPlainObject() { return { equipmentId: this.equipmentId, requiredWorkerCount: this.requiredWorkerCount, roleRequirements: this.roleRequirements.map((item) => ({ ...item })) }; }
}
