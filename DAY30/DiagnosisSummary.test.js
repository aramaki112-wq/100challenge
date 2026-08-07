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
  OperationDiagnosisResult
} from "./OperationDiagnosisResult.js";

import {
  DiagnosisSummary,
  assertDiagnosisSummary
} from "./DiagnosisSummary.js";

function createFinding(plannedOperationId, findingId = `CF-${plannedOperationId}`) {
  return new ConstraintFinding({
    findingId,
    plannedOperationId,
    category: CONSTRAINT_CATEGORY.CAPACITY,
    reasonCode: "CAPACITY_SHORTAGE",
    severity: CONSTRAINT_SEVERITY.HIGH,
    confirmationStatus: FINDING_CONFIRMATION_STATUS.CONFIRMED,
    title: "Capacity不足",
    description: "設備時間が不足しています。",
    blocking: true,
    preventsExecution: false,
    sourceType: FINDING_SOURCE_TYPE.CAPACITY_ALLOCATION,
    sourceId: `CAL-${plannedOperationId}`,
    observedAt: "2026-08-01T12:00:00+09:00",
    requiredValue: 480,
    availableValue: 420,
    shortageValue: 60,
    unit: "MINUTE"
  });
}

function createCheck(
  plannedOperationId,
  nextCheckId = `NC-${plannedOperationId}`,
  dueDate = "2026-07-31"
) {
  return new NextCheck({
    nextCheckId,
    plannedOperationId,
    sourceType: NEXT_CHECK_SOURCE_TYPE.CONSTRAINT_FINDING,
    sourceId: `CF-${plannedOperationId}`,
    checkType: NEXT_CHECK_TYPE.CORRECT_PLAN,
    priority: NEXT_CHECK_PRIORITY.HIGH,
    status: NEXT_CHECK_STATUS.OPEN,
    title: "計画を修正する",
    description: "不足時間を解消する計画へ修正します。",
    dueDate,
    createdAt: "2026-07-30T12:00:00+09:00"
  });
}

function createResult({
  resultId,
  operationId,
  unit = QUANTITY_UNIT.PIECE,
  plannedQuantity = 60,
  capacityExecutableQuantity = plannedQuantity,
  requiredMinutes = 360,
  allocatedMinutes = requiredMinutes,
  status = DIAGNOSIS_STATUS.FEASIBLE,
  primaryReasonCode = OPERATION_STATUS_REASON.ALL_CONDITIONS_SATISFIED,
  capacityStatus = CAPACITY_STATUS.FEASIBLE,
  assumptionStatus = ASSUMPTION_RESOLUTION_STATUS.SATISFIED,
  constraintFindings = [],
  nextChecks = [],
  diagnosisScenarioId = "DGS-0001",
  planVersionId = "PV-0001"
}) {
  return new OperationDiagnosisResult({
    operationDiagnosisResultId: resultId,
    diagnosisScenarioId,
    planVersionId,
    plannedOperationId: operationId,
    orderId: `ORD-${operationId}`,
    routingOperationId: `ROP-${operationId}`,
    factoryId: "F-01",
    equipmentId: "EQ-01",
    plannedDate: "2026-08-03",
    quantityUnit: unit,
    plannedQuantity,
    capacityExecutableQuantity,
    requiredMinutes,
    allocatedMinutes,
    status,
    primaryReasonCode,
    capacityStatus,
    assumptionStatus,
    routingStatus: ROUTING_STATUS.VALID,
    modelCoverageStatus: MODEL_COVERAGE_STATUS.MODELED,
    constraintFindings,
    nextChecks,
    diagnosedAt: "2026-08-01T12:30:00+09:00"
  });
}

function createSummary(operationResults) {
  return new DiagnosisSummary({
    diagnosisSummaryId: "DS-0001",
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    operationResults,
    generatedAt: "2026-08-01T13:00:00+09:00"
  });
}

test("すべてFEASIBLEならPlan全体もFEASIBLEになる", () => {
  const summary = createSummary([
    createResult({ resultId: "ODR-0001", operationId: "POP-0001" }),
    createResult({ resultId: "ODR-0002", operationId: "POP-0002" })
  ]);

  assert.equal(summary.status, DIAGNOSIS_STATUS.FEASIBLE);
  assert.equal(summary.operationCount, 2);
  assert.equal(summary.statusCounts.FEASIBLE, 2);
  assert.equal(summary.requiresActionOperationCount, 0);
});

test("INFEASIBLEとUNKNOWNが混在しても確定不成立を弱めない", () => {
  const summary = createSummary([
    createResult({
      resultId: "ODR-0001",
      operationId: "POP-0001",
      capacityExecutableQuantity: 0,
      allocatedMinutes: 0,
      status: DIAGNOSIS_STATUS.INFEASIBLE,
      primaryReasonCode: OPERATION_STATUS_REASON.CAPACITY_INFEASIBLE,
      capacityStatus: CAPACITY_STATUS.INFEASIBLE
    }),
    createResult({
      resultId: "ODR-0002",
      operationId: "POP-0002",
      capacityExecutableQuantity: 20,
      allocatedMinutes: 120,
      status: DIAGNOSIS_STATUS.UNKNOWN,
      primaryReasonCode: OPERATION_STATUS_REASON.CAPACITY_UNKNOWN,
      capacityStatus: CAPACITY_STATUS.UNKNOWN,
      assumptionStatus: ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE
    })
  ]);

  assert.equal(summary.status, DIAGNOSIS_STATUS.INFEASIBLE);
  assert.equal(summary.hasConfirmedInfeasibleOperations, true);
  assert.equal(summary.hasUnknownOperations, true);
});

test("UNKNOWNがありINFEASIBLEがなければ全体はUNKNOWNになる", () => {
  const summary = createSummary([
    createResult({ resultId: "ODR-0001", operationId: "POP-0001" }),
    createResult({
      resultId: "ODR-0002",
      operationId: "POP-0002",
      capacityExecutableQuantity: 10,
      allocatedMinutes: 60,
      status: DIAGNOSIS_STATUS.UNKNOWN,
      primaryReasonCode: OPERATION_STATUS_REASON.CAPACITY_UNKNOWN,
      capacityStatus: CAPACITY_STATUS.UNKNOWN,
      assumptionStatus: ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE
    })
  ]);

  assert.equal(summary.status, DIAGNOSIS_STATUS.UNKNOWN);
});

test("部分成立だけが残る場合はPARTIALLY_FEASIBLEになる", () => {
  const summary = createSummary([
    createResult({
      resultId: "ODR-0001",
      operationId: "POP-0001",
      capacityExecutableQuantity: 40,
      allocatedMinutes: 240,
      status: DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE,
      primaryReasonCode: OPERATION_STATUS_REASON.CAPACITY_PARTIAL,
      capacityStatus: CAPACITY_STATUS.PARTIALLY_FEASIBLE
    })
  ]);

  assert.equal(summary.status, DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE);
});

test("数量は単位別に集計しUNKNOWN数量を0へ変換しない", () => {
  const summary = createSummary([
    createResult({
      resultId: "ODR-0001",
      operationId: "POP-0001",
      plannedQuantity: 60
    }),
    createResult({
      resultId: "ODR-0002",
      operationId: "POP-0002",
      plannedQuantity: 40,
      capacityExecutableQuantity: 20,
      allocatedMinutes: 180,
      status: DIAGNOSIS_STATUS.UNKNOWN,
      primaryReasonCode: OPERATION_STATUS_REASON.CAPACITY_UNKNOWN,
      capacityStatus: CAPACITY_STATUS.UNKNOWN,
      assumptionStatus: ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE
    }),
    createResult({
      resultId: "ODR-0003",
      operationId: "POP-0003",
      unit: QUANTITY_UNIT.KILOGRAM,
      plannedQuantity: 12.5,
      capacityExecutableQuantity: 12.5
    })
  ]);

  const pieces = summary.quantityTotalsByUnit.PIECE;
  assert.equal(pieces.plannedQuantity, 100);
  assert.equal(pieces.diagnosedExecutableQuantity, 60);
  assert.equal(pieces.unknownPlannedQuantity, 40);
  assert.equal(pieces.unknownOperationCount, 1);
  assert.equal(summary.quantityTotalsByUnit.KILOGRAM.plannedQuantity, 12.5);
});

test("既知時間と不明時間の件数を分離して集計する", () => {
  const summary = createSummary([
    createResult({ resultId: "ODR-0001", operationId: "POP-0001" }),
    createResult({
      resultId: "ODR-0002",
      operationId: "POP-0002",
      requiredMinutes: null,
      allocatedMinutes: null,
      capacityExecutableQuantity: 0,
      status: DIAGNOSIS_STATUS.UNKNOWN,
      primaryReasonCode: OPERATION_STATUS_REASON.CAPACITY_UNKNOWN,
      capacityStatus: CAPACITY_STATUS.UNKNOWN,
      assumptionStatus: ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE
    })
  ]);

  assert.equal(summary.minutesSummary.knownRequiredMinutes, 360);
  assert.equal(summary.minutesSummary.knownAllocatedMinutes, 360);
  assert.equal(summary.minutesSummary.unknownRequiredMinutesOperationCount, 1);
  assert.equal(summary.minutesSummary.unknownAllocatedMinutesOperationCount, 1);
});

test("FindingとNext Checkを集計し期限超過を判定する", () => {
  const operationId = "POP-0001";
  const summary = createSummary([
    createResult({
      resultId: "ODR-0001",
      operationId,
      constraintFindings: [createFinding(operationId)],
      nextChecks: [createCheck(operationId)]
    })
  ]);

  assert.equal(summary.findingSummary.constraintFindingCount, 1);
  assert.equal(summary.findingSummary.blockingConstraintFindingCount, 1);
  assert.equal(summary.findingSummary.constraintSeverityCounts.HIGH, 1);
  assert.equal(summary.nextCheckSummary.openNextCheckCount, 1);
  assert.equal(summary.nextCheckSummary.overdueNextCheckCount, 1);
  assert.equal(summary.hasOpenNextChecks, true);
});

test("異なるScenarioまたはPlan Versionの結果を混在させない", () => {
  assert.throws(
    () => createSummary([
      createResult({
        resultId: "ODR-0001",
        operationId: "POP-0001",
        diagnosisScenarioId: "DGS-9999"
      })
    ]),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT
    )
  );
});

test("同じOperationの診断結果を二重集計しない", () => {
  assert.throws(
    () => createSummary([
      createResult({ resultId: "ODR-0001", operationId: "POP-0001" }),
      createResult({ resultId: "ODR-0002", operationId: "POP-0001" })
    ]),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DUPLICATE_OPERATION_DIAGNOSIS_RESULT
    )
  );
});

test("空の診断結果一覧を拒否する", () => {
  assert.throws(
    () => createSummary([]),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DIAGNOSIS_SUMMARY)
  );
});

test("Snapshotは集計値とOperation結果まで変更できない", () => {
  const summary = createSummary([
    createResult({ resultId: "ODR-0001", operationId: "POP-0001" })
  ]);
  const snapshot = summary.toSnapshot();

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.statusCounts), true);
  assert.equal(Object.isFrozen(snapshot.operationResults), true);
  assert.throws(() => snapshot.operationResults.push({}));
});

test("assertDiagnosisSummaryは異なるObjectを拒否する", () => {
  const summary = createSummary([
    createResult({ resultId: "ODR-0001", operationId: "POP-0001" })
  ]);

  assert.equal(assertDiagnosisSummary(summary), summary);
  assert.throws(
    () => assertDiagnosisSummary({}),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DIAGNOSIS_SUMMARY)
  );
});
