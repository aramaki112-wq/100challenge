import test from "node:test";
import assert from "node:assert/strict";

import {
  ImportIssue,
  PlannedOperationImportPreview,
  assertPlannedOperationImportPreview
} from "./PlannedOperationImportPreview.js";
import {
  IMPORT_ISSUE_CODE,
  IMPORT_ISSUE_SEVERITY,
  IMPORT_PREVIEW_STATUS,
  IMPORT_BATCH_STATUS
} from "./DiagnosisCodes.js";

function issue(severity = IMPORT_ISSUE_SEVERITY.WARNING) {
  return new ImportIssue({
    severity,
    issueCode: IMPORT_ISSUE_CODE.EXISTING_ENTITY_UPDATE,
    message: "Existing row will be updated.",
    rowNumber: 2
  });
}

function preview(overrides = {}) {
  return new PlannedOperationImportPreview({
    importBatchId: "IMP-0001",
    expectedPlanVersionId: "PV-0001",
    fileName: "plan.csv",
    receivedAt: "2026-08-02T08:00:00+09:00",
    previewedAt: "2026-08-02T08:01:00+09:00",
    repositoryRevisions: {
      planVersions: 1,
      plannedOperations: 2
    },
    rows: [{
      rowNumber: 2,
      plannedOperationId: "POP-0001",
      previewStatus: IMPORT_PREVIEW_STATUS.ADD,
      normalizedData: {
        plannedOperationId: "POP-0001",
        planVersionId: "PV-0001"
      },
      issues: []
    }],
    issues: [],
    ...overrides
  });
}

test("ErrorがなければCOMMIT_READYになる", () => {
  const result = preview();
  assert.equal(result.batchStatus, IMPORT_BATCH_STATUS.COMMIT_READY);
  assert.equal(result.canCommit(), true);
  assert.equal(result.counts.add, 1);
});

test("Error IssueがあればREJECTEDになる", () => {
  const result = preview({
    issues: [issue(IMPORT_ISSUE_SEVERITY.ERROR)]
  });
  assert.equal(result.batchStatus, IMPORT_BATCH_STATUS.REJECTED);
  assert.equal(result.canCommit(), false);
  assert.equal(result.counts.errors, 1);
});

test("Commit EntryはADDとUPDATEだけを返す", () => {
  const result = preview({
    rows: [
      {
        rowNumber: 2,
        plannedOperationId: "POP-0001",
        previewStatus: IMPORT_PREVIEW_STATUS.ADD,
        normalizedData: { plannedOperationId: "POP-0001", planVersionId: "PV-0001" },
        issues: []
      },
      {
        rowNumber: 3,
        plannedOperationId: "POP-0002",
        previewStatus: IMPORT_PREVIEW_STATUS.UNCHANGED,
        normalizedData: { plannedOperationId: "POP-0002", planVersionId: "PV-0001" },
        issues: []
      }
    ]
  });
  assert.equal(result.getCommitEntries().length, 1);
  assert.equal(result.getCommitEntries()[0].rowNumber, 2);
});

test("Preview Snapshotは内部Dataまで変更できない", () => {
  const result = preview();
  const snapshot = result.toSnapshot();
  assert.equal(Object.isFrozen(snapshot.rows[0].normalizedData), true);
  assert.throws(
    () => snapshot.rows[0].normalizedData.planVersionId = "PV-X",
    TypeError
  );
});

test("assertPlannedOperationImportPreviewは正式Previewだけを受け付ける", () => {
  const result = preview();
  assert.equal(assertPlannedOperationImportPreview(result), result);
  assert.throws(() => assertPlannedOperationImportPreview({}));
});
