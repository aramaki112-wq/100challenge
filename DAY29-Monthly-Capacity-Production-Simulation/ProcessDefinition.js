import { ERROR_CODES, assertBoolean, assertNonEmptyString, assertPositiveInteger } from "./errors.js";

export class ProcessDefinition {
  constructor({ processId, factoryId, name, sequence = 1, active = true, note = "" }) {
    this.processId = assertNonEmptyString(processId, ERROR_CODES.INVALID_PROCESS_ID, "processId");
    this.factoryId = assertNonEmptyString(factoryId, ERROR_CODES.INVALID_FACTORY_ID, "factoryId");
    this.name = assertNonEmptyString(name, ERROR_CODES.INVALID_ARGUMENT, "process name");
    this.sequence = assertPositiveInteger(sequence, ERROR_CODES.INVALID_ARGUMENT, "sequence");
    this.active = assertBoolean(active, ERROR_CODES.INVALID_ARGUMENT, "active");
    this.note = typeof note === "string" ? note : "";
    Object.freeze(this);
  }
  toPlainObject() { return { ...this }; }
}
