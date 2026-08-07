import { ERROR_CODES, assertBoolean, assertNonEmptyString } from "./errors.js";
export class StopReasonDefinition {
  constructor({ stopReasonId, name, category = "OTHER", active = true, note = "" }) {
    this.stopReasonId = assertNonEmptyString(stopReasonId, ERROR_CODES.INVALID_ARGUMENT, "stopReasonId");
    this.name = assertNonEmptyString(name, ERROR_CODES.INVALID_ARGUMENT, "stop reason name");
    this.category = assertNonEmptyString(category, ERROR_CODES.INVALID_ARGUMENT, "category");
    this.active = assertBoolean(active, ERROR_CODES.INVALID_ARGUMENT, "active");
    this.note = typeof note === "string" ? note : "";
    Object.freeze(this);
  }
  toPlainObject() { return { ...this }; }
}
