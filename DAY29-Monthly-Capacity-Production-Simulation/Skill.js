import {
  ERROR_CODES,
  assertNonEmptyString
} from "./errors.js";

export class Skill {
  constructor({ skillId, name }) {
    this.skillId = assertNonEmptyString(
      skillId,
      ERROR_CODES.INVALID_SKILL_ID,
      "skillId"
    );
    this.name = assertNonEmptyString(
      name,
      ERROR_CODES.INVALID_SKILL_NAME,
      "name"
    );
    Object.freeze(this);
  }

  toPlainObject() {
    return {
      skillId: this.skillId,
      name: this.name
    };
  }
}
