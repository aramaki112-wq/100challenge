import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSUMPTION_CSV_HEADERS,
  analyzeAssumptionCsvHeaders
} from "./AssumptionCsvSchema.js";

test("Assumption CSV Schemaは必要Columnを定義する", () => {
  assert.equal(ASSUMPTION_CSV_HEADERS.includes("assumptionId"), true);
  assert.equal(ASSUMPTION_CSV_HEADERS.includes("blocking"), true);
  assert.equal(analyzeAssumptionCsvHeaders(ASSUMPTION_CSV_HEADERS).valid, true);
});
