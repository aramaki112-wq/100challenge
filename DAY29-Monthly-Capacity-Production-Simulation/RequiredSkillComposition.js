import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";
import {
  RequiredSkillRequirement
} from "./RequiredSkillRequirement.js";

export class RequiredSkillComposition {
  constructor(requirements = []) {
    if (requirements == null) {
      requirements = [];
    }
    if (!Array.isArray(requirements)) {
      throw new ApplicationError(
        ERROR_CODES.INVALID_ARGUMENT,
        "Required skill requirements must be an array.",
        { requirements }
      );
    }

    const normalized = requirements.map((requirement) =>
      requirement instanceof RequiredSkillRequirement
        ? requirement
        : new RequiredSkillRequirement(requirement)
    );

    const skillIds = normalized.map((requirement) => requirement.skillId);
    if (new Set(skillIds).size !== skillIds.length) {
      throw new ApplicationError(
        ERROR_CODES.DUPLICATE_REQUIRED_SKILL,
        "Required skill requirements must not contain duplicate skill IDs.",
        { skillIds }
      );
    }

    this.requirements = Object.freeze([...normalized]);
    Object.freeze(this);
  }

  getRequirements() {
    return [...this.requirements];
  }

  findBySkillId(skillId) {
    return this.requirements.find(
      (requirement) => requirement.skillId === skillId
    );
  }

  getRequiredRoleSlotCount() {
    return this.requirements.reduce(
      (total, requirement) => total + requirement.requiredCount,
      0
    );
  }

  isEmpty() {
    return this.requirements.length === 0;
  }

  toPlainObject() {
    return this.requirements.map((requirement) =>
      requirement.toPlainObject()
    );
  }
}
