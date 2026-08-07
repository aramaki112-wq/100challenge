import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTOR_TYPE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  DomainEvent,
  assertDomainEvent
} from "./DomainEvent.js";

import {
  DomainEventCollector,
  assertDomainEventCollector
} from "./DomainEventCollector.js";

function createEvent({
  eventId = "EVT-0001",
  eventType = "PLANNED_OPERATION_UPDATED",
  eventVersion = 1,
  occurredAt = "2026-08-01T17:45:00+09:00",
  recordedAt = "2026-08-01T17:45:01+09:00",
  aggregateType = "PLANNED_OPERATION",
  aggregateId = "POP-0001",
  actor = {
    type: ACTOR_TYPE.USER,
    actorId: "USER-001",
    actorName: "Planner"
  },
  correlationId = "COR-0001",
  causationId = null,
  payload = {
    changedFields: ["plannedQuantity"],
    before: { plannedQuantity: 40 },
    after: { plannedQuantity: 60 }
  },
  metadata = {
    source: "BROWSER"
  }
} = {}) {
  return new DomainEvent({
    eventId,
    eventType,
    eventVersion,
    occurredAt,
    recordedAt,
    aggregateType,
    aggregateId,
    actor,
    correlationId,
    causationId,
    payload,
    metadata
  });
}

test(
  "DomainEventは共通HeaderとPayloadを保持する",
  () => {
    const event = createEvent();

    assert.equal(event.eventId, "EVT-0001");
    assert.equal(
      event.eventType,
      "PLANNED_OPERATION_UPDATED"
    );
    assert.equal(event.eventVersion, 1);
    assert.equal(
      event.actor.type,
      ACTOR_TYPE.USER
    );
    assert.equal(
      event.payload.after.plannedQuantity,
      60
    );
  }
);

test(
  "recordedAtはoccurredAtと同時刻または後でなければならない",
  () => {
    assert.throws(
      () => createEvent({
        recordedAt:
          "2026-08-01T17:44:59+09:00"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_EVENT_TIME_ORDER
      )
    );

    assert.doesNotThrow(
      () => createEvent({
        recordedAt:
          "2026-08-01T17:45:00+09:00"
      })
    );
  }
);

test(
  "Event TypeとAggregate Typeは大文字Snake Caseに限定する",
  () => {
    assert.throws(
      () => createEvent({
        eventType: "plannedOperationUpdated"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_EVENT_TYPE
      )
    );

    assert.throws(
      () => createEvent({
        aggregateType: "PlannedOperation"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_DOMAIN_EVENT
      )
    );
  }
);

test(
  "Event Versionは1以上の整数に限定する",
  () => {
    for (const eventVersion of [0, -1, 1.5]) {
      assert.throws(
        () => createEvent({ eventVersion }),
        (error) => hasErrorCode(
          error,
          ERROR_CODES.INVALID_EVENT_VERSION
        )
      );
    }
  }
);

test(
  "Actor Typeを正式Codeに限定し未知Fieldを拒否する",
  () => {
    assert.throws(
      () => createEvent({
        actor: { type: "HUMAN" }
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_EVENT_ACTOR
      )
    );

    assert.throws(
      () => createEvent({
        actor: {
          type: ACTOR_TYPE.SYSTEM,
          hiddenAuthority: "ADMIN"
        }
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_EVENT_ACTOR
      )
    );
  }
);

test(
  "Payload・Metadata・Actorを深い階層まで変更不能にする",
  () => {
    const event = createEvent();

    assert.equal(Object.isFrozen(event), true);
    assert.equal(Object.isFrozen(event.actor), true);
    assert.equal(Object.isFrozen(event.payload), true);
    assert.equal(
      Object.isFrozen(event.payload.after),
      true
    );
    assert.equal(
      Object.isFrozen(event.payload.changedFields),
      true
    );

    assert.throws(
      () => {
        event.payload.after.plannedQuantity = 999;
      },
      TypeError
    );
  }
);

test(
  "PayloadはJSON互換値だけを許可しDate・Function・非有限数を拒否する",
  () => {
    const invalidPayloads = [
      { value: new Date() },
      { value: () => true },
      { value: Number.NaN },
      { value: Number.POSITIVE_INFINITY }
    ];

    for (const payload of invalidPayloads) {
      assert.throws(
        () => createEvent({ payload }),
        (error) => hasErrorCode(
          error,
          ERROR_CODES.INVALID_EVENT_DATA
        )
      );
    }
  }
);

test(
  "Payloadの循環参照を拒否する",
  () => {
    const payload = {};
    payload.self = payload;

    assert.throws(
      () => createEvent({ payload }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_EVENT_DATA
      )
    );
  }
);

test(
  "causationIdによる自己参照を拒否する",
  () => {
    assert.throws(
      () => createEvent({
        causationId: "EVT-0001"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.EVENT_CAUSATION_SELF_REFERENCE
      )
    );
  }
);

test(
  "toSnapshotはEvent内容をSerializableなObjectとして返す",
  () => {
    const event = createEvent();
    const snapshot = event.toSnapshot();

    assert.deepEqual(
      JSON.parse(JSON.stringify(event)),
      snapshot
    );
    assert.equal(Object.isFrozen(snapshot), true);
  }
);

test(
  "assertDomainEventはDomainEvent以外を拒否する",
  () => {
    const event = createEvent();

    assert.equal(assertDomainEvent(event), event);

    assert.throws(
      () => assertDomainEvent({
        eventId: "EVT-FAKE"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_DOMAIN_EVENT
      )
    );
  }
);

test(
  "CollectorはEventを記録しpeekでは削除しない",
  () => {
    const collector = new DomainEventCollector();
    const event = createEvent();

    collector.record(event);

    assert.equal(collector.hasEvents(), true);
    assert.equal(collector.getEventCount(), 1);
    assert.deepEqual(
      collector.peekEvents(),
      [event]
    );
    assert.equal(collector.getEventCount(), 1);
  }
);

test(
  "pullEventsは記録順を維持して返しCollectorを空にする",
  () => {
    const collector = new DomainEventCollector();
    const first = createEvent();
    const second = createEvent({
      eventId: "EVT-0002",
      eventType: "ASSUMPTION_CONFIRMED",
      aggregateType: "ASSUMPTION",
      aggregateId: "ASM-0001"
    });

    collector.recordAll([first, second]);

    assert.deepEqual(
      collector.pullEvents(),
      [first, second]
    );
    assert.equal(collector.hasEvents(), false);
    assert.equal(collector.getEventCount(), 0);
  }
);

test(
  "Collectorは同じEvent IDの二重記録を拒否する",
  () => {
    const collector = new DomainEventCollector();
    const event = createEvent();

    collector.record(event);

    assert.throws(
      () => collector.record(event),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.DUPLICATE_DOMAIN_EVENT
      )
    );
  }
);

test(
  "recordAllは重複がある場合に一件も追加しない",
  () => {
    const collector = new DomainEventCollector();
    const first = createEvent();
    const duplicate = createEvent();

    assert.throws(
      () => collector.recordAll([
        first,
        duplicate
      ]),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.DUPLICATE_DOMAIN_EVENT
      )
    );

    assert.equal(collector.getEventCount(), 0);
  }
);

test(
  "assertDomainEventCollectorは必要Methodを持つCollectorだけを許可する",
  () => {
    const collector = new DomainEventCollector();

    assert.equal(
      assertDomainEventCollector(collector),
      collector
    );

    assert.throws(
      () => assertDomainEventCollector({
        record() {}
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_DOMAIN_EVENT_COLLECTOR
      )
    );
  }
);
