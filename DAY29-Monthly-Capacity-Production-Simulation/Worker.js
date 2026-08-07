import {
  ApplicationError,
  ERROR_CODES,
  assertNonEmptyString
} from "./errors.js";

export class Worker {
  constructor({ workerId, name, skillIds = [] }) {
    this.workerId = assertNonEmptyString(
      workerId,
      ERROR_CODES.INVALID_WORKER_ID,
      "workerId"
    );
    this.name = assertNonEmptyString(
      name,
      ERROR_CODES.INVALID_WORKER_NAME,
      "name"
    );

    if (!Array.isArray(skillIds)) {
      throw new ApplicationError(
        ERROR_CODES.INVALID_WORKER_SKILL_IDS,
        "skillIds must be an array.",
        { skillIds }
      );
    }

    const normalized = skillIds.map((skillId) =>
      assertNonEmptyString(
        skillId,
        ERROR_CODES.INVALID_SKILL_ID,
        "skillId"
      )
    );

    if (new Set(normalized).size !== normalized.length) {
      throw new ApplicationError(
        ERROR_CODES.DUPLICATE_WORKER_SKILL,
        "Worker skill IDs must not contain duplicates.",
        { workerId: this.workerId, skillIds: normalized }
      );
    }

    this.skillIds = Object.freeze([...normalized]);
    Object.freeze(this);
  }

  hasSkill(skillId) {
    return this.skillIds.includes(skillId);
  }

  getSkillIds() {
    return [...this.skillIds];
  }

  toPlainObject() {
    return {
      workerId: this.workerId,
      name: this.name,
      skillIds: this.getSkillIds()
    };
  }
}
