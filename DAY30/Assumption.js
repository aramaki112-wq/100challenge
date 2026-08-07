import {
  ASSUMPTION_CONFIDENCE,
  ASSUMPTION_EVIDENCE_TYPE,
  ASSUMPTION_IMPACT_LEVEL,
  ASSUMPTION_STATUS,
  ASSUMPTION_TARGET_TYPE,
  ASSUMPTION_TYPE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertBoolean,
  assertCodeValue,
  assertNonEmptyString,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate,
  assertDateTime,
  compareDates
} from "./DateTimeUtils.js";

import {
  DomainEvent
} from "./DomainEvent.js";

import {
  DomainEventCollector,
  assertDomainEventCollector
} from "./DomainEventCollector.js";

const IDENTIFIER_PATTERN = /^\S+$/;

export const ASSUMPTION_EVENT_TYPE = Object.freeze({
  REGISTERED: "ASSUMPTION_REGISTERED",
  EXPECTED: "ASSUMPTION_MARKED_EXPECTED",
  CONFIRMED: "ASSUMPTION_CONFIRMED",
  REJECTED: "ASSUMPTION_REJECTED",
  EXPIRED: "ASSUMPTION_EXPIRED",
  REOPENED: "ASSUMPTION_REOPENED",
  OWNER_CHANGED: "ASSUMPTION_OWNER_CHANGED",
  BLOCKING_CHANGED: "ASSUMPTION_BLOCKING_CHANGED",
  EVIDENCE_UPDATED: "ASSUMPTION_EVIDENCE_UPDATED",
  VALIDITY_CHANGED: "ASSUMPTION_VALIDITY_CHANGED",
  DESCRIPTION_CHANGED: "ASSUMPTION_DESCRIPTION_CHANGED",
  NOTE_CHANGED: "ASSUMPTION_NOTE_CHANGED"
});

function assertIdentifier(value, code, label) {
  const identifier = assertNonEmptyString(value, code, label);

  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw createDomainError(
      code,
      `${label} must not contain whitespace.`,
      { value, label }
    );
  }

  return identifier;
}

function normalizeOptionalText(value, label) {
  if (typeof value !== "string") {
    throw createDomainError(
      ERROR_CODES.INVALID_ASSUMPTION_TEXT,
      `${label} must be a string.`,
      { value, label }
    );
  }

  return value.trim();
}

function normalizeOptionalDate(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return assertDate(value, ERROR_CODES.INVALID_DATE, label);
}

function normalizeOptionalDateTime(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return assertDateTime(value, ERROR_CODES.INVALID_DATE_TIME, label);
}

function normalizeOptionalCode(value, codeMap, code, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return assertCodeValue(value, codeMap, code, label);
}

function assertValidityPeriod(validFrom, validTo) {
  const normalizedFrom = normalizeOptionalDate(validFrom, "validFrom");
  const normalizedTo = normalizeOptionalDate(validTo, "validTo");

  if (
    normalizedFrom !== null &&
    normalizedTo !== null &&
    compareDates(normalizedFrom, normalizedTo) > 0
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_VALIDITY_PERIOD,
      "validFrom must be before or equal to validTo.",
      { validFrom: normalizedFrom, validTo: normalizedTo }
    );
  }

  return Object.freeze({
    validFrom: normalizedFrom,
    validTo: normalizedTo
  });
}

function assertDecisionPair(confirmedAt, confirmedBy) {
  const hasAt = confirmedAt !== null;
  const hasBy = confirmedBy !== "";

  if (hasAt !== hasBy) {
    throw createDomainError(
      ERROR_CODES.INVALID_ASSUMPTION_STATE,
      "confirmedAt and confirmedBy must either both be present or both be absent.",
      { confirmedAt, confirmedBy }
    );
  }
}

function assertStateConsistency({
  status,
  confidence,
  confirmedAt,
  confirmedBy,
  evidence
}) {
  assertDecisionPair(confirmedAt, confirmedBy);

  if (
    [
      ASSUMPTION_STATUS.UNKNOWN,
      ASSUMPTION_STATUS.CONFIRMED,
      ASSUMPTION_STATUS.REJECTED
    ].includes(status) &&
    confidence !== null
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_ASSUMPTION_STATE,
      `${status} Assumption must not contain confidence.`,
      { status, confidence }
    );
  }

  if (
    status === ASSUMPTION_STATUS.EXPECTED &&
    confidence === null
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_ASSUMPTION_STATE,
      "EXPECTED Assumption requires confidence.",
      { status, confidence }
    );
  }

  if (
    [ASSUMPTION_STATUS.UNKNOWN, ASSUMPTION_STATUS.EXPECTED]
      .includes(status) &&
    (confirmedAt !== null || confirmedBy !== "")
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_ASSUMPTION_STATE,
      `${status} Assumption must not contain confirmation or rejection decision data.`,
      { status, confirmedAt, confirmedBy }
    );
  }

  if (
    [ASSUMPTION_STATUS.CONFIRMED, ASSUMPTION_STATUS.REJECTED]
      .includes(status) &&
    (confirmedAt === null || confirmedBy === "")
  ) {
    throw createDomainError(
      status === ASSUMPTION_STATUS.CONFIRMED
        ? ERROR_CODES.CONFIRMED_AT_REQUIRED
        : ERROR_CODES.REJECTED_AT_REQUIRED,
      `${status} Assumption requires confirmedAt and confirmedBy.`,
      { status, confirmedAt, confirmedBy }
    );
  }

  if (
    status === ASSUMPTION_STATUS.REJECTED &&
    evidence === ""
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_ASSUMPTION_EVIDENCE,
      "REJECTED Assumption requires evidence.",
      { status }
    );
  }
}

function assertAllowedTransition(currentStatus, allowedStatuses, action) {
  if (!allowedStatuses.includes(currentStatus)) {
    throw createDomainError(
      ERROR_CODES.INVALID_ASSUMPTION_TRANSITION,
      `${action} is not allowed from ${currentStatus}.`,
      { currentStatus, allowedStatuses, action }
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
    aggregateType: "ASSUMPTION",
    aggregateId,
    actor,
    correlationId,
    causationId,
    payload,
    metadata
  });
}

/**
 * A condition required by a plan that is not automatically equivalent to
 * a confirmed fact. Status, evidence, validity, and blocking impact are
 * kept explicit so EXPECTED is never silently treated as CONFIRMED.
 */
export class Assumption {
  #assumptionId;
  #assumptionType;
  #targetType;
  #targetId;
  #description;
  #status;
  #confidence;
  #owner;
  #confirmationDueDate;
  #confirmedAt;
  #confirmedBy;
  #evidenceType;
  #evidence;
  #sourceUpdatedAt;
  #validFrom;
  #validTo;
  #blocking;
  #impactLevel;
  #impactDescription;
  #note;
  #domainEvents;

  constructor({
    assumptionId,
    assumptionType,
    targetType,
    targetId,
    description,
    status = ASSUMPTION_STATUS.UNKNOWN,
    confidence = null,
    owner = "",
    confirmationDueDate = null,
    confirmedAt = null,
    confirmedBy = "",
    evidenceType = null,
    evidence = "",
    sourceUpdatedAt = null,
    validFrom = null,
    validTo = null,
    blocking = false,
    impactLevel = null,
    impactDescription = "",
    note = ""
  } = {}, {
    eventCollector = new DomainEventCollector()
  } = {}) {
    this.#assumptionId = assertIdentifier(
      assumptionId,
      ERROR_CODES.INVALID_ASSUMPTION_ID,
      "assumptionId"
    );

    this.#assumptionType = assertCodeValue(
      assumptionType,
      ASSUMPTION_TYPE,
      ERROR_CODES.INVALID_ASSUMPTION_TYPE,
      "assumptionType"
    );

    this.#targetType = assertCodeValue(
      targetType,
      ASSUMPTION_TARGET_TYPE,
      ERROR_CODES.INVALID_ASSUMPTION_TARGET,
      "targetType"
    );

    this.#targetId = assertIdentifier(
      targetId,
      ERROR_CODES.INVALID_ASSUMPTION_TARGET,
      "targetId"
    );

    this.#description = assertNonEmptyString(
      description,
      ERROR_CODES.INVALID_ASSUMPTION_TEXT,
      "description"
    );

    this.#status = assertCodeValue(
      status,
      ASSUMPTION_STATUS,
      ERROR_CODES.INVALID_ASSUMPTION_STATUS,
      "status"
    );

    this.#confidence = normalizeOptionalCode(
      confidence,
      ASSUMPTION_CONFIDENCE,
      ERROR_CODES.INVALID_ASSUMPTION_CONFIDENCE,
      "confidence"
    );

    this.#owner = normalizeOptionalText(owner, "owner");
    this.#confirmationDueDate = normalizeOptionalDate(
      confirmationDueDate,
      "confirmationDueDate"
    );
    this.#confirmedAt = normalizeOptionalDateTime(
      confirmedAt,
      "confirmedAt"
    );
    this.#confirmedBy = normalizeOptionalText(
      confirmedBy,
      "confirmedBy"
    );
    this.#evidenceType = normalizeOptionalCode(
      evidenceType,
      ASSUMPTION_EVIDENCE_TYPE,
      ERROR_CODES.INVALID_ASSUMPTION_EVIDENCE,
      "evidenceType"
    );
    this.#evidence = normalizeOptionalText(evidence, "evidence");
    this.#sourceUpdatedAt = normalizeOptionalDateTime(
      sourceUpdatedAt,
      "sourceUpdatedAt"
    );

    const validity = assertValidityPeriod(validFrom, validTo);
    this.#validFrom = validity.validFrom;
    this.#validTo = validity.validTo;

    this.#blocking = assertBoolean(
      blocking,
      ERROR_CODES.INVALID_BOOLEAN,
      "blocking"
    );
    this.#impactLevel = normalizeOptionalCode(
      impactLevel,
      ASSUMPTION_IMPACT_LEVEL,
      ERROR_CODES.INVALID_ASSUMPTION_IMPACT_LEVEL,
      "impactLevel"
    );
    this.#impactDescription = normalizeOptionalText(
      impactDescription,
      "impactDescription"
    );
    this.#note = normalizeOptionalText(note, "note");

    assertStateConsistency({
      status: this.#status,
      confidence: this.#confidence,
      confirmedAt: this.#confirmedAt,
      confirmedBy: this.#confirmedBy,
      evidence: this.#evidence
    });

    this.#domainEvents = assertDomainEventCollector(eventCollector);
    Object.freeze(this);
  }

  static create(assumptionData, {
    eventId,
    actor,
    occurredAt,
    recordedAt = occurredAt,
    correlationId = null,
    causationId = null,
    metadata = {},
    eventCollector = new DomainEventCollector()
  } = {}) {
    const assumption = new Assumption(
      assumptionData,
      { eventCollector }
    );

    assumption.#recordEvent(createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.REGISTERED,
      occurredAt,
      recordedAt,
      aggregateId: assumption.#assumptionId,
      actor,
      correlationId,
      causationId,
      payload: assumption.toSnapshot(),
      metadata
    }));

    return assumption;
  }

  get assumptionId() { return this.#assumptionId; }
  get assumptionType() { return this.#assumptionType; }
  get targetType() { return this.#targetType; }
  get targetId() { return this.#targetId; }
  get description() { return this.#description; }
  get status() { return this.#status; }
  get confidence() { return this.#confidence; }
  get owner() { return this.#owner; }
  get confirmationDueDate() { return this.#confirmationDueDate; }
  get confirmedAt() { return this.#confirmedAt; }
  get confirmedBy() { return this.#confirmedBy; }
  get evidenceType() { return this.#evidenceType; }
  get evidence() { return this.#evidence; }
  get sourceUpdatedAt() { return this.#sourceUpdatedAt; }
  get validFrom() { return this.#validFrom; }
  get validTo() { return this.#validTo; }
  get blocking() { return this.#blocking; }
  get impactLevel() { return this.#impactLevel; }
  get impactDescription() { return this.#impactDescription; }
  get note() { return this.#note; }

  markExpected({
    confidence,
    owner = this.#owner,
    confirmationDueDate = this.#confirmationDueDate,
    evidenceType = this.#evidenceType,
    evidence = this.#evidence,
    sourceUpdatedAt = this.#sourceUpdatedAt,
    changedAt,
    actor,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    assertAllowedTransition(
      this.#status,
      [ASSUMPTION_STATUS.UNKNOWN, ASSUMPTION_STATUS.EXPECTED],
      "markExpected"
    );

    const nextConfidence = assertCodeValue(
      confidence,
      ASSUMPTION_CONFIDENCE,
      ERROR_CODES.INVALID_ASSUMPTION_CONFIDENCE,
      "confidence"
    );
    const nextOwner = normalizeOptionalText(owner, "owner");
    const nextDueDate = normalizeOptionalDate(
      confirmationDueDate,
      "confirmationDueDate"
    );
    const nextEvidenceType = normalizeOptionalCode(
      evidenceType,
      ASSUMPTION_EVIDENCE_TYPE,
      ERROR_CODES.INVALID_ASSUMPTION_EVIDENCE,
      "evidenceType"
    );
    const nextEvidence = normalizeOptionalText(evidence, "evidence");
    const nextSourceUpdatedAt = normalizeOptionalDateTime(
      sourceUpdatedAt,
      "sourceUpdatedAt"
    );

    const unchanged =
      this.#status === ASSUMPTION_STATUS.EXPECTED &&
      this.#confidence === nextConfidence &&
      this.#owner === nextOwner &&
      this.#confirmationDueDate === nextDueDate &&
      this.#evidenceType === nextEvidenceType &&
      this.#evidence === nextEvidence &&
      this.#sourceUpdatedAt === nextSourceUpdatedAt;

    if (unchanged) {
      return false;
    }

    const event = createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.EXPECTED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#assumptionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousStatus: this.#status,
        status: ASSUMPTION_STATUS.EXPECTED,
        confidence: nextConfidence,
        owner: nextOwner,
        confirmationDueDate: nextDueDate,
        evidenceType: nextEvidenceType,
        evidence: nextEvidence,
        sourceUpdatedAt: nextSourceUpdatedAt
      },
      metadata
    });

    this.#recordEvent(event);
    this.#status = ASSUMPTION_STATUS.EXPECTED;
    this.#confidence = nextConfidence;
    this.#owner = nextOwner;
    this.#confirmationDueDate = nextDueDate;
    this.#evidenceType = nextEvidenceType;
    this.#evidence = nextEvidence;
    this.#sourceUpdatedAt = nextSourceUpdatedAt;

    return true;
  }

  confirm({
    confirmedAt,
    confirmedBy,
    evidenceType = null,
    evidence = "",
    sourceUpdatedAt = null,
    validFrom = null,
    validTo = null,
    actor,
    eventId,
    recordedAt = confirmedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    assertAllowedTransition(
      this.#status,
      [
        ASSUMPTION_STATUS.UNKNOWN,
        ASSUMPTION_STATUS.EXPECTED,
        ASSUMPTION_STATUS.EXPIRED
      ],
      "confirm"
    );

    const nextConfirmedAt = assertDateTime(
      confirmedAt,
      ERROR_CODES.CONFIRMED_AT_REQUIRED,
      "confirmedAt"
    );
    const nextConfirmedBy = assertNonEmptyString(
      confirmedBy,
      ERROR_CODES.INVALID_ASSUMPTION_TEXT,
      "confirmedBy"
    );
    const nextEvidenceType = normalizeOptionalCode(
      evidenceType,
      ASSUMPTION_EVIDENCE_TYPE,
      ERROR_CODES.INVALID_ASSUMPTION_EVIDENCE,
      "evidenceType"
    );
    const nextEvidence = normalizeOptionalText(evidence, "evidence");
    const nextSourceUpdatedAt = normalizeOptionalDateTime(
      sourceUpdatedAt,
      "sourceUpdatedAt"
    );
    const validity = assertValidityPeriod(validFrom, validTo);

    const event = createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.CONFIRMED,
      occurredAt: nextConfirmedAt,
      recordedAt,
      aggregateId: this.#assumptionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousStatus: this.#status,
        status: ASSUMPTION_STATUS.CONFIRMED,
        confirmedBy: nextConfirmedBy,
        evidenceType: nextEvidenceType,
        evidence: nextEvidence,
        sourceUpdatedAt: nextSourceUpdatedAt,
        validFrom: validity.validFrom,
        validTo: validity.validTo
      },
      metadata
    });

    this.#recordEvent(event);
    this.#status = ASSUMPTION_STATUS.CONFIRMED;
    this.#confidence = null;
    this.#confirmedAt = nextConfirmedAt;
    this.#confirmedBy = nextConfirmedBy;
    this.#evidenceType = nextEvidenceType;
    this.#evidence = nextEvidence;
    this.#sourceUpdatedAt = nextSourceUpdatedAt;
    this.#validFrom = validity.validFrom;
    this.#validTo = validity.validTo;

    return true;
  }

  reject({
    rejectedAt,
    rejectedBy,
    evidenceType = null,
    evidence,
    sourceUpdatedAt = null,
    impactDescription = this.#impactDescription,
    actor,
    eventId,
    recordedAt = rejectedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    assertAllowedTransition(
      this.#status,
      [
        ASSUMPTION_STATUS.UNKNOWN,
        ASSUMPTION_STATUS.EXPECTED,
        ASSUMPTION_STATUS.EXPIRED
      ],
      "reject"
    );

    const nextRejectedAt = assertDateTime(
      rejectedAt,
      ERROR_CODES.REJECTED_AT_REQUIRED,
      "rejectedAt"
    );
    const nextRejectedBy = assertNonEmptyString(
      rejectedBy,
      ERROR_CODES.INVALID_ASSUMPTION_TEXT,
      "rejectedBy"
    );
    const nextEvidenceType = normalizeOptionalCode(
      evidenceType,
      ASSUMPTION_EVIDENCE_TYPE,
      ERROR_CODES.INVALID_ASSUMPTION_EVIDENCE,
      "evidenceType"
    );
    const nextEvidence = assertNonEmptyString(
      evidence,
      ERROR_CODES.INVALID_ASSUMPTION_EVIDENCE,
      "evidence"
    );
    const nextSourceUpdatedAt = normalizeOptionalDateTime(
      sourceUpdatedAt,
      "sourceUpdatedAt"
    );
    const nextImpactDescription = normalizeOptionalText(
      impactDescription,
      "impactDescription"
    );

    const event = createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.REJECTED,
      occurredAt: nextRejectedAt,
      recordedAt,
      aggregateId: this.#assumptionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousStatus: this.#status,
        status: ASSUMPTION_STATUS.REJECTED,
        rejectedBy: nextRejectedBy,
        evidenceType: nextEvidenceType,
        evidence: nextEvidence,
        sourceUpdatedAt: nextSourceUpdatedAt,
        impactDescription: nextImpactDescription
      },
      metadata
    });

    this.#recordEvent(event);
    this.#status = ASSUMPTION_STATUS.REJECTED;
    this.#confidence = null;
    this.#confirmedAt = nextRejectedAt;
    this.#confirmedBy = nextRejectedBy;
    this.#evidenceType = nextEvidenceType;
    this.#evidence = nextEvidence;
    this.#sourceUpdatedAt = nextSourceUpdatedAt;
    this.#validFrom = null;
    this.#validTo = null;
    this.#impactDescription = nextImpactDescription;

    return true;
  }

  markExpired({
    expiredAt,
    reason,
    actor,
    eventId,
    recordedAt = expiredAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    assertAllowedTransition(
      this.#status,
      [ASSUMPTION_STATUS.EXPECTED, ASSUMPTION_STATUS.CONFIRMED],
      "markExpired"
    );

    const nextExpiredAt = assertDateTime(
      expiredAt,
      ERROR_CODES.INVALID_DATE_TIME,
      "expiredAt"
    );
    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_ASSUMPTION_TEXT,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.EXPIRED,
      occurredAt: nextExpiredAt,
      recordedAt,
      aggregateId: this.#assumptionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousStatus: this.#status,
        status: ASSUMPTION_STATUS.EXPIRED,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#status = ASSUMPTION_STATUS.EXPIRED;

    return true;
  }

  reopen({
    reopenedAt,
    reopenedBy,
    owner = "",
    confirmationDueDate = null,
    reason,
    actor,
    eventId,
    recordedAt = reopenedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    assertAllowedTransition(
      this.#status,
      [ASSUMPTION_STATUS.REJECTED, ASSUMPTION_STATUS.EXPIRED],
      "reopen"
    );

    const validReopenedAt = assertDateTime(
      reopenedAt,
      ERROR_CODES.INVALID_DATE_TIME,
      "reopenedAt"
    );
    const validReopenedBy = assertNonEmptyString(
      reopenedBy,
      ERROR_CODES.INVALID_ASSUMPTION_TEXT,
      "reopenedBy"
    );
    const nextOwner = normalizeOptionalText(owner, "owner");
    const nextDueDate = normalizeOptionalDate(
      confirmationDueDate,
      "confirmationDueDate"
    );
    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_ASSUMPTION_TEXT,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.REOPENED,
      occurredAt: validReopenedAt,
      recordedAt,
      aggregateId: this.#assumptionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousStatus: this.#status,
        status: ASSUMPTION_STATUS.UNKNOWN,
        reopenedBy: validReopenedBy,
        owner: nextOwner,
        confirmationDueDate: nextDueDate,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#status = ASSUMPTION_STATUS.UNKNOWN;
    this.#confidence = null;
    this.#owner = nextOwner;
    this.#confirmationDueDate = nextDueDate;
    this.#confirmedAt = null;
    this.#confirmedBy = "";
    this.#evidenceType = null;
    this.#evidence = "";
    this.#sourceUpdatedAt = null;
    this.#validFrom = null;
    this.#validTo = null;

    return true;
  }

  changeOwner({
    owner,
    confirmationDueDate = this.#confirmationDueDate,
    changedAt,
    actor,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const nextOwner = normalizeOptionalText(owner, "owner");
    const nextDueDate = normalizeOptionalDate(
      confirmationDueDate,
      "confirmationDueDate"
    );

    if (
      nextOwner === this.#owner &&
      nextDueDate === this.#confirmationDueDate
    ) {
      return false;
    }

    const event = createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.OWNER_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#assumptionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousOwner: this.#owner,
        owner: nextOwner,
        previousConfirmationDueDate: this.#confirmationDueDate,
        confirmationDueDate: nextDueDate
      },
      metadata
    });

    this.#recordEvent(event);
    this.#owner = nextOwner;
    this.#confirmationDueDate = nextDueDate;

    return true;
  }

  changeBlocking({
    blocking,
    impactLevel = this.#impactLevel,
    impactDescription = this.#impactDescription,
    changedAt,
    actor,
    reason,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const nextBlocking = assertBoolean(
      blocking,
      ERROR_CODES.INVALID_BOOLEAN,
      "blocking"
    );
    const nextImpactLevel = normalizeOptionalCode(
      impactLevel,
      ASSUMPTION_IMPACT_LEVEL,
      ERROR_CODES.INVALID_ASSUMPTION_IMPACT_LEVEL,
      "impactLevel"
    );
    const nextImpactDescription = normalizeOptionalText(
      impactDescription,
      "impactDescription"
    );

    if (
      nextBlocking === this.#blocking &&
      nextImpactLevel === this.#impactLevel &&
      nextImpactDescription === this.#impactDescription
    ) {
      return false;
    }

    const validReason = assertNonEmptyString(
      reason,
      ERROR_CODES.INVALID_ASSUMPTION_TEXT,
      "reason"
    );

    const event = createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.BLOCKING_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#assumptionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousBlocking: this.#blocking,
        blocking: nextBlocking,
        previousImpactLevel: this.#impactLevel,
        impactLevel: nextImpactLevel,
        previousImpactDescription: this.#impactDescription,
        impactDescription: nextImpactDescription,
        reason: validReason
      },
      metadata
    });

    this.#recordEvent(event);
    this.#blocking = nextBlocking;
    this.#impactLevel = nextImpactLevel;
    this.#impactDescription = nextImpactDescription;

    return true;
  }

  updateEvidence({
    evidenceType,
    evidence,
    sourceUpdatedAt = null,
    changedAt,
    actor,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const nextEvidenceType = normalizeOptionalCode(
      evidenceType,
      ASSUMPTION_EVIDENCE_TYPE,
      ERROR_CODES.INVALID_ASSUMPTION_EVIDENCE,
      "evidenceType"
    );
    const nextEvidence = normalizeOptionalText(evidence, "evidence");
    const nextSourceUpdatedAt = normalizeOptionalDateTime(
      sourceUpdatedAt,
      "sourceUpdatedAt"
    );

    if (
      this.#status === ASSUMPTION_STATUS.REJECTED &&
      nextEvidence === ""
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_ASSUMPTION_EVIDENCE,
        "REJECTED Assumption evidence must not be cleared.",
        { assumptionId: this.#assumptionId }
      );
    }

    if (
      nextEvidenceType === this.#evidenceType &&
      nextEvidence === this.#evidence &&
      nextSourceUpdatedAt === this.#sourceUpdatedAt
    ) {
      return false;
    }

    const event = createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.EVIDENCE_UPDATED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#assumptionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousEvidenceType: this.#evidenceType,
        evidenceType: nextEvidenceType,
        previousEvidence: this.#evidence,
        evidence: nextEvidence,
        previousSourceUpdatedAt: this.#sourceUpdatedAt,
        sourceUpdatedAt: nextSourceUpdatedAt
      },
      metadata
    });

    this.#recordEvent(event);
    this.#evidenceType = nextEvidenceType;
    this.#evidence = nextEvidence;
    this.#sourceUpdatedAt = nextSourceUpdatedAt;

    return true;
  }

  changeValidity({
    validFrom,
    validTo,
    changedAt,
    actor,
    eventId,
    recordedAt = changedAt,
    correlationId = null,
    causationId = null,
    metadata = {}
  } = {}) {
    const validity = assertValidityPeriod(validFrom, validTo);

    if (
      validity.validFrom === this.#validFrom &&
      validity.validTo === this.#validTo
    ) {
      return false;
    }

    const event = createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.VALIDITY_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#assumptionId,
      actor,
      correlationId,
      causationId,
      payload: {
        previousValidFrom: this.#validFrom,
        validFrom: validity.validFrom,
        previousValidTo: this.#validTo,
        validTo: validity.validTo
      },
      metadata
    });

    this.#recordEvent(event);
    this.#validFrom = validity.validFrom;
    this.#validTo = validity.validTo;

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
    const nextDescription = assertNonEmptyString(
      description,
      ERROR_CODES.INVALID_ASSUMPTION_TEXT,
      "description"
    );

    if (nextDescription === this.#description) {
      return false;
    }

    const event = createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.DESCRIPTION_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#assumptionId,
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

    if (nextNote === this.#note) {
      return false;
    }

    const event = createEvent({
      eventId,
      eventType: ASSUMPTION_EVENT_TYPE.NOTE_CHANGED,
      occurredAt: changedAt,
      recordedAt,
      aggregateId: this.#assumptionId,
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

  isEffectiveOn(date) {
    const evaluationDate = assertDate(
      date,
      ERROR_CODES.INVALID_DATE,
      "date"
    );

    if (this.#status !== ASSUMPTION_STATUS.CONFIRMED) {
      return false;
    }

    if (
      this.#validFrom !== null &&
      compareDates(evaluationDate, this.#validFrom) < 0
    ) {
      return false;
    }

    if (
      this.#validTo !== null &&
      compareDates(evaluationDate, this.#validTo) > 0
    ) {
      return false;
    }

    return true;
  }

  isConfirmationOverdue(evaluationDate) {
    const date = assertDate(
      evaluationDate,
      ERROR_CODES.INVALID_DATE,
      "evaluationDate"
    );

    if (
      ![
        ASSUMPTION_STATUS.UNKNOWN,
        ASSUMPTION_STATUS.EXPECTED
      ].includes(this.#status) ||
      this.#confirmationDueDate === null
    ) {
      return false;
    }

    return compareDates(date, this.#confirmationDueDate) > 0;
  }

  peekDomainEvents() { return this.#domainEvents.peekEvents(); }
  pullDomainEvents() { return this.#domainEvents.pullEvents(); }
  hasDomainEvents() { return this.#domainEvents.hasEvents(); }
  getDomainEventCount() { return this.#domainEvents.getEventCount(); }

  toSnapshot() {
    return Object.freeze({
      assumptionId: this.#assumptionId,
      assumptionType: this.#assumptionType,
      targetType: this.#targetType,
      targetId: this.#targetId,
      description: this.#description,
      status: this.#status,
      confidence: this.#confidence,
      owner: this.#owner,
      confirmationDueDate: this.#confirmationDueDate,
      confirmedAt: this.#confirmedAt,
      confirmedBy: this.#confirmedBy,
      evidenceType: this.#evidenceType,
      evidence: this.#evidence,
      sourceUpdatedAt: this.#sourceUpdatedAt,
      validFrom: this.#validFrom,
      validTo: this.#validTo,
      blocking: this.#blocking,
      impactLevel: this.#impactLevel,
      impactDescription: this.#impactDescription,
      note: this.#note
    });
  }

  #recordEvent(event) {
    this.#domainEvents.record(event);
  }
}

export function assertAssumption(assumption) {
  if (!(assumption instanceof Assumption)) {
    throw createDomainError(
      ERROR_CODES.INVALID_ARGUMENT,
      "assumption must be an Assumption.",
      { receivedType: typeof assumption }
    );
  }

  return assumption;
}
