import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSUMPTION_EFFECTIVE_STATUS,
  ASSUMPTION_IMPACT_LEVEL,
  ASSUMPTION_RESOLUTION_STATUS,
  ASSUMPTION_STATUS,
  ASSUMPTION_TARGET_TYPE,
  ASSUMPTION_TYPE,
  CAPACITY_STATUS,
  CONSTRAINT_CATEGORY,
  CONSTRAINT_SEVERITY,
  DATA_CONFIDENCE,
  DIAGNOSIS_STATUS,
  FINDING_CONFIRMATION_STATUS,
  FINDING_SOURCE_TYPE,
  MODEL_COVERAGE_STATUS,
  NEXT_CHECK_PRIORITY,
  NEXT_CHECK_SOURCE_TYPE,
  NEXT_CHECK_STATUS,
  NEXT_CHECK_TYPE,
  OPERATION_STATUS_REASON,
  QUANTITY_UNIT,
  ROUTING_STATUS
} from "./DiagnosisCodes.js";
import { ERROR_CODES, hasErrorCode } from "./DiagnosisErrors.js";
import { createInMemoryDiagnosisRepositories } from "./InMemoryDiagnosisRepositories.js";
import {
  createPlan,
  createPlanVersion,
  createScenario,
  createRelation,
  createAssumption,
  createApplicationHarness
} from "./DiagnosisApplicationTestFixture.js";
import { ConstraintFinding } from "./ConstraintFinding.js";
import { AssumptionFinding } from "./AssumptionFinding.js";
import { NextCheck } from "./NextCheck.js";
import { OperationDiagnosisResult } from "./OperationDiagnosisResult.js";
import { DiagnosisSummary } from "./DiagnosisSummary.js";
import { DiagnosisResult } from "./DiagnosisResult.js";
import {
  ACTION_ITEM_TYPE,
  RepositoryDiagnosisReadModel,
  assertRepositoryDiagnosisReadModel
} from "./RepositoryDiagnosisReadModel.js";

async function createDiagnosedHarness() {
  const harness = createApplicationHarness();
  const diagnosisResult = await harness.service.execute({
    diagnosisScenarioId: harness.scenario.diagnosisScenarioId
  });
  return { ...harness, diagnosisResult };
}

function createActionDiagnosisResult() {
  const diagnosedAt = "2026-08-02T07:30:00+09:00";
  const constraint = new ConstraintFinding({
    findingId: "CF-ACT-1",
    plannedOperationId: "POP-0001",
    category: CONSTRAINT_CATEGORY.CAPACITY,
    reasonCode: "CAPACITY_SHORTAGE",
    severity: CONSTRAINT_SEVERITY.HIGH,
    confirmationStatus: FINDING_CONFIRMATION_STATUS.CONFIRMED,
    title: "設備時間が不足しています",
    description: "必要時間に対して利用可能時間が不足しています。",
    blocking: true,
    preventsExecution: false,
    sourceType: FINDING_SOURCE_TYPE.CAPACITY_ALLOCATION,
    sourceId: "CAL-0001",
    observedAt: diagnosedAt,
    dataConfidence: DATA_CONFIDENCE.A,
    requiredValue: 480,
    availableValue: 420,
    shortageValue: 60,
    unit: "MINUTE",
    recommendedAction: "別Shiftへの移動を検討する"
  });
  const assumption = new AssumptionFinding({
    findingId: "AF-ACT-1",
    plannedOperationId: "POP-0001",
    assumptionId: "ASM-0001",
    assumptionType: ASSUMPTION_TYPE.MATERIAL_ARRIVAL,
    targetType: ASSUMPTION_TARGET_TYPE.PLANNED_OPERATION,
    targetId: "POP-0001",
    assumptionStatus: ASSUMPTION_STATUS.EXPECTED,
    effectiveStatus: ASSUMPTION_EFFECTIVE_STATUS.EXPECTED,
    resolutionStatus: ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED,
    blocking: true,
    impactLevel: ASSUMPTION_IMPACT_LEVEL.HIGH,
    description: "材料到着が未確認です。",
    evaluatedOn: "2026-08-03",
    owner: "生産管理",
    confirmationDueDate: "2026-08-02",
    recommendedAction: "仕入先へ確認する"
  });
  const nextCheck = new NextCheck({
    nextCheckId: "NC-ACT-1",
    plannedOperationId: "POP-0001",
    sourceType: NEXT_CHECK_SOURCE_TYPE.ASSUMPTION_FINDING,
    sourceId: "AF-ACT-1",
    checkType: NEXT_CHECK_TYPE.CONFIRM_ASSUMPTION,
    priority: NEXT_CHECK_PRIORITY.HIGH,
    status: NEXT_CHECK_STATUS.OPEN,
    title: "材料到着を確認する",
    description: "仕入先へ到着予定を確認してください。",
    owner: "生産管理",
    dueDate: "2026-08-02",
    createdAt: "2026-08-01T21:00:00+09:00"
  });
  const operation = new OperationDiagnosisResult({
    operationDiagnosisResultId: "ODR-ACT-1",
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    plannedOperationId: "POP-0001",
    orderId: "ORD-0001",
    routingOperationId: "ROP-0001",
    factoryId: "F-01",
    equipmentId: "EQ-01",
    plannedDate: "2026-08-03",
    quantityUnit: QUANTITY_UNIT.PIECE,
    plannedQuantity: 60,
    capacityExecutableQuantity: 40,
    requiredMinutes: 480,
    allocatedMinutes: 420,
    status: DIAGNOSIS_STATUS.UNKNOWN,
    primaryReasonCode: OPERATION_STATUS_REASON.BLOCKING_ASSUMPTION_UNRESOLVED,
    capacityStatus: CAPACITY_STATUS.PARTIALLY_FEASIBLE,
    assumptionStatus: ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED,
    routingStatus: ROUTING_STATUS.VALID,
    modelCoverageStatus: MODEL_COVERAGE_STATUS.MODELED,
    constraintFindings: [constraint],
    assumptionFindings: [assumption],
    nextChecks: [nextCheck],
    diagnosedAt
  });
  const summary = new DiagnosisSummary({
    diagnosisSummaryId: "DS-ACT-1",
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    operationResults: [operation],
    generatedAt: diagnosedAt
  });
  return new DiagnosisResult({
    diagnosisResultId: "DR-ACT-1",
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    capacityScenarioId: "CAP-BASE",
    targetMonth: "2026-08",
    operationResults: [operation],
    summary,
    diagnosedAt,
    capacitySnapshotGeneratedAt: "2026-08-02T06:00:00+09:00",
    capacitySourceRevision: { capacity: 1 },
    diagnosisInputRevision: { plan: 1 }
  });
}

test("Plan一覧はVersion・Scenario・最新診断を結合して不変Dataを返す", async () => {
  const { repositories, diagnosisResult } = await createDiagnosedHarness();
  const readModel = new RepositoryDiagnosisReadModel({ repositories });
  const rows = readModel.listPlanSummaries({ targetMonth: "2026-08" });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].latestPlanVersionId, "PV-0001");
  assert.equal(rows[0].activeScenarioCount, 1);
  assert.equal(rows[0].latestDiagnosis.diagnosisResultId, diagnosisResult.diagnosisResultId);
  assert.equal(Object.isFrozen(rows), true);
  assert.equal(Object.isFrozen(rows[0].latestDiagnosis.statusCounts), true);
});

test("Plan一覧はactiveOnlyと対象月で絞り込める", () => {
  const repositories = createInMemoryDiagnosisRepositories();
  repositories.productionPlans.add(createPlan({ active: false }));
  const readModel = new RepositoryDiagnosisReadModel({ repositories });
  assert.equal(readModel.listPlanSummaries({ activeOnly: true }).length, 0);
  assert.equal(readModel.listPlanSummaries({ targetMonth: "2026-09" }).length, 0);
});

test("Scenario一覧はActive Assumption数と最新診断を返す", async () => {
  const harness = createApplicationHarness({
    assumptions: [createAssumption()],
    relations: [createRelation()]
  });
  await harness.service.execute({ diagnosisScenarioId: "DGS-0001" });
  const readModel = new RepositoryDiagnosisReadModel({ repositories: harness.repositories });
  const rows = readModel.listScenarioSummaries({ planVersionId: "PV-0001" });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].activeAssumptionCount, 1);
  assert.equal(rows[0].latestDiagnosis.operationCount, 1);
});

test("存在しないPlan VersionのScenario一覧はENTITY_NOT_FOUNDになる", () => {
  const repositories = createInMemoryDiagnosisRepositories();
  const readModel = new RepositoryDiagnosisReadModel({ repositories });
  assert.throws(
    () => readModel.listScenarioSummaries({ planVersionId: "PV-MISSING" }),
    (error) => hasErrorCode(error, ERROR_CODES.ENTITY_NOT_FOUND)
  );
});

test("未診断ScenarioのOverviewはhasDiagnosisResult=falseを返す", () => {
  const repositories = createInMemoryDiagnosisRepositories();
  repositories.productionPlans.add(createPlan());
  repositories.planVersions.add(createPlanVersion());
  repositories.diagnosisScenarios.add(createScenario());
  const readModel = new RepositoryDiagnosisReadModel({ repositories });
  const overview = readModel.getLatestDiagnosisOverview({ diagnosisScenarioId: "DGS-0001" });
  assert.equal(overview.hasDiagnosisResult, false);
  assert.equal(overview.latestDiagnosis, null);
});

test("診断詳細はPlan・Version・Scenario・Summary・Operationを一つに束ねる", async () => {
  const { repositories, diagnosisResult } = await createDiagnosedHarness();
  const readModel = new RepositoryDiagnosisReadModel({ repositories });
  const detail = readModel.getDiagnosisResultDetail({
    diagnosisResultId: diagnosisResult.diagnosisResultId
  });
  assert.equal(detail.plan.planId, "PLAN-0001");
  assert.equal(detail.planVersion.planVersionId, "PV-0001");
  assert.equal(detail.scenario.diagnosisScenarioId, "DGS-0001");
  assert.equal(detail.operationResults.length, 1);
  assert.equal(Object.isFrozen(detail.operationResults[0]), true);
});

test("要対応項目はConstraint・Assumption・Next Checkを優先順で返す", () => {
  const repositories = createInMemoryDiagnosisRepositories();
  repositories.productionPlans.add(createPlan());
  repositories.planVersions.add(createPlanVersion());
  repositories.diagnosisScenarios.add(createScenario());
  repositories.diagnosisResults.add(createActionDiagnosisResult());
  const readModel = new RepositoryDiagnosisReadModel({ repositories });
  const items = readModel.listActionItems({
    diagnosisResultId: "DR-ACT-1",
    evaluationDate: "2026-08-03"
  });
  assert.equal(items.length, 3);
  assert.equal(items[0].overdue, true);
  assert.deepEqual(new Set(items.map((item) => item.type)), new Set([
    ACTION_ITEM_TYPE.CONSTRAINT,
    ACTION_ITEM_TYPE.ASSUMPTION,
    ACTION_ITEM_TYPE.NEXT_CHECK
  ]));
  assert.equal(Object.isFrozen(items), true);
});

test("assertRepositoryDiagnosisReadModelは別Objectを拒否する", () => {
  assert.throws(
    () => assertRepositoryDiagnosisReadModel({}),
    (error) => hasErrorCode(error, ERROR_CODES.READ_MODEL_INTEGRITY_ERROR)
  );
});

test("Comparison Scenarioは比較元との最新診断差分を返す", async () => {
  const {
    CAPACITY_RESOURCE_STATUS,
    DATA_CONFIDENCE,
    DIAGNOSIS_SCENARIO_CATEGORY,
    EQUIPMENT_AVAILABILITY_STATUS
  } = await import("./DiagnosisCodes.js");
  const { CapacityBucket } = await import("./CapacityBucket.js");
  const { CapacitySnapshot } = await import("./CapacitySnapshot.js");
  const { InMemoryDiagnosisExecutionDataProvider } = await import("./InMemoryDiagnosisExecutionDataProvider.js");
  const { createExecutionData } = await import("./DiagnosisApplicationTestFixture.js");

  const comparisonScenario = createScenario({
    diagnosisScenarioId: "DGS-0002",
    name: "残業追加",
    capacityScenarioId: "CAP-COMP",
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.COMPARISON,
    baseDiagnosisScenarioId: "DGS-0001",
    changeSummary: "利用可能時間を60分追加"
  });
  const comparisonBucket = new CapacityBucket({
    factoryId: "F-01",
    equipmentId: "EQ-01",
    date: "2026-08-03",
    shiftId: null,
    availableMinutes: 360,
    availabilityStatus: EQUIPMENT_AVAILABILITY_STATUS.AVAILABLE,
    workerStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    skillStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    assignmentStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    reasonCodes: [],
    dataConfidence: DATA_CONFIDENCE.A
  });
  const provider = new InMemoryDiagnosisExecutionDataProvider({
    data: [
      createExecutionData({
        capacitySnapshot: new CapacitySnapshot({
          capacityScenarioId: "CAP-BASE",
          targetMonth: "2026-08",
          generatedAt: "2026-08-02T06:00:00+09:00",
          sourceRevision: { capacity: 1 },
          buckets: [new CapacityBucket({
            factoryId: "F-01",
            equipmentId: "EQ-01",
            date: "2026-08-03",
            shiftId: null,
            availableMinutes: 300,
            availabilityStatus: EQUIPMENT_AVAILABILITY_STATUS.AVAILABLE,
            workerStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
            skillStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
            assignmentStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
            reasonCodes: [],
            dataConfidence: DATA_CONFIDENCE.A
          })]
        })
      }),
      createExecutionData({
        capacitySnapshot: new CapacitySnapshot({
          capacityScenarioId: "CAP-COMP",
          targetMonth: "2026-08",
          generatedAt: "2026-08-02T06:00:00+09:00",
          sourceRevision: { capacity: 2 },
          buckets: [comparisonBucket]
        })
      })
    ]
  });
  const harness = createApplicationHarness({
    diagnosisExecutionDataProvider: provider
  });
  harness.repositories.diagnosisScenarios.add(comparisonScenario);
  await harness.service.execute({ diagnosisScenarioId: "DGS-0001" });
  await harness.service.execute({ diagnosisScenarioId: "DGS-0002" });

  const readModel = new RepositoryDiagnosisReadModel({ repositories: harness.repositories });
  const result = readModel.getScenarioComparison({ comparisonScenarioId: "DGS-0002" });
  assert.equal(result.comparisonAvailable, true);
  assert.equal(result.comparison.outcome, "IMPROVED");
  assert.equal(result.comparison.operationComparisons[0].deltas.shortageMinutes, -60);
  assert.equal(Object.isFrozen(result.comparison), true);
});

test("比較元または診断結果がなければ比較不可理由を返す", () => {
  const repositories = createInMemoryDiagnosisRepositories();
  repositories.productionPlans.add(createPlan());
  repositories.planVersions.add(createPlanVersion());
  repositories.diagnosisScenarios.add(createScenario());
  const readModel = new RepositoryDiagnosisReadModel({ repositories });
  const result = readModel.getScenarioComparison({ comparisonScenarioId: "DGS-0001" });
  assert.equal(result.comparisonAvailable, false);
  assert.equal(result.reasonCode, "BASE_SCENARIO_NOT_CONFIGURED");
});
