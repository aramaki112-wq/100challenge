import test from "node:test";
import assert from "node:assert/strict";

import { CommitPlannedOperationCsvImport } from "./CommitPlannedOperationCsvImport.js";
import { PreviewPlannedOperationCsvImport } from "./PreviewPlannedOperationCsvImport.js";
import {
  PlannedOperationImportPreview
} from "./PlannedOperationImportPreview.js";
import { ProductionPlanVersion } from "./ProductionPlanVersion.js";
import { createInMemoryDiagnosisRepositories } from "./InMemoryDiagnosisRepositories.js";
import { InMemoryRepositoryTransactionManager } from "./InMemoryRepositoryTransactionManager.js";
import { FixedClock } from "./FixedClock.js";
import { SequentialIdGenerator } from "./SequentialIdGenerator.js";
import {
  IMPORT_BATCH_STATUS,
  IMPORT_PREVIEW_STATUS,
  PLAN_VERSION_STATUS
} from "./DiagnosisCodes.js";
import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

const HEADER = [
  "plannedOperationId",
  "planVersionId",
  "orderId",
  "routingOperationId",
  "equipmentId",
  "plannedDate",
  "plannedQuantity",
  "quantityUnit"
].join(",");

function csv({ id = "POP-0001", quantity = "60" } = {}) {
  return [
    HEADER,
    [id, "PV-0001", "ORD-001", "ROP-001", "EQ-001", "2026-08-03", quantity, "PIECE"].join(",")
  ].join("\n");
}

function createVersion(status = PLAN_VERSION_STATUS.DRAFT) {
  return new ProductionPlanVersion({
    planVersionId: "PV-0001",
    planId: "PLAN-0001",
    versionNumber: 1,
    versionName: "Version 1",
    status,
    createdAt: "2026-08-02T08:00:00+09:00"
  });
}

function fixture() {
  const repositories = createInMemoryDiagnosisRepositories();
  repositories.planVersions.add(createVersion());
  const clock = new FixedClock("2026-08-02T08:40:00+09:00");
  const previewService = new PreviewPlannedOperationCsvImport({
    planVersionRepository: repositories.planVersions,
    plannedOperationRepository: repositories.plannedOperations,
    clock,
    idGenerator: new SequentialIdGenerator()
  });
  const transactionManager = new InMemoryRepositoryTransactionManager({
    repositories
  });
  const commitService = new CommitPlannedOperationCsvImport({
    transactionManager,
    clock
  });
  return { repositories, previewService, commitService };
}

test("ADD PreviewをTransaction内で保存する", async () => {
  const { repositories, previewService, commitService } = fixture();
  const preview = previewService.execute({
    csvText: csv(),
    expectedPlanVersionId: "PV-0001"
  });

  const result = await commitService.execute({ preview });

  assert.equal(result.batchStatus, IMPORT_BATCH_STATUS.COMMITTED);
  assert.equal(result.added, 1);
  assert.equal(result.updated, 0);
  assert.equal(repositories.plannedOperations.count(), 1);
  assert.equal(
    repositories.plannedOperations.getById("POP-0001").plannedQuantity,
    60
  );
});

test("UPDATE Previewで既存Operationを置換する", async () => {
  const { repositories, previewService, commitService } = fixture();
  let preview = previewService.execute({
    csvText: csv(),
    expectedPlanVersionId: "PV-0001"
  });
  await commitService.execute({ preview });

  preview = previewService.execute({
    csvText: csv({ quantity: "75" }),
    expectedPlanVersionId: "PV-0001"
  });
  const result = await commitService.execute({ preview });

  assert.equal(result.updated, 1);
  assert.equal(
    repositories.plannedOperations.getById("POP-0001").plannedQuantity,
    75
  );
});

test("UNCHANGEDだけのPreviewは書込0件でCommitできる", async () => {
  const { repositories, previewService, commitService } = fixture();
  let preview = previewService.execute({
    csvText: csv(),
    expectedPlanVersionId: "PV-0001"
  });
  await commitService.execute({ preview });

  preview = previewService.execute({
    csvText: csv(),
    expectedPlanVersionId: "PV-0001"
  });
  const revisionBefore = repositories.plannedOperations.revision;
  const result = await commitService.execute({ preview });

  assert.equal(result.totalWritten, 0);
  assert.equal(result.unchanged, 1);
  assert.equal(repositories.plannedOperations.revision, revisionBefore);
});

test("Errorを含むPreviewはCommitできない", async () => {
  const { previewService, commitService } = fixture();
  const preview = previewService.execute({
    csvText: csv({ quantity: "invalid" }),
    expectedPlanVersionId: "PV-0001"
  });

  await assert.rejects(
    () => commitService.execute({ preview }),
    (error) => hasErrorCode(error, ERROR_CODES.IMPORT_COMMIT_NOT_ALLOWED)
  );
});

test("Preview後にRepositoryが変わった場合はSTALEとして拒否する", async () => {
  const { repositories, previewService, commitService } = fixture();
  const preview = previewService.execute({
    csvText: csv(),
    expectedPlanVersionId: "PV-0001"
  });
  repositories.plannedOperations.add(
    new (await import("./PlannedOperation.js")).PlannedOperation({
      plannedOperationId: "POP-9999",
      planVersionId: "PV-0001",
      orderId: "ORD-X",
      routingOperationId: "ROP-X",
      equipmentId: "EQ-X",
      plannedDate: "2026-08-03",
      plannedQuantity: 1,
      quantityUnit: "PIECE"
    })
  );

  await assert.rejects(
    () => commitService.execute({ preview }),
    (error) => hasErrorCode(error, ERROR_CODES.IMPORT_STALE_PREVIEW)
  );
});

test("Commit時に対象Versionが編集不可なら拒否する", async () => {
  const repositories = createInMemoryDiagnosisRepositories();
  repositories.planVersions.add(createVersion(PLAN_VERSION_STATUS.APPROVED));
  const transactionManager = new InMemoryRepositoryTransactionManager({ repositories });
  const commitService = new CommitPlannedOperationCsvImport({
    transactionManager,
    clock: new FixedClock("2026-08-02T08:40:00+09:00")
  });

  const preview = new PlannedOperationImportPreview({
    importBatchId: "IMP-0001",
    expectedPlanVersionId: "PV-0001",
    receivedAt: "2026-08-02T08:35:00+09:00",
    previewedAt: "2026-08-02T08:36:00+09:00",
    repositoryRevisions: {
      planVersions: repositories.planVersions.revision,
      plannedOperations: repositories.plannedOperations.revision
    },
    rows: [],
    issues: []
  });

  await assert.rejects(
    () => commitService.execute({ preview }),
    (error) => hasErrorCode(error, ERROR_CODES.IMPORT_TARGET_VERSION_NOT_EDITABLE)
  );
});

test("Transaction途中失敗時は先行ADDもRollbackする", async () => {
  const { repositories, commitService } = fixture();
  const data = {
    plannedOperationId: "POP-0001",
    planVersionId: "PV-0001",
    orderId: "ORD-001",
    routingOperationId: "ROP-001",
    equipmentId: "EQ-001",
    plannedDate: "2026-08-03",
    shiftId: null,
    plannedStartTime: null,
    plannedEndTime: null,
    plannedQuantity: 60,
    quantityUnit: "PIECE",
    priority: null,
    productGroup: null,
    materialGroup: null,
    dimensionGroup: null,
    outsideDiameter: null,
    wallThickness: null,
    processingType: null,
    difficultyClass: null,
    operationType: null,
    note: ""
  };
  const preview = new PlannedOperationImportPreview({
    importBatchId: "IMP-0001",
    expectedPlanVersionId: "PV-0001",
    receivedAt: "2026-08-02T08:35:00+09:00",
    previewedAt: "2026-08-02T08:36:00+09:00",
    repositoryRevisions: {
      planVersions: repositories.planVersions.revision,
      plannedOperations: repositories.plannedOperations.revision
    },
    rows: [
      {
        rowNumber: 2,
        plannedOperationId: "POP-0001",
        previewStatus: IMPORT_PREVIEW_STATUS.ADD,
        normalizedData: data,
        issues: []
      },
      {
        rowNumber: 3,
        plannedOperationId: "POP-0001",
        previewStatus: IMPORT_PREVIEW_STATUS.ADD,
        normalizedData: data,
        issues: []
      }
    ],
    issues: []
  });

  await assert.rejects(
    () => commitService.execute({ preview }),
    (error) => hasErrorCode(error, ERROR_CODES.IMPORT_TRANSACTION_FAILED)
  );
  assert.equal(repositories.plannedOperations.count(), 0);
  assert.equal(repositories.plannedOperations.revision, 0);
});

test("Commit Resultは外部から変更できない", async () => {
  const { previewService, commitService } = fixture();
  const preview = previewService.execute({
    csvText: csv(),
    expectedPlanVersionId: "PV-0001"
  });
  const result = await commitService.execute({ preview });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.repositoryRevisionsAfter), true);
  assert.throws(() => result.added = 9, TypeError);
});
