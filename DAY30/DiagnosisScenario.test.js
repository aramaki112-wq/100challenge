import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTOR_TYPE,
  CAPACITY_BASELINE,
  DIAGNOSIS_SCENARIO_CATEGORY
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  DiagnosisScenario,
  DIAGNOSIS_SCENARIO_EVENT_TYPE,
  assertDiagnosisScenario
} from "./DiagnosisScenario.js";

const CREATED_AT = "2026-08-01T18:45:00+09:00";
const CHANGED_AT = "2026-08-01T18:50:00+09:00";
const USER_ACTOR = Object.freeze({
  type: ACTOR_TYPE.USER,
  actorId: "USER-001",
  actorName: "Production Planner"
});

function createBaseData(overrides = {}) {
  return {
    diagnosisScenarioId: "DGS-0001",
    name: "August Base Diagnosis",
    planVersionId: "PV-0001",
    capacityScenarioId: "CAP-SCENARIO-BASE",
    capacityBaseline: CAPACITY_BASELINE.AVAILABLE_CAPACITY,
    baseDiagnosisScenarioId: null,
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.BASE,
    changeSummary: "",
    description: "Base diagnosis using confirmed capacity.",
    createdBy: "USER-001",
    createdAt: CREATED_AT,
    active: true,
    note: "",
    ...overrides
  };
}

function createScenario(overrides = {}) {
  return new DiagnosisScenario(createBaseData(overrides));
}

test("BASE Diagnosis Scenarioを復元できる", () => {
  const scenario = createScenario();

  assert.equal(scenario.diagnosisScenarioId, "DGS-0001");
  assert.equal(scenario.planVersionId, "PV-0001");
  assert.equal(scenario.capacityScenarioId, "CAP-SCENARIO-BASE");
  assert.equal(scenario.capacityBaseline, CAPACITY_BASELINE.AVAILABLE_CAPACITY);
  assert.equal(scenario.scenarioCategory, DIAGNOSIS_SCENARIO_CATEGORY.BASE);
  assert.equal(scenario.active, true);
  assert.equal(scenario.hasDomainEvents(), false);
});

test("static createはDIAGNOSIS_SCENARIO_CREATED Eventを記録する", () => {
  const scenario = DiagnosisScenario.create(createBaseData(), {
    eventId: "EVT-0300",
    actor: USER_ACTOR,
    occurredAt: CREATED_AT,
    correlationId: "COR-0300"
  });

  const [event] = scenario.peekDomainEvents();
  assert.equal(event.eventType, DIAGNOSIS_SCENARIO_EVENT_TYPE.CREATED);
  assert.equal(event.aggregateType, "DIAGNOSIS_SCENARIO");
  assert.equal(event.aggregateId, "DGS-0001");
  assert.equal(event.correlationId, "COR-0300");
  assert.deepEqual(event.payload, scenario.toSnapshot());
});

test("ScenarioのID・名称・参照ID・Categoryを厳密に検証する", () => {
  const cases = [
    [{ diagnosisScenarioId: "" }, ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_ID],
    [{ diagnosisScenarioId: "DGS 0001" }, ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_ID],
    [{ name: "  " }, ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_NAME],
    [{ planVersionId: "" }, ERROR_CODES.INVALID_PLAN_VERSION_ID],
    [{ capacityScenarioId: "" }, ERROR_CODES.INVALID_CAPACITY_SCENARIO_ID],
    [{ scenarioCategory: "WHAT_IF" }, ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_CATEGORY]
  ];

  for (const [overrides, code] of cases) {
    assert.throws(
      () => createScenario(overrides),
      (error) => hasErrorCode(error, code)
    );
  }
});

test("DAY30初期版はAVAILABLE_CAPACITY以外のBaselineを拒否する", () => {
  assert.throws(
    () => createScenario({
      capacityBaseline: CAPACITY_BASELINE.REMAINING_AFTER_BASELINE
    }),
    (error) => hasErrorCode(error, ERROR_CODES.UNSUPPORTED_CAPACITY_BASELINE)
  );
});

test("BASE Scenarioは別のBase Scenarioを参照できない", () => {
  assert.throws(
    () => createScenario({ baseDiagnosisScenarioId: "DGS-BASE" }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_STATE)
  );
});

test("COMPARISON ScenarioにはBaseと変更概要が必要", () => {
  assert.throws(
    () => createScenario({
      scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.COMPARISON,
      changeSummary: "Overtime added"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.COMPARISON_BASE_REQUIRED)
  );

  assert.throws(
    () => createScenario({
      scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.COMPARISON,
      baseDiagnosisScenarioId: "DGS-BASE"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.CHANGE_SUMMARY_REQUIRED)
  );
});

test("COMPARISON Scenarioを正しい条件で生成できる", () => {
  const scenario = createScenario({
    diagnosisScenarioId: "DGS-0002",
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.COMPARISON,
    baseDiagnosisScenarioId: "DGS-0001",
    changeSummary: "Add two hours of overtime"
  });

  assert.equal(scenario.baseDiagnosisScenarioId, "DGS-0001");
  assert.equal(scenario.changeSummary, "Add two hours of overtime");
});

test("Base Scenarioに自分自身を指定できない", () => {
  assert.throws(
    () => createScenario({
      diagnosisScenarioId: "DGS-0002",
      scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.COMPARISON,
      baseDiagnosisScenarioId: "DGS-0002",
      changeSummary: "Change"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.BASE_SCENARIO_SELF_REFERENCE)
  );
});

test("ARCHIVED Scenarioはactive=trueで復元できない", () => {
  assert.throws(
    () => createScenario({
      scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.ARCHIVED,
      active: true
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_STATE)
  );
});

test("Scenario名称をEvent付きで変更できる", () => {
  const scenario = createScenario();
  scenario.rename({
    name: "Confirmed Capacity Base",
    changedAt: CHANGED_AT,
    actor: USER_ACTOR,
    eventId: "EVT-0301"
  });

  const [event] = scenario.peekDomainEvents();
  assert.equal(scenario.name, "Confirmed Capacity Base");
  assert.equal(event.eventType, DIAGNOSIS_SCENARIO_EVENT_TYPE.RENAMED);
  assert.equal(event.payload.previousName, "August Base Diagnosis");
});

test("同じ名称の再入力ではEventを発生させない", () => {
  const scenario = createScenario();
  assert.equal(scenario.rename({ name: scenario.name }), false);
  assert.equal(scenario.getDomainEventCount(), 0);
});

test("Plan Version変更には理由が必要", () => {
  const scenario = createScenario();

  assert.throws(
    () => scenario.changePlanVersion({
      planVersionId: "PV-0002",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      reason: " ",
      eventId: "EVT-0302"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_TEXT)
  );

  assert.equal(scenario.planVersionId, "PV-0001");
});

test("Plan Versionを理由付きで変更できる", () => {
  const scenario = createScenario();
  scenario.changePlanVersion({
    planVersionId: "PV-0002",
    changedAt: CHANGED_AT,
    actor: USER_ACTOR,
    reason: "Use revised production plan",
    eventId: "EVT-0303"
  });

  const [event] = scenario.peekDomainEvents();
  assert.equal(scenario.planVersionId, "PV-0002");
  assert.equal(event.eventType, DIAGNOSIS_SCENARIO_EVENT_TYPE.PLAN_VERSION_CHANGED);
  assert.equal(event.payload.reason, "Use revised production plan");
});

test("DAY29 Capacity Scenarioを理由付きで変更できる", () => {
  const scenario = createScenario();
  scenario.changeCapacityScenario({
    capacityScenarioId: "CAP-SCENARIO-OT",
    changedAt: CHANGED_AT,
    actor: USER_ACTOR,
    reason: "Compare overtime capacity",
    eventId: "EVT-0304"
  });

  assert.equal(scenario.capacityScenarioId, "CAP-SCENARIO-OT");
  assert.equal(
    scenario.peekDomainEvents()[0].eventType,
    DIAGNOSIS_SCENARIO_EVENT_TYPE.CAPACITY_SCENARIO_CHANGED
  );
});

test("EXPERIMENT Scenarioに比較元と変更概要を設定できる", () => {
  const scenario = createScenario({
    diagnosisScenarioId: "DGS-EXP",
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.EXPERIMENT
  });

  scenario.setBaseScenario({
    baseDiagnosisScenarioId: "DGS-0001",
    changeSummary: "Temporary equipment substitution",
    changedAt: CHANGED_AT,
    actor: USER_ACTOR,
    eventId: "EVT-0305"
  });

  assert.equal(scenario.baseDiagnosisScenarioId, "DGS-0001");
  assert.equal(scenario.changeSummary, "Temporary equipment substitution");
});

test("BASE Scenarioには後から比較元を設定できない", () => {
  const scenario = createScenario();

  assert.throws(
    () => scenario.setBaseScenario({
      baseDiagnosisScenarioId: "DGS-X",
      changeSummary: "Invalid",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0306"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_STATE)
  );
});

test("Scenarioを理由付きで停止し再開できる", () => {
  const scenario = createScenario();
  scenario.deactivate({
    deactivatedAt: CHANGED_AT,
    actor: USER_ACTOR,
    reason: "Capacity data under review",
    eventId: "EVT-0307"
  });
  assert.equal(scenario.active, false);

  scenario.activate({
    activatedAt: "2026-08-01T18:55:00+09:00",
    actor: USER_ACTOR,
    eventId: "EVT-0308"
  });
  assert.equal(scenario.active, true);
  assert.equal(scenario.getDomainEventCount(), 2);
});

test("既にactiveまたはinactiveのScenarioへ同じ操作を繰り返せない", () => {
  const activeScenario = createScenario();
  assert.throws(
    () => activeScenario.activate({
      activatedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0309"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.DIAGNOSIS_SCENARIO_ALREADY_ACTIVE)
  );

  const inactiveScenario = createScenario({ active: false });
  assert.throws(
    () => inactiveScenario.deactivate({
      deactivatedAt: CHANGED_AT,
      actor: USER_ACTOR,
      reason: "Again",
      eventId: "EVT-0310"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.DIAGNOSIS_SCENARIO_ALREADY_INACTIVE)
  );
});

test("ScenarioをArchiveするとCategoryとactiveが同時に変わる", () => {
  const scenario = createScenario();
  scenario.archive({
    archivedAt: CHANGED_AT,
    actor: USER_ACTOR,
    reason: "Historical comparison only",
    eventId: "EVT-0311"
  });

  const [event] = scenario.peekDomainEvents();
  assert.equal(scenario.scenarioCategory, DIAGNOSIS_SCENARIO_CATEGORY.ARCHIVED);
  assert.equal(scenario.active, false);
  assert.equal(event.eventType, DIAGNOSIS_SCENARIO_EVENT_TYPE.ARCHIVED);
});

test("Archived Scenarioは再開・条件変更できないが監査Noteは追加できる", () => {
  const scenario = createScenario({
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.ARCHIVED,
    active: false
  });

  assert.throws(
    () => scenario.activate({
      activatedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0312"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.DIAGNOSIS_SCENARIO_ARCHIVED)
  );

  assert.throws(
    () => scenario.changePlanVersion({
      planVersionId: "PV-0002",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      reason: "Invalid edit",
      eventId: "EVT-0313"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.DIAGNOSIS_SCENARIO_ARCHIVED)
  );

  assert.equal(scenario.changeNote({
    note: "Retained for audit",
    changedAt: CHANGED_AT,
    actor: USER_ACTOR,
    eventId: "EVT-0314"
  }), true);
});

test("Event記録失敗時はScenario状態を変更しない", () => {
  const scenario = DiagnosisScenario.create(createBaseData(), {
    eventId: "EVT-DUP",
    actor: USER_ACTOR,
    occurredAt: CREATED_AT
  });

  assert.throws(
    () => scenario.changeCapacityScenario({
      capacityScenarioId: "CAP-NEW",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      reason: "Change",
      eventId: "EVT-DUP"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.DUPLICATE_DOMAIN_EVENT)
  );

  assert.equal(scenario.capacityScenarioId, "CAP-SCENARIO-BASE");
});

test("Snapshotは変更できない", () => {
  const snapshot = createScenario().toSnapshot();
  assert.equal(Object.isFrozen(snapshot), true);
  assert.throws(() => { snapshot.name = "Changed"; }, TypeError);
});

test("assertDiagnosisScenarioは異なるObjectを拒否する", () => {
  assert.equal(assertDiagnosisScenario(createScenario()) instanceof DiagnosisScenario, true);
  assert.throws(
    () => assertDiagnosisScenario({}),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO)
  );
});
