import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSUMPTION_STATUS,
  ASSUMPTION_TARGET_TYPE,
  ASSUMPTION_TYPE,
  DIAGNOSIS_SCENARIO_CATEGORY,
  PLAN_VERSION_STATUS,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";
import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";
import { ProductionPlan } from "./ProductionPlan.js";
import { ProductionPlanVersion } from "./ProductionPlanVersion.js";
import { PlannedOperation } from "./PlannedOperation.js";
import { Assumption } from "./Assumption.js";
import { DiagnosisScenario } from "./DiagnosisScenario.js";
import { ScenarioAssumptionRelation } from "./ScenarioAssumptionRelation.js";
import { createValidityTestDiagnosisResult } from "./DiagnosisValidityTestFixture.js";
import {
  InMemoryProductionPlanRepository,
  InMemoryProductionPlanVersionRepository,
  InMemoryPlannedOperationRepository,
  InMemoryAssumptionRepository,
  InMemoryDiagnosisScenarioRepository,
  InMemoryScenarioAssumptionRelationRepository,
  InMemoryDiagnosisResultRepository,
  createInMemoryDiagnosisRepositories
} from "./InMemoryDiagnosisRepositories.js";

function plan(id = "PLAN-0001", overrides = {}) {
  return new ProductionPlan({
    planId: id,
    name: `Plan ${id}`,
    targetMonth: "2026-08",
    primaryFactoryId: "F-01",
    createdAt: "2026-08-02T05:00:00+09:00",
    ...overrides
  });
}

function version(id = "PV-0001", overrides = {}) {
  return new ProductionPlanVersion({
    planVersionId: id,
    planId: "PLAN-0001",
    versionNumber: 1,
    versionName: "Version 1",
    status: PLAN_VERSION_STATUS.DRAFT,
    createdAt: "2026-08-02T05:05:00+09:00",
    ...overrides
  });
}

function operation(id = "POP-0001", overrides = {}) {
  return new PlannedOperation({
    plannedOperationId: id,
    planVersionId: "PV-0001",
    orderId: "ORD-0001",
    routingOperationId: "ROP-0001",
    equipmentId: "EQ-01",
    plannedDate: "2026-08-03",
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    ...overrides
  });
}

function assumption(id = "ASM-0001", overrides = {}) {
  return new Assumption({
    assumptionId: id,
    assumptionType: ASSUMPTION_TYPE.MATERIAL_ARRIVAL,
    targetType: ASSUMPTION_TARGET_TYPE.PLANNED_OPERATION,
    targetId: "POP-0001",
    description: "Material arrives before execution.",
    status: ASSUMPTION_STATUS.UNKNOWN,
    blocking: true,
    ...overrides
  });
}

function scenario(id = "DGS-0001", overrides = {}) {
  return new DiagnosisScenario({
    diagnosisScenarioId: id,
    name: `Scenario ${id}`,
    planVersionId: "PV-0001",
    capacityScenarioId: "CS-0001",
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.BASE,
    createdAt: "2026-08-02T05:10:00+09:00",
    ...overrides
  });
}

test("ProductionPlan Repositoryは月・Factory・Activeで検索する", () => {
  const repository = new InMemoryProductionPlanRepository();
  repository.add(plan("PLAN-0001"));
  repository.add(plan("PLAN-0002", {
    targetMonth: "2026-09",
    primaryFactoryId: "F-02",
    active: false
  }));

  assert.deepEqual(
    repository.findByTargetMonth("2026-08").map((item) => item.planId),
    ["PLAN-0001"]
  );
  assert.deepEqual(
    repository.findByPrimaryFactoryId("F-02").map((item) => item.planId),
    ["PLAN-0002"]
  );
  assert.deepEqual(repository.findActive().map((item) => item.planId), [
    "PLAN-0001"
  ]);
});

test("Plan Version RepositoryはPlan内Version番号の重複を拒否する", () => {
  const repository = new InMemoryProductionPlanVersionRepository();
  repository.add(version("PV-0001"));

  assert.throws(
    () => repository.add(version("PV-0002", { versionName: "Duplicate" })),
    (error) => hasErrorCode(error, ERROR_CODES.DUPLICATE_UNIQUE_KEY)
  );
});

test("Plan Version RepositoryはVersion番号順と最新Versionを返す", () => {
  const repository = new InMemoryProductionPlanVersionRepository();
  repository.add(version("PV-0002", {
    versionNumber: 2,
    versionName: "Version 2"
  }));
  repository.add(version("PV-0001"));

  assert.deepEqual(repository.findByPlanId("PLAN-0001").map(
    (item) => item.planVersionId
  ), ["PV-0001", "PV-0002"]);
  assert.equal(
    repository.findLatestByPlanId("PLAN-0001").planVersionId,
    "PV-0002"
  );
  assert.equal(repository.findByStatus(PLAN_VERSION_STATUS.DRAFT).length, 2);
});

test("Planned Operation RepositoryはVersion・Order・設備日で検索する", () => {
  const repository = new InMemoryPlannedOperationRepository();
  repository.add(operation("POP-0001"));
  repository.add(operation("POP-0002", {
    orderId: "ORD-0002",
    equipmentId: "EQ-02"
  }));

  assert.equal(repository.findByPlanVersionId("PV-0001").length, 2);
  assert.deepEqual(repository.findByOrderId("ORD-0002").map(
    (item) => item.plannedOperationId
  ), ["POP-0002"]);
  assert.deepEqual(repository.findByEquipmentAndDate(
    "EQ-01",
    "2026-08-03"
  ).map((item) => item.plannedOperationId), ["POP-0001"]);
});

test("Assumption Repositoryは対象・Status・blockingで検索する", () => {
  const repository = new InMemoryAssumptionRepository();
  repository.add(assumption("ASM-0001"));
  repository.add(assumption("ASM-0002", {
    targetId: "POP-0002",
    blocking: false
  }));

  assert.equal(repository.findByTarget(
    ASSUMPTION_TARGET_TYPE.PLANNED_OPERATION,
    "POP-0001"
  ).length, 1);
  assert.equal(repository.findByStatus(ASSUMPTION_STATUS.UNKNOWN).length, 2);
  assert.deepEqual(repository.findBlocking().map(
    (item) => item.assumptionId
  ), ["ASM-0001"]);
});

test("Diagnosis Scenario RepositoryはPlan VersionとActiveで検索する", () => {
  const repository = new InMemoryDiagnosisScenarioRepository();
  repository.add(scenario("DGS-0001"));
  repository.add(scenario("DGS-0002", {
    planVersionId: "PV-0002",
    active: false,
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.ARCHIVED
  }));

  assert.equal(repository.findByPlanVersionId("PV-0001").length, 1);
  assert.deepEqual(repository.findActiveByPlanVersionId("PV-0001").map(
    (item) => item.diagnosisScenarioId
  ), ["DGS-0001"]);
});

test("Scenario Assumption Relation Repositoryは接続方向別に検索する", () => {
  const repository = new InMemoryScenarioAssumptionRelationRepository();
  repository.add(new ScenarioAssumptionRelation({
    diagnosisScenarioId: "DGS-0001",
    assumptionId: "ASM-0001"
  }));
  repository.add(new ScenarioAssumptionRelation({
    diagnosisScenarioId: "DGS-0001",
    assumptionId: "ASM-0002",
    active: false
  }));

  assert.equal(repository.findByScenarioId("DGS-0001").length, 2);
  assert.equal(repository.findByAssumptionId("ASM-0001").length, 1);
  assert.deepEqual(repository.findActiveByScenarioId("DGS-0001").map(
    (item) => item.assumptionId
  ), ["ASM-0001"]);
});

test("Diagnosis Result RepositoryはScenario・Plan Versionから検索する", () => {
  const repository = new InMemoryDiagnosisResultRepository();
  const result = createValidityTestDiagnosisResult();
  repository.add(result);

  assert.equal(repository.findByScenarioId("DGS-0001")[0], result);
  assert.equal(repository.findByPlanVersionId("PV-0001")[0], result);
  assert.equal(repository.findLatestByScenarioId("DGS-0001"), result);
  assert.equal(repository.findLatestByScenarioId("DGS-9999"), null);
});

test("Repository Setは正式な7種類を一括生成する", () => {
  const repositories = createInMemoryDiagnosisRepositories();
  assert.equal(Object.isFrozen(repositories), true);
  assert.equal(repositories.productionPlans.count(), 0);
  assert.equal(repositories.planVersions.count(), 0);
  assert.equal(repositories.plannedOperations.count(), 0);
  assert.equal(repositories.assumptions.count(), 0);
  assert.equal(repositories.diagnosisScenarios.count(), 0);
  assert.equal(repositories.scenarioAssumptionRelations.count(), 0);
  assert.equal(repositories.diagnosisResults.count(), 0);
});
