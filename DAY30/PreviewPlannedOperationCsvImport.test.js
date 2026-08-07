import test from "node:test";
import assert from "node:assert/strict";

import { PreviewPlannedOperationCsvImport } from "./PreviewPlannedOperationCsvImport.js";
import { ProductionPlanVersion } from "./ProductionPlanVersion.js";
import { PlannedOperation } from "./PlannedOperation.js";
import { createInMemoryDiagnosisRepositories } from "./InMemoryDiagnosisRepositories.js";
import { FixedClock } from "./FixedClock.js";
import { SequentialIdGenerator } from "./SequentialIdGenerator.js";
import {
  IMPORT_BATCH_STATUS,
  IMPORT_ISSUE_CODE,
  IMPORT_PREVIEW_STATUS,
  PLAN_VERSION_STATUS
} from "./DiagnosisCodes.js";

const HEADERS = [
  "plannedOperationId",
  "planVersionId",
  "orderId",
  "routingOperationId",
  "equipmentId",
  "plannedDate",
  "plannedQuantity",
  "quantityUnit",
  "note"
];

function row({
  id = "POP-0001",
  versionId = "PV-0001",
  orderId = "ORD-001",
  routingOperationId = "ROP-001",
  equipmentId = "EQ-001",
  plannedDate = "2026-08-03",
  quantity = "60",
  unit = "PIECE",
  note = ""
} = {}) {
  return [
    id,
    versionId,
    orderId,
    routingOperationId,
    equipmentId,
    plannedDate,
    quantity,
    unit,
    note
  ].join(",");
}

function csv(...rows) {
  return [HEADERS.join(","), ...rows].join("\n");
}

function version({
  id = "PV-0001",
  status = PLAN_VERSION_STATUS.DRAFT,
  active = true
} = {}) {
  return new ProductionPlanVersion({
    planVersionId: id,
    planId: "PLAN-0001",
    versionNumber: 1,
    versionName: "Version 1",
    status,
    createdAt: "2026-08-02T08:00:00+09:00",
    active
  });
}

function operation({ quantity = 60, note = "" } = {}) {
  return new PlannedOperation({
    plannedOperationId: "POP-0001",
    planVersionId: "PV-0001",
    orderId: "ORD-001",
    routingOperationId: "ROP-001",
    equipmentId: "EQ-001",
    plannedDate: "2026-08-03",
    plannedQuantity: quantity,
    quantityUnit: "PIECE",
    note
  });
}

function fixture({ addVersion = true } = {}) {
  const repositories = createInMemoryDiagnosisRepositories();
  if (addVersion) {
    repositories.planVersions.add(version());
  }
  const service = new PreviewPlannedOperationCsvImport({
    planVersionRepository: repositories.planVersions,
    plannedOperationRepository: repositories.plannedOperations,
    clock: new FixedClock("2026-08-02T08:35:00+09:00"),
    idGenerator: new SequentialIdGenerator()
  });
  return { repositories, service };
}

test("新規RowをADDとしてPreviewする", () => {
  const { service } = fixture();
  const preview = service.execute({
    csvText: csv(row()),
    expectedPlanVersionId: "PV-0001",
    fileName: "plan.csv"
  });

  assert.equal(preview.importBatchId, "IMP-0001");
  assert.equal(preview.batchStatus, IMPORT_BATCH_STATUS.COMMIT_READY);
  assert.equal(preview.rows[0].previewStatus, IMPORT_PREVIEW_STATUS.ADD);
  assert.equal(preview.rows[0].normalizedData.plannedQuantity, 60);
});

test("既存Dataと同じRowをUNCHANGEDにする", () => {
  const { repositories, service } = fixture();
  repositories.plannedOperations.add(operation());

  const preview = service.execute({
    csvText: csv(row()),
    expectedPlanVersionId: "PV-0001"
  });

  assert.equal(preview.rows[0].previewStatus, IMPORT_PREVIEW_STATUS.UNCHANGED);
  assert.equal(preview.counts.unchanged, 1);
});

test("既存Dataとの差分をUPDATEとWarningにする", () => {
  const { repositories, service } = fixture();
  repositories.plannedOperations.add(operation());

  const preview = service.execute({
    csvText: csv(row({ quantity: "70", note: "changed" })),
    expectedPlanVersionId: "PV-0001"
  });

  assert.equal(preview.rows[0].previewStatus, IMPORT_PREVIEW_STATUS.UPDATE);
  assert.equal(preview.counts.warnings, 1);
  assert.equal(
    preview.rows[0].issues[0].issueCode,
    IMPORT_ISSUE_CODE.EXISTING_ENTITY_UPDATE
  );
});

test("CSV内の重複IDを両方DUPLICATEにする", () => {
  const { service } = fixture();
  const preview = service.execute({
    csvText: csv(row(), row({ quantity: "30" })),
    expectedPlanVersionId: "PV-0001"
  });

  assert.equal(preview.batchStatus, IMPORT_BATCH_STATUS.REJECTED);
  assert.deepEqual(
    preview.rows.map((candidate) => candidate.previewStatus),
    [IMPORT_PREVIEW_STATUS.DUPLICATE, IMPORT_PREVIEW_STATUS.DUPLICATE]
  );
});

test("選択したPlan VersionとRowのPlan Version不一致を拒否する", () => {
  const { service } = fixture();
  const preview = service.execute({
    csvText: csv(row({ versionId: "PV-9999" })),
    expectedPlanVersionId: "PV-0001"
  });

  assert.equal(preview.rows[0].previewStatus, IMPORT_PREVIEW_STATUS.ERROR);
  assert.equal(
    preview.rows[0].issues.some((candidate) =>
      candidate.issueCode === IMPORT_ISSUE_CODE.TARGET_VERSION_MISMATCH
    ),
    true
  );
});

test("不正な数量をEntity Validation Errorとして返す", () => {
  const { service } = fixture();
  const preview = service.execute({
    csvText: csv(row({ quantity: "abc" })),
    expectedPlanVersionId: "PV-0001"
  });

  assert.equal(preview.rows[0].previewStatus, IMPORT_PREVIEW_STATUS.ERROR);
  assert.equal(preview.counts.errors > 0, true);
});

test("未知HeaderがあるCSVをRow変換せず拒否する", () => {
  const { service } = fixture();
  const preview = service.execute({
    csvText: "plannedOperationId,unknownColumn\nPOP-0001,x",
    expectedPlanVersionId: "PV-0001"
  });

  assert.equal(preview.batchStatus, IMPORT_BATCH_STATUS.REJECTED);
  assert.equal(preview.rows.length, 0);
  assert.equal(
    preview.issues.some((candidate) =>
      candidate.issueCode === IMPORT_ISSUE_CODE.UNKNOWN_HEADER
    ),
    true
  );
});

test("対象Plan Versionが存在しない場合はGlobal Errorにする", () => {
  const { service } = fixture({ addVersion: false });
  const preview = service.execute({
    csvText: csv(row()),
    expectedPlanVersionId: "PV-0001"
  });

  assert.equal(preview.batchStatus, IMPORT_BATCH_STATUS.REJECTED);
  assert.equal(
    preview.issues[0].issueCode,
    IMPORT_ISSUE_CODE.TARGET_VERSION_NOT_FOUND
  );
});

test("APPROVED Plan VersionへのImportを拒否する", () => {
  const repositories = createInMemoryDiagnosisRepositories();
  repositories.planVersions.add(version({ status: PLAN_VERSION_STATUS.APPROVED }));
  const service = new PreviewPlannedOperationCsvImport({
    planVersionRepository: repositories.planVersions,
    plannedOperationRepository: repositories.plannedOperations,
    clock: new FixedClock("2026-08-02T08:35:00+09:00"),
    idGenerator: new SequentialIdGenerator()
  });

  const preview = service.execute({
    csvText: csv(row()),
    expectedPlanVersionId: "PV-0001"
  });

  assert.equal(preview.batchStatus, IMPORT_BATCH_STATUS.REJECTED);
  assert.equal(
    preview.issues[0].issueCode,
    IMPORT_ISSUE_CODE.TARGET_VERSION_NOT_EDITABLE
  );
});

test("CSV Parse ErrorをPreview Issueへ変換する", () => {
  const { service } = fixture();
  const preview = service.execute({
    csvText: 'plannedOperationId,planVersionId\n"broken',
    expectedPlanVersionId: "PV-0001"
  });

  assert.equal(preview.batchStatus, IMPORT_BATCH_STATUS.REJECTED);
  assert.equal(preview.issues[0].issueCode, IMPORT_ISSUE_CODE.CSV_PARSE_FAILED);
});

test("Repository RevisionをPreviewへ保存する", () => {
  const { repositories, service } = fixture();
  repositories.plannedOperations.add(operation());
  const preview = service.execute({
    csvText: csv(row()),
    expectedPlanVersionId: "PV-0001"
  });

  assert.deepEqual(preview.repositoryRevisions, {
    planVersions: 1,
    plannedOperations: 1
  });
});
