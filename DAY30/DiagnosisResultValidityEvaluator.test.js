import test from "node:test";
import assert from "node:assert/strict";

import {
  RESULT_VALIDITY_STATUS,
  STALE_REASON_CODE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  DiagnosisResultValidityEvaluator,
  assertDiagnosisResultValidityEvaluation
} from "./DiagnosisResultValidityEvaluator.js";

import {
  createValidityTestDiagnosisResult,
  currentValiditySources
} from "./DiagnosisValidityTestFixture.js";

function evaluate(overrides = {}) {
  return new DiagnosisResultValidityEvaluator().evaluate({
    diagnosisResult: createValidityTestDiagnosisResult(),
    ...currentValiditySources(),
    ...overrides
  });
}

test("Sourceが同一なら元のCURRENT Resultをそのまま返す", () => {
  const diagnosisResult = createValidityTestDiagnosisResult();
  const evaluation = new DiagnosisResultValidityEvaluator().evaluate({
    diagnosisResult,
    ...currentValiditySources()
  });

  assert.equal(evaluation.evaluatedResult, diagnosisResult);
  assert.equal(evaluation.changed, false);
  assert.equal(evaluation.validityStatus, RESULT_VALIDITY_STATUS.CURRENT);
});

test("Revision変更時は元Resultを変更せずSTALE Copyを返す", () => {
  const diagnosisResult = createValidityTestDiagnosisResult();
  const evaluation = new DiagnosisResultValidityEvaluator().evaluate({
    diagnosisResult,
    ...currentValiditySources({
      currentDiagnosisInputRevision: {
        plan: 8,
        assumption: 2,
        routing: 4,
        modelCoverage: 1
      }
    })
  });

  assert.equal(diagnosisResult.validityStatus, RESULT_VALIDITY_STATUS.CURRENT);
  assert.equal(
    evaluation.evaluatedResult.validityStatus,
    RESULT_VALIDITY_STATUS.STALE
  );
  assert.deepEqual(evaluation.reasonCodes, [
    STALE_REASON_CODE.PLAN_VERSION_CHANGED
  ]);
  assert.equal(evaluation.changed, true);
  assert.equal(evaluation.requiresRediagnosis, true);
});

test("Source Identity不一致時はINVALID Copyを返す", () => {
  const evaluation = evaluate({ currentCapacityScenarioId: "CS-0002" });

  assert.equal(
    evaluation.validityStatus,
    RESULT_VALIDITY_STATUS.INVALID
  );
  assert.deepEqual(evaluation.reasonCodes, [
    STALE_REASON_CODE.CAPACITY_SCENARIO_CHANGED
  ]);
});

test("以前STALEでも現在Sourceが診断時Revisionへ一致すればCURRENTへ戻せる", () => {
  const stale = createValidityTestDiagnosisResult().withValidity({
    validityStatus: RESULT_VALIDITY_STATUS.STALE,
    validityReasonCodes: [STALE_REASON_CODE.ASSUMPTION_CHANGED]
  });

  const evaluation = new DiagnosisResultValidityEvaluator().evaluate({
    diagnosisResult: stale,
    ...currentValiditySources()
  });

  assert.equal(evaluation.previousValidityStatus, RESULT_VALIDITY_STATUS.STALE);
  assert.equal(evaluation.validityStatus, RESULT_VALIDITY_STATUS.CURRENT);
  assert.deepEqual(evaluation.reasonCodes, []);
  assert.equal(evaluation.changed, true);
});

test("同じSTALE判定を再評価した場合は同じResult Instanceを返す", () => {
  const stale = createValidityTestDiagnosisResult().withValidity({
    validityStatus: RESULT_VALIDITY_STATUS.STALE,
    validityReasonCodes: [STALE_REASON_CODE.ASSUMPTION_CHANGED]
  });

  const evaluation = new DiagnosisResultValidityEvaluator().evaluate({
    diagnosisResult: stale,
    ...currentValiditySources({
      currentDiagnosisInputRevision: {
        plan: 7,
        assumption: 3,
        routing: 4,
        modelCoverage: 1
      }
    })
  });

  assert.equal(evaluation.evaluatedResult, stale);
  assert.equal(evaluation.changed, false);
});

test("不正なDetector契約を拒否する", () => {
  assert.throws(
    () => new DiagnosisResultValidityEvaluator({ staleReasonDetector: {} }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_RESULT_VALIDITY_EVALUATION
    )
  );
});

test("EvaluationとSnapshotを外部変更できない", () => {
  const evaluation = evaluate({
    currentCapacitySourceRevision: {
      capacity: 4,
      calendar: 5,
      assignment: 2,
      capacityRule: 4
    }
  });
  const snapshot = evaluation.toSnapshot();

  assert.equal(Object.isFrozen(evaluation), true);
  assert.equal(Object.isFrozen(evaluation.changes), true);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.evaluatedResult), true);
});

test("assertDiagnosisResultValidityEvaluationは正式Objectだけを受け付ける", () => {
  const evaluation = evaluate();
  assert.equal(
    assertDiagnosisResultValidityEvaluation(evaluation),
    evaluation
  );
  assert.throws(
    () => assertDiagnosisResultValidityEvaluation({}),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_RESULT_VALIDITY_EVALUATION
    )
  );
});
