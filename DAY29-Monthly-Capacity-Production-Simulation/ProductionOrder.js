import { ApplicationError, ERROR_CODES, assertFiniteNumber, assertNonEmptyString, assertPositiveInteger } from "./errors.js";
import { dateKey } from "./Day29DateTime.js";

export class ProductionOrder {
  constructor({ orderId, productId = null, productGroup, requiredQuantity, unit = "PIECE", dueDate, priority = 100, routingId, initialWip = 0, scenarioId = null, attributes = {} }) {
    this.orderId = assertNonEmptyString(orderId, ERROR_CODES.INVALID_ORDER, "orderId");
    this.productId = productId == null ? null : String(productId);
    this.productGroup = assertNonEmptyString(productGroup, ERROR_CODES.INVALID_ORDER, "productGroup");
    this.requiredQuantity = assertFiniteNumber(Number(requiredQuantity), ERROR_CODES.INVALID_ORDER, "requiredQuantity", { min: Number.EPSILON });
    this.unit = assertNonEmptyString(unit, ERROR_CODES.INVALID_CAPACITY_UNIT, "unit");
    this.dueDate = dateKey(dueDate);
    this.priority = assertPositiveInteger(Number(priority), ERROR_CODES.INVALID_ORDER, "priority");
    this.routingId = assertNonEmptyString(routingId, ERROR_CODES.INVALID_ROUTING, "routingId");
    this.initialWip = assertFiniteNumber(Number(initialWip), ERROR_CODES.INVALID_ORDER, "initialWip", { min: 0 });
    this.scenarioId = scenarioId == null ? null : String(scenarioId);
    if (attributes == null || typeof attributes !== "object" || Array.isArray(attributes)) throw new ApplicationError(ERROR_CODES.INVALID_ORDER, "attributes must be an object.");
    this.attributes = Object.freeze({ ...attributes, productGroup: this.productGroup });
    Object.freeze(this);
  }
  toPlainObject() { return { ...this, attributes: { ...this.attributes } }; }
}
