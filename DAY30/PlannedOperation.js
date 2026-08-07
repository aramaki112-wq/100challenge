import {
  DIAGNOSIS_GRANULARITY,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertCodeValue,
  assertFiniteNumber,
  assertNonEmptyString,
  assertPositiveInteger,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate,
  assertOptionalTimeRange
} from "./DateTimeUtils.js";

import {
  DomainEvent
} from "./DomainEvent.js";

import {
  DomainEventCollector,
  assertDomainEventCollector
} from "./DomainEventCollector.js";

const IDENTIFIER_PATTERN = /^\S+$/;
const DISCRETE_QUANTITY_UNITS = Object.freeze([
  QUANTITY_UNIT.PIECE,
  QUANTITY_UNIT.LOT
]);

export const PLANNED_OPERATION_EVENT_TYPE = Object.freeze({
  ADDED: "PLANNED_OPERATION_ADDED",
  RESCHEDULED: "PLANNED_OPERATION_RESCHEDULED",
  QUANTITY_CHANGED: "PLANNED_OPERATION_QUANTITY_CHANGED",
  EQUIPMENT_CHANGED: "PLANNED_OPERATION_EQUIPMENT_CHANGED",
  PRIORITY_CHANGED: "PLANNED_OPERATION_PRIORITY_CHANGED",
  CAPACITY_CONDITIONS_CHANGED:
    "PLANNED_OPERATION_CAPACITY_CONDITIONS_CHANGED",
  NOTE_CHANGED: "PLANNED_OPERATION_NOTE_CHANGED"
});

function assertIdentifier(value, code, label) {
  const identifier = assertNonEmptyString(
    value,
    code,
    label
  );

  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw createDomainError(
      code,
      `${label} must not contain whitespace.`,
      { value, label }
    );
  }

  return identifier;
}

function assertOptionalIdentifier(value, code, label) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return assertIdentifier(value, code, label);
}

function normalizeOptionalText(value, label) {
  if (typeof value !== "string") {
    throw createDomainError(
      ERROR_CODES.INVALID_PLANNED_OPERATION_TEXT,
      `${label} must be a string.`,
      { value, label }
    );
  }

  return value.trim();
}

function assertPlannedQuantity(value, quantityUnit) {
  const quantity = assertFiniteNumber(
    value,
    ERROR_CODES.INVALID_PLANNED_QUANTITY,
    "plannedQuantity",
    { min: Number.MIN_VALUE }
  );

  if (
    DISCRETE_QUANTITY_UNITS.includes(quantityUnit) &&
    !Number.isInteger(quantity)
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_PLANNED_QUANTITY,
      `${quantityUnit} plannedQuantity must be an integer.`,
      {
        plannedQuantity: value,
        quantityUnit
      }
    );
  }

  return quantity;
}

function assertOptionalPriority(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return assertPositiveInteger(
    value,
    ERROR_CODES.INVALID_PRIORITY,
    "priority"
  );
}

function assertOptionalPositiveNumber(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return assertFiniteNumber(
    value,
    ERROR_CODES.INVALID_OPERATION_DIMENSION,
    label,
    { min: Number.MIN_VALUE }
  );
}

function normalizeCapacityConditions({
  productGroup = null,
  materialGroup = null,
  dimensionGroup = null,
  outsideDiameter = null,
  wallThickness = null,
  processingType = null,
  difficultyClass = null,
  operationType = null
} = {}) {
  return Object.freeze({
    productGroup: assertOptionalIdentifier(
      productGroup,
      ERROR_CODES.INVALID_OPERATION_CONDITION,
      "productGroup"
    ),
    materialGroup: assertOptionalIdentifier(
      materialGroup,
      ERROR_CODES.INVALID_OPERATION_CONDITION,
      "materialGroup"
    ),
    dimensionGroup: assertOptionalIdentifier(
      dimensionGroup,
      ERROR_CODES.INVALID_OPERATION_CONDITION,
      "dimensionGroup"
    ),
    outsideDiameter: assertOptionalPositiveNumber(
      outsideDiameter,
      "outsideDiameter"
    ),
    wallThickness: assertOptionalPositiveNumber(
      wallThickness,
      "wallThickness"
    ),
    processingType: assertOptionalIdentifier(
      processingType,
      ERROR_CODES.INVALID_OPERATION_CONDITION,
      "processingType"
    ),
    difficultyClass: assertOptionalIdentifier(
      difficultyClass,
      ERROR_CODES.INVALID_OPERATION_CONDITION,
      "difficultyClass"
    ),
    operationType: assertOptionalIdentifier(
      operationType,
      ERROR_CODES.INVALID_OPERATION_CONDITION,
      "operationType"
    )
  });
}

function areCapacityConditionsEqual(left, right) {
  return Object.keys(left).every(
    (key) => left[key] === right[key]
  );
}

function createEvent({
  eventId,
  eventType,
  occurredAt,
  recordedAt = occurredAt,
  aggregateId,
  actor,
  correlationId = null,
  causationId = null,
  payload = {},
  metadata = {}
}) {
  return new DomainEvent({
    eventId,
    eventType,
    eventVersion: 1,
    occurredAt,
    recordedAt,
    aggregateType: "PLANNED_OPERATION",
    aggregateId,
    actor,
    correlationId,
    causationId,
    payload,
    metadata
  });
}

/**
 * One scheduled operation within a Production Plan Version.
 *
 * This Entity stores only plan intent. Required time, executable quantity,
 * shortage, and Diagnosis Status belong to Diagnosis Result objects.
 */
export class PlannedOperation {
  #plannedOperationId;
  #planVersionId;
  #orderId;
  #routingOperationId;
  #equipmentId;
  #plannedDate;
  #shiftId;
  #plannedStartTime;
  #plannedEndTime;
  #plannedDurationMinutes;
  #plannedQuantity;
  #quantityUnit;
  #priority;
  #capacityConditions;
  #note;
  #domainEvents;

  constructor({
    plannedOperationId,
    planVersionId,
    orderId,
    routingOperationId,
    equipmentId,
    plannedDate,
    shiftId = null,
    plannedStartTime = null,
    plannedEndTime = null,
    plannedQuantity,
    quantityUnit,
    priority = null,
    productGroup = null,
    materialGroup = null,
    dimensionGroup = null,
    outsideDiameter = null,
    wallThickness = null,
    processingType = null,
    difficultyClass = null,
    operationType = null,
    note = ""
  } = {}, {
    eventCollector = new DomainEventCollector()
  } = {}) {
    this.#plannedOperationId = assertIdentifier(
      plannedOperationId,
      ERROR_CODES.INVALID_PLANNED_OPERATION_ID,
      "plannedOperationId"
    );

    this.#planVersionId = assertIdentifier(
      planVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "planVersionId"
    );

    this.#orderId = assertIdentifier(
      orderId,
      ERROR_CODES.INVALID_ORDER_ID,
      "orderId"
    );

    this.#routingOperationId = assertIdentifier(
      routingOperationId,
      ERROR_CODES.INVALID_ROUTING_OPERATION_ID,
      "routingOperationId"
    );

    this.#equipmentId = assertIdentifier(
      equipmentId,
      ERROR_CODES.INVALID_EQUIPMENT_ID,
      "equipmentId"
    );

    this.#plannedDate = assertDate(
      plannedDate,
      ERROR_CODES.INVALID_DATE,
      "plannedDate"
    );

    this.#shiftId = assertOptionalIdentifier(
      shiftId,
      ERROR_CODES.INVALID_SHIFT_ID,
      "shiftId"
    );

    const timeRange = assertOptionalTimeRange(
      plannedStartTime,
      plannedEndTime,
      { allowOvernight: false }
    );

    this.#plannedStartTime = timeRange.startTime;
    this.#plannedEndTime = timeRange.endTime;
    this.#plannedDurationMinutes = timeRange.durationMinutes;

    this.#quantityUnit = assertCodeValue(
      quantityUnit,
      QUANTITY_UNIT,
      ERROR_CODES.INVALID_QUANTITY_UNIT,
      "quantityUnit"
    );

    this.#plannedQuantity = assertPlannedQuantity(
      plannedQuantity,
      this.#quantityUnit
    );

    this.#priority = assertOptionalPriority(priority);

    this.#capacityConditions = normalizeCapacityConditions({
      productGroup,
      materialGroup,
      dimensionGroup,
      outsideDiameter,
      wallThickness,
      processingType,
      difficultyClass,
      operationType
    });

    this.#note = normalizeOptionalText(note, "note");
    this.#domainEvents = assertDomainEventCollector(eventCollector);

    Object.freeze(this);
  }

  static create(operationData, {
    eventId,
    actor,
    occurredAt,
    recordedAt = occurredAt,
    correlationId = null,
    causationId = null,
    metadata = {},
    eventCollector = new DomainEventCollector()
  } = {}) {
    const operation = new PlannedOperation(
      operationData,
      { eventCollector }
    );

    operation.#recordEvent(
      createEvent({
        eventId,
        eventType: PLANNED_OPERATION_EVENT_TYPE.ADDED,
        occurredAt,
        recordedAt,
        aggregateId: operation.#plannedOperationId,
        actor,
        correlationId,
        causationId,
        payload: operation.toSnapshot(),
        metadata
      })
    );

    return operation;
  }

  get plannedOperationId() {
    return this.#plannedOperationId;
  }

  get planVersionId() {
    return this.#planVersionId;
  }

  get orderId() {
    return this.#orderId;
  }

  get routingOperationId() {
    return this.#routingOperationId;
  }

  get equipmentId() {
    return this.#equipmentId;
  }

  get plannedDate() {
    return this.#plannedDate;
  }

  get shiftId() {
    return this.#shiftId;
  }

  get plannedStartTime() {
    return this.#plannedStartTime;
  }

  get plannedEndTime() {
    return this.#plannedEndTime;
  }

  get plannedDurationMinutes() {
    return this.#plannedDurationMinutes;
  }

  get plannedQuantity() {
    return this.#plannedQuantity;
  }

  get quantityUnit() {
    return this.#quantityUnit;
  }

  get priority() {
    return this.#priority;
  }

  get note() {
    return this.#note;
  }

  getDiagnosisGranularity() {
    if (this.#plannedStartTime !== null) {
      return DIAGNOSIS_GRANULARITY.TIME;
    }

    if (this.#shiftId !== null) {
      return DIAGNOSIS_GRANULARITY.SHIFT;
    }

    return DIAGNOSIS_GRANULARITY.DAY;
  }

  reschedule({
    plannedDate,
    shiftId = null,
    plannedStartTime = null,
    plannedEndTime = null,
    changedAt,
    actor,
    reason,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const nextDate = assertDate(
      plannedDate,
      ERROR_CODES.INVALID_DATE,
      "plannedDate"
    );

    const nextShiftId = assertOptionalIdentifier(
      shiftId,
      ERROR_CODES.INVALID_SHIFT_ID,
      "shiftId"
    );

    const nextTimeRange = assertOptionalTimeRange(
      plannedStartTime,
      plannedEndTime,
      { allowOvernight: false }
    );

    const unchanged =
      nextDate === this.#plannedDate &&
      nextShiftId === this.#shiftId &&
      nextTimeRange.startTime === this.#plannedStartTime &&
      nextTimeRange.endTime === this.#plannedEndTime;

    if (unchanged) {
      return false;
    }

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_PLANNED_OPERATION_TEXT,
      "reason"
    );

    const previousSchedule = this.#scheduleSnapshot();
    const nextSchedule = Object.freeze({
      plannedDate: nextDate,
      shiftId: nextShiftId,
      plannedStartTime: nextTimeRange.startTime,
      plannedEndTime: nextTimeRange.endTime,
      plannedDurationMinutes: nextTimeRange.durationMinutes,
      diagnosisGranularity:
        nextTimeRange.startTime !== null
          ? DIAGNOSIS_GRANULARITY.TIME
          : nextShiftId !== null
            ? DIAGNOSIS_GRANULARITY.SHIFT
            : DIAGNOSIS_GRANULARITY.DAY
    });

    const event = createEvent({
      eventId,
      eventType: PLANNED_OPERATION_EVENT_TYPE.RESCHEDULED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#plannedOperationId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousSchedule,
        schedule: nextSchedule,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#plannedDate = nextDate;
    this.#shiftId = nextShiftId;
    this.#plannedStartTime = nextTimeRange.startTime;
    this.#plannedEndTime = nextTimeRange.endTime;
    this.#plannedDurationMinutes = nextTimeRange.durationMinutes;

    return true;
  }

  changeEquipment({
    equipmentId,
    changedAt,
    actor,
    reason,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const nextEquipmentId = assertIdentifier(
      equipmentId,
      ERROR_CODES.INVALID_EQUIPMENT_ID,
      "equipmentId"
    );

    if (nextEquipmentId === this.#equipmentId) {
      return false;
    }

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_PLANNED_OPERATION_TEXT,
      "reason"
    );

    const previousEquipmentId = this.#equipmentId;
    const event = createEvent({
      eventId,
      eventType: PLANNED_OPERATION_EVENT_TYPE.EQUIPMENT_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#plannedOperationId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousEquipmentId,
        equipmentId: nextEquipmentId,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#equipmentId = nextEquipmentId;

    return true;
  }

  changeQuantity({
    plannedQuantity,
    quantityUnit = this.#quantityUnit,
    changedAt,
    actor,
    reason,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const nextUnit = assertCodeValue(
      quantityUnit,
      QUANTITY_UNIT,
      ERROR_CODES.INVALID_QUANTITY_UNIT,
      "quantityUnit"
    );

    const nextQuantity = assertPlannedQuantity(
      plannedQuantity,
      nextUnit
    );

    if (
      nextQuantity === this.#plannedQuantity &&
      nextUnit === this.#quantityUnit
    ) {
      return false;
    }

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_PLANNED_OPERATION_TEXT,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: PLANNED_OPERATION_EVENT_TYPE.QUANTITY_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#plannedOperationId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousPlannedQuantity: this.#plannedQuantity,
        previousQuantityUnit: this.#quantityUnit,
        plannedQuantity: nextQuantity,
        quantityUnit: nextUnit,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#plannedQuantity = nextQuantity;
    this.#quantityUnit = nextUnit;

    return true;
  }

  changePriority({
    priority,
    changedAt,
    actor,
    reason,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const nextPriority = assertOptionalPriority(priority);

    if (nextPriority === this.#priority) {
      return false;
    }

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_PLANNED_OPERATION_TEXT,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: PLANNED_OPERATION_EVENT_TYPE.PRIORITY_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#plannedOperationId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousPriority: this.#priority,
        priority: nextPriority,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#priority = nextPriority;

    return true;
  }

  changeCapacityConditions({
    productGroup = null,
    materialGroup = null,
    dimensionGroup = null,
    outsideDiameter = null,
    wallThickness = null,
    processingType = null,
    difficultyClass = null,
    operationType = null,
    changedAt,
    actor,
    reason,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const nextConditions = normalizeCapacityConditions({
      productGroup,
      materialGroup,
      dimensionGroup,
      outsideDiameter,
      wallThickness,
      processingType,
      difficultyClass,
      operationType
    });

    if (
      areCapacityConditionsEqual(
        nextConditions,
        this.#capacityConditions
      )
    ) {
      return false;
    }

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_PLANNED_OPERATION_TEXT,
      "reason"
    );

    const previousCapacityConditions = this.#capacityConditions;
    const event = createEvent({
      eventId,
      eventType:
        PLANNED_OPERATION_EVENT_TYPE.CAPACITY_CONDITIONS_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#plannedOperationId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousCapacityConditions,
        capacityConditions: nextConditions,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#capacityConditions = nextConditions;

    return true;
  }

  changeNote({
    note,
    changedAt,
    actor,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const nextNote = normalizeOptionalText(note, "note");

    if (nextNote === this.#note) {
      return false;
    }

    const event = createEvent({
      eventId,
      eventType: PLANNED_OPERATION_EVENT_TYPE.NOTE_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#plannedOperationId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousNote: this.#note,
        note: nextNote
      },
      metadata
    });

    this.#recordEvent(event);
    this.#note = nextNote;

    return true;
  }

  toCapacityContext() {
    return Object.freeze({
      plannedOperationId: this.#plannedOperationId,
      orderId: this.#orderId,
      routingOperationId: this.#routingOperationId,
      equipmentId: this.#equipmentId,
      plannedDate: this.#plannedDate,
      shiftId: this.#shiftId,
      plannedStartTime: this.#plannedStartTime,
      plannedEndTime: this.#plannedEndTime,
      plannedDurationMinutes: this.#plannedDurationMinutes,
      diagnosisGranularity: this.getDiagnosisGranularity(),
      plannedQuantity: this.#plannedQuantity,
      quantityUnit: this.#quantityUnit,
      priority: this.#priority,
      ...this.#capacityConditions
    });
  }

  peekDomainEvents() {
    return this.#domainEvents.peekEvents();
  }

  pullDomainEvents() {
    return this.#domainEvents.pullEvents();
  }

  hasDomainEvents() {
    return this.#domainEvents.hasEvents();
  }

  getDomainEventCount() {
    return this.#domainEvents.getEventCount();
  }

  toSnapshot() {
    return Object.freeze({
      plannedOperationId: this.#plannedOperationId,
      planVersionId: this.#planVersionId,
      orderId: this.#orderId,
      routingOperationId: this.#routingOperationId,
      equipmentId: this.#equipmentId,
      plannedDate: this.#plannedDate,
      shiftId: this.#shiftId,
      plannedStartTime: this.#plannedStartTime,
      plannedEndTime: this.#plannedEndTime,
      plannedQuantity: this.#plannedQuantity,
      quantityUnit: this.#quantityUnit,
      priority: this.#priority,
      ...this.#capacityConditions,
      note: this.#note
    });
  }

  #scheduleSnapshot() {
    return Object.freeze({
      plannedDate: this.#plannedDate,
      shiftId: this.#shiftId,
      plannedStartTime: this.#plannedStartTime,
      plannedEndTime: this.#plannedEndTime,
      plannedDurationMinutes: this.#plannedDurationMinutes,
      diagnosisGranularity: this.getDiagnosisGranularity()
    });
  }

  #recordEvent(event) {
    this.#domainEvents.record(event);
  }
}

export function assertPlannedOperation(operation) {
  if (!(operation instanceof PlannedOperation)) {
    throw createDomainError(
      ERROR_CODES.INVALID_ARGUMENT,
      "operation must be a PlannedOperation.",
      { receivedType: typeof operation }
    );
  }

  return operation;
}
