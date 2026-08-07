import test from "node:test";
import assert from "node:assert/strict";

import {
  PLANNED_OPERATION_CSV_HEADERS,
  PLANNED_OPERATION_REQUIRED_HEADERS,
  analyzePlannedOperationCsvHeaders,
  mapPlannedOperationCsvRecord
} from "./PlannedOperationCsvSchema.js";

import { IMPORT_ISSUE_CODE } from "./DiagnosisCodes.js";

test("Planned Operation CSVの正式Column順を公開する", () => {
  assert.deepEqual(PLANNED_OPERATION_CSV_HEADERS.slice(0, 6), [
    "plannedOperationId",
    "planVersionId",
    "orderId",
    "routingOperationId",
    "equipmentId",
    "plannedDate"
  ]);
  assert.equal(PLANNED_OPERATION_CSV_HEADERS.at(-1), "note");
  assert.equal(PLANNED_OPERATION_REQUIRED_HEADERS.includes("plannedQuantity"), true);
  assert.equal(Object.isFrozen(PLANNED_OPERATION_CSV_HEADERS), true);
});

test("正式Header一式を有効と判定する", () => {
  const result = analyzePlannedOperationCsvHeaders(
    PLANNED_OPERATION_CSV_HEADERS
  );
  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
});

test("必須Header不足・未知Header・重複Headerを分離する", () => {
  const result = analyzePlannedOperationCsvHeaders([
    "plannedOperationId",
    "plannedOperationId",
    "unknownColumn"
  ]);

  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some((issue) =>
      issue.issueCode === IMPORT_ISSUE_CODE.DUPLICATE_HEADER
    ),
    true
  );
  assert.equal(
    result.issues.some((issue) =>
      issue.issueCode === IMPORT_ISSUE_CODE.UNKNOWN_HEADER
    ),
    true
  );
  assert.equal(result.missingRequired.includes("planVersionId"), true);
});

test("HeaderとCell配列をRow Objectへ変換する", () => {
  const row = mapPlannedOperationCsvRecord(
    ["plannedOperationId", "note"],
    ["POP-0001", "test"]
  );
  assert.deepEqual(row, {
    plannedOperationId: "POP-0001",
    note: "test"
  });
  assert.equal(Object.isFrozen(row), true);
});
