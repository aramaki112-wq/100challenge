import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { parseCsv } from "./CsvParser.js";
import {
  PLANNED_OPERATION_CSV_HEADERS
} from "./PlannedOperationCsvSchema.js";

test("配布用CSV TemplateのHeaderは正式Schemaと一致する", async () => {
  const text = await readFile(
    new URL("./planned-operations-template.csv", import.meta.url),
    "utf8"
  );
  const document = parseCsv(text);
  assert.deepEqual(document.headers, PLANNED_OPERATION_CSV_HEADERS);
  assert.equal(document.records.length, 2);
});
