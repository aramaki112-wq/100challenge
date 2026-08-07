import test from "node:test";
import assert from "node:assert/strict";
import {
  CAPACITY_RESOURCE_STATUS,
  DATA_CONFIDENCE,
  DIAGNOSIS_SCENARIO_CATEGORY,
  EQUIPMENT_AVAILABILITY_STATUS,
  OPERATION_COMPARISON_OUTCOME,
  RESULT_VALIDITY_STATUS,
  SCENARIO_COMPARISON_OUTCOME
} from "./DiagnosisCodes.js";
import { CapacityBucket } from "./CapacityBucket.js";
import { CapacitySnapshot } from "./CapacitySnapshot.js";
import { DiagnosisExecutionData } from "./DiagnosisExecutionData.js";
import { InMemoryDiagnosisExecutionDataProvider } from "./InMemoryDiagnosisExecutionDataProvider.js";
import {
  createApplicationHarness,
  createCapacitySnapshot,
  createExecutionData,
  createOperation,
  createScenario
} from "./DiagnosisApplicationTestFixture.js";
import { ScenarioComparison } from "./ScenarioComparison.js";

function executionDataFor(capacityScenarioId, availableMinutes) {
  const bucket = new CapacityBucket({
    factoryId: "F-01",
    equipmentId: "EQ-01",
    date: "2026-08-03",
    shiftId: null,
    availableMinutes,
    availabilityStatus: EQUIPMENT_AVAILABILITY_STATUS.AVAILABLE,
    workerStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    skillStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    assignmentStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    reasonCodes: [],
    dataConfidence: DATA_CONFIDENCE.A
  });
  return createExecutionData({
    capacitySnapshot: new CapacitySnapshot({
      capacityScenarioId,
      targetMonth: "2026-08",
      generatedAt: "2026-08-02T06:00:00+09:00",
      sourceRevision: { capacity: availableMinutes, calendar: 1 },
      buckets: [bucket]
    })
  });
}

async function createComparison({ baseMinutes = 360, comparisonMinutes = 420 } = {}) {
  const baseScenario = createScenario();
  const comparisonScenario = createScenario({
    diagnosisScenarioId: "DGS-0002",
    name: "残業追加",
    capacityScenarioId: "CAP-COMP",
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.COMPARISON,
    baseDiagnosisScenarioId: "DGS-0001",
    changeSummary: "利用可能時間を60分追加"
  });
  const provider = new InMemoryDiagnosisExecutionDataProvider({
    data: [
      executionDataFor("CAP-BASE", baseMinutes),
      executionDataFor("CAP-COMP", comparisonMinutes)
    ]
  });
  const harness = createApplicationHarness({
    operations: [createOperation({ plannedQuantity: 60 })],
    scenario: baseScenario,
    diagnosisExecutionDataProvider: provider
  });
  harness.repositories.diagnosisScenarios.add(comparisonScenario);
  const baseResult = await harness.service.execute({ diagnosisScenarioId: "DGS-0001" });
  const comparisonResult = await harness.service.execute({ diagnosisScenarioId: "DGS-0002" });
  return {
    baseScenario,
    comparisonScenario,
    baseResult,
    comparisonResult,
    comparison: new ScenarioComparison({
      scenarioComparisonId: "SCMP-0001",
      baseScenario,
      comparisonScenario,
      baseResult,
      comparisonResult,
      comparedAt: "2026-08-02T07:00:00+09:00"
    })
  };
}

test("Scenario比較は不足減少をIMPROVEDとして集計する", async () => {
  const { comparison } = await createComparison({
    baseMinutes: 300,
    comparisonMinutes: 360
  });
  assert.equal(comparison.outcome, SCENARIO_COMPARISON_OUTCOME.IMPROVED);
  assert.equal(comparison.validityStatus, RESULT_VALIDITY_STATUS.CURRENT);
  assert.equal(comparison.changedOperationCount, 1);
  assert.equal(comparison.operationComparisons[0].outcome, OPERATION_COMPARISON_OUTCOME.IMPROVED);
  assert.equal(comparison.operationComparisons[0].deltas.shortageMinutes, -60);
  assert.equal(comparison.changeSummary, "利用可能時間を60分追加");
});

test("同じ結果はUNCHANGEDになる", async () => {
  const { comparison } = await createComparison({ baseMinutes: 360, comparisonMinutes: 360 });
  assert.equal(comparison.outcome, SCENARIO_COMPARISON_OUTCOME.UNCHANGED);
  assert.equal(comparison.operationOutcomeCounts.UNCHANGED, 1);
});

test("不足増加はWORSENEDになる", async () => {
  const { comparison } = await createComparison({ baseMinutes: 360, comparisonMinutes: 300 });
  assert.equal(comparison.outcome, SCENARIO_COMPARISON_OUTCOME.WORSENED);
  assert.equal(comparison.operationComparisons[0].deltas.shortageMinutes, 60);
});

test("UNKNOWNを含む差は良化・悪化と断定しない", async () => {
  const baseScenario = createScenario();
  const comparisonScenario = createScenario({
    diagnosisScenarioId: "DGS-0002",
    name: "未確認Scenario",
    capacityScenarioId: "CAP-UNKNOWN",
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.COMPARISON,
    baseDiagnosisScenarioId: "DGS-0001",
    changeSummary: "Capacityを未確認Dataへ変更"
  });
  const unknownSnapshot = createCapacitySnapshot({
    capacityScenarioId: "CAP-UNKNOWN",
    buckets: [new CapacityBucket({
      factoryId: "F-01",
      equipmentId: "EQ-01",
      date: "2026-08-03",
      shiftId: null,
      availableMinutes: null,
      availabilityStatus: EQUIPMENT_AVAILABILITY_STATUS.UNKNOWN,
      workerStatus: CAPACITY_RESOURCE_STATUS.UNKNOWN,
      skillStatus: CAPACITY_RESOURCE_STATUS.UNKNOWN,
      assignmentStatus: CAPACITY_RESOURCE_STATUS.UNKNOWN,
      reasonCodes: ["SOURCE_NOT_CONFIRMED"],
      dataConfidence: DATA_CONFIDENCE.D
    })]
  });
  const provider = new InMemoryDiagnosisExecutionDataProvider({
    data: [createExecutionData(), createExecutionData({ capacitySnapshot: unknownSnapshot })]
  });
  const harness = createApplicationHarness({
    scenario: baseScenario,
    diagnosisExecutionDataProvider: provider
  });
  harness.repositories.diagnosisScenarios.add(comparisonScenario);
  const baseResult = await harness.service.execute({ diagnosisScenarioId: "DGS-0001" });
  const comparisonResult = await harness.service.execute({ diagnosisScenarioId: "DGS-0002" });
  const comparison = new ScenarioComparison({
    scenarioComparisonId: "SCMP-0001",
    baseScenario,
    comparisonScenario,
    baseResult,
    comparisonResult,
    comparedAt: "2026-08-02T07:00:00+09:00"
  });
  assert.equal(comparison.outcome, SCENARIO_COMPARISON_OUTCOME.UNCERTAIN);
  assert.equal(comparison.operationComparisons[0].outcome, OPERATION_COMPARISON_OUTCOME.UNCERTAIN);
});

test("異なるPlan VersionのScenario比較を拒否する", async () => {
  const values = await createComparison();
  const differentScenario = createScenario({
    diagnosisScenarioId: "DGS-0099",
    planVersionId: "PV-9999",
    capacityScenarioId: "CAP-COMP",
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.EXPERIMENT
  });
  assert.throws(() => new ScenarioComparison({
    scenarioComparisonId: "SCMP-X",
    baseScenario: values.baseScenario,
    comparisonScenario: differentScenario,
    baseResult: values.baseResult,
    comparisonResult: values.comparisonResult,
    comparedAt: "2026-08-02T07:00:00+09:00"
  }), { code: "INVALID_SCENARIO_COMPARISON" });
});

test("Comparison Scenarioの比較元と異なるBaseを拒否する", async () => {
  const values = await createComparison();
  const wrongBase = createScenario({ diagnosisScenarioId: "DGS-0099" });
  assert.throws(() => new ScenarioComparison({
    scenarioComparisonId: "SCMP-X",
    baseScenario: wrongBase,
    comparisonScenario: values.comparisonScenario,
    baseResult: values.baseResult,
    comparisonResult: values.comparisonResult,
    comparedAt: "2026-08-02T07:00:00+09:00"
  }), { code: "INVALID_SCENARIO_COMPARISON" });
});

test("Snapshotは外部から変更できない", async () => {
  const { comparison } = await createComparison();
  const snapshot = comparison.toSnapshot();
  assert.throws(() => { snapshot.operationComparisons[0].outcome = "WORSENED"; }, TypeError);
  assert.throws(() => { snapshot.summaryDeltas.minutesSummary.knownShortageMinutes = 999; }, TypeError);
});
