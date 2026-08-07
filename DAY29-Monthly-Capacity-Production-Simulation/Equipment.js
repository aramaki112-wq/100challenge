import {
  ApplicationError,
  ERROR_CODES,
  assertNonEmptyString,
  assertNonNegativeInteger
} from "./errors.js";
import {
  RequiredSkillComposition
} from "./RequiredSkillComposition.js";

export class Equipment {
  constructor({
    equipmentId,
    name,
    requiredWorkerCount,
    requiredSkillRequirements = []
  }) {
    this.equipmentId = assertNonEmptyString(
      equipmentId,
      ERROR_CODES.INVALID_EQUIPMENT_ID,
      "equipmentId"
    );
    this.name = assertNonEmptyString(
      name,
      ERROR_CODES.INVALID_EQUIPMENT_NAME,
      "name"
    );
    this.requiredWorkerCount = assertNonNegativeInteger(
      requiredWorkerCount,
      ERROR_CODES.INVALID_REQUIRED_WORKER_COUNT,
      "requiredWorkerCount"
    );
    this.requiredSkillComposition =
      requiredSkillRequirements instanceof RequiredSkillComposition
        ? requiredSkillRequirements
        : new RequiredSkillComposition(requiredSkillRequirements);

    const requiredSkillCount =
      this.requiredSkillComposition.getRequiredRoleSlotCount();

    if (requiredSkillCount > this.requiredWorkerCount) {
      throw new ApplicationError(
        ERROR_CODES.REQUIRED_SKILL_COUNT_EXCEEDS_REQUIRED_WORKER_COUNT,
        "Required skill count must not exceed required worker count.",
        {
          equipmentId: this.equipmentId,
          requiredWorkerCount: this.requiredWorkerCount,
          requiredSkillCount
        }
      );
    }

    Object.freeze(this);
  }

  getRequiredWorkerCount() {
    return this.requiredWorkerCount;
  }

  getRequiredSkillComposition() {
    return this.requiredSkillComposition;
  }

  toPlainObject() {
    return {
      equipmentId: this.equipmentId,
      name: this.name,
      requiredWorkerCount: this.requiredWorkerCount,
      requiredSkillRequirements:
        this.requiredSkillComposition.toPlainObject()
    };
  }
}
