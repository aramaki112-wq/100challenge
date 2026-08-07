import test from "node:test";
import assert from "node:assert/strict";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  DiagnosisExecutionData,
  assertDiagnosisExecutionData
} from "./DiagnosisExecutionData.js";

import {
  createCapacitySnapshot,
  createExecutionData
} from "./DiagnosisApplicationTestFixture.js";

test("DAY29 Snapshotと診断Masterを不変Dataとして保持する", () => {
  const data = createExecutionData({
    factoryIdByOperation: { "POP-0001": "F-01" },
    requiredConditionsByOperation: {
      "POP-0001": [{ conditionId: "COND-01" }]
    }
  });

  assert.equal(data.capacitySnapshot.capacityScenarioId, "CAP-BASE");
  assert.equal(data.equipments.length, 1);
  assert.deepEqual(data.externalInputRevision, {
    routing: 1,
    modelCoverage: 1
  });
  assert.throws(() => {
    data.factoryIdByOperation["POP-0001"] = "F-02";
  }, TypeError);
  assert.throws(() => {
    data.requiredConditionsByOperation["POP-0001"].push({});
  }, TypeError);
});

test("toEngineInputはProvider固有RevisionをEngine入力へ混ぜない", () => {
  const data = createExecutionData();
  const input = data.toEngineInput();

  assert.equal(input.capacitySnapshot, data.capacitySnapshot);
  assert.equal("externalInputRevision" in input, false);
  assert.equal(Object.isFrozen(input), true);
});

test("標準時間と数量精度を厳密に検証する", () => {
  assert.throws(
    () => new DiagnosisExecutionData({
      capacitySnapshot: createCapacitySnapshot(),
      standardShiftMinutes: 0
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA
    )
  );

  assert.throws(
    () => new DiagnosisExecutionData({
      capacitySnapshot: createCapacitySnapshot(),
      quantityPrecision: -1
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA
    )
  );
});

test("外部Revisionの不正Keyと負数を拒否する", () => {
  assert.throws(
    () => createExecutionData({
      externalInputRevision: { "bad-key": 1 }
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA
    )
  );

  assert.throws(
    () => createExecutionData({
      externalInputRevision: { routing: -1 }
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA
    )
  );
});

test("assertDiagnosisExecutionDataは正式Objectだけを受け付ける", () => {
  const data = createExecutionData();
  assert.equal(assertDiagnosisExecutionData(data), data);
  assert.throws(
    () => assertDiagnosisExecutionData({}),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA
    )
  );
});
