import {
  CAPACITY_BASELINE,
  DIAGNOSIS_SCENARIO_CATEGORY
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertBoolean,
  assertCodeValue,
  assertNonEmptyString,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDateTime
} from "./DateTimeUtils.js";

import {
  DomainEvent
} from "./DomainEvent.js";

import {
  DomainEventCollector,
  assertDomainEventCollector
} from "./DomainEventCollector.js";

const IDENTIFIER_PATTERN = /^\S+$/;

export const DIAGNOSIS_SCENARIO_EVENT_TYPE = Object.freeze({
  CREATED: "DIAGNOSIS_SCENARIO_CREATED",
  RENAMED: "DIAGNOSIS_SCENARIO_RENAMED",
  PLAN_VERSION_CHANGED: "DIAGNOSIS_SCENARIO_PLAN_VERSION_CHANGED",
  CAPACITY_SCENARIO_CHANGED: "DIAGNOSIS_SCENARIO_CAPACITY_SCENARIO_CHANGED",
  BASE_SCENARIO_CHANGED: "DIAGNOSIS_SCENARIO_BASE_SCENARIO_CHANGED",
  DESCRIPTION_CHANGED: "DIAGNOSIS_SCENARIO_DESCRIPTION_CHANGED",
  NOTE_CHANGED: "DIAGNOSIS_SCENARIO_NOTE_CHANGED",
  ACTIVATED: "DIAGNOSIS_SCENARIO_ACTIVATED",
  DEACTIVATED: "DIAGNOSIS_SCENARIO_DEACTIVATED",
  ARCHIVED: "DIAGNOSIS_SCENARIO_ARCHIVED"
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

function assertOptionalIdentifier(value, code, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return assertIdentifier(value, code, label);
}

function normalizeOptionalText(value, label) {
  if (typeof value !== "string") {
    throw createDomainError(
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_TEXT,
      `${label} must be a string.`,
      { value, label }
    );
  }

  return value.trim();
}

function assertSupportedBaseline(value) {
  const baseline = assertCodeValue(
    value,
    CAPACITY_BASELINE,
    ERROR_CODES.INVALID_CAPACITY_BASELINE,
    "capacityBaseline"
  );

  if (baseline !== CAPACITY_BASELINE.AVAILABLE_CAPACITY) {
    throw createDomainError(
      ERROR_CODES.UNSUPPORTED_CAPACITY_BASELINE,
      "DAY30 currently supports AVAILABLE_CAPACITY only.",
      { capacityBaseline: baseline }
    );
  }

  return baseline;
}

function assertScenarioConsistency({
  diagnosisScenarioId,
  scenarioCategory,
  baseDiagnosisScenarioId,
  changeSummary,
  active
}) {
  if (baseDiagnosisScenarioId === diagnosisScenarioId) {
    throw createDomainError(
      ERROR_CODES.BASE_SCENARIO_SELF_REFERENCE,
      "baseDiagnosisScenarioId must not reference the same Diagnosis Scenario.",
      { diagnosisScenarioId, baseDiagnosisScenarioId }
    );
  }

  if (
    scenarioCategory === DIAGNOSIS_SCENARIO_CATEGORY.BASE &&
    baseDiagnosisScenarioId !== null
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_STATE,
      "BASE Scenario must not reference another base Scenario.",
      { scenarioCategory, baseDiagnosisScenarioId }
    );
  }

  if (
    scenarioCategory === DIAGNOSIS_SCENARIO_CATEGORY.COMPARISON &&
    baseDiagnosisScenarioId === null
  ) {
    throw createDomainError(
      ERROR_CODES.COMPARISON_BASE_REQUIRED,
      "COMPARISON Scenario requires baseDiagnosisScenarioId.",
      { scenarioCategory }
    );
  }

  if (
    scenarioCategory === DIAGNOSIS_SCENARIO_CATEGORY.COMPARISON &&
    changeSummary === ""
  ) {
    throw createDomainError(
      ERROR_CODES.CHANGE_SUMMARY_REQUIRED,
      "COMPARISON Scenario requires changeSummary.",
      { scenarioCategory }
    );
  }

  if (
    scenarioCategory === DIAGNOSIS_SCENARIO_CATEGORY.ARCHIVED &&
    active
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_STATE,
      "ARCHIVED Diagnosis Scenario must be inactive.",
      { scenarioCategory, active }
    );
  }
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
    aggregateType: "DIAGNOSIS_SCENARIO",
    aggregateId,
    actor,
    correlationId,
    causationId,
    payload,
    metadata
  });
}

/**
 * Selects which Plan Version is diagnosed against which DAY29 Capacity
 * Scenario. It stores conditions only; diagnosis results are derived later.
 */
export class DiagnosisScenario {
  #diagnosisScenarioId;
  #name;
  #planVersionId;
  #capacityScenarioId;
  #capacityBaseline;
  #baseDiagnosisScenarioId;
  #scenarioCategory;
  #changeSummary;
  #description;
  #createdBy;
  #createdAt;
  #active;
  #note;
  #domainEvents;

  constructor({
    diagnosisScenarioId,
    name,
    planVersionId,
    capacityScenarioId,
    capacityBaseline = CAPACITY_BASELINE.AVAILABLE_CAPACITY,
    baseDiagnosisScenarioId = null,
    scenarioCategory = DIAGNOSIS_SCENARIO_CATEGORY.BASE,
    changeSummary = "",
    description = "",
    createdBy = "",
    createdAt,
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

    this.#name = assertNonEmptyString(
      name,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_NAME,
      "name"
    );

    this.#planVersionId = assertIdentifier(
      planVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "planVersionId"
    );

    this.#capacityScenarioId = assertIdentifier(
      capacityScenarioId,
      ERROR_CODES.INVALID_CAPACITY_SCENARIO_ID,
      "capacityScenarioId"
    );

    this.#capacityBaseline = assertSupportedBaseline(capacityBaseline);
    this.#baseDiagnosisScenarioId = assertOptionalIdentifier(
      baseDiagnosisScenarioId,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_ID,
      "baseDiagnosisScenarioId"
    );

    this.#scenarioCategory = assertCodeValue(
      scenarioCategory,
      DIAGNOSIS_SCENARIO_CATEGORY,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_CATEGORY,
      "scenarioCategory"
    );

    this.#changeSummary = normalizeOptionalText(changeSummary, "changeSummary");
    this.#description = normalizeOptionalText(description, "description");
    this.#createdBy = normalizeOptionalText(createdBy, "createdBy");
    this.#createdAt = assertDateTime(
      createdAt,
      ERROR_CODES.INVALID_DATE_TIME,
      "createdAt"
    );
    this.#active = assertBoolean(active, ERROR_CODES.INVALID_BOOLEAN, "active");
    this.#note = normalizeOptionalText(note, "note");

    assertScenarioConsistency({
      diagnosisScenarioId: this.#diagnosisScenarioId,
      scenarioCategory: this.#scenarioCategory,
      baseDiagnosisScenarioId: this.#baseDiagnosisScenarioId,
      changeSummary: this.#changeSummary,
      active: this.#active
    });

    this.#domainEvents = assertDomainEventCollector(eventCollector);
    Object.freeze(this);
  }

  static create(scenarioData, {
    eventId,
    actor,
    occurredAt = scenarioData?.createdAt,
    recordedAt = occurredAt,
    correlationId = null,
    causationId = null,
    metadata = {},
    eventCollector = new DomainEventCollector()
  } = {}) {
    const scenario = new DiagnosisScenario(
      scenarioData,
      { eventCollector }
    );

    scenario.#recordEvent(createEvent({
      eventId,
      eventType: DIAGNOSIS_SCENARIO_EVENT_TYPE.CREATED,
      occurredAt,
      recordedAt,
      aggregateId: scenario.#diagnosisScenarioId,
      actor,
      correlationId,
      causationId,
      payload: scenario.toSnapshot(),
      metadata
    }));

    return scenario;
  }

  get diagnosisScenarioId() { return this.#diagnosisScenarioId; }
  get name() { return this.#name; }
  get planVersionId() { return this.#planVersionId; }
  get capacityScenarioId() { return this.#capacityScenarioId; }
  get capacityBaseline() { return this.#capacityBaseline; }
  get baseDiagnosisScenarioId() { return this.#baseDiagnosisScenarioId; }
  get scenarioCategory() { return this.#scenarioCategory; }
  get changeSummary() { return this.#changeSummary; }
  get description() { return this.#description; }
  get createdBy() { return this.#createdBy; }
  get createdAt() { return this.#createdAt; }
  get active() { return this.#active; }
  get note() { return this.#note; }

  isArchived() {
    return this.#scenarioCategory === DIAGNOSIS_SCENARIO_CATEGORY.ARCHIVED;
  }

  assertNotArchived() {
    if (this.isArchived()) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SCENARIO_ARCHIVED,
        "Archived Diagnosis Scenario cannot be changed or reactivated.",
        { diagnosisScenarioId: this.#diagnosisScenarioId }
      );
    }

    return this;
  }

  rename({
    name,
    changedAt,
    actor,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    this.assertNotArchived();
    const nextName = assertNonEmptyString(
      name,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_NAME,
      "name"
    );

    if (nextName === this.#name) return false;

    const event = createEvent({
      eventId,
      eventType: DIAGNOSIS_SCENARIO_EVENT_TYPE.RENAMED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#diagnosisScenarioId,
      actor,
      correlationId,
      causationId,
      payload: { previousName: this.#name, name: nextName },
      metadata
    });

    this.#recordEvent(event);
    this.#name = nextName;
    return true;
  }

  changePlanVersion({
    planVersionId,
    changedAt,
    actor,
    reason,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    this.assertNotArchived();
    const nextId = assertIdentifier(
      planVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "planVersionId"
    );

    if (nextId === this.#planVersionId) return false;

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_TEXT,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: DIAGNOSIS_SCENARIO_EVENT_TYPE.PLAN_VERSION_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#diagnosisScenarioId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousPlanVersionId: this.#planVersionId,
        planVersionId: nextId,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#planVersionId = nextId;
    return true;
  }

  changeCapacityScenario({
    capacityScenarioId,
    changedAt,
    actor,
    reason,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    this.assertNotArchived();
    const nextId = assertIdentifier(
      capacityScenarioId,
      ERROR_CODES.INVALID_CAPACITY_SCENARIO_ID,
      "capacityScenarioId"
    );

    if (nextId === this.#capacityScenarioId) return false;

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_TEXT,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: DIAGNOSIS_SCENARIO_EVENT_TYPE.CAPACITY_SCENARIO_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#diagnosisScenarioId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousCapacityScenarioId: this.#capacityScenarioId,
        capacityScenarioId: nextId,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#capacityScenarioId = nextId;
    return true;
  }

  setBaseScenario({
    baseDiagnosisScenarioId,
    changeSummary,
    changedAt,
    actor,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    this.assertNotArchived();

    if (this.#scenarioCategory === DIAGNOSIS_SCENARIO_CATEGORY.BASE) {
      throw createDomainError(
        ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_STATE,
        "BASE Scenario cannot reference a base Scenario.",
        { diagnosisScenarioId: this.#diagnosisScenarioId }
      );
    }

    const nextBaseId = assertIdentifier(
      baseDiagnosisScenarioId,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_ID,
      "baseDiagnosisScenarioId"
    );

    if (nextBaseId === this.#diagnosisScenarioId) {
      throw createDomainError(
        ERROR_CODES.BASE_SCENARIO_SELF_REFERENCE,
        "baseDiagnosisScenarioId must not reference the same Diagnosis Scenario.",
        {
          diagnosisScenarioId: this.#diagnosisScenarioId,
          baseDiagnosisScenarioId: nextBaseId
        }
      );
    }

    const nextSummary = assertNonEmptyString(
      changeSummary,
      ERROR_CODES.CHANGE_SUMMARY_REQUIRED,
      "changeSummary"
    );

    if (
      nextBaseId === this.#baseDiagnosisScenarioId &&
      nextSummary === this.#changeSummary
    ) {
      return false;
    }

    const event = createEvent({
      eventId,
      eventType: DIAGNOSIS_SCENARIO_EVENT_TYPE.BASE_SCENARIO_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#diagnosisScenarioId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousBaseDiagnosisScenarioId: this.#baseDiagnosisScenarioId,
        baseDiagnosisScenarioId: nextBaseId,
        previousChangeSummary: this.#changeSummary,
        changeSummary: nextSummary
      },
      metadata
    });

    this.#recordEvent(event);
    this.#baseDiagnosisScenarioId = nextBaseId;
    this.#changeSummary = nextSummary;
    return true;
  }

  changeDescription({
    description,
    changedAt,
    actor,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    this.assertNotArchived();
    const nextDescription = normalizeOptionalText(description, "description");
    if (nextDescription === this.#description) return false;

    const event = createEvent({
      eventId,
      eventType: DIAGNOSIS_SCENARIO_EVENT_TYPE.DESCRIPTION_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#diagnosisScenarioId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousDescription: this.#description,
        description: nextDescription
      },
      metadata
    });

    this.#recordEvent(event);
    this.#description = nextDescription;
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
    if (nextNote === this.#note) return false;

    const event = createEvent({
      eventId,
      eventType: DIAGNOSIS_SCENARIO_EVENT_TYPE.NOTE_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#diagnosisScenarioId,
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

  activate({
    activatedAt,
    actor,
    eventId,
    recordedAt = activatedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    this.assertNotArchived();

    if (this.#active) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SCENARIO_ALREADY_ACTIVE,
        "Diagnosis Scenario is already active.",
        { diagnosisScenarioId: this.#diagnosisScenarioId }
      );
    }

    const event = createEvent({
      eventId,
      eventType: DIAGNOSIS_SCENARIO_EVENT_TYPE.ACTIVATED,
      occurredAt: activatedAt,
      recordedAt,
      aggregateId: this.#diagnosisScenarioId,
      actor,
      correlationId,
      causationId,
      payload: { previousActive: false, active: true },
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
    this.assertNotArchived();

    if (!this.#active) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SCENARIO_ALREADY_INACTIVE,
        "Diagnosis Scenario is already inactive.",
        { diagnosisScenarioId: this.#diagnosisScenarioId }
      );
    }

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_TEXT,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: DIAGNOSIS_SCENARIO_EVENT_TYPE.DEACTIVATED,
      occurredAt: deactivatedAt,
      recordedAt,
      aggregateId: this.#diagnosisScenarioId,
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

  archive({
    archivedAt,
    actor,
    reason,
    eventId,
    recordedAt = archivedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    this.assertNotArchived();
    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_TEXT,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: DIAGNOSIS_SCENARIO_EVENT_TYPE.ARCHIVED,
      occurredAt: archivedAt,
      recordedAt,
      aggregateId: this.#diagnosisScenarioId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousScenarioCategory: this.#scenarioCategory,
        scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.ARCHIVED,
        previousActive: this.#active,
        active: false,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#scenarioCategory = DIAGNOSIS_SCENARIO_CATEGORY.ARCHIVED;
    this.#active = false;
    return true;
  }

  peekDomainEvents() { return this.#domainEvents.peekEvents(); }
  pullDomainEvents() { return this.#domainEvents.pullEvents(); }
  hasDomainEvents() { return this.#domainEvents.hasEvents(); }
  getDomainEventCount() { return this.#domainEvents.getEventCount(); }

  toSnapshot() {
    return Object.freeze({
      diagnosisScenarioId: this.#diagnosisScenarioId,
      name: this.#name,
      planVersionId: this.#planVersionId,
      capacityScenarioId: this.#capacityScenarioId,
      capacityBaseline: this.#capacityBaseline,
      baseDiagnosisScenarioId: this.#baseDiagnosisScenarioId,
      scenarioCategory: this.#scenarioCategory,
      changeSummary: this.#changeSummary,
      description: this.#description,
      createdBy: this.#createdBy,
      createdAt: this.#createdAt,
      active: this.#active,
      note: this.#note
    });
  }

  #recordEvent(event) {
    this.#domainEvents.record(event);
  }
}

export function assertDiagnosisScenario(value) {
  if (!(value instanceof DiagnosisScenario)) {
    throw createDomainError(
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO,
      "value must be a DiagnosisScenario.",
      { receivedType: typeof value }
    );
  }

  return value;
}
