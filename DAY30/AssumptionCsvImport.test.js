import test from "node:test";
import assert from "node:assert/strict";

import { ProductionPlan } from "./ProductionPlan.js";
import { ProductionPlanVersion } from "./ProductionPlanVersion.js";
import { PlannedOperation } from "./PlannedOperation.js";
import { Assumption } from "./Assumption.js";
import {
  ASSUMPTION_STATUS,
  ASSUMPTION_TARGET_TYPE,
  ASSUMPTION_TYPE,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";
import { createInMemoryDiagnosisRepositories } from "./InMemoryDiagnosisRepositories.js";
import { InMemoryRepositoryTransactionManager } from "./InMemoryRepositoryTransactionManager.js";
import { FixedClock } from "./FixedClock.js";
import { SequentialIdGenerator } from "./SequentialIdGenerator.js";
import { PreviewAssumptionCsvImport } from "./PreviewAssumptionCsvImport.js";
import { CommitAssumptionCsvImport } from "./CommitAssumptionCsvImport.js";
import { ERROR_CODES, hasErrorCode } from "./DiagnosisErrors.js";

function setup() {
  const repositories = createInMemoryDiagnosisRepositories();
  const plan = new ProductionPlan({
    planId: "PLAN-1",
    name: "Plan",
    targetMonth: "2026-08",
    primaryFactoryId: "F-1",
    createdAt: "2026-08-01T08:00:00+09:00"
  });
  const version = new ProductionPlanVersion({
    planVersionId: "PV-1",
    planId: plan.planId,
    versionNumber: 1,
    versionName: "Draft",
    createdAt: "2026-08-01T08:05:00+09:00"
  });
  const operation = new PlannedOperation({
    plannedOperationId: "POP-1",
    planVersionId: version.planVersionId,
    orderId: "ORD-1",
    routingOperationId: "ROP-1",
    equipmentId: "EQ-1",
    plannedDate: "2026-08-03",
    plannedQuantity: 10,
    quantityUnit: QUANTITY_UNIT.PIECE
  });
  repositories.productionPlans.add(plan);
  repositories.planVersions.add(version);
  repositories.plannedOperations.add(operation);
  const clock = new FixedClock("2026-08-02T09:00:00+09:00");
  const transactionManager = new InMemoryRepositoryTransactionManager({ repositories });
  return {
    repositories,
    version,
    preview: new PreviewAssumptionCsvImport({
      productionPlanRepository: repositories.productionPlans,
      planVersionRepository: repositories.planVersions,
      plannedOperationRepository: repositories.plannedOperations,
      assumptionRepository: repositories.assumptions,
      clock,
      idGenerator: new SequentialIdGenerator()
    }),
    commit: new CommitAssumptionCsvImport({ transactionManager, clock })
  };
}

const header = [
  "assumptionId,assumptionType,targetType,targetId,description,status,blocking",
  "ASM-1,MATERIAL_ARRIVAL,PLANNED_OPERATION,POP-1,材料が到着する,UNKNOWN,true"
].join("\n");

test("Assumption CSVをPreviewしてAtomic Commitできる", async () => {
  const { repositories, preview, commit } = setup();
  const result = preview.execute({
    csvText: header,
    fileName: "assumptions.csv",
    expectedPlanVersionId: "PV-1"
  });
  assert.equal(result.canCommit(), true);
  assert.equal(result.counts.add, 1);
  assert.equal(result.rows[0].entityId, "ASM-1");

  const committed = await commit.execute({ preview: result });
  assert.equal(committed.added, 1);
  assert.equal(repositories.assumptions.count(), 1);
  assert.equal(repositories.assumptions.findById("ASM-1").blocking, true);
});

test("Planned Operation対象が選択Version外ならErrorにする", () => {
  const { preview } = setup();
  const result = preview.execute({
    csvText: [
      "assumptionId,assumptionType,targetType,targetId,description,status",
      "ASM-2,MATERIAL_ARRIVAL,PLANNED_OPERATION,POP-NOT-FOUND,材料,UNKNOWN"
    ].join("\n"),
    expectedPlanVersionId: "PV-1"
  });
  assert.equal(result.canCommit(), false);
  assert.equal(result.counts.errors > 0, true);
});

test("既存Assumptionの対象Identity変更を拒否する", () => {
  const { repositories, preview } = setup();
  repositories.assumptions.add(new Assumption({
    assumptionId: "ASM-1",
    assumptionType: ASSUMPTION_TYPE.MATERIAL_ARRIVAL,
    targetType: ASSUMPTION_TARGET_TYPE.PLANNED_OPERATION,
    targetId: "POP-1",
    description: "材料",
    status: ASSUMPTION_STATUS.UNKNOWN
  }));
  const result = preview.execute({
    csvText: [
      "assumptionId,assumptionType,targetType,targetId,description,status",
      "ASM-1,EQUIPMENT_AVAILABILITY,EQUIPMENT,EQ-1,設備,UNKNOWN"
    ].join("\n"),
    expectedPlanVersionId: "PV-1"
  });
  assert.equal(result.canCommit(), false);
  assert.equal(result.rows[0].previewStatus, "ERROR");
});

test("Assumption Preview後のRepository変更を検出する", async () => {
  const { repositories, preview, commit } = setup();
  const result = preview.execute({ csvText: header, expectedPlanVersionId: "PV-1" });
  repositories.assumptions.add(new Assumption({
    assumptionId: "ASM-X",
    assumptionType: ASSUMPTION_TYPE.OTHER,
    targetType: ASSUMPTION_TARGET_TYPE.PLAN_VERSION,
    targetId: "PV-1",
    description: "別の前提",
    status: ASSUMPTION_STATUS.UNKNOWN
  }));
  await assert.rejects(
    () => commit.execute({ preview: result }),
    (error) => hasErrorCode(error, ERROR_CODES.IMPORT_STALE_PREVIEW)
  );
});
