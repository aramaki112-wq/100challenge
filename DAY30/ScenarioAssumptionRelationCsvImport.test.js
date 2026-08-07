import test from "node:test";
import assert from "node:assert/strict";
import { ProductionPlan } from "./ProductionPlan.js";
import { ProductionPlanVersion } from "./ProductionPlanVersion.js";
import { Assumption } from "./Assumption.js";
import { DiagnosisScenario } from "./DiagnosisScenario.js";
import { ScenarioAssumptionRelation } from "./ScenarioAssumptionRelation.js";
import { createInMemoryDiagnosisRepositories } from "./InMemoryDiagnosisRepositories.js";
import { InMemoryRepositoryTransactionManager } from "./InMemoryRepositoryTransactionManager.js";
import { FixedClock } from "./FixedClock.js";
import { SequentialIdGenerator } from "./SequentialIdGenerator.js";
import { PreviewScenarioAssumptionRelationCsvImport } from "./PreviewScenarioAssumptionRelationCsvImport.js";
import { CommitScenarioAssumptionRelationCsvImport } from "./CommitScenarioAssumptionRelationCsvImport.js";
import { ERROR_CODES } from "./DiagnosisErrors.js";

function createFixture() {
  const repositories = createInMemoryDiagnosisRepositories();
  const plan = new ProductionPlan({
    planId: "PLAN-REL-1",
    name: "Relation Import Plan",
    targetMonth: "2026-08",
    primaryFactoryId: "F-01",
    createdAt: "2026-08-01T09:00:00+09:00"
  });
  const version = new ProductionPlanVersion({
    planVersionId: "PV-REL-1",
    planId: plan.planId,
    versionNumber: 1,
    versionName: "Version 1",
    createdAt: "2026-08-01T09:01:00+09:00"
  });
  const scenario = new DiagnosisScenario({
    diagnosisScenarioId: "DGS-REL-1",
    name: "基準Scenario",
    planVersionId: version.planVersionId,
    capacityScenarioId: "CAP-REL-1",
    createdAt: "2026-08-01T09:02:00+09:00"
  });
  const assumption = new Assumption({
    assumptionId: "ASM-REL-1",
    assumptionType: "MATERIAL_ARRIVAL",
    targetType: "PLAN_VERSION",
    targetId: version.planVersionId,
    description: "材料が到着する",
    status: "EXPECTED",
    confidence: "MEDIUM",
    blocking: true
  });
  repositories.productionPlans.add(plan);
  repositories.planVersions.add(version);
  repositories.diagnosisScenarios.add(scenario);
  repositories.assumptions.add(assumption);

  const clock = new FixedClock("2026-08-02T09:00:00+09:00");
  const idGenerator = new SequentialIdGenerator();
  const preview = new PreviewScenarioAssumptionRelationCsvImport({
    planVersionRepository: repositories.planVersions,
    diagnosisScenarioRepository: repositories.diagnosisScenarios,
    assumptionRepository: repositories.assumptions,
    relationRepository: repositories.scenarioAssumptionRelations,
    clock,
    idGenerator
  });
  const commit = new CommitScenarioAssumptionRelationCsvImport({
    transactionManager: new InMemoryRepositoryTransactionManager({ repositories }),
    clock
  });
  return { repositories, plan, version, scenario, assumption, preview, commit };
}

function csv(rows) {
  return [
    "diagnosisScenarioId,assumptionId,active,note",
    ...rows
  ].join("\n");
}

test("Scenario–Assumption RelationをADD Previewできる", () => {
  const fixture = createFixture();
  const result = fixture.preview.execute({
    csvText: csv(["DGS-REL-1,ASM-REL-1,true,材料確認"]),
    expectedPlanVersionId: fixture.version.planVersionId
  });
  assert.equal(result.canCommit(), true);
  assert.equal(result.counts.add, 1);
  assert.equal(result.rows[0].entityId, "DGS-REL-1::ASM-REL-1");
});

test("RelationをAtomic Commitできる", async () => {
  const fixture = createFixture();
  const preview = fixture.preview.execute({
    csvText: csv(["DGS-REL-1,ASM-REL-1,true,材料確認"]),
    expectedPlanVersionId: fixture.version.planVersionId
  });
  const result = await fixture.commit.execute({ preview });
  assert.equal(result.added, 1);
  const stored = fixture.repositories.scenarioAssumptionRelations.findById(
    "DGS-REL-1::ASM-REL-1"
  );
  assert.equal(stored.active, true);
  assert.equal(stored.note, "材料確認");
});

test("既存Relationのactive・note変更をUPDATEとして扱う", async () => {
  const fixture = createFixture();
  fixture.repositories.scenarioAssumptionRelations.add(
    new ScenarioAssumptionRelation({
      diagnosisScenarioId: fixture.scenario.diagnosisScenarioId,
      assumptionId: fixture.assumption.assumptionId,
      active: true,
      note: "旧Note"
    })
  );
  const preview = fixture.preview.execute({
    csvText: csv(["DGS-REL-1,ASM-REL-1,false,一時的に診断対象外"]),
    expectedPlanVersionId: fixture.version.planVersionId
  });
  assert.equal(preview.counts.update, 1);
  await fixture.commit.execute({ preview });
  const stored = fixture.repositories.scenarioAssumptionRelations.findById(
    "DGS-REL-1::ASM-REL-1"
  );
  assert.equal(stored.active, false);
  assert.equal(stored.note, "一時的に診断対象外");
});

test("同じ内容はUNCHANGEDになる", () => {
  const fixture = createFixture();
  fixture.repositories.scenarioAssumptionRelations.add(
    new ScenarioAssumptionRelation({
      diagnosisScenarioId: "DGS-REL-1",
      assumptionId: "ASM-REL-1",
      active: true,
      note: "同じ"
    })
  );
  const preview = fixture.preview.execute({
    csvText: csv(["DGS-REL-1,ASM-REL-1,true,同じ"]),
    expectedPlanVersionId: fixture.version.planVersionId
  });
  assert.equal(preview.counts.unchanged, 1);
  assert.equal(preview.canCommit(), true);
});

test("CSV内の同一Relation重複を拒否する", () => {
  const fixture = createFixture();
  const preview = fixture.preview.execute({
    csvText: csv([
      "DGS-REL-1,ASM-REL-1,true,A",
      "DGS-REL-1,ASM-REL-1,false,B"
    ]),
    expectedPlanVersionId: fixture.version.planVersionId
  });
  assert.equal(preview.canCommit(), false);
  assert.equal(preview.counts.errors > 0, true);
});

test("存在しないScenarioを拒否する", () => {
  const fixture = createFixture();
  const preview = fixture.preview.execute({
    csvText: csv(["DGS-NOT-FOUND,ASM-REL-1,true,"]),
    expectedPlanVersionId: fixture.version.planVersionId
  });
  assert.equal(preview.canCommit(), false);
  assert.equal(preview.rows[0].previewStatus, "ERROR");
});

test("存在しないAssumptionを拒否する", () => {
  const fixture = createFixture();
  const preview = fixture.preview.execute({
    csvText: csv(["DGS-REL-1,ASM-NOT-FOUND,true,"]),
    expectedPlanVersionId: fixture.version.planVersionId
  });
  assert.equal(preview.canCommit(), false);
});

test("別Plan VersionのScenarioを拒否する", () => {
  const fixture = createFixture();
  const otherVersion = new ProductionPlanVersion({
    planVersionId: "PV-REL-2",
    planId: fixture.plan.planId,
    versionNumber: 2,
    versionName: "Version 2",
    createdAt: "2026-08-01T10:00:00+09:00"
  });
  const otherScenario = new DiagnosisScenario({
    diagnosisScenarioId: "DGS-REL-2",
    name: "別Version",
    planVersionId: otherVersion.planVersionId,
    capacityScenarioId: "CAP-REL-2",
    createdAt: "2026-08-01T10:01:00+09:00"
  });
  fixture.repositories.planVersions.add(otherVersion);
  fixture.repositories.diagnosisScenarios.add(otherScenario);
  const preview = fixture.preview.execute({
    csvText: csv(["DGS-REL-2,ASM-REL-1,true,"]),
    expectedPlanVersionId: fixture.version.planVersionId
  });
  assert.equal(preview.canCommit(), false);
});

test("Preview後にRepositoryが変わった場合はCommitを拒否する", async () => {
  const fixture = createFixture();
  const preview = fixture.preview.execute({
    csvText: csv(["DGS-REL-1,ASM-REL-1,true,"]),
    expectedPlanVersionId: fixture.version.planVersionId
  });
  fixture.repositories.assumptions.save(new Assumption({
    ...fixture.assumption.toSnapshot(),
    note: "Preview後に変更"
  }));
  await assert.rejects(
    fixture.commit.execute({ preview }),
    (error) => error.code === ERROR_CODES.IMPORT_STALE_PREVIEW
  );
  assert.equal(fixture.repositories.scenarioAssumptionRelations.count(), 0);
});

test("Errorを含むPreviewはCommitできない", async () => {
  const fixture = createFixture();
  const preview = fixture.preview.execute({
    csvText: csv(["DGS-NOT-FOUND,ASM-REL-1,true,"]),
    expectedPlanVersionId: fixture.version.planVersionId
  });
  await assert.rejects(
    fixture.commit.execute({ preview }),
    (error) => error.code === ERROR_CODES.IMPORT_COMMIT_NOT_ALLOWED
  );
});
