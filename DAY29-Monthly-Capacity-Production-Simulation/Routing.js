import { ApplicationError, ERROR_CODES, assertNonEmptyString, assertPositiveInteger } from "./errors.js";

export class RoutingOperation {
  constructor({ operationId, processId, sequence, eligibleEquipmentIds = [] }) {
    this.operationId = assertNonEmptyString(operationId, ERROR_CODES.INVALID_ROUTING, "operationId");
    this.processId = assertNonEmptyString(processId, ERROR_CODES.INVALID_PROCESS_ID, "processId");
    this.sequence = assertPositiveInteger(Number(sequence), ERROR_CODES.INVALID_ROUTING, "sequence");
    if (!Array.isArray(eligibleEquipmentIds) || eligibleEquipmentIds.length === 0) throw new ApplicationError(ERROR_CODES.INVALID_ROUTING, "eligibleEquipmentIds is required.");
    this.eligibleEquipmentIds = Object.freeze([...new Set(eligibleEquipmentIds.map(String))]);
    Object.freeze(this);
  }
  toPlainObject() { return { ...this, eligibleEquipmentIds: [...this.eligibleEquipmentIds] }; }
}

export class Routing {
  constructor({ routingId, productGroup, operations = [] }) {
    this.routingId = assertNonEmptyString(routingId, ERROR_CODES.INVALID_ROUTING, "routingId");
    this.productGroup = assertNonEmptyString(productGroup, ERROR_CODES.INVALID_ARGUMENT, "productGroup");
    if (!Array.isArray(operations) || operations.length === 0) throw new ApplicationError(ERROR_CODES.INVALID_ROUTING, "Routing operations are required.");
    this.operations = Object.freeze(operations.map((item) => item instanceof RoutingOperation ? item : new RoutingOperation(item)).sort((a, b) => a.sequence - b.sequence));
    const sequences = this.operations.map((item) => item.sequence);
    if (new Set(sequences).size !== sequences.length) throw new ApplicationError(ERROR_CODES.INVALID_ROUTING, "Routing sequence must be unique.");
    Object.freeze(this);
  }
  toPlainObject() { return { routingId: this.routingId, productGroup: this.productGroup, operations: this.operations.map((item) => item.toPlainObject()) }; }
}
