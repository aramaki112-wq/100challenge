import test from "node:test";
import assert from "node:assert/strict";

import {
  CAPACITY_RATE_BASIS,
  CAPACITY_RESOURCE_STATUS,
  CAPACITY_RULE_SOURCE,
  DATA_CONFIDENCE,
  DIAGNOSIS_STATUS,
  EQUIPMENT_AVAILABILITY_STATUS,
  QUANTITY_UNIT,
  RESULT_VALIDITY_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import { SequentialIdGenerator } from "./SequentialIdGenerator.js";
import { DiagnosisScenario } from "./DiagnosisScenario.js";
import { PlannedOperation } from "./PlannedOperation.js";
import { CapacityBucket } from "./CapacityBucket.js";
import { CapacitySnapshot } from "./CapacitySnapshot.js";
import { PlanDiagnosisEngine } from "./PlanDiagnosisEngine.js";

const DIAGNOSED_AT = "2026-08-01T21:00:00+09:00";

function scenario(overrides = {}) {
  return new DiagnosisScenario({
    diagnosisScenarioId: "DGS-0001",
    name: "基準診断",
    planVersionId: "PV-0001",
    capacityScenarioId: "CAP-BASE",
    createdAt: "2026-08-01T19:30:00+09:00",
    active: true,
    ...overrides
  });
}

function operation(id = "POP-0001", overrides = {}) {
  return new PlannedOperation({
    plannedOperationId: id,
    planVersionId: "PV-0001",
    orderId: `ORD-${id}`,
    routingOperationId: `ROP-${id}`,
    equipmentId: "EQ-01",
    plannedDate: "2026-08-03",
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    ...overrides
  });
}

function bucket(overrides = {}) {
  return new CapacityBucket({
    factoryId: "F-01",
    equipmentId: "EQ-01",
    date: "2026-08-03",
    shiftId: null,
    availableMinutes: 420,
    availabilityStatus: EQUIPMENT_AVAILABILITY_STATUS.AVAILABLE,
    workerStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    skillStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    assignmentStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    reasonCodes: [],
    dataConfidence: DATA_CONFIDENCE.A,
    ...overrides
  });
}

function snapshot(overrides = {}) {
  return new CapacitySnapshot({
    capacityScenarioId: "CAP-BASE",
    targetMonth: "2026-08",
    generatedAt: "2026-08-01T20:00:00+09:00",
    sourceRevision: { capacity: 3, calendar: 4 },
    buckets: [bucket()],
    ...overrides
  });
}

function capacityRule(overrides = {}) {
  return {
    capacityRuleId: "CR-001",
    equipmentId: "EQ-01",
    source: CAPACITY_RULE_SOURCE.DEFAULT_RULE,
    active: true,
    priority: 100,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    capacityValue: 10,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityBasis: CAPACITY_RATE_BASIS.HOUR,
    capacityMultiplier: 1,
    ...overrides
  };
}

function diagnose(overrides = {}, generator = new SequentialIdGenerator()) {
  const engine = new PlanDiagnosisEngine({ idGenerator: generator });
  const operations = overrides.plannedOperations ?? [operation()];
  const routingOperations = operations.map((value, index) => ({
    routingOperationId: value.routingOperationId,
    routingId: `ROUTING-${value.orderId}`,
    sequence: index + 1
  }));

  return engine.diagnose({
    diagnosisScenario: scenario(),
    capacitySnapshot: snapshot(),
    plannedOperations: operations,
    productionPlanId: "PLAN-0001",
    defaultFactoryId: "F-01",
    equipments: [{ equipmentId: "EQ-01" }],
    orders: operations.map((value) => ({ orderId: value.orderId })),
    routingOperations,
    capacityRules: [capacityRule()],
    diagnosisInputRevision: { plan: 2, assumption: 1, routing: 1 },
    diagnosedAt: DIAGNOSED_AT,
    ...overrides
  });
}

test("各Serviceを接続してCURRENTのDiagnosis Resultを生成する", () => {
  const result = diagnose();

  assert.equal(result.diagnosisResultId, "DR-0001");
  assert.equal(result.summary.diagnosisSummaryId, "DS-0001");
  assert.equal(result.operationResults[0].operationDiagnosisResultId, "ODR-0001");
  assert.equal(result.status, DIAGNOSIS_STATUS.FEASIBLE);
  assert.equal(result.validityStatus, RESULT_VALIDITY_STATUS.CURRENT);
  assert.equal(result.operationResults[0].requiredMinutes, 360);
  assert.equal(result.operationResults[0].allocatedMinutes, 360);
  assert.equal(result.operationResults[0].capacityExecutableQuantity, 60);
});

test("同じCapacityを複数Operationへ二重使用しない", () => {
  const first = operation("POP-0001", { priority: 1 });
  const second = operation("POP-0002", { priority: 2 });
  const result = diagnose({ plannedOperations: [second, first] });

  const byId = new Map(result.operationResults.map((value) => [
    value.plannedOperationId,
    value
  ]));

  assert.equal(byId.get("POP-0001").allocatedMinutes, 360);
  assert.equal(byId.get("POP-0002").allocatedMinutes, 60);
  assert.equal(
    byId.get("POP-0002").status,
    DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE
  );
  assert.equal(result.status, DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE);
});

test("入力配列順が変わってもOperation診断順と結果は変わらない", () => {
  const a = operation("POP-A", { priority: 1 });
  const b = operation("POP-B", { priority: 2 });

  const first = diagnose({ plannedOperations: [a, b] });
  const second = diagnose(
    { plannedOperations: [b, a] },
    new SequentialIdGenerator()
  );

  assert.deepEqual(
    first.operationResults.map((value) => ({
      id: value.plannedOperationId,
      allocated: value.allocatedMinutes,
      status: value.status
    })),
    second.operationResults.map((value) => ({
      id: value.plannedOperationId,
      allocated: value.allocatedMinutes,
      status: value.status
    }))
  );
});

test("Capacity Ruleなしを能力0とせずUNKNOWNにする", () => {
  const result = diagnose({ capacityRules: [] });
  const operationResult = result.operationResults[0];

  assert.equal(operationResult.status, DIAGNOSIS_STATUS.UNKNOWN);
  assert.equal(operationResult.requiredMinutes, null);
  assert.equal(operationResult.allocatedMinutes, null);
  assert.equal(operationResult.capacityExecutableQuantity, 0);
});

test("Capacity Snapshot Revisionと診断Input Revisionを保存する", () => {
  const result = diagnose({
    diagnosisInputRevision: { plan: 8, assumption: 5, routing: 3 }
  });

  assert.deepEqual(result.capacitySourceRevision, {
    capacity: 3,
    calendar: 4
  });
  assert.deepEqual(result.diagnosisInputRevision, {
    plan: 8,
    assumption: 5,
    routing: 3
  });
});

test("ScenarioとCapacity SnapshotのScenario不一致を拒否する", () => {
  assert.throws(
    () => diagnose({
      capacitySnapshot: snapshot({ capacityScenarioId: "CAP-OTHER" })
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT
    )
  );
});

test("Plan Versionが異なるOperationを拒否する", () => {
  assert.throws(
    () => diagnose({
      plannedOperations: [operation("POP-X", { planVersionId: "PV-OTHER" })]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT
    )
  );
});

test("Equipment Master不足を推測で補わない", () => {
  assert.throws(
    () => diagnose({ equipments: [] }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT
    )
  );
});

test("診断してもPlannedOperationを変更しない", () => {
  const plannedOperation = operation();
  const before = plannedOperation.toSnapshot();

  diagnose({ plannedOperations: [plannedOperation] });

  assert.deepEqual(plannedOperation.toSnapshot(), before);
  assert.equal(plannedOperation.hasDomainEvents(), false);
});

test("不正なService契約をConstructorで拒否する", () => {
  assert.throws(
    () => new PlanDiagnosisEngine({
      idGenerator: new SequentialIdGenerator(),
      operationSortService: {}
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DIAGNOSIS_ENGINE)
  );
});
