import {
  ERROR_CODES,
  assertBoolean,
  assertNonEmptyString,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDateTime,
  assertTargetMonth
} from "./DateTimeUtils.js";

import {
  DomainEvent
} from "./DomainEvent.js";

import {
  DomainEventCollector,
  assertDomainEventCollector
} from "./DomainEventCollector.js";

const IDENTIFIER_PATTERN = /^\S+$/;

export const PRODUCTION_PLAN_EVENT_TYPE = Object.freeze({
  CREATED: "PRODUCTION_PLAN_CREATED",
  RENAMED: "PRODUCTION_PLAN_RENAMED",
  DESCRIPTION_CHANGED: "PRODUCTION_PLAN_DESCRIPTION_CHANGED",
  NOTE_CHANGED: "PRODUCTION_PLAN_NOTE_CHANGED",
  ACTIVATED: "PRODUCTION_PLAN_ACTIVATED",
  DEACTIVATED: "PRODUCTION_PLAN_DEACTIVATED"
});

function assertIdentifier(
  value,
  code,
  label
) {
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

function normalizeOptionalText(
  value,
  label
) {
  if (typeof value !== "string") {
    throw createDomainError(
      ERROR_CODES.INVALID_PRODUCTION_PLAN_TEXT,
      `${label} must be a string.`,
      { value, label }
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
    aggregateType: "PRODUCTION_PLAN",
    aggregateId,
    actor,
    correlationId,
    causationId,
    payload,
    metadata
  });
}

/**
 * Production Plan全体を識別するAggregate Root。
 *
 * 対象月とPrimary Factoryは計画の意味そのものを変えるため、
 * 作成後に変更するMethodを持たない。
 */
export class ProductionPlan {
  #planId;
  #name;
  #targetMonth;
  #primaryFactoryId;
  #description;
  #createdBy;
  #createdAt;
  #active;
  #note;
  #domainEvents;

  constructor({
    planId,
    name,
    targetMonth,
    primaryFactoryId,
    description = "",
    createdBy = "",
    createdAt,
    active = true,
    note = ""
  } = {}, {
    eventCollector = new DomainEventCollector()
  } = {}) {
    this.#planId = assertIdentifier(
      planId,
      ERROR_CODES.INVALID_PLAN_ID,
      "planId"
    );

    this.#name = assertNonEmptyString(
      name,
      ERROR_CODES.INVALID_PLAN_NAME,
      "name"
    );

    this.#targetMonth = assertTargetMonth(
      targetMonth,
      ERROR_CODES.INVALID_TARGET_MONTH,
      "targetMonth"
    );

    this.#primaryFactoryId = assertIdentifier(
      primaryFactoryId,
      ERROR_CODES.INVALID_PRIMARY_FACTORY_ID,
      "primaryFactoryId"
    );

    this.#description = normalizeOptionalText(
      description,
      "description"
    );

    this.#createdBy = normalizeOptionalText(
      createdBy,
      "createdBy"
    );

    this.#createdAt = assertDateTime(
      createdAt,
      ERROR_CODES.INVALID_DATE_TIME,
      "createdAt"
    );

    this.#active = assertBoolean(
      active,
      ERROR_CODES.INVALID_BOOLEAN,
      "active"
    );

    this.#note = normalizeOptionalText(
      note,
      "note"
    );

    this.#domainEvents = assertDomainEventCollector(
      eventCollector
    );

    Object.freeze(this);
  }

  /**
   * 新規作成時だけPRODUCTION_PLAN_CREATEDを記録するFactory。
   * Repositoryからの復元ではconstructorを直接使用する。
   */
  static create(planData, {
    eventId,
    actor,
    occurredAt = planData?.createdAt,
    recordedAt = occurredAt,
    correlationId = null,
    causationId = null,
    metadata = {},
    eventCollector = new DomainEventCollector()
  } = {}) {
    const plan = new ProductionPlan(
      planData,
      { eventCollector }
    );

    plan.#recordEvent(
      createEvent({
        eventId,
        eventType: PRODUCTION_PLAN_EVENT_TYPE.CREATED,
        occurredAt,
        recordedAt,
        aggregateId: plan.#planId,
        actor,
        correlationId,
        causationId,
        payload: plan.toSnapshot(),
        metadata
      })
    );

    return plan;
  }

  get planId() {
    return this.#planId;
  }

  get name() {
    return this.#name;
  }

  get targetMonth() {
    return this.#targetMonth;
  }

  get primaryFactoryId() {
    return this.#primaryFactoryId;
  }

  get description() {
    return this.#description;
  }

  get createdBy() {
    return this.#createdBy;
  }

  get createdAt() {
    return this.#createdAt;
  }

  get active() {
    return this.#active;
  }

  get note() {
    return this.#note;
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
    const nextName = assertNonEmptyString(
      name,
      ERROR_CODES.INVALID_PLAN_NAME,
      "name"
    );

    if (nextName === this.#name) {
      return false;
    }

    const previousName = this.#name;
    const event = createEvent({
      eventId,
      eventType: PRODUCTION_PLAN_EVENT_TYPE.RENAMED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#planId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousName,
        name: nextName
      },
      metadata
    });

    this.#recordEvent(event);
    this.#name = nextName;

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
    const nextDescription = normalizeOptionalText(
      description,
      "description"
    );

    if (nextDescription === this.#description) {
      return false;
    }

    const previousDescription = this.#description;
    const event = createEvent({
      eventId,
      eventType:
        PRODUCTION_PLAN_EVENT_TYPE.DESCRIPTION_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#planId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousDescription,
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
    const nextNote = normalizeOptionalText(
      note,
      "note"
    );

    if (nextNote === this.#note) {
      return false;
    }

    const previousNote = this.#note;
    const event = createEvent({
      eventId,
      eventType: PRODUCTION_PLAN_EVENT_TYPE.NOTE_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#planId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousNote,
        note: nextNote
      },
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
    if (this.#active) {
      throw createDomainError(
        ERROR_CODES.PRODUCTION_PLAN_ALREADY_ACTIVE,
        "Production Plan is already active.",
        { planId: this.#planId }
      );
    }

    const event = createEvent({
      eventId,
      eventType: PRODUCTION_PLAN_EVENT_TYPE.ACTIVATED,
      occurredAt: activatedAt,
      recordedAt,
      aggregateId: this.#planId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousActive: false,
        active: true
      },
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
      throw createDomainError(
        ERROR_CODES.PRODUCTION_PLAN_ALREADY_INACTIVE,
        "Production Plan is already inactive.",
        { planId: this.#planId }
      );
    }

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_PRODUCTION_PLAN_TEXT,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: PRODUCTION_PLAN_EVENT_TYPE.DEACTIVATED,
      occurredAt: deactivatedAt,
      recordedAt,
      aggregateId: this.#planId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousActive: true,
        active: false,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#active = false;

    return true;
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
      planId: this.#planId,
      name: this.#name,
      targetMonth: this.#targetMonth,
      primaryFactoryId: this.#primaryFactoryId,
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

export function assertProductionPlan(plan) {
  if (!(plan instanceof ProductionPlan)) {
    throw createDomainError(
      ERROR_CODES.INVALID_ARGUMENT,
      "plan must be a ProductionPlan.",
      { receivedType: typeof plan }
    );
  }

  return plan;
}
