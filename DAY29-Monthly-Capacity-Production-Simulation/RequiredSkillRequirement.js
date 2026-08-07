import {
  ERROR_CODES,
  assertNonEmptyString,
  assertPositiveInteger
} from "./errors.js";

export class RequiredSkillRequirement {
  constructor({ skillId, requiredCount }) {
    this.skillId = assertNonEmptyString(
      skillId,
      ERROR_CODES.INVALID_SKILL_ID,
      "skillId"
    );
    this.requiredCount = assertPositiveInteger(
      requiredCount,
      ERROR_CODES.INVALID_REQUIRED_SKILL_COUNT,
      "requiredCount"
    );
    Object.freeze(this);
  }

  equals(other) {
    return other instanceof RequiredSkillRequirement &&
      this.skillId === other.skillId &&
      this.requiredCount === other.requiredCount;
  }

  toPlainObject() {
    return {
      skillId: this.skillId,
      requiredCount: this.requiredCount
    };
  }
}
