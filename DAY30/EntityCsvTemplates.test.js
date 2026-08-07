import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ASSUMPTION_CSV_HEADERS } from "./AssumptionCsvSchema.js";
import { DIAGNOSIS_SCENARIO_CSV_HEADERS } from "./DiagnosisScenarioCsvSchema.js";

async function firstLine(fileName) {
  return (await readFile(new URL(fileName, import.meta.url), "utf8"))
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)[0];
}

test("Assumption CSV TemplateのHeaderが正式Schemaと一致する", async () => {
  assert.equal(await firstLine("./assumptions-template.csv"), ASSUMPTION_CSV_HEADERS.join(","));
});

test("Diagnosis Scenario CSV TemplateのHeaderが正式Schemaと一致する", async () => {
  assert.equal(await firstLine("./diagnosis-scenarios-template.csv"), DIAGNOSIS_SCENARIO_CSV_HEADERS.join(","));
});
