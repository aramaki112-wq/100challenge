import {
  ACTOR_TYPE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertCodeValue,
  assertNonEmptyString,
  assertPlainObject,
  assertPositiveInteger,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDateTime,
  compareDateTimes
} from "./DateTimeUtils.js";

const EVENT_TYPE_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const AGGREGATE_TYPE_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const IDENTIFIER_PATTERN = /^\S+$/;

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

function assertOptionalIdentifier(
  value,
  code,
  label
) {
  if (value === null || value === undefined) {
    return null;
  }

  return assertIdentifier(value, code, label);
}

function assertUpperSnakeCase(
  value,
  pattern,
  code,
  label
) {
  const text = assertNonEmptyString(
    value,
    code,
    label
  );

  if (!pattern.test(text)) {
    throw createDomainError(
      code,
      `${label} must use uppercase snake case.`,
      { value, label }
    );
  }

  return text;
}

function createImmutableJsonValue(
  value,
  label,
  ancestors = new WeakSet()
) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw createDomainError(
        ERROR_CODES.INVALID_EVENT_DATA,
        `${label} contains a non-finite number.`,
        { label, value }
      );
    }

    return value;
  }

  if (
    typeof value !== "object" ||
    value instanceof Date
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_EVENT_DATA,
      `${label} must contain JSON-compatible values only.`,
      {
        label,
        valueType: typeof value
      }
    );
  }

  if (ancestors.has(value)) {
    throw createDomainError(
      ERROR_CODES.INVALID_EVENT_DATA,
      `${label} must not contain circular references.`,
      { label }
    );
  }

  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      return Object.freeze(
        value.map((item, index) =>
          createImmutableJsonValue(
            item,
            `${label}[${index}]`,
            ancestors
          )
        )
      );
    }

    assertPlainObject(
      value,
      ERROR_CODES.INVALID_EVENT_DATA,
      label
    );

    const copy = {};

    for (const [key, item] of Object.entries(value)) {
      copy[key] = createImmutableJsonValue(
        item,
        `${label}.${key}`,
        ancestors
      );
    }

    return Object.freeze(copy);
  } finally {
    ancestors.delete(value);
  }
}

function normalizeActor(actor) {
  const source = assertPlainObject(
    actor,
    ERROR_CODES.INVALID_EVENT_ACTOR,
    "actor"
  );

  const type = assertCodeValue(
    source.type,
    ACTOR_TYPE,
    ERROR_CODES.INVALID_EVENT_ACTOR,
    "actor.type"
  );

  const actorId = assertOptionalIdentifier(
    source.actorId,
    ERROR_CODES.INVALID_EVENT_ACTOR,
    "actor.actorId"
  );

  const actorName =
    source.actorName === null ||
    source.actorName === undefined
      ? null
      : assertNonEmptyString(
          source.actorName,
          ERROR_CODES.INVALID_EVENT_ACTOR,
          "actor.actorName"
        );

  const unknownKeys = Object.keys(source)
    .filter((key) =>
      !["type", "actorId", "actorName"].includes(key)
    );

  if (unknownKeys.length > 0) {
    throw createDomainError(
      ERROR_CODES.INVALID_EVENT_ACTOR,
      "actor contains unsupported fields.",
      { unknownKeys }
    );
  }

  return Object.freeze({
    type,
    actorId,
    actorName
  });
}

/**
 * A serializable, immutable record of a completed Domain change.
 *
 * DomainEvent describes what already happened. It is not a command and
 * must not contain mutable Entity references, Date objects, or functions.
 */
export class DomainEvent {
  constructor({
    eventId,
    eventType,
    eventVersion = 1,
    occurredAt,
    recordedAt = occurredAt,
    aggregateType,
    aggregateId,
    actor,
    correlationId = null,
    causationId = null,
    payload = {},
    metadata = {}
  } = {}) {
    this.eventId = assertIdentifier(
      eventId,
      ERROR_CODES.INVALID_EVENT_ID,
      "eventId"
    );

    this.eventType = assertUpperSnakeCase(
      eventType,
      EVENT_TYPE_PATTERN,
      ERROR_CODES.INVALID_EVENT_TYPE,
      "eventType"
    );

    this.eventVersion = assertPositiveInteger(
      eventVersion,
      ERROR_CODES.INVALID_EVENT_VERSION,
      "eventVersion"
    );

    this.occurredAt = assertDateTime(
      occurredAt,
      ERROR_CODES.INVALID_DATE_TIME,
      "occurredAt"
    );

    this.recordedAt = assertDateTime(
      recordedAt,
      ERROR_CODES.INVALID_DATE_TIME,
      "recordedAt"
    );

    if (
      compareDateTimes(
        this.recordedAt,
        this.occurredAt
      ) < 0
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_EVENT_TIME_ORDER,
        "recordedAt must not be earlier than occurredAt.",
        {
          occurredAt: this.occurredAt,
          recordedAt: this.recordedAt
        }
      );
    }

    this.aggregateType = assertUpperSnakeCase(
      aggregateType,
      AGGREGATE_TYPE_PATTERN,
      ERROR_CODES.INVALID_DOMAIN_EVENT,
      "aggregateType"
    );

    this.aggregateId = assertIdentifier(
      aggregateId,
      ERROR_CODES.INVALID_DOMAIN_EVENT,
      "aggregateId"
    );

    this.actor = normalizeActor(actor);

    this.correlationId = assertOptionalIdentifier(
      correlationId,
      ERROR_CODES.INVALID_DOMAIN_EVENT,
      "correlationId"
    );

    this.causationId = assertOptionalIdentifier(
      causationId,
      ERROR_CODES.INVALID_DOMAIN_EVENT,
      "causationId"
    );

    if (this.causationId === this.eventId) {
      throw createDomainError(
        ERROR_CODES.EVENT_CAUSATION_SELF_REFERENCE,
        "causationId must not reference the event itself.",
        {
          eventId: this.eventId,
          causationId: this.causationId
        }
      );
    }

    this.payload = createImmutableJsonValue(
      payload,
      "payload"
    );

    this.metadata = createImmutableJsonValue(
      metadata,
      "metadata"
    );

    Object.freeze(this);
  }

  toSnapshot() {
    return Object.freeze({
      eventId: this.eventId,
      eventType: this.eventType,
      eventVersion: this.eventVersion,
      occurredAt: this.occurredAt,
      recordedAt: this.recordedAt,
      aggregateType: this.aggregateType,
      aggregateId: this.aggregateId,
      actor: this.actor,
      correlationId: this.correlationId,
      causationId: this.causationId,
      payload: this.payload,
      metadata: this.metadata
    });
  }

  toJSON() {
    return this.toSnapshot();
  }
}

/**
 * @param {unknown} event
 * @returns {DomainEvent}
 */
export function assertDomainEvent(event) {
  if (!(event instanceof DomainEvent)) {
    throw createDomainError(
      ERROR_CODES.INVALID_DOMAIN_EVENT,
      "event must be a DomainEvent.",
      { receivedType: typeof event }
    );
  }

  return event;
}
