import test from "node:test";
import assert from "node:assert/strict";
import {
  DIAGNOSIS_SCENARIO_CSV_HEADERS,
  analyzeDiagnosisScenarioCsvHeaders
} from "./DiagnosisScenarioCsvSchema.js";

test("Diagnosis Scenario CSV Schemaは必要Columnを定義する", () => {
  assert.equal(DIAGNOSIS_SCENARIO_CSV_HEADERS.includes("diagnosisScenarioId"), true);
  assert.equal(DIAGNOSIS_SCENARIO_CSV_HEADERS.includes("scenarioCategory"), true);
  assert.equal(analyzeDiagnosisScenarioCsvHeaders(DIAGNOSIS_SCENARIO_CSV_HEADERS).valid, true);
});
