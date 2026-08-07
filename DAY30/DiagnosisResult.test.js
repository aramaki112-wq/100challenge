import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSUMPTION_RESOLUTION_STATUS,
  CAPACITY_STATUS,
  DIAGNOSIS_STATUS,
  MODEL_COVERAGE_STATUS,
  OPERATION_STATUS_REASON,
  QUANTITY_UNIT,
  RESULT_VALIDITY_STATUS,
  ROUTING_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import { OperationDiagnosisResult } from "./OperationDiagnosisResult.js";
import { DiagnosisSummary } from "./DiagnosisSummary.js";
import {
  DiagnosisResult,
  assertDiagnosisResult
} from "./DiagnosisResult.js";

const DIAGNOSED_AT = "2026-08-01T20:00:00+09:00";

function operationResult({
  id = "ODR-0001",
  operationId = "POP-0001",
  status = DIAGNOSIS_STATUS.FEASIBLE,
  capacityStatus = CAPACITY_STATUS.FEASIBLE,
  executable = 60,
  reason = OPERATION_STATUS_REASON.ALL_CONDITIONS_SATISFIED
} = {}) {
  return new OperationDiagnosisResult({
    operationDiagnosisResultId: id,
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    plannedOperationId: operationId,
    orderId: `ORD-${operationId}`,
    routingOperationId: `ROP-${operationId}`,
    factoryId: "F-01",
    equipmentId: "EQ-01",
    plannedDate: "2026-08-03",
    quantityUnit: QUANTITY_UNIT.PIECE,
    plannedQuantity: 60,
    capacityExecutableQuantity: executable,
    requiredMinutes: 360,
    allocatedMinutes: capacityStatus === CAPACITY_STATUS.FEASIBLE ? 360 : 0,
    status,
    primaryReasonCode: reason,
    capacityStatus,
    assumptionStatus: ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE,
    routingStatus: ROUTING_STATUS.VALID,
    modelCoverageStatus: MODEL_COVERAGE_STATUS.MODELED,
    diagnosedAt: DIAGNOSED_AT
  });
}

function createResult(overrides = {}) {
  const results = overrides.operationResults ?? [operationResult()];
  const summary = overrides.summary ?? new DiagnosisSummary({
    diagnosisSummaryId: "DS-0001",
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    operationResults: results,
    generatedAt: DIAGNOSED_AT
  });

  return new DiagnosisResult({
    diagnosisResultId: "DR-0001",
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    capacityScenarioId: "CS-0001",
    targetMonth: "2026-08",
    operationResults: results,
    summary,
    diagnosedAt: DIAGNOSED_AT,
    capacitySnapshotGeneratedAt: "2026-08-01T19:00:00+09:00",
    capacitySourceRevision: { capacity: 3, calendar: 5 },
    diagnosisInputRevision: { plan: 7, assumption: 2, routing: 4 },
    ...overrides
  });
}

test("一回の正式な診断結果を不変Objectとして保持する", () => {
  const result = createResult();

  assert.equal(result.status, DIAGNOSIS_STATUS.FEASIBLE);
  assert.equal(result.validityStatus, RESULT_VALIDITY_STATUS.CURRENT);
  assert.equal(result.operationCount, 1);
  assert.equal(result.isCurrent(), true);
  assert.equal(Object.isFrozen(result), true);
});

test("SummaryとOperation Resultの順序・件数を一致させる", () => {
  const first = operationResult({ id: "ODR-0001", operationId: "POP-0001" });
  const second = operationResult({ id: "ODR-0002", operationId: "POP-0002" });
  const summary = new DiagnosisSummary({
    diagnosisSummaryId: "DS-0001",
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    operationResults: [second, first],
    generatedAt: DIAGNOSED_AT
  });

  assert.throws(
    () => createResult({ operationResults: [first, second], summary }),
    (error) => hasErrorCode(error, ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT)
  );
});

test("CURRENTにはStale理由を登録できない", () => {
  assert.throws(
    () => createResult({ validityReasonCodes: ["PLAN_CHANGED"] }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_RESULT_VALIDITY)
  );
});

test("STALEとINVALIDには理由が必要", () => {
  for (const validityStatus of [
    RESULT_VALIDITY_STATUS.STALE,
    RESULT_VALIDITY_STATUS.INVALID
  ]) {
    assert.throws(
      () => createResult({ validityStatus }),
      (error) => hasErrorCode(error, ERROR_CODES.INVALID_RESULT_VALIDITY)
    );
  }
});

test("withValidityは元結果を書き換えずSTALE版を返す", () => {
  const current = createResult();
  const stale = current.withValidity({
    validityStatus: RESULT_VALIDITY_STATUS.STALE,
    validityReasonCodes: ["PLAN_VERSION_CHANGED", "PLAN_VERSION_CHANGED"]
  });

  assert.equal(current.isCurrent(), true);
  assert.equal(stale.isStale(), true);
  assert.deepEqual(stale.validityReasonCodes, ["PLAN_VERSION_CHANGED"]);
  assert.equal(stale.diagnosisResultId, current.diagnosisResultId);
  assert.equal(stale.summary, current.summary);
});

test("Revisionは空Object・負数・不正Keyを拒否する", () => {
  for (const capacitySourceRevision of [
    {},
    { capacity: -1 },
    { "bad key": 1 }
  ]) {
    assert.throws(
      () => createResult({ capacitySourceRevision }),
      (error) => hasErrorCode(error, ERROR_CODES.INVALID_DIAGNOSIS_RESULT)
    );
  }
});

test("toSnapshotは内部配列とRevisionを変更不能にする", () => {
  const snapshot = createResult().toSnapshot();

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.operationResults), true);
  assert.equal(Object.isFrozen(snapshot.capacitySourceRevision), true);
  assert.throws(() => snapshot.operationResults.push({}), TypeError);
});

test("assertDiagnosisResultは異なるObjectを拒否する", () => {
  assert.throws(
    () => assertDiagnosisResult({}),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DIAGNOSIS_RESULT)
  );
});
