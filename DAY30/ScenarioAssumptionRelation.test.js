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
  ScenarioAssumptionRelation,
  SCENARIO_ASSUMPTION_EVENT_TYPE,
  assertScenarioAssumptionRelation
} from "./ScenarioAssumptionRelation.js";

const AT = "2026-08-01T18:46:00+09:00";
const USER_ACTOR = Object.freeze({
  type: ACTOR_TYPE.USER,
  actorId: "USER-001",
  actorName: "Production Planner"
});

function createRelation(overrides = {}) {
  return new ScenarioAssumptionRelation({
    diagnosisScenarioId: "DGS-0001",
    assumptionId: "ASM-0001",
    active: true,
    note: "",
    ...overrides
  });
}

test("ScenarioとAssumptionのRelationを復元できる", () => {
  const relation = createRelation();
  assert.equal(relation.relationId, "DGS-0001::ASM-0001");
  assert.equal(relation.active, true);
  assert.equal(relation.hasDomainEvents(), false);
});

test("static createはATTACHED Eventを記録する", () => {
  const relation = ScenarioAssumptionRelation.create({
    diagnosisScenarioId: "DGS-0001",
    assumptionId: "ASM-0001",
    active: true,
    note: "Material arrival condition"
  }, {
    eventId: "EVT-0400",
    actor: USER_ACTOR,
    occurredAt: AT
  });

  const [event] = relation.peekDomainEvents();
  assert.equal(event.eventType, SCENARIO_ASSUMPTION_EVENT_TYPE.ATTACHED);
  assert.equal(event.aggregateId, "DGS-0001::ASM-0001");
  assert.deepEqual(event.payload, relation.toSnapshot());
});

test("新規Attachをinactive状態では作成できない", () => {
  assert.throws(
    () => ScenarioAssumptionRelation.create({
      diagnosisScenarioId: "DGS-0001",
      assumptionId: "ASM-0001",
      active: false
    }, {
      eventId: "EVT-0401",
      actor: USER_ACTOR,
      occurredAt: AT
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_SCENARIO_ASSUMPTION_RELATION)
  );
});

test("Relation IDに空欄や空白を許可しない", () => {
  const cases = [
    [{ diagnosisScenarioId: "" }, ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_ID],
    [{ diagnosisScenarioId: "DGS 1" }, ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_ID],
    [{ assumptionId: "" }, ERROR_CODES.INVALID_ASSUMPTION_ID],
    [{ assumptionId: "ASM 1" }, ERROR_CODES.INVALID_ASSUMPTION_ID]
  ];

  for (const [overrides, code] of cases) {
    assert.throws(
      () => createRelation(overrides),
      (error) => hasErrorCode(error, code)
    );
  }
});

test("Relationを理由付きでDetachできる", () => {
  const relation = createRelation();
  relation.deactivate({
    deactivatedAt: AT,
    actor: USER_ACTOR,
    reason: "Not used in this Scenario",
    eventId: "EVT-0402"
  });

  const [event] = relation.peekDomainEvents();
  assert.equal(relation.active, false);
  assert.equal(event.eventType, SCENARIO_ASSUMPTION_EVENT_TYPE.DETACHED);
  assert.equal(event.payload.reason, "Not used in this Scenario");
});

test("DetachしてもAssumption IDは失われない", () => {
  const relation = createRelation();
  relation.deactivate({
    deactivatedAt: AT,
    actor: USER_ACTOR,
    reason: "Detach only",
    eventId: "EVT-0403"
  });

  assert.equal(relation.assumptionId, "ASM-0001");
  assert.equal(relation.diagnosisScenarioId, "DGS-0001");
});

test("inactive Relationを理由付きでReattachできる", () => {
  const relation = createRelation({ active: false });
  relation.activate({
    activatedAt: AT,
    actor: USER_ACTOR,
    reason: "Required again",
    eventId: "EVT-0404"
  });

  assert.equal(relation.active, true);
  assert.equal(
    relation.peekDomainEvents()[0].eventType,
    SCENARIO_ASSUMPTION_EVENT_TYPE.REATTACHED
  );
});

test("同じactive状態への操作はNo-opになる", () => {
  const active = createRelation();
  assert.equal(active.activate({}), false);
  assert.equal(active.getDomainEventCount(), 0);

  const inactive = createRelation({ active: false });
  assert.equal(inactive.deactivate({}), false);
  assert.equal(inactive.getDomainEventCount(), 0);
});

test("実際のAttach・Detach変更には理由が必要", () => {
  const active = createRelation();
  assert.throws(
    () => active.deactivate({
      deactivatedAt: AT,
      actor: USER_ACTOR,
      reason: " ",
      eventId: "EVT-0405"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_SCENARIO_ASSUMPTION_RELATION)
  );
  assert.equal(active.active, true);

  const inactive = createRelation({ active: false });
  assert.throws(
    () => inactive.activate({
      activatedAt: AT,
      actor: USER_ACTOR,
      reason: " ",
      eventId: "EVT-0406"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_SCENARIO_ASSUMPTION_RELATION)
  );
  assert.equal(inactive.active, false);
});

test("Relation NoteをEvent付きで変更できる", () => {
  const relation = createRelation();
  relation.changeNote({
    note: "Only valid for base diagnosis",
    changedAt: AT,
    actor: USER_ACTOR,
    eventId: "EVT-0407"
  });

  assert.equal(relation.note, "Only valid for base diagnosis");
  assert.equal(
    relation.peekDomainEvents()[0].eventType,
    SCENARIO_ASSUMPTION_EVENT_TYPE.NOTE_CHANGED
  );
});

test("Event記録失敗時はRelation状態を変更しない", () => {
  const relation = ScenarioAssumptionRelation.create({
    diagnosisScenarioId: "DGS-0001",
    assumptionId: "ASM-0001",
    active: true
  }, {
    eventId: "EVT-DUP-REL",
    actor: USER_ACTOR,
    occurredAt: AT
  });

  assert.throws(
    () => relation.deactivate({
      deactivatedAt: AT,
      actor: USER_ACTOR,
      reason: "Detach",
      eventId: "EVT-DUP-REL"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.DUPLICATE_DOMAIN_EVENT)
  );

  assert.equal(relation.active, true);
});

test("Snapshotは変更できない", () => {
  const snapshot = createRelation().toSnapshot();
  assert.equal(Object.isFrozen(snapshot), true);
  assert.throws(() => { snapshot.active = false; }, TypeError);
});

test("assertScenarioAssumptionRelationは異なるObjectを拒否する", () => {
  assert.equal(
    assertScenarioAssumptionRelation(createRelation()) instanceof ScenarioAssumptionRelation,
    true
  );
  assert.throws(
    () => assertScenarioAssumptionRelation({}),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_SCENARIO_ASSUMPTION_RELATION)
  );
});
