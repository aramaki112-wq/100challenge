import test from "node:test";
import assert from "node:assert/strict";

import {
  DIAGNOSIS_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  createApplicationError,
  hasErrorCode
} from "./DiagnosisErrors.js";

import { SequentialIdGenerator } from "./SequentialIdGenerator.js";
import { FixedClock } from "./FixedClock.js";
import { PlanDiagnosisEngine } from "./PlanDiagnosisEngine.js";
import { RunPlanDiagnosis } from "./RunPlanDiagnosis.js";
import { InMemoryRepositoryTransactionManager } from "./InMemoryRepositoryTransactionManager.js";

import {
  DIAGNOSIS_TIME,
  createApplicationHarness,
  createAssumption,
  createCapacitySnapshot,
  createExecutionData,
  createOperation,
  createPlan,
  createPlanVersion,
  createRelation
} from "./DiagnosisApplicationTestFixture.js";

test("Repositoryから診断Sourceを組み立てResultをTransaction保存する", async () => {
  const { service, repositories } = createApplicationHarness();

  const result = await service.execute({
    diagnosisScenarioId: "DGS-0001"
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.FEASIBLE);
  assert.equal(result.diagnosedAt, DIAGNOSIS_TIME);
  assert.equal(repositories.diagnosisResults.count(), 1);
  assert.equal(
    repositories.diagnosisResults.getById(result.diagnosisResultId),
    result
  );
});

test("Repository Revisionと外部Revisionを診断時点へ保存する", async () => {
  const { service } = createApplicationHarness();
  const result = await service.execute({ diagnosisScenarioId: "DGS-0001" });

  assert.deepEqual(result.diagnosisInputRevision, {
    plan: 1,
    planVersion: 1,
    plannedOperation: 1,
    assumption: 0,
    diagnosisScenario: 1,
    scenarioAssumptionRelation: 0,
    routing: 1,
    modelCoverage: 1
  });
});

test("Scenarioにactive接続されたAssumptionだけをEngineへ渡す", async () => {
  const activeAssumption = createAssumption();
  const inactiveAssumption = createAssumption({
    assumptionId: "ASM-0002",
    targetId: "POP-0001",
    description: "運搬が間に合う"
  });
  const activeRelation = createRelation();
  const inactiveRelation = createRelation({
    assumptionId: "ASM-0002",
    active: false
  });
  const actualEngine = new PlanDiagnosisEngine({
    idGenerator: new SequentialIdGenerator()
  });
  let captured = null;
  const spyEngine = {
    diagnose(input) {
      captured = input;
      return actualEngine.diagnose(input);
    }
  };
  const { service } = createApplicationHarness({
    assumptions: [activeAssumption, inactiveAssumption],
    relations: [activeRelation, inactiveRelation],
    planDiagnosisEngine: spyEngine
  });

  await service.execute({ diagnosisScenarioId: "DGS-0001" });

  assert.deepEqual(
    captured.assumptions.map((value) => value.assumptionId),
    ["ASM-0001"]
  );
  assert.deepEqual(
    captured.scenarioAssumptionRelations.map((value) => value.assumptionId),
    ["ASM-0001"]
  );
});

test("inactive Production Planの診断を拒否する", async () => {
  const { service, repositories } = createApplicationHarness({
    plan: createPlan({ active: false })
  });

  await assert.rejects(
    () => service.execute({ diagnosisScenarioId: "DGS-0001" }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_EXECUTION_NOT_ALLOWED
    )
  );
  assert.equal(repositories.diagnosisResults.count(), 0);
});

test("inactive Plan Versionの診断を拒否する", async () => {
  const { service } = createApplicationHarness({
    planVersion: createPlanVersion({ active: false })
  });

  await assert.rejects(
    () => service.execute({ diagnosisScenarioId: "DGS-0001" }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_EXECUTION_NOT_ALLOWED
    )
  );
});

test("OperationがないPlan VersionをRead Model不整合として拒否する", async () => {
  const { service } = createApplicationHarness({ operations: [] });

  await assert.rejects(
    () => service.execute({ diagnosisScenarioId: "DGS-0001" }),
    (error) => hasErrorCode(error, ERROR_CODES.READ_MODEL_INTEGRITY_ERROR)
  );
});

test("Relationが存在するのにAssumption本体がなければ拒否する", async () => {
  const { service } = createApplicationHarness({
    relations: [createRelation()]
  });

  await assert.rejects(
    () => service.execute({ diagnosisScenarioId: "DGS-0001" }),
    (error) => hasErrorCode(error, ERROR_CODES.READ_MODEL_INTEGRITY_ERROR)
  );
});

test("Plan対象月とCapacity Snapshot対象月の不一致を拒否する", async () => {
  const mismatched = createExecutionData({
    capacitySnapshot: createCapacitySnapshot({
      targetMonth: "2026-09",
      buckets: []
    })
  });
  const provider = { async load() { return mismatched; } };
  const { service } = createApplicationHarness({
    diagnosisExecutionDataProvider: provider
  });

  await assert.rejects(
    () => service.execute({ diagnosisScenarioId: "DGS-0001" }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT
    )
  );
});

test("診断読込中にSource Repositoryが変われば保存しない", async () => {
  const executionData = createExecutionData();
  let repositories;
  const provider = {
    async load() {
      repositories.plannedOperations.add(createOperation({
        plannedOperationId: "POP-0002",
        orderId: "ORD-0002",
        routingOperationId: "ROP-0002"
      }));
      return executionData;
    }
  };
  const harness = createApplicationHarness({
    diagnosisExecutionDataProvider: provider
  });
  repositories = harness.repositories;

  await assert.rejects(
    () => harness.service.execute({ diagnosisScenarioId: "DGS-0001" }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_SOURCE_CHANGED_DURING_EXECUTION
    )
  );
  assert.equal(repositories.diagnosisResults.count(), 0);
});

test("Engine失敗時はDiagnosis Resultを保存しない", async () => {
  const failingEngine = {
    diagnose() {
      throw createApplicationError(
        ERROR_CODES.INVALID_RUN_PLAN_DIAGNOSIS,
        "forced failure"
      );
    }
  };
  const { service, repositories } = createApplicationHarness({
    planDiagnosisEngine: failingEngine
  });

  await assert.rejects(
    () => service.execute({ diagnosisScenarioId: "DGS-0001" }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_RUN_PLAN_DIAGNOSIS)
  );
  assert.equal(repositories.diagnosisResults.count(), 0);
});

test("Result保存失敗時はTransactionが既存状態を維持する", async () => {
  const harness = createApplicationHarness();
  const first = await harness.service.execute({
    diagnosisScenarioId: "DGS-0001"
  });
  assert.equal(first.diagnosisResultId, "DR-0001");

  const secondService = new RunPlanDiagnosis({
    transactionManager: new InMemoryRepositoryTransactionManager({
      repositories: harness.repositories
    }),
    planDiagnosisEngine: new PlanDiagnosisEngine({
      idGenerator: new SequentialIdGenerator()
    }),
    diagnosisExecutionDataProvider: harness.provider,
    clock: new FixedClock(DIAGNOSIS_TIME)
  });

  await assert.rejects(
    () => secondService.execute({ diagnosisScenarioId: "DGS-0001" }),
    (error) => hasErrorCode(error, ERROR_CODES.DUPLICATE_ENTITY)
  );

  assert.equal(harness.repositories.diagnosisResults.count(), 1);
  assert.equal(
    harness.repositories.diagnosisResults.getById("DR-0001"),
    first
  );
});

test("外部RevisionがRepository Revisionを上書きする場合を拒否する", async () => {
  const executionData = createExecutionData({
    externalInputRevision: { plan: 99 }
  });
  const { service } = createApplicationHarness({ executionData });

  await assert.rejects(
    () => service.execute({ diagnosisScenarioId: "DGS-0001" }),
    (error) => hasErrorCode(error, ERROR_CODES.READ_MODEL_INTEGRITY_ERROR)
  );
});

test("不正なDiagnosis Scenario IDを早期に拒否する", async () => {
  const { service } = createApplicationHarness();

  await assert.rejects(
    () => service.execute({ diagnosisScenarioId: "bad id" }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_RUN_PLAN_DIAGNOSIS)
  );
});
