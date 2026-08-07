import {
  PLAN_VERSION_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertBoolean,
  assertCodeValue,
  assertNonEmptyString,
  assertPositiveInteger,
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

const EDITABLE_STATUSES = Object.freeze([
  PLAN_VERSION_STATUS.DRAFT,
  PLAN_VERSION_STATUS.REVIEW
]);

export const PLAN_VERSION_EVENT_TYPE = Object.freeze({
  CREATED: "PLAN_VERSION_CREATED",
  RENAMED: "PLAN_VERSION_RENAMED",
  NOTE_CHANGED: "PLAN_VERSION_NOTE_CHANGED",
  SUBMITTED_FOR_REVIEW: "PLAN_VERSION_SUBMITTED_FOR_REVIEW",
  RETURNED_TO_DRAFT: "PLAN_VERSION_RETURNED_TO_DRAFT",
  APPROVED: "PLAN_VERSION_APPROVED",
  SUPERSEDED: "PLAN_VERSION_SUPERSEDED",
  ARCHIVED: "PLAN_VERSION_ARCHIVED"
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
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return assertIdentifier(value, code, label);
}

function normalizeOptionalText(value, label) {
  if (typeof value !== "string") {
    throw createDomainError(
      ERROR_CODES.INVALID_PLAN_VERSION_TEXT,
      `${label} must be a string.`,
      { value, label }
    );
  }

  return value.trim();
}

function assertStatusActiveConsistency(status, active) {
  const mustBeInactive = [
    PLAN_VERSION_STATUS.SUPERSEDED,
    PLAN_VERSION_STATUS.ARCHIVED
  ].includes(status);

  if (mustBeInactive && active) {
    throw createDomainError(
      ERROR_CODES.INVALID_PLAN_VERSION_STATE,
      `${status} Plan Version must be inactive.`,
      { status, active }
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
    aggregateType: "PLAN_VERSION",
    aggregateId,
    actor,
    correlationId,
    causationId,
    payload,
    metadata
  });
}

/**
 * Identifies one reproducible version of a Production Plan.
 *
 * DRAFT and REVIEW are editable. Once approved, plan content must be
 * changed by creating a new version rather than modifying this instance.
 */
export class ProductionPlanVersion {
  #planVersionId;
  #planId;
  #versionNumber;
  #versionName;
  #status;
  #sourceVersionId;
  #changeReason;
  #createdBy;
  #createdAt;
  #active;
  #note;
  #domainEvents;

  constructor({
    planVersionId,
    planId,
    versionNumber,
    versionName,
    status = PLAN_VERSION_STATUS.DRAFT,
    sourceVersionId = null,
    changeReason = "",
    createdBy = "",
    createdAt,
    active = true,
    note = ""
  } = {}, {
    eventCollector = new DomainEventCollector()
  } = {}) {
    this.#planVersionId = assertIdentifier(
      planVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "planVersionId"
    );

    this.#planId = assertIdentifier(
      planId,
      ERROR_CODES.INVALID_PLAN_ID,
      "planId"
    );

    this.#versionNumber = assertPositiveInteger(
      versionNumber,
      ERROR_CODES.INVALID_PLAN_VERSION_NUMBER,
      "versionNumber"
    );

    this.#versionName = assertNonEmptyString(
      versionName,
      ERROR_CODES.INVALID_PLAN_VERSION_NAME,
      "versionName"
    );

    this.#status = assertCodeValue(
      status,
      PLAN_VERSION_STATUS,
      ERROR_CODES.INVALID_PLAN_VERSION_STATUS,
      "status"
    );

    this.#sourceVersionId = assertOptionalIdentifier(
      sourceVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "sourceVersionId"
    );

    if (this.#sourceVersionId === this.#planVersionId) {
      throw createDomainError(
        ERROR_CODES.SOURCE_VERSION_SELF_REFERENCE,
        "sourceVersionId must not reference the same Plan Version.",
        {
          planVersionId: this.#planVersionId,
          sourceVersionId: this.#sourceVersionId
        }
      );
    }

    this.#changeReason = normalizeOptionalText(
      changeReason,
      "changeReason"
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

    assertStatusActiveConsistency(
      this.#status,
      this.#active
    );

    this.#note = normalizeOptionalText(note, "note");
    this.#domainEvents = assertDomainEventCollector(
      eventCollector
    );

    Object.freeze(this);
  }

  static create(versionData, {
    eventId,
    actor,
    occurredAt = versionData?.createdAt,
    recordedAt = occurredAt,
    correlationId = null,
    causationId = null,
    metadata = {},
    eventCollector = new DomainEventCollector()
  } = {}) {
    const version = new ProductionPlanVersion(
      versionData,
      { eventCollector }
    );

    version.#recordEvent(
      createEvent({
        eventId,
        eventType: PLAN_VERSION_EVENT_TYPE.CREATED,
        occurredAt,
        recordedAt,
        aggregateId: version.#planVersionId,
        actor,
        correlationId,
        causationId,
        payload: version.toSnapshot(),
        metadata
      })
    );

    return version;
  }

  get planVersionId() {
    return this.#planVersionId;
  }

  get planId() {
    return this.#planId;
  }

  get versionNumber() {
    return this.#versionNumber;
  }

  get versionName() {
    return this.#versionName;
  }

  get status() {
    return this.#status;
  }

  get sourceVersionId() {
    return this.#sourceVersionId;
  }

  get changeReason() {
    return this.#changeReason;
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

  isEditable() {
    return EDITABLE_STATUSES.includes(this.#status);
  }

  assertEditable() {
    if (!this.isEditable()) {
      throw createDomainError(
        ERROR_CODES.PLAN_VERSION_NOT_EDITABLE,
        "Approved, superseded, or archived Plan Versions cannot be edited.",
        {
          planVersionId: this.#planVersionId,
          status: this.#status
        }
      );
    }

    return this;
  }

  rename({
    versionName,
    changedAt,
    actor,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    this.assertEditable();

    const nextName = assertNonEmptyString(
      versionName,
      ERROR_CODES.INVALID_PLAN_VERSION_NAME,
      "versionName"
    );

    if (nextName === this.#versionName) {
      return false;
    }

    const previousVersionName = this.#versionName;
    const event = createEvent({
      eventId,
      eventType: PLAN_VERSION_EVENT_TYPE.RENAMED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#planVersionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousVersionName,
        versionName: nextName
      },
      metadata
    });

    this.#recordEvent(event);
    this.#versionName = nextName;

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

    const previousNote = this.#note;
    const event = createEvent({
      eventId,
      eventType: PLAN_VERSION_EVENT_TYPE.NOTE_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#planVersionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousNote,
        note: nextNote,
        status: this.#status
      },
      metadata
    });

    this.#recordEvent(event);
    this.#note = nextNote;

    return true;
  }

  submitForReview({
    submittedAt,
    actor,
    eventId,
    recordedAt = submittedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    return this.#transition({
      expectedStatus: PLAN_VERSION_STATUS.DRAFT,
      nextStatus: PLAN_VERSION_STATUS.REVIEW,
      eventType: PLAN_VERSION_EVENT_TYPE.SUBMITTED_FOR_REVIEW,
      occurredAt: submittedAt,
      recordedAt,
      actor,
      eventId,
      correlationId,
      causationId,
      payload: {},
      metadata
    });
  }

  returnToDraft({
    returnedAt,
    actor,
    reason,
    eventId,
    recordedAt = returnedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_PLAN_VERSION_TEXT,
      "reason"
    );

    return this.#transition({
      expectedStatus: PLAN_VERSION_STATUS.REVIEW,
      nextStatus: PLAN_VERSION_STATUS.DRAFT,
      eventType: PLAN_VERSION_EVENT_TYPE.RETURNED_TO_DRAFT,
      occurredAt: returnedAt,
      recordedAt,
      actor,
      eventId,
      correlationId,
      causationId,
      payload: { reason: validReason },
      metadata
    });
  }

  approve({
    approvedAt,
    actor,
    eventId,
    recordedAt = approvedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    return this.#transition({
      expectedStatus: PLAN_VERSION_STATUS.REVIEW,
      nextStatus: PLAN_VERSION_STATUS.APPROVED,
      eventType: PLAN_VERSION_EVENT_TYPE.APPROVED,
      occurredAt: approvedAt,
      recordedAt,
      actor,
      eventId,
      correlationId,
      causationId,
      payload: {},
      metadata
    });
  }

  markSuperseded({
    supersededAt,
    actor,
    replacementVersionId,
    eventId,
    recordedAt = supersededAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const replacementId = assertIdentifier(
      replacementVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "replacementVersionId"
    );

    if (replacementId === this.#planVersionId) {
      throw createDomainError(
        ERROR_CODES.REPLACEMENT_VERSION_SELF_REFERENCE,
        "replacementVersionId must not reference the same Plan Version.",
        {
          planVersionId: this.#planVersionId,
          replacementVersionId: replacementId
        }
      );
    }

    return this.#transition({
      expectedStatus: PLAN_VERSION_STATUS.APPROVED,
      nextStatus: PLAN_VERSION_STATUS.SUPERSEDED,
      nextActive: false,
      eventType: PLAN_VERSION_EVENT_TYPE.SUPERSEDED,
      occurredAt: supersededAt,
      recordedAt,
      actor,
      eventId,
      correlationId,
      causationId,
      payload: {
        replacementVersionId: replacementId
      },
      metadata
    });
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
    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_PLAN_VERSION_TEXT,
      "reason"
    );

    return this.#transition({
      expectedStatus: PLAN_VERSION_STATUS.SUPERSEDED,
      nextStatus: PLAN_VERSION_STATUS.ARCHIVED,
      nextActive: false,
      eventType: PLAN_VERSION_EVENT_TYPE.ARCHIVED,
      occurredAt: archivedAt,
      recordedAt,
      actor,
      eventId,
      correlationId,
      causationId,
      payload: { reason: validReason },
      metadata
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
      planVersionId: this.#planVersionId,
      planId: this.#planId,
      versionNumber: this.#versionNumber,
      versionName: this.#versionName,
      status: this.#status,
      sourceVersionId: this.#sourceVersionId,
      changeReason: this.#changeReason,
      createdBy: this.#createdBy,
      createdAt: this.#createdAt,
      active: this.#active,
      note: this.#note
    });
  }

  #transition({
    expectedStatus,
    nextStatus,
    nextActive = this.#active,
    eventType,
    occurredAt,
    recordedAt,
    actor,
    eventId,
    correlationId,
    causationId,
    payload,
    metadata
  }) {
    if (this.#status !== expectedStatus) {
      throw createDomainError(
        ERROR_CODES.INVALID_PLAN_VERSION_TRANSITION,
        `Plan Version cannot transition from ${this.#status} to ${nextStatus}.`,
        {
          planVersionId: this.#planVersionId,
          currentStatus: this.#status,
          expectedStatus,
          nextStatus
        }
      );
    }

    assertStatusActiveConsistency(nextStatus, nextActive);

    const event = createEvent({
      eventId,
      eventType,
      occurredAt,
      recordedAt,
      aggregateId: this.#planVersionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousStatus: this.#status,
        status: nextStatus,
        previousActive: this.#active,
        active: nextActive,
        ...payload
      },
      metadata
    });

    this.#recordEvent(event);
    this.#status = nextStatus;
    this.#active = nextActive;

    return true;
  }

  #recordEvent(event) {
    this.#domainEvents.record(event);
  }
}

export function assertProductionPlanVersion(version) {
  if (!(version instanceof ProductionPlanVersion)) {
    throw createDomainError(
      ERROR_CODES.INVALID_ARGUMENT,
      "version must be a ProductionPlanVersion.",
      { receivedType: typeof version }
    );
  }

  return version;
}
