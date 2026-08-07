import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import * as diagnosisCodes from "./DiagnosisCodes.js";
import { ERROR_CODES } from "./DiagnosisErrors.js";
import { PRODUCTION_PLAN_EVENT_TYPE } from "./ProductionPlan.js";
import { PLAN_VERSION_EVENT_TYPE } from "./ProductionPlanVersion.js";
import { PLANNED_OPERATION_EVENT_TYPE } from "./PlannedOperation.js";
import { ASSUMPTION_EVENT_TYPE } from "./Assumption.js";
import { DIAGNOSIS_SCENARIO_EVENT_TYPE } from "./DiagnosisScenario.js";
import { SCENARIO_ASSUMPTION_EVENT_TYPE } from "./ScenarioAssumptionRelation.js";

const root = process.cwd();

const formalManuals = [
  "DAY30_日本語クイックスタート_正式版.docx",
  "DAY30_日本語詳細ユーザーマニュアル_正式版.docx",
  "DAY30_Error・Troubleshooting手順書_正式版.docx"
];

const formalExcel = [
  "DAY30_運用チェック・再診断記録.xlsx",
  "DAY30_外部診断Data入力Template.xlsx"
];

const catalogs = [
  "DAY30_Status_Code_Catalog.md",
  "DAY30_Error_Catalog.md",
  "DAY30_Domain_Catalog.md",
  "DAY30_Domain_Event_Catalog.md",
  "DAY30_CATALOG_INDEX.md"
];

test("日本語Word正式版3冊が存在し空ではない", async () => {
  for (const name of formalManuals) {
    const info = await stat(path.join(root, name));
    assert.ok(info.size > 20_000, `${name} should be a rendered formal manual`);
  }
});

test("Excel運用Workbookと外部Data入力Templateが存在する", async () => {
  for (const name of formalExcel) {
    const info = await stat(path.join(root, name));
    assert.ok(info.size > 20_000, `${name} should be a valid workbook`);
  }
});

test("正式Catalog5点が存在し空ではない", async () => {
  for (const name of catalogs) {
    const info = await stat(path.join(root, name));
    assert.ok(info.size > 300, `${name} should contain formal catalog content`);
  }
});

test("Status CatalogはDiagnosisCodesの全Codeを含む", async () => {
  const text = await readFile(path.join(root, "DAY30_Status_Code_Catalog.md"), "utf8");
  for (const [name, value] of Object.entries(diagnosisCodes)) {
    if (name === "CODE_CATALOG" || typeof value !== "object" || value === null || Array.isArray(value)) continue;
    const values = Object.values(value);
    if (!values.length || !values.every((item) => typeof item === "string")) continue;
    for (const code of values) assert.match(text, new RegExp(`\\b${code}\\b`), `${name}.${code}`);
  }
});

test("Error CatalogはDiagnosisErrorsの全Error Codeを含む", async () => {
  const text = await readFile(path.join(root, "DAY30_Error_Catalog.md"), "utf8");
  for (const code of Object.values(ERROR_CODES)) {
    assert.match(text, new RegExp(`\\b${code}\\b`), code);
  }
});

test("Domain Event Catalogは全Aggregate Eventを含む", async () => {
  const text = await readFile(path.join(root, "DAY30_Domain_Event_Catalog.md"), "utf8");
  const groups = [
    PRODUCTION_PLAN_EVENT_TYPE,
    PLAN_VERSION_EVENT_TYPE,
    PLANNED_OPERATION_EVENT_TYPE,
    ASSUMPTION_EVENT_TYPE,
    DIAGNOSIS_SCENARIO_EVENT_TYPE,
    SCENARIO_ASSUMPTION_EVENT_TYPE
  ];
  for (const group of groups) {
    for (const eventType of Object.values(group)) {
      assert.match(text, new RegExp(`\\b${eventType}\\b`), eventType);
    }
  }
});

test("Domain Catalogは主要責任境界を含む", async () => {
  const text = await readFile(path.join(root, "DAY30_Domain_Catalog.md"), "utf8");
  for (const name of [
    "ProductionPlan",
    "PlannedOperation",
    "Assumption",
    "CapacityLedger",
    "PlanDiagnosisEngine",
    "RunPlanDiagnosis",
    "DiagnosisBrowserController"
  ]) {
    assert.match(text, new RegExp(`\\b${name}\\b`), name);
  }
});

test("Manual Indexは正式版Manual・Excel・Catalogを案内する", async () => {
  const text = await readFile(path.join(root, "DAY30_MANUAL_INDEX.md"), "utf8");
  for (const name of [...formalManuals, ...formalExcel, ...catalogs]) {
    assert.match(text, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), name);
  }
});
