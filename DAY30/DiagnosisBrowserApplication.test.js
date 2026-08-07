import test from "node:test";
import assert from "node:assert/strict";

import { createBrowserDemoHarness } from "./BrowserDemoData.js";

class FakeRoot {
  constructor() {
    this.innerHTML = "";
    this.listeners = new Map();
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
}
class FakeDocument {
  constructor() { this.root = new FakeRoot(); }
  querySelector(selector) { return selector === "#app" ? this.root : null; }
}

test("Demo Browser Applicationは未診断状態から開始できる", async () => {
  const document = new FakeDocument();
  const harness = createBrowserDemoHarness({ document });
  const state = await harness.application.start({ targetMonth: "2026-08" });

  assert.equal(state.selectedPlanId, "PLAN-DEMO");
  assert.equal(state.selectedScenarioId, "DGS-DEMO-BASE");
  assert.equal(state.selectedDiagnosisResultId, null);
  assert.equal(state.canRunDiagnosis, true);
  assert.match(document.root.innerHTML, /まだ診断されていません/);
});

test("Demo診断を実行するとCapacity競合を一部実行可能として表示する", async () => {
  const document = new FakeDocument();
  const harness = createBrowserDemoHarness({ document });
  await harness.application.start({ targetMonth: "2026-08" });
  const state = await harness.application.controller.runDiagnosis();
  harness.application.renderer.render(state);

  assert.equal(state.diagnosisBadge.label, "一部実行可能");
  assert.equal(state.detail.operationResults.length, 2);
  assert.equal(state.detail.summary.statusCounts.PARTIALLY_FEASIBLE, 1);
  assert.equal(state.detail.summary.minutesSummary.knownShortageMinutes, 120);
  assert.match(document.root.innerHTML, /一部実行可能/);
  assert.match(document.root.innerHTML, /POP-DEMO-2/);
});

test("Demoを再診断しても新しいResultとして保存できる", async () => {
  const document = new FakeDocument();
  const harness = createBrowserDemoHarness({ document });
  await harness.application.start({ targetMonth: "2026-08" });
  await harness.application.controller.runDiagnosis();
  await harness.application.controller.runDiagnosis();

  assert.equal(harness.repositories.diagnosisResults.count(), 2);
  assert.equal(harness.application.controller.getState().selectedDiagnosisResultId, "DR-0002");
});

test("Demo BrowserからCSV PreviewとCommitを実行できる", async () => {
  const document = new FakeDocument();
  const harness = createBrowserDemoHarness({ document });
  await harness.application.start({ targetMonth: "2026-08" });
  const csvText = [
    "plannedOperationId,planVersionId,orderId,routingOperationId,equipmentId,plannedDate,plannedQuantity,quantityUnit",
    "POP-DEMO-3,PV-DEMO-1,ORD-1003,ROP-1003,EQ-01,2026-08-03,10,PIECE"
  ].join("\n");

  let importState = await harness.application.importController.previewCsv({
    csvText,
    fileName: "demo-import.csv",
    expectedPlanVersionId: "PV-DEMO-1"
  });
  assert.equal(importState.canCommit, true);
  assert.equal(importState.preview.counts.add, 1);

  importState = await harness.application.importController.commit();
  assert.equal(importState.screenStatus, "COMMITTED");
  assert.equal(harness.repositories.plannedOperations.count(), 3);
});

test("Demo BrowserからAssumption CSV PreviewとCommitを実行できる", async () => {
  const document = new FakeDocument();
  const harness = createBrowserDemoHarness({ document });
  await harness.application.start({ targetMonth: "2026-08" });
  const csvText = [
    "assumptionId,assumptionType,targetType,targetId,description,status,blocking",
    "ASM-DEMO-1,MATERIAL_ARRIVAL,PLANNED_OPERATION,POP-DEMO-1,材料到着,UNKNOWN,true"
  ].join("\n");

  let state = await harness.application.assumptionImportController.previewCsv({
    csvText,
    fileName: "assumptions.csv",
    expectedPlanVersionId: "PV-DEMO-1"
  });
  assert.equal(state.canCommit, true);
  state = await harness.application.assumptionImportController.commit();
  assert.equal(state.screenStatus, "COMMITTED");
  assert.equal(harness.repositories.assumptions.count(), 1);
});

test("Demo BrowserからDiagnosis Scenario CSV PreviewとCommitを実行できる", async () => {
  const document = new FakeDocument();
  const harness = createBrowserDemoHarness({ document });
  await harness.application.start({ targetMonth: "2026-08" });
  const csvText = [
    "diagnosisScenarioId,name,planVersionId,capacityScenarioId,scenarioCategory,baseDiagnosisScenarioId,changeSummary,createdAt",
    "DGS-DEMO-COMP,比較,PV-DEMO-1,CAP-DEMO-OT,COMPARISON,DGS-DEMO-BASE,残業追加,2026-08-02T09:00:00+09:00"
  ].join("\n");

  let state = await harness.application.diagnosisScenarioImportController.previewCsv({
    csvText,
    fileName: "scenarios.csv",
    expectedPlanVersionId: "PV-DEMO-1"
  });
  assert.equal(state.canCommit, true);
  state = await harness.application.diagnosisScenarioImportController.commit();
  assert.equal(state.screenStatus, "COMMITTED");
  assert.equal(harness.repositories.diagnosisScenarios.count(), 3);
});

test("Demo BrowserからDAY29外部Data JSONをPreview・Commitできる", async () => {
  const document = new FakeDocument();
  const harness = createBrowserDemoHarness({ document });
  await harness.application.start({ targetMonth: "2026-08" });
  const jsonText = JSON.stringify(
    harness.executionDataSnapshotService.createSnapshot({
      exportedAt: "2026-08-02T09:00:00+09:00"
    })
  );

  let state = harness.application.executionDataImportController.previewJson({
    jsonText,
    fileName: "day29-external-data.json"
  });
  harness.application.renderer.render();
  assert.equal(state.canCommit, true);
  assert.equal(state.preview.summaries[0].bucketCount, 1);
  assert.match(document.root.innerHTML, /DAY29外部Data JSON/);
  assert.match(document.root.innerHTML, /CAP-DEMO-BASE/);

  state = harness.application.executionDataImportController.commit();
  assert.equal(state.screenStatus, "COMMITTED");
  assert.equal(harness.dataProvider.count, 2);
});


test("Demoで基準Scenarioと残業Scenarioを診断すると比較結果を表示する", async () => {
  const document = new FakeDocument();
  const harness = createBrowserDemoHarness({ document });
  await harness.application.start({ targetMonth: "2026-08" });
  await harness.application.controller.runDiagnosis();
  await harness.application.controller.selectScenario("DGS-DEMO-OT");
  const state = await harness.application.controller.runDiagnosis();
  harness.application.renderer.render(state);

  assert.equal(state.comparison.comparisonAvailable, true);
  assert.equal(state.comparison.comparison.outcome, "IMPROVED");
  assert.equal(state.comparisonBadge.label, "改善");
  assert.equal(state.comparison.comparison.summaryDeltas.minutesSummary.knownShortageMinutes, -120);
  assert.match(document.root.innerHTML, /基準Scenarioとの差を確認する/);
  assert.match(document.root.innerHTML, /単独で証明するものではありません/);
});
