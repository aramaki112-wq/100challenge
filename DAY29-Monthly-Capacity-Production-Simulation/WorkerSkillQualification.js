import { ERROR_CODES, assertNonEmptyString } from "./errors.js";
import { EffectivePeriod } from "./EffectivePeriod.js";

export class WorkerSkillQualification {
  constructor({ workerId, skillId, effectivePeriod = {}, level = "QUALIFIED" }) {
    this.workerId = assertNonEmptyString(workerId, ERROR_CODES.INVALID_WORKER_ID, "workerId");
    this.skillId = assertNonEmptyString(skillId, ERROR_CODES.INVALID_SKILL_ID, "skillId");
    this.effectivePeriod = effectivePeriod instanceof EffectivePeriod ? effectivePeriod : new EffectivePeriod(effectivePeriod);
    this.level = assertNonEmptyString(level, ERROR_CODES.INVALID_ARGUMENT, "level");
    Object.freeze(this);
  }
  isValid(date) { return this.effectivePeriod.contains(date); }
  toPlainObject() { return { ...this, effectivePeriod: this.effectivePeriod.toPlainObject() }; }
}
