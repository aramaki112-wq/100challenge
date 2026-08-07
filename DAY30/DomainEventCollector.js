import {
  ERROR_CODES,
  assertArray,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDomainEvent
} from "./DomainEvent.js";

/**
 * Stores unpublished Domain Events inside an Entity or Aggregate boundary.
 *
 * Pulling events empties the collector so the same event is not published
 * twice after a successful Repository transaction.
 */
export class DomainEventCollector {
  #events = [];
  #eventIds = new Set();

  constructor(initialEvents = []) {
    this.recordAll(initialEvents);
  }

  record(event) {
    const validEvent = assertDomainEvent(event);

    if (this.#eventIds.has(validEvent.eventId)) {
      throw createDomainError(
        ERROR_CODES.DUPLICATE_DOMAIN_EVENT,
        "The same Domain Event cannot be recorded twice.",
        { eventId: validEvent.eventId }
      );
    }

    this.#events.push(validEvent);
    this.#eventIds.add(validEvent.eventId);

    return validEvent;
  }

  recordAll(events) {
    const validEvents = assertArray(
      events,
      ERROR_CODES.INVALID_DOMAIN_EVENT_COLLECTOR,
      "events"
    ).map(assertDomainEvent);

    const incomingIds = new Set();

    for (const event of validEvents) {
      if (
        this.#eventIds.has(event.eventId) ||
        incomingIds.has(event.eventId)
      ) {
        throw createDomainError(
          ERROR_CODES.DUPLICATE_DOMAIN_EVENT,
          "The same Domain Event cannot be recorded twice.",
          { eventId: event.eventId }
        );
      }

      incomingIds.add(event.eventId);
    }

    for (const event of validEvents) {
      this.#events.push(event);
      this.#eventIds.add(event.eventId);
    }

    return Object.freeze([...validEvents]);
  }

  peekEvents() {
    return Object.freeze([...this.#events]);
  }

  pullEvents() {
    const events = Object.freeze([...this.#events]);

    this.#events = [];
    this.#eventIds.clear();

    return events;
  }

  clearEvents() {
    this.#events = [];
    this.#eventIds.clear();
  }

  hasEvents() {
    return this.#events.length > 0;
  }

  getEventCount() {
    return this.#events.length;
  }
}

/**
 * Validate the Domain Event Collector Port used by an Entity/Aggregate.
 *
 * @param {unknown} collector
 * @returns {object}
 */
export function assertDomainEventCollector(collector) {
  const requiredMethods = [
    "record",
    "recordAll",
    "peekEvents",
    "pullEvents",
    "clearEvents",
    "hasEvents",
    "getEventCount"
  ];

  const valid =
    collector !== null &&
    typeof collector === "object" &&
    requiredMethods.every(
      (method) => typeof collector[method] === "function"
    );

  if (!valid) {
    throw createDomainError(
      ERROR_CODES.INVALID_DOMAIN_EVENT_COLLECTOR,
      "collector must implement the Domain Event Collector contract.",
      { requiredMethods }
    );
  }

  return collector;
}
