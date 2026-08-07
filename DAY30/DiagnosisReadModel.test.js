import test from "node:test";
import assert from "node:assert/strict";
import { ERROR_CODES, hasErrorCode } from "./DiagnosisErrors.js";
import {
  DiagnosisReadModel,
  assertDiagnosisReadModel
} from "./DiagnosisReadModel.js";

test("DiagnosisReadModel基底Classは未実装Methodを明示的に拒否する", () => {
  const readModel = new DiagnosisReadModel();
  assert.throws(
    () => readModel.listPlanSummaries(),
    (error) => hasErrorCode(error, ERROR_CODES.READ_MODEL_INTEGRITY_ERROR)
  );
});

test("assertDiagnosisReadModelは6つのRead Methodを持つObjectを受け付ける", () => {
  const value = {
    listPlanSummaries() {},
    listScenarioSummaries() {},
    getLatestDiagnosisOverview() {},
    getDiagnosisResultDetail() {},
    listActionItems() {},
    getScenarioComparison() {}
  };
  assert.equal(assertDiagnosisReadModel(value), value);
});

test("assertDiagnosisReadModelは不足Methodを拒否する", () => {
  assert.throws(
    () => assertDiagnosisReadModel({ listPlanSummaries() {} }),
    (error) => hasErrorCode(error, ERROR_CODES.READ_MODEL_INTEGRITY_ERROR)
  );
});
