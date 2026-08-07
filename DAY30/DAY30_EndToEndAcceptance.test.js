import test from "node:test";
import assert from "node:assert/strict";

import { createBrowserDemoHarness } from "./BrowserDemoData.js";

class FakeRoot {
  constructor() {
    this.innerHTML = "";
    this.listeners = new Map();
  }
  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }
}

class FakeDocument {
  constructor() {
    this.root = new FakeRoot();
  }
  querySelector(selector) {
    return selector === "#app" ? this.root : null;
  }
}

class FakeStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
}

function createAcceptanceHarness({ storage = new FakeStorage() } = {}) {
  return createBrowserDemoHarness({
    document: new FakeDocument(),
    storage
  });
}

test("AC-01 Demo起動から未診断Scenarioを選択できる", async () => {
  const harness = createAcceptanceHarness();
  const state = await harness.application.start({ targetMonth: "2026-08" });

  assert.equal(state.screenStatus, "READY");
  assert.equal(state.selectedPlanId, "PLAN-DEMO");
  assert.equal(state.selectedPlanVersionId, "PV-DEMO-1");
  assert.equal(state.selectedScenarioId, "DGS-DEMO-BASE");
  assert.equal(state.selectedDiagnosisResultId, null);
  assert.equal(state.canRunDiagnosis, true);
});

test("AC-02 基準ScenarioはCapacity二重使用を防ぎ一部実行可能になる", async () => {
  const harness = createAcceptanceHarness();
  await harness.application.start({ targetMonth: "2026-08" });
  const state = await harness.application.controller.runDiagnosis();

  assert.equal(state.diagnosisBadge.status, "PARTIALLY_FEASIBLE");
  assert.equal(state.detail.summary.minutesSummary.knownRequiredMinutes, 540);
  assert.equal(state.detail.summary.minutesSummary.knownAllocatedMinutes, 420);
  assert.equal(state.detail.summary.minutesSummary.knownShortageMinutes, 120);
  assert.equal(state.detail.summary.quantityTotalsByUnit.PIECE.diagnosedShortageQuantity, 20);
  assert.equal(state.detail.operationResults[1].plannedOperationId, "POP-DEMO-2");
  assert.equal(state.detail.operationResults[1].allocatedMinutes, 60);
  assert.equal(state.detail.operationResults[1].status, "PARTIALLY_FEASIBLE");
});

test("AC-03 比較Scenarioは残業追加により実行可能となり改善差分を表示する", async () => {
  const harness = createAcceptanceHarness();
  await harness.application.start({ targetMonth: "2026-08" });
  await harness.application.controller.runDiagnosis();
  await harness.application.controller.selectScenario("DGS-DEMO-OT");
  const state = await harness.application.controller.runDiagnosis();

  assert.equal(state.diagnosisBadge.status, "FEASIBLE");
  assert.equal(state.detail.summary.minutesSummary.knownShortageMinutes, 0);
  assert.equal(state.comparison.comparisonAvailable, true);
  assert.equal(state.comparison.comparison.outcome, "IMPROVED");
  assert.equal(
    state.comparison.comparison.summaryDeltas.minutesSummary.knownShortageMinutes,
    -120
  );
  assert.equal(
    state.comparison.comparison.summaryDeltas.quantityTotalsByUnit.PIECE.diagnosedExecutableQuantity,
    20
  );
});

test("AC-04 Assumption本体とRelationをPreview後にAtomic Commitできる", async () => {
  const harness = createAcceptanceHarness();
  await harness.application.start({ targetMonth: "2026-08" });

  const assumptionCsv = [
    "assumptionId,assumptionType,targetType,targetId,description,status,blocking",
    "ASM-AC-01,MATERIAL_ARRIVAL,PLANNED_OPERATION,POP-DEMO-1,材料到着を確認する,UNKNOWN,true"
  ].join("\n");
  let assumptionState = await harness.application.assumptionImportController.previewCsv({
    csvText: assumptionCsv,
    fileName: "acceptance-assumptions.csv",
    expectedPlanVersionId: "PV-DEMO-1"
  });
  assert.equal(assumptionState.canCommit, true);
  assert.equal(assumptionState.preview.counts.add, 1);
  assumptionState = await harness.application.assumptionImportController.commit();
  assert.equal(assumptionState.screenStatus, "COMMITTED");

  const relationCsv = [
    "diagnosisScenarioId,assumptionId,active,note",
    "DGS-DEMO-BASE,ASM-AC-01,true,基準Scenarioで材料到着を確認する"
  ].join("\n");
  let relationState = await harness.application.scenarioAssumptionRelationImportController.previewCsv({
    csvText: relationCsv,
    fileName: "acceptance-relations.csv",
    expectedPlanVersionId: "PV-DEMO-1"
  });
  assert.equal(relationState.canCommit, true);
  assert.equal(relationState.preview.counts.add, 1);
  relationState = await harness.application.scenarioAssumptionRelationImportController.commit();
  assert.equal(relationState.screenStatus, "COMMITTED");

  assert.equal(harness.repositories.assumptions.count(), 1);
  assert.equal(harness.repositories.scenarioAssumptionRelations.count(), 1);
});

test("AC-05 未確認blocking Assumptionを0や不成立へ変換せずUNKNOWNにする", async () => {
  const harness = createAcceptanceHarness();
  await harness.application.start({ targetMonth: "2026-08" });

  const assumptionCsv = [
    "assumptionId,assumptionType,targetType,targetId,description,status,blocking",
    "ASM-AC-02,MATERIAL_ARRIVAL,PLANNED_OPERATION,POP-DEMO-1,材料到着を確認する,UNKNOWN,true"
  ].join("\n");
  await harness.application.assumptionImportController.previewCsv({
    csvText: assumptionCsv,
    fileName: "acceptance-assumptions.csv",
    expectedPlanVersionId: "PV-DEMO-1"
  });
  await harness.application.assumptionImportController.commit();

  const relationCsv = [
    "diagnosisScenarioId,assumptionId,active,note",
    "DGS-DEMO-BASE,ASM-AC-02,true,材料到着を診断条件にする"
  ].join("\n");
  await harness.application.scenarioAssumptionRelationImportController.previewCsv({
    csvText: relationCsv,
    fileName: "acceptance-relations.csv",
    expectedPlanVersionId: "PV-DEMO-1"
  });
  await harness.application.scenarioAssumptionRelationImportController.commit();

  const state = await harness.application.controller.runDiagnosis();
  const unknownOperation = state.detail.operationResults.find(
    (row) => row.plannedOperationId === "POP-DEMO-1"
  );

  assert.equal(state.diagnosisBadge.status, "UNKNOWN");
  assert.equal(unknownOperation.status, "UNKNOWN");
  assert.equal(unknownOperation.diagnosedExecutableQuantity, null);
  assert.equal(unknownOperation.diagnosedShortageQuantity, null);
  assert.equal(unknownOperation.assumptionStatus, "UNRESOLVED");
});

test("AC-06 Backup JSONへ本体Repositoryと外部Read Dataを同時保存する", async () => {
  const harness = createAcceptanceHarness();
  await harness.application.start({ targetMonth: "2026-08" });
  await harness.application.controller.runDiagnosis();
  const backupState = harness.application.backupController.createBackup();
  const backup = JSON.parse(backupState.backupJson);

  assert.equal(backupState.screenStatus, "BACKUP_READY");
  assert.match(backupState.backupFileName, /^DAY30-backup-\d{4}-\d{2}-\d{2}\.json$/);
  assert.equal(backup.schemaVersion, 2);
  assert.ok(backup.repositorySnapshot?.repositories);
  assert.ok(backup.externalDataSnapshot);
  assert.equal(
    backup.repositorySnapshot.repositories.diagnosisResults.items.length,
    1
  );
  assert.equal(backup.externalDataSnapshot.items.length, 2);
});

test("AC-07 Backup復元後もDiagnosis Result・Assumption・Relationを再利用できる", async () => {
  const source = createAcceptanceHarness();
  await source.application.start({ targetMonth: "2026-08" });

  const assumptionCsv = [
    "assumptionId,assumptionType,targetType,targetId,description,status,blocking",
    "ASM-AC-03,MATERIAL_ARRIVAL,PLANNED_OPERATION,POP-DEMO-1,材料到着を確認する,UNKNOWN,true"
  ].join("\n");
  await source.application.assumptionImportController.previewCsv({
    csvText: assumptionCsv,
    fileName: "acceptance-assumptions.csv",
    expectedPlanVersionId: "PV-DEMO-1"
  });
  await source.application.assumptionImportController.commit();
  const relationCsv = [
    "diagnosisScenarioId,assumptionId,active,note",
    "DGS-DEMO-BASE,ASM-AC-03,true,復元確認用Relation"
  ].join("\n");
  await source.application.scenarioAssumptionRelationImportController.previewCsv({
    csvText: relationCsv,
    fileName: "acceptance-relations.csv",
    expectedPlanVersionId: "PV-DEMO-1"
  });
  await source.application.scenarioAssumptionRelationImportController.commit();
  await source.application.controller.runDiagnosis();

  const backupState = source.application.backupController.createBackup();
  const target = createAcceptanceHarness();
  await target.application.start({ targetMonth: "2026-08" });
  const restoreState = target.application.backupController.restoreBackup({
    jsonText: backupState.backupJson,
    fileName: backupState.backupFileName
  });
  const state = await target.application.controller.refresh();

  assert.equal(restoreState.screenStatus, "RESTORED");
  assert.equal(target.repositories.diagnosisResults.count(), 1);
  assert.equal(target.repositories.assumptions.count(), 1);
  assert.equal(target.repositories.scenarioAssumptionRelations.count(), 1);
  assert.equal(target.dataProvider.count, 2);
  assert.equal(state.diagnosisBadge.status, "UNKNOWN");
});

test("AC-08 壊れたBackupは現在Dataを変更せず復元を拒否する", async () => {
  const harness = createAcceptanceHarness();
  await harness.application.start({ targetMonth: "2026-08" });
  await harness.application.controller.runDiagnosis();
  const resultCountBefore = harness.repositories.diagnosisResults.count();

  const restoreState = harness.application.backupController.restoreBackup({
    jsonText: "{ broken json",
    fileName: "broken.json"
  });

  assert.equal(restoreState.screenStatus, "ERROR");
  assert.equal(harness.repositories.diagnosisResults.count(), resultCountBefore);
  assert.match(restoreState.message, /現在のDataは変更していません/);
});
