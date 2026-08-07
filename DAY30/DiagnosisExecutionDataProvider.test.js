import test from "node:test";
import assert from "node:assert/strict";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  assertDiagnosisExecutionDataProvider,
  loadDiagnosisExecutionData
} from "./DiagnosisExecutionDataProvider.js";

import { createExecutionData } from "./DiagnosisApplicationTestFixture.js";

test("load(request)契約を持つProviderを受け付ける", async () => {
  const data = createExecutionData();
  const provider = { async load() { return data; } };

  assert.equal(assertDiagnosisExecutionDataProvider(provider), provider);
  assert.equal(await loadDiagnosisExecutionData(provider, {}), data);
});

test("Providerが正式Data以外を返した場合は拒否する", async () => {
  await assert.rejects(
    () => loadDiagnosisExecutionData({
      async load() { return {}; }
    }, {}),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA
    )
  );
});

test("Providerの予期しないErrorをUNEXPECTED_ERRORへ包む", async () => {
  await assert.rejects(
    () => loadDiagnosisExecutionData({
      async load() { throw new Error("network failed"); }
    }, { capacityScenarioId: "CAP-BASE" }),
    (error) => hasErrorCode(error, ERROR_CODES.UNEXPECTED_ERROR)
  );
});

test("loadを持たないObjectを拒否する", () => {
  assert.throws(
    () => assertDiagnosisExecutionDataProvider({}),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_PROVIDER
    )
  );
});
