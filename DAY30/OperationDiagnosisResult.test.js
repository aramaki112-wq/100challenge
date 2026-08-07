import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSUMPTION_RESOLUTION_STATUS,
  CAPACITY_STATUS,
  CONSTRAINT_CATEGORY,
  CONSTRAINT_SEVERITY,
  DIAGNOSIS_STATUS,
  FINDING_CONFIRMATION_STATUS,
  FINDING_SOURCE_TYPE,
  MODEL_COVERAGE_STATUS,
  NEXT_CHECK_PRIORITY,
  NEXT_CHECK_SOURCE_TYPE,
  NEXT_CHECK_STATUS,
  NEXT_CHECK_TYPE,
  OPERATION_STATUS_REASON,
  QUANTITY_UNIT,
  ROUTING_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  ConstraintFinding
} from "./ConstraintFinding.js";

import {
  NextCheck
} from "./NextCheck.js";

import {
  OperationDiagnosisResult,
  assertOperationDiagnosisResult
} from "./OperationDiagnosisResult.js";

function createConstraintFinding({
  findingId = "CF-0001",
  plannedOperationId = "POP-0001"
} = {}) {
  return new ConstraintFinding({
    findingId,
    plannedOperationId,
    category: CONSTRAINT_CATEGORY.CAPACITY,
    reasonCode: "CAPACITY_SHORTAGE",
    severity: CONSTRAINT_SEVERITY.HIGH,
    confirmationStatus: FINDING_CONFIRMATION_STATUS.CONFIRMED,
    title: "設備時間不足",
    description: "必要時間に対して利用可能時間が不足しています。",
    blocking: true,
    preventsExecution: false,
    sourceType: FINDING_SOURCE_TYPE.CAPACITY_ALLOCATION,
    sourceId: "CAL-0001",
    observedAt: "2026-08-01T12:00:00+09:00",
    requiredValue: 480,
    availableValue: 420,
    shortageValue: 60,
    unit: "MINUTE"
  });
}

function createNextCheck({
  nextCheckId = "NC-0001",
  plannedOperationId = "POP-0001",
  dueDate = "2026-08-02"
} = {}) {
  return new NextCheck({
    nextCheckId,
    plannedOperationId,
    sourceType: NEXT_CHECK_SOURCE_TYPE.CONSTRAINT_FINDING,
    sourceId: "CF-0001",
    checkType: NEXT_CHECK_TYPE.CORRECT_PLAN,
    priority: NEXT_CHECK_PRIORITY.HIGH,
    status: NEXT_CHECK_STATUS.OPEN,
    title: "別Shiftを検討する",
    description: "不足60分を別Shiftへ移せるか確認します。",
    owner: "生産管理",
    dueDate,
    createdAt: "2026-08-01T12:00:00+09:00"
  });
}

function createResult(overrides = {}) {
  return new OperationDiagnosisResult({
    operationDiagnosisResultId: "ODR-0001",
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    plannedOperationId: "POP-0001",
    orderId: "ORD-0001",
    routingOperationId: "ROP-0001",
    factoryId: "F-01",
    equipmentId: "EQ-01",
    plannedDate: "2026-08-03",
    quantityUnit: QUANTITY_UNIT.PIECE,
    plannedQuantity: 60,
    capacityExecutableQuantity: 60,
    requiredMinutes: 360,
    allocatedMinutes: 360,
    status: DIAGNOSIS_STATUS.FEASIBLE,
    primaryReasonCode: OPERATION_STATUS_REASON.ALL_CONDITIONS_SATISFIED,
    capacityStatus: CAPACITY_STATUS.FEASIBLE,
    assumptionStatus: ASSUMPTION_RESOLUTION_STATUS.SATISFIED,
    routingStatus: ROUTING_STATUS.VALID,
    modelCoverageStatus: MODEL_COVERAGE_STATUS.MODELED,
    constraintFindings: [],
    assumptionFindings: [],
    nextChecks: [],
    diagnosedAt: "2026-08-01T12:30:00+09:00",
    ...overrides
  });
}

test("FEASIBLE結果は診断実行可能数量と不足量を導出する", () => {
  const result = createResult();

  assert.equal(result.diagnosedExecutableQuantity, 60);
  assert.equal(result.diagnosedShortageQuantity, 0);
  assert.equal(result.shortageMinutes, 0);
  assert.equal(result.requiresAction(), false);
});

test("PARTIALLY_FEASIBLEはCapacity上の部分数量を最終数量に採用する", () => {
  const result = createResult({
    capacityExecutableQuantity: 40,
    allocatedMinutes: 240,
    status: DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE,
    primaryReasonCode: OPERATION_STATUS_REASON.CAPACITY_PARTIAL,
    capacityStatus: CAPACITY_STATUS.PARTIALLY_FEASIBLE
  });

  assert.equal(result.diagnosedExecutableQuantity, 40);
  assert.equal(result.diagnosedShortageQuantity, 20);
  assert.equal(result.shortageMinutes, 120);
  assert.equal(result.requiresAction(), true);
});

test("最終INFEASIBLEはCapacityが足りていても実行可能数量を0とする", () => {
  const result = createResult({
    status: DIAGNOSIS_STATUS.INFEASIBLE,
    primaryReasonCode:
      OPERATION_STATUS_REASON.BLOCKING_ASSUMPTION_REJECTED,
    assumptionStatus: ASSUMPTION_RESOLUTION_STATUS.REJECTED
  });

  assert.equal(result.capacityExecutableQuantity, 60);
  assert.equal(result.diagnosedExecutableQuantity, 0);
  assert.equal(result.diagnosedShortageQuantity, 60);
});

test("UNKNOWNは実行可能数量を0へ変換しない", () => {
  const result = createResult({
    capacityExecutableQuantity: 20,
    requiredMinutes: 360,
    allocatedMinutes: 120,
    status: DIAGNOSIS_STATUS.UNKNOWN,
    primaryReasonCode:
      OPERATION_STATUS_REASON.BLOCKING_ASSUMPTION_UNRESOLVED,
    capacityStatus: CAPACITY_STATUS.UNKNOWN,
    assumptionStatus: ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED
  });

  assert.equal(result.diagnosedExecutableQuantity, null);
  assert.equal(result.diagnosedShortageQuantity, null);
  assert.equal(result.capacityExecutableQuantity, 20);
});

test("必要時間または割当時間が不明なら不足時間も不明になる", () => {
  const result = createResult({
    requiredMinutes: null,
    allocatedMinutes: null,
    capacityExecutableQuantity: 0,
    status: DIAGNOSIS_STATUS.UNKNOWN,
    primaryReasonCode: OPERATION_STATUS_REASON.CAPACITY_UNKNOWN,
    capacityStatus: CAPACITY_STATUS.UNKNOWN,
    assumptionStatus: ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE,
    routingStatus: ROUTING_STATUS.NOT_APPLICABLE
  });

  assert.equal(result.shortageMinutes, null);
});

test("StatusとPrimary Reasonの不整合を拒否する", () => {
  assert.throws(
    () => createResult({
      status: DIAGNOSIS_STATUS.FEASIBLE,
      primaryReasonCode: OPERATION_STATUS_REASON.CAPACITY_PARTIAL
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT
    )
  );
});

test("Capacity Statusと数量の不整合を拒否する", () => {
  assert.throws(
    () => createResult({
      capacityExecutableQuantity: 59,
      capacityStatus: CAPACITY_STATUS.FEASIBLE
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT
    )
  );
});

test("割当時間が必要時間を超える結果を拒否する", () => {
  assert.throws(
    () => createResult({ allocatedMinutes: 361 }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT
    )
  );
});

test("FindingとNext Checkは同じPlanned Operationだけを受け付ける", () => {
  assert.throws(
    () => createResult({
      constraintFindings: [
        createConstraintFinding({ plannedOperationId: "POP-9999" })
      ]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT
    )
  );

  assert.throws(
    () => createResult({
      nextChecks: [createNextCheck({ plannedOperationId: "POP-9999" })]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT
    )
  );
});

test("同じFinding IDの重複を拒否する", () => {
  const finding = createConstraintFinding();

  assert.throws(
    () => createResult({ constraintFindings: [finding, finding] }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT
    )
  );
});

test("Open Next CheckがあればFEASIBLEでもAction対象になる", () => {
  const result = createResult({ nextChecks: [createNextCheck()] });

  assert.equal(result.hasOpenNextChecks(), true);
  assert.equal(result.requiresAction(), true);
});

test("Snapshotは配下の配列まで変更できない", () => {
  const result = createResult({
    constraintFindings: [createConstraintFinding()],
    nextChecks: [createNextCheck()]
  });
  const snapshot = result.toSnapshot();

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.constraintFindings), true);
  assert.equal(Object.isFrozen(snapshot.nextChecks), true);
  assert.throws(() => snapshot.nextChecks.push(createNextCheck()));
});

test("assertOperationDiagnosisResultは異なるObjectを拒否する", () => {
  const result = createResult();
  assert.equal(assertOperationDiagnosisResult(result), result);

  assert.throws(
    () => assertOperationDiagnosisResult({}),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT
    )
  );
});
