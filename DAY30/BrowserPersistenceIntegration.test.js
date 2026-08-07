import test from "node:test";
import assert from "node:assert/strict";
import { createBrowserDemoHarness } from "./BrowserDemoData.js";
import { buildDiagnosisDashboardHtml } from "./DiagnosisDashboardDomRenderer.js";

class FakeRoot {
  constructor() {
    this.innerHTML = "";
    this.listeners = new Map();
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  dispatch(type, target) { this.listeners.get(type)?.({ target }); }
}
class FakeDocument {
  constructor() { this.root = new FakeRoot(); }
  querySelector(selector) { return selector === "#app" ? this.root : null; }
}
class FakeStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

test("Demo BrowserからScenario–Assumption RelationをImportできる", async () => {
  const harness = createBrowserDemoHarness({ document: new FakeDocument() });
  await harness.application.start({ targetMonth: "2026-08" });

  const assumptionCsv = [
    "assumptionId,assumptionType,targetType,targetId,description,status,blocking",
    "ASM-DEMO-1,MATERIAL_ARRIVAL,PLANNED_OPERATION,POP-DEMO-1,材料到着,UNKNOWN,true"
  ].join("\n");
  await harness.application.assumptionImportController.previewCsv({
    csvText: assumptionCsv,
    fileName: "assumptions.csv",
    expectedPlanVersionId: "PV-DEMO-1"
  });
  await harness.application.assumptionImportController.commit();

  const relationCsv = [
    "diagnosisScenarioId,assumptionId,active,note",
    "DGS-DEMO-BASE,ASM-DEMO-1,true,材料到着を基準Scenarioで確認"
  ].join("\n");
  let state = await harness.application.scenarioAssumptionRelationImportController.previewCsv({
    csvText: relationCsv,
    fileName: "relations.csv",
    expectedPlanVersionId: "PV-DEMO-1"
  });
  assert.equal(state.canCommit, true);
  state = await harness.application.scenarioAssumptionRelationImportController.commit();
  assert.equal(state.screenStatus, "COMMITTED");
  assert.equal(harness.repositories.scenarioAssumptionRelations.count(), 1);
});

test("Dashboard HTMLにRelation ImportとBackup Panelを表示する", () => {
  const html = buildDiagnosisDashboardHtml({
    screenStatus: "READY",
    revision: 1,
    filters: {},
    plans: [],
    scenarios: [],
    selectedPlanVersionId: "PV-1",
    actionItems: [],
    canRunDiagnosis: false
  }, null, {
    scenarioAssumptionRelation: {
      screenStatus: "IDLE",
      revision: 0,
      message: "Relation CSVを選択してください。",
      error: null,
      preview: null,
      canCommit: false
    },
    backup: {
      screenStatus: "IDLE",
      revision: 0,
      message: "Browser保存とBackupを管理します。",
      error: null,
      backupJson: null,
      backupFileName: null,
      lastSavedAt: null,
      lastRestoredAt: null,
      hasStoredSnapshot: false
    }
  });
  assert.match(html, /Scenario–Assumption Relation CSV/);
  assert.match(html, /Browser保存とBackup/);
  assert.match(html, /Backup JSONを作成/);
});

test("診断Button経由のwrite後にBrowserへ自動保存する", async () => {
  const storage = new FakeStorage();
  const document = new FakeDocument();
  const harness = createBrowserDemoHarness({ document, storage });
  await harness.application.start({ targetMonth: "2026-08" });

  document.root.dispatch("click", { dataset: { action: "run-diagnosis" } });
  await harness.application.renderer.whenIdle();

  assert.equal(harness.repositories.diagnosisResults.count(), 1);
  assert.equal(harness.application.backupController.getState().hasStoredSnapshot, true);
  assert.equal(storage.map.size, 1);
});

test("Browserを再起動したHarnessが保存済みDiagnosis Resultを復元する", async () => {
  const storage = new FakeStorage();
  const first = createBrowserDemoHarness({
    document: new FakeDocument(),
    storage
  });
  await first.application.start({ targetMonth: "2026-08" });
  await first.application.controller.runDiagnosis();
  first.application.backupController.saveNow();
  assert.equal(first.repositories.diagnosisResults.count(), 1);

  const second = createBrowserDemoHarness({
    document: new FakeDocument(),
    storage
  });
  const state = await second.application.start({ targetMonth: "2026-08" });
  assert.equal(second.repositories.diagnosisResults.count(), 1);
  assert.notEqual(state.selectedDiagnosisResultId, null);
  assert.equal(second.application.backupController.getState().screenStatus, "RESTORED");
});

test("Backup JSON復元後にDashboardを再読込できる", async () => {
  const storage = new FakeStorage();
  const source = createBrowserDemoHarness({ document: new FakeDocument(), storage });
  await source.application.start({ targetMonth: "2026-08" });
  await source.application.controller.runDiagnosis();
  const backupState = source.application.backupController.createBackup();

  const target = createBrowserDemoHarness({ document: new FakeDocument(), storage: new FakeStorage() });
  await target.application.start({ targetMonth: "2026-08" });
  const restored = target.application.backupController.restoreBackup({
    jsonText: backupState.backupJson,
    fileName: backupState.backupFileName
  });
  const state = await target.application.controller.refresh();
  assert.equal(restored.screenStatus, "RESTORED");
  assert.equal(target.repositories.diagnosisResults.count(), 1);
  assert.notEqual(state.selectedDiagnosisResultId, null);
});
