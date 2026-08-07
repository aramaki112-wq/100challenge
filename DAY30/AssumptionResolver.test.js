import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSUMPTION_CONFIDENCE,
  ASSUMPTION_EVIDENCE_TYPE,
  ASSUMPTION_IMPACT_LEVEL,
  ASSUMPTION_RESOLUTION_STATUS,
  ASSUMPTION_STATUS,
  ASSUMPTION_TARGET_TYPE,
  ASSUMPTION_TYPE,
  CAPACITY_BASELINE,
  DIAGNOSIS_SCENARIO_CATEGORY,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import { Assumption } from "./Assumption.js";
import { AssumptionResolver } from "./AssumptionResolver.js";
import { DiagnosisScenario } from "./DiagnosisScenario.js";
import { PlannedOperation } from "./PlannedOperation.js";
import { ScenarioAssumptionRelation } from "./ScenarioAssumptionRelation.js";

function createOperation(overrides = {}) {
  return new PlannedOperation({
    plannedOperationId: "POP-0001",
    planVersionId: "PV-0001",
    orderId: "ORDER-001",
    routingOperationId: "ROUTE-010",
    equipmentId: "EQ-001",
    plannedDate: "2026-08-03",
    shiftId: "S1",
    plannedStartTime: null,
    plannedEndTime: null,
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    priority: 1,
    note: "",
    ...overrides
  });
}

function createScenario(overrides = {}) {
  return new DiagnosisScenario({
    diagnosisScenarioId: "DGS-0001",
    name: "Base Diagnosis",
    planVersionId: "PV-0001",
    capacityScenarioId: "CAP-BASE",
    capacityBaseline: CAPACITY_BASELINE.AVAILABLE_CAPACITY,
    baseDiagnosisScenarioId: null,
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.BASE,
    changeSummary: "",
    description: "",
    createdBy: "USER-001",
    createdAt: "2026-08-01T20:00:00+09:00",
    active: true,
    note: "",
    ...overrides
  });
}

function createAssumption(overrides = {}) {
  return new Assumption({
    assumptionId: "ASM-0001",
    assumptionType: ASSUMPTION_TYPE.MATERIAL_ARRIVAL,
    targetType: ASSUMPTION_TARGET_TYPE.PLANNED_OPERATION,
    targetId: "POP-0001",
    description: "Material arrives before operation start.",
    status: ASSUMPTION_STATUS.UNKNOWN,
    confidence: null,
    owner: "Material Control",
    confirmationDueDate: "2026-08-02",
    confirmedAt: null,
    confirmedBy: "",
    evidenceType: null,
    evidence: "",
    sourceUpdatedAt: null,
    validFrom: null,
    validTo: null,
    blocking: true,
    impactLevel: ASSUMPTION_IMPACT_LEVEL.CRITICAL,
    impactDescription: "Operation cannot start without material.",
    note: "",
    ...overrides
  });
}

function createConfirmedAssumption(overrides = {}) {
  return createAssumption({
    status: ASSUMPTION_STATUS.CONFIRMED,
    confirmedAt: "2026-08-02T08:00:00+09:00",
    confirmedBy: "USER-002",
    evidenceType: ASSUMPTION_EVIDENCE_TYPE.SYSTEM_RECORD,
    evidence: "Confirmed arrival record.",
    sourceUpdatedAt: "2026-08-02T08:00:00+09:00",
    validFrom: "2026-08-02",
    validTo: "2026-08-05",
    ...overrides
  });
}

function createRelation(assumptionId = "ASM-0001", overrides = {}) {
  return new ScenarioAssumptionRelation({
    diagnosisScenarioId: "DGS-0001",
    assumptionId,
    active: true,
    note: "",
    ...overrides
  });
}

const resolver = new AssumptionResolver();

function resolve({
  assumptions = [],
  relations = [],
  operation = createOperation(),
  scenario = createScenario(),
  targetContext = {}
} = {}) {
  return resolver.resolve({
    plannedOperation: operation,
    diagnosisScenario: scenario,
    assumptions,
    scenarioAssumptionRelations: relations,
    targetContext
  });
}

test("接続AssumptionがなければNOT_APPLICABLEになる", () => {
  const result = resolve({
    assumptions: [createAssumption()]
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE);
  assert.deepEqual(result.applicableAssumptionIds, []);
});

test("Scenarioへ明示接続されていないAssumptionを自動採用しない", () => {
  const result = resolve({
    assumptions: [createConfirmedAssumption()]
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE);
});

test("有効期間内のCONFIRMED blocking AssumptionはSATISFIEDになる", () => {
  const result = resolve({
    assumptions: [createConfirmedAssumption()],
    relations: [createRelation()]
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.SATISFIED);
  assert.deepEqual(result.effectiveConfirmedAssumptionIds, ["ASM-0001"]);
  assert.equal(result.hasBlockingUnresolved, false);
});

test("EXPECTED blocking AssumptionはUNRESOLVEDになる", () => {
  const assumption = createAssumption({
    status: ASSUMPTION_STATUS.EXPECTED,
    confidence: ASSUMPTION_CONFIDENCE.HIGH
  });

  const result = resolve({
    assumptions: [assumption],
    relations: [createRelation()]
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED);
  assert.deepEqual(result.blockingUnresolvedAssumptionIds, ["ASM-0001"]);
});

test("REJECTED blocking AssumptionはREJECTEDになる", () => {
  const assumption = createAssumption({
    status: ASSUMPTION_STATUS.REJECTED,
    confirmedAt: "2026-08-02T08:00:00+09:00",
    confirmedBy: "USER-002",
    evidenceType: ASSUMPTION_EVIDENCE_TYPE.EXTERNAL_CONFIRMATION,
    evidence: "Supplier confirmed delay."
  });

  const result = resolve({
    assumptions: [assumption],
    relations: [createRelation()]
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.REJECTED);
  assert.deepEqual(result.blockingRejectedAssumptionIds, ["ASM-0001"]);
});

test("non-blocking REJECTEDは記録するが総合Statusを阻害しない", () => {
  const assumption = createAssumption({
    status: ASSUMPTION_STATUS.REJECTED,
    confirmedAt: "2026-08-02T08:00:00+09:00",
    confirmedBy: "USER-002",
    evidenceType: ASSUMPTION_EVIDENCE_TYPE.INTERVIEW,
    evidence: "Optional support worker unavailable.",
    blocking: false
  });

  const result = resolve({
    assumptions: [assumption],
    relations: [createRelation()]
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.SATISFIED);
  assert.deepEqual(result.rejectedAssumptionIds, ["ASM-0001"]);
  assert.deepEqual(result.blockingRejectedAssumptionIds, []);
});

test("CONFIRMEDでもOperation日が有効期間外ならUNRESOLVEDになる", () => {
  const assumption = createConfirmedAssumption({
    validFrom: "2026-08-04",
    validTo: "2026-08-05"
  });

  const result = resolve({
    assumptions: [assumption],
    relations: [createRelation()]
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED);
  assert.deepEqual(result.unresolvedAssumptionIds, ["ASM-0001"]);
});

test("同じ対象・種類にCONFIRMEDとREJECTEDがあればCONFLICTになる", () => {
  const confirmed = createConfirmedAssumption({ assumptionId: "ASM-0001" });
  const rejected = createAssumption({
    assumptionId: "ASM-0002",
    status: ASSUMPTION_STATUS.REJECTED,
    confirmedAt: "2026-08-02T09:00:00+09:00",
    confirmedBy: "USER-003",
    evidenceType: ASSUMPTION_EVIDENCE_TYPE.EMAIL,
    evidence: "Delay notice."
  });

  const result = resolve({
    assumptions: [confirmed, rejected],
    relations: [
      createRelation("ASM-0001"),
      createRelation("ASM-0002")
    ]
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.CONFLICT);
  assert.equal(result.conflicts.length, 1);
  assert.deepEqual(
    result.conflicts[0].assumptionIds,
    ["ASM-0001", "ASM-0002"]
  );
});

test("対象IDがOperationと一致しないAssumptionは適用しない", () => {
  const assumption = createConfirmedAssumption({ targetId: "POP-9999" });

  const result = resolve({
    assumptions: [assumption],
    relations: [createRelation()]
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE);
});

test("必要なFactory Contextがないblocking Assumptionを黙って無視しない", () => {
  const assumption = createConfirmedAssumption({
    targetType: ASSUMPTION_TARGET_TYPE.FACTORY,
    targetId: "F2"
  });

  const result = resolve({
    assumptions: [assumption],
    relations: [createRelation()]
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED);
  assert.deepEqual(result.contextMissingAssumptionIds, ["ASM-0001"]);
});

test("Factory Contextが一致すればFactory対象Assumptionを評価する", () => {
  const assumption = createConfirmedAssumption({
    targetType: ASSUMPTION_TARGET_TYPE.FACTORY,
    targetId: "F2"
  });

  const result = resolve({
    assumptions: [assumption],
    relations: [createRelation()],
    targetContext: { factoryId: "F2" }
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.SATISFIED);
});

test("inactive Relationは評価対象にしない", () => {
  const result = resolve({
    assumptions: [createConfirmedAssumption()],
    relations: [createRelation("ASM-0001", { active: false })]
  });

  assert.equal(result.status, ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE);
});

test("Relationが存在しAssumption本体がない場合はSource不整合にする", () => {
  assert.throws(
    () => resolve({ relations: [createRelation()] }),
    (error) => hasErrorCode(error, ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT)
  );
});

test("ScenarioとOperationのPlan Version不一致を拒否する", () => {
  assert.throws(
    () => resolve({
      scenario: createScenario({ planVersionId: "PV-0002" })
    }),
    (error) => hasErrorCode(error, ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT)
  );
});

test("重複Assumption IDをSource不整合として拒否する", () => {
  assert.throws(
    () => resolve({
      assumptions: [createAssumption(), createAssumption()]
    }),
    (error) => hasErrorCode(error, ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT)
  );
});

test("Resolver Resultを外部から変更できない", () => {
  const result = resolve({
    assumptions: [createConfirmedAssumption()],
    relations: [createRelation()]
  });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.evaluations), true);
  assert.throws(() => {
    result.effectiveConfirmedAssumptionIds.push("ASM-X");
  }, TypeError);
});
