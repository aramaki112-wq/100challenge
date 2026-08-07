import {
  ERROR_CODES,
  assertBoolean,
  assertNonEmptyString,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  DomainEvent
} from "./DomainEvent.js";

import {
  DomainEventCollector,
  assertDomainEventCollector
} from "./DomainEventCollector.js";

const IDENTIFIER_PATTERN = /^\S+$/;

export const SCENARIO_ASSUMPTION_EVENT_TYPE = Object.freeze({
  ATTACHED: "DIAGNOSIS_SCENARIO_ASSUMPTION_ATTACHED",
  DETACHED: "DIAGNOSIS_SCENARIO_ASSUMPTION_DETACHED",
  REATTACHED: "DIAGNOSIS_SCENARIO_ASSUMPTION_REATTACHED",
  NOTE_CHANGED: "DIAGNOSIS_SCENARIO_ASSUMPTION_NOTE_CHANGED"
});

function assertIdentifier(value, code, label) {
  const id = assertNonEmptyString(value, code, label);
  if (!IDENTIFIER_PATTERN.test(id)) {
    throw createDomainError(
      code,
      `${label} must not contain whitespace.`,
      { value, label }
    );
  }
  return id;
}

function normalizeNote(value) {
  if (typeof value !== "string") {
    throw createDomainError(
      ERROR_CODES.INVALID_SCENARIO_ASSUMPTION_RELATION,
      "note must be a string.",
      { value }
    );
  }
  return value.trim();
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
    aggregateType: "SCENARIO_ASSUMPTION_RELATION",
    aggregateId,
    actor,
    correlationId,
    causationId,
    payload,
    metadata
  });
}

/**
 * Explicitly attaches one Assumption to one Diagnosis Scenario.
 * Detaching never deletes the Assumption Entity itself.
 */
export class ScenarioAssumptionRelation {
  #diagnosisScenarioId;
  #assumptionId;
  #active;
  #note;
  #domainEvents;

  constructor({
    diagnosisScenarioId,
    assumptionId,
    active = true,
    note = ""
  } = {}, {
    eventCollector = new DomainEventCollector()
  } = {}) {
    this.#diagnosisScenarioId = assertIdentifier(
      diagnosisScenarioId,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_ID,
      "diagnosisScenarioId"
    );
    this.#assumptionId = assertIdentifier(
      assumptionId,
      ERROR_CODES.INVALID_ASSUMPTION_ID,
      "assumptionId"
    );
    this.#active = assertBoolean(active, ERROR_CODES.INVALID_BOOLEAN, "active");
    this.#note = normalizeNote(note);
    this.#domainEvents = assertDomainEventCollector(eventCollector);
    Object.freeze(this);
  }

  static create(relationData, {
    eventId,
    actor,
    occurredAt,
    recordedAt = occurredAt,
    correlationId = null,
    causationId = null,
    metadata = {},
    eventCollector = new DomainEventCollector()
  } = {}) {
    const relation = new ScenarioAssumptionRelation(
      relationData,
      { eventCollector }
    );

    if (!relation.#active) {
      throw createDomainError(
        ERROR_CODES.INVALID_SCENARIO_ASSUMPTION_RELATION,
        "A newly attached Scenario Assumption relation must be active.",
        { relationId: relation.relationId }
      );
    }

    relation.#recordEvent(createEvent({
      eventId,
      eventType: SCENARIO_ASSUMPTION_EVENT_TYPE.ATTACHED,
      occurredAt,
      recordedAt,
      aggregateId: relation.relationId,
      actor,
      correlationId,
      causationId,
      payload: relation.toSnapshot(),
      metadata
    }));

    return relation;
  }

  get relationId() {
    return `${this.#diagnosisScenarioId}::${this.#assumptionId}`;
  }
  get diagnosisScenarioId() { return this.#diagnosisScenarioId; }
  get assumptionId() { return this.#assumptionId; }
  get active() { return this.#active; }
  get note() { return this.#note; }

  activate({
    activatedAt,
    actor,
    reason,
    eventId,
    recordedAt = activatedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    if (this.#active) {
      return false;
    }

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_SCENARIO_ASSUMPTION_RELATION,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: SCENARIO_ASSUMPTION_EVENT_TYPE.REATTACHED,
      occurredAt: activatedAt,
      recordedAt,
      aggregateId: this.relationId,
      actor,
      correlationId,
      causationId,
      payload: { previousActive: false, active: true, reason: validReason },
      metadata
    });

    this.#recordEvent(event);
    this.#active = true;
    return true;
  }

  deactivate({
    deactivatedAt,
    actor,
    reason,
    eventId,
    recordedAt = deactivatedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    if (!this.#active) {
      return false;
    }

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_SCENARIO_ASSUMPTION_RELATION,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: SCENARIO_ASSUMPTION_EVENT_TYPE.DETACHED,
      occurredAt: deactivatedAt,
      recordedAt,
      aggregateId: this.relationId,
      actor,
      correlationId,
      causationId,
      payload: { previousActive: true, active: false, reason: validReason },
      metadata
    });

    this.#recordEvent(event);
    this.#active = false;
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
    const nextNote = normalizeNote(note);
    if (nextNote === this.#note) return false;

    const event = createEvent({
      eventId,
      eventType: SCENARIO_ASSUMPTION_EVENT_TYPE.NOTE_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.relationId,
      actor,
      correlationId,
      causationId,
      payload: { previousNote: this.#note, note: nextNote },
      metadata
    });

    this.#recordEvent(event);
    this.#note = nextNote;
    return true;
  }

  peekDomainEvents() { return this.#domainEvents.peekEvents(); }
  pullDomainEvents() { return this.#domainEvents.pullEvents(); }
  hasDomainEvents() { return this.#domainEvents.hasEvents(); }
  getDomainEventCount() { return this.#domainEvents.getEventCount(); }

  toSnapshot() {
    return Object.freeze({
      diagnosisScenarioId: this.#diagnosisScenarioId,
      assumptionId: this.#assumptionId,
      active: this.#active,
      note: this.#note
    });
  }

  #recordEvent(event) {
    this.#domainEvents.record(event);
  }
}

export function assertScenarioAssumptionRelation(value) {
  if (!(value instanceof ScenarioAssumptionRelation)) {
    throw createDomainError(
      ERROR_CODES.INVALID_SCENARIO_ASSUMPTION_RELATION,
      "value must be a ScenarioAssumptionRelation.",
      { receivedType: typeof value }
    );
  }

  return value;
}
