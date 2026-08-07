import test from "node:test";
import assert from "node:assert/strict";
import { EntityCsvImportController } from "./EntityCsvImportController.js";

function previewObject({ canCommit = true } = {}) {
  return {
    canCommit() { return canCommit; },
    toSnapshot() {
      return {
        fileName: "x.csv",
        expectedPlanVersionId: "PV-1",
        counts: { add: 1, update: 0, unchanged: 0, errors: canCommit ? 0 : 1 }
      };
    }
  };
}

test("Generic CSV Import ControllerはPreviewとCommitを管理する", async () => {
  const controller = new EntityCsvImportController({
    importType: "ASSUMPTION",
    previewService: { execute() { return previewObject(); } },
    commitService: { execute() { return { added: 1, updated: 0, unchanged: 0 }; } }
  });
  let state = await controller.previewCsv({
    csvText: "a",
    fileName: "x.csv",
    expectedPlanVersionId: "PV-1"
  });
  assert.equal(state.canCommit, true);
  state = await controller.commit();
  assert.equal(state.screenStatus, "COMMITTED");
});

test("Error PreviewはCommit不可になる", async () => {
  const controller = new EntityCsvImportController({
    importType: "DIAGNOSIS_SCENARIO",
    previewService: { execute() { return previewObject({ canCommit: false }); } },
    commitService: { execute() { throw new Error("must not call"); } }
  });
  const state = await controller.previewCsv({ csvText: "x", expectedPlanVersionId: "PV-1" });
  assert.equal(state.canCommit, false);
});
