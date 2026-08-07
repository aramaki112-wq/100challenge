import test from "node:test";
import assert from "node:assert/strict";

import {
  PlannedOperationCsvImportController,
  assertPlannedOperationCsvImportController
} from "./PlannedOperationCsvImportController.js";
import { PreviewPlannedOperationCsvImport } from "./PreviewPlannedOperationCsvImport.js";
import { CommitPlannedOperationCsvImport } from "./CommitPlannedOperationCsvImport.js";
import { ProductionPlanVersion } from "./ProductionPlanVersion.js";
import { createInMemoryDiagnosisRepositories } from "./InMemoryDiagnosisRepositories.js";
import { InMemoryRepositoryTransactionManager } from "./InMemoryRepositoryTransactionManager.js";
import { FixedClock } from "./FixedClock.js";
import { SequentialIdGenerator } from "./SequentialIdGenerator.js";
import { ERROR_CODES, hasErrorCode } from "./DiagnosisErrors.js";

const HEADER = "plannedOperationId,planVersionId,orderId,routingOperationId,equipmentId,plannedDate,plannedQuantity,quantityUnit";
function csv(quantity = "60") {
  return `${HEADER}\nPOP-1,PV-1,ORD-1,ROP-1,EQ-1,2026-08-03,${quantity},PIECE`;
}

function fixture() {
  const repositories = createInMemoryDiagnosisRepositories();
  repositories.planVersions.add(new ProductionPlanVersion({
    planVersionId: "PV-1",
    planId: "PLAN-1",
    versionNumber: 1,
    versionName: "Draft",
    createdAt: "2026-08-02T08:00:00+09:00"
  }));
  const clock = new FixedClock("2026-08-02T09:00:00+09:00");
  const transactionManager = new InMemoryRepositoryTransactionManager({ repositories });
  const previewService = new PreviewPlannedOperationCsvImport({
    planVersionRepository: repositories.planVersions,
    plannedOperationRepository: repositories.plannedOperations,
    clock,
    idGenerator: new SequentialIdGenerator()
  });
  const commitService = new CommitPlannedOperationCsvImport({ transactionManager, clock });
  const controller = new PlannedOperationCsvImportController({
    previewPlannedOperationCsvImport: previewService,
    commitPlannedOperationCsvImport: commitService
  });
  return { repositories, controller };
}

test("初期状態はFile選択待ちである", () => {
  const { controller } = fixture();
  const state = controller.getState();
  assert.equal(state.screenStatus, "IDLE");
  assert.equal(state.preview, null);
  assert.equal(state.canCommit, false);
});

test("正常CSVをPreviewしADD件数を画面状態へ変換する", async () => {
  const { controller } = fixture();
  const state = await controller.previewCsv({
    csvText: csv(),
    fileName: "plan.csv",
    expectedPlanVersionId: "PV-1"
  });
  assert.equal(state.screenStatus, "PREVIEW_READY");
  assert.equal(state.preview.counts.add, 1);
  assert.equal(state.canCommit, true);
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.preview.rows), true);
});

test("入力ErrorがあるPreviewは表示するがCommit不可にする", async () => {
  const { controller } = fixture();
  const state = await controller.previewCsv({
    csvText: csv("invalid"),
    fileName: "invalid.csv",
    expectedPlanVersionId: "PV-1"
  });
  assert.equal(state.screenStatus, "PREVIEW_READY");
  assert.equal(state.preview.counts.errors > 0, true);
  assert.equal(state.canCommit, false);
});

test("Preview後にCommitするとRepositoryへ保存し完了状態にする", async () => {
  const { repositories, controller } = fixture();
  await controller.previewCsv({
    csvText: csv(),
    fileName: "plan.csv",
    expectedPlanVersionId: "PV-1"
  });
  const state = await controller.commit();
  assert.equal(state.screenStatus, "COMMITTED");
  assert.equal(state.commitResult.added, 1);
  assert.equal(state.canCommit, false);
  assert.equal(repositories.plannedOperations.count(), 1);
});

test("PreviewなしのCommitはError状態として返す", async () => {
  const { controller } = fixture();
  const state = await controller.commit();
  assert.equal(state.screenStatus, "ERROR");
  assert.equal(state.error.code, ERROR_CODES.IMPORT_COMMIT_NOT_ALLOWED);
});

test("ResetでPreviewとCommit Resultを破棄する", async () => {
  const { controller } = fixture();
  await controller.previewCsv({ csvText: csv(), fileName: "plan.csv", expectedPlanVersionId: "PV-1" });
  await controller.commit();
  const state = controller.reset();
  assert.equal(state.screenStatus, "IDLE");
  assert.equal(state.preview, null);
  assert.equal(state.commitResult, null);
});

test("Controller契約とConstructor入力を検証する", () => {
  const { controller } = fixture();
  assert.equal(assertPlannedOperationCsvImportController(controller), controller);
  assert.throws(
    () => assertPlannedOperationCsvImportController({ previewCsv() {} }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_PLANNED_OPERATION_CSV_IMPORT_CONTROLLER)
  );
  assert.throws(
    () => new PlannedOperationCsvImportController({}),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_PLANNED_OPERATION_CSV_IMPORT_CONTROLLER)
  );
});
