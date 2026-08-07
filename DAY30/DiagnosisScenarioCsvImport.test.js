import test from "node:test";
import assert from "node:assert/strict";

import { ProductionPlan } from "./ProductionPlan.js";
import { ProductionPlanVersion } from "./ProductionPlanVersion.js";
import { DiagnosisScenario } from "./DiagnosisScenario.js";
import { createInMemoryDiagnosisRepositories } from "./InMemoryDiagnosisRepositories.js";
import { InMemoryRepositoryTransactionManager } from "./InMemoryRepositoryTransactionManager.js";
import { FixedClock } from "./FixedClock.js";
import { SequentialIdGenerator } from "./SequentialIdGenerator.js";
import { PreviewDiagnosisScenarioCsvImport } from "./PreviewDiagnosisScenarioCsvImport.js";
import { CommitDiagnosisScenarioCsvImport } from "./CommitDiagnosisScenarioCsvImport.js";
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
  repositories.productionPlans.add(plan);
  repositories.planVersions.add(version);
  const clock = new FixedClock("2026-08-02T09:00:00+09:00");
  const transactionManager = new InMemoryRepositoryTransactionManager({ repositories });
  return {
    repositories,
    preview: new PreviewDiagnosisScenarioCsvImport({
      planVersionRepository: repositories.planVersions,
      diagnosisScenarioRepository: repositories.diagnosisScenarios,
      clock,
      idGenerator: new SequentialIdGenerator()
    }),
    commit: new CommitDiagnosisScenarioCsvImport({ transactionManager, clock })
  };
}

test("BASEとCOMPARISON Scenarioを同一CSVからCommitできる", async () => {
  const { repositories, preview, commit } = setup();
  const csv = [
    "diagnosisScenarioId,name,planVersionId,capacityScenarioId,scenarioCategory,baseDiagnosisScenarioId,changeSummary,createdAt",
    "DGS-BASE,基準,PV-1,CAP-BASE,BASE,,,2026-08-02T09:00:00+09:00",
    "DGS-COMP,残業追加,PV-1,CAP-OT,COMPARISON,DGS-BASE,残業2時間,2026-08-02T09:01:00+09:00"
  ].join("\n");
  const result = preview.execute({ csvText: csv, expectedPlanVersionId: "PV-1" });
  assert.equal(result.canCommit(), true);
  assert.equal(result.counts.add, 2);
  const committed = await commit.execute({ preview: result });
  assert.equal(committed.added, 2);
  assert.equal(repositories.diagnosisScenarios.count(), 2);
});

test("存在しない比較元ScenarioをErrorにする", () => {
  const { preview } = setup();
  const result = preview.execute({
    csvText: [
      "diagnosisScenarioId,name,planVersionId,capacityScenarioId,scenarioCategory,baseDiagnosisScenarioId,changeSummary,createdAt",
      "DGS-COMP,比較,PV-1,CAP-2,COMPARISON,DGS-NONE,変更,2026-08-02T09:00:00+09:00"
    ].join("\n"),
    expectedPlanVersionId: "PV-1"
  });
  assert.equal(result.canCommit(), false);
  assert.equal(result.rows[0].previewStatus, "ERROR");
});

test("別Plan Versionに属する既存Scenarioの上書きを拒否する", () => {
  const { repositories, preview } = setup();
  repositories.diagnosisScenarios.add(new DiagnosisScenario({
    diagnosisScenarioId: "DGS-1",
    name: "別Version",
    planVersionId: "PV-OTHER",
    capacityScenarioId: "CAP-1",
    createdAt: "2026-08-01T09:00:00+09:00"
  }));
  const result = preview.execute({
    csvText: [
      "diagnosisScenarioId,name,planVersionId,capacityScenarioId,scenarioCategory,createdAt",
      "DGS-1,基準,PV-1,CAP-1,BASE,2026-08-02T09:00:00+09:00"
    ].join("\n"),
    expectedPlanVersionId: "PV-1"
  });
  assert.equal(result.canCommit(), false);
});

test("Scenario Preview後のRepository変更を検出する", async () => {
  const { repositories, preview, commit } = setup();
  const result = preview.execute({
    csvText: [
      "diagnosisScenarioId,name,planVersionId,capacityScenarioId,scenarioCategory,createdAt",
      "DGS-1,基準,PV-1,CAP-1,BASE,2026-08-02T09:00:00+09:00"
    ].join("\n"),
    expectedPlanVersionId: "PV-1"
  });
  repositories.diagnosisScenarios.add(new DiagnosisScenario({
    diagnosisScenarioId: "DGS-X",
    name: "X",
    planVersionId: "PV-1",
    capacityScenarioId: "CAP-X",
    createdAt: "2026-08-02T09:02:00+09:00"
  }));
  await assert.rejects(
    () => commit.execute({ preview: result }),
    (error) => hasErrorCode(error, ERROR_CODES.IMPORT_STALE_PREVIEW)
  );
});
