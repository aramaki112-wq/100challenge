import {
  ASSUMPTION_STATUS,
  ASSUMPTION_TARGET_TYPE,
  ASSUMPTION_TYPE,
  CAPACITY_RATE_BASIS,
  CAPACITY_RESOURCE_STATUS,
  CAPACITY_RULE_SOURCE,
  DATA_CONFIDENCE,
  EQUIPMENT_AVAILABILITY_STATUS,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";

import { ProductionPlan } from "./ProductionPlan.js";
import { ProductionPlanVersion } from "./ProductionPlanVersion.js";
import { PlannedOperation } from "./PlannedOperation.js";
import { DiagnosisScenario } from "./DiagnosisScenario.js";
import { Assumption } from "./Assumption.js";
import { ScenarioAssumptionRelation } from "./ScenarioAssumptionRelation.js";
import { CapacityBucket } from "./CapacityBucket.js";
import { CapacitySnapshot } from "./CapacitySnapshot.js";
import { DiagnosisExecutionData } from "./DiagnosisExecutionData.js";
import { InMemoryDiagnosisExecutionDataProvider } from "./InMemoryDiagnosisExecutionDataProvider.js";
import { createInMemoryDiagnosisRepositories } from "./InMemoryDiagnosisRepositories.js";
import { InMemoryRepositoryTransactionManager } from "./InMemoryRepositoryTransactionManager.js";
import { SequentialIdGenerator } from "./SequentialIdGenerator.js";
import { PlanDiagnosisEngine } from "./PlanDiagnosisEngine.js";
import { FixedClock } from "./FixedClock.js";
import { RunPlanDiagnosis } from "./RunPlanDiagnosis.js";

export const DIAGNOSIS_TIME = "2026-08-02T06:50:00+09:00";

export function createPlan(overrides = {}) {
  return new ProductionPlan({
    planId: "PLAN-0001",
    name: "8月生産計画",
    targetMonth: "2026-08",
    primaryFactoryId: "F-01",
    createdAt: "2026-08-01T18:00:00+09:00",
    active: true,
    ...overrides
  });
}

export function createPlanVersion(overrides = {}) {
  return new ProductionPlanVersion({
    planVersionId: "PV-0001",
    planId: "PLAN-0001",
    versionNumber: 1,
    versionName: "初版",
    createdAt: "2026-08-01T18:05:00+09:00",
    active: true,
    ...overrides
  });
}

export function createOperation(overrides = {}) {
  return new PlannedOperation({
    plannedOperationId: "POP-0001",
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

export function createScenario(overrides = {}) {
  return new DiagnosisScenario({
    diagnosisScenarioId: "DGS-0001",
    name: "基準診断",
    planVersionId: "PV-0001",
    capacityScenarioId: "CAP-BASE",
    createdAt: "2026-08-01T18:10:00+09:00",
    active: true,
    ...overrides
  });
}

export function createAssumption(overrides = {}) {
  return new Assumption({
    assumptionId: "ASM-0001",
    assumptionType: ASSUMPTION_TYPE.MATERIAL_ARRIVAL,
    targetType: ASSUMPTION_TARGET_TYPE.PLANNED_OPERATION,
    targetId: "POP-0001",
    description: "材料は計画日前に到着する",
    status: ASSUMPTION_STATUS.UNKNOWN,
    blocking: false,
    ...overrides
  });
}

export function createRelation(overrides = {}) {
  return new ScenarioAssumptionRelation({
    diagnosisScenarioId: "DGS-0001",
    assumptionId: "ASM-0001",
    active: true,
    ...overrides
  });
}

export function createCapacitySnapshot(overrides = {}) {
  const bucket = new CapacityBucket({
    factoryId: "F-01",
    equipmentId: "EQ-01",
    date: "2026-08-03",
    shiftId: null,
    availableMinutes: 420,
    availabilityStatus: EQUIPMENT_AVAILABILITY_STATUS.AVAILABLE,
    workerStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    skillStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    assignmentStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    reasonCodes: [],
    dataConfidence: DATA_CONFIDENCE.A
  });

  return new CapacitySnapshot({
    capacityScenarioId: "CAP-BASE",
    targetMonth: "2026-08",
    generatedAt: "2026-08-02T06:00:00+09:00",
    sourceRevision: { capacity: 3, calendar: 2 },
    buckets: [bucket],
    ...overrides
  });
}

export function createExecutionData(overrides = {}) {
  return new DiagnosisExecutionData({
    capacitySnapshot: createCapacitySnapshot(),
    equipments: [{ equipmentId: "EQ-01" }],
    orders: [{ orderId: "ORD-0001" }],
    routingOperations: [{
      routingOperationId: "ROP-0001",
      routingId: "ROUTING-001",
      sequence: 1
    }],
    capacityRules: [{
      capacityRuleId: "CR-001",
      equipmentId: "EQ-01",
      source: CAPACITY_RULE_SOURCE.DEFAULT_RULE,
      active: true,
      priority: 100,
      validFrom: "2026-01-01",
      validTo: "2026-12-31",
      capacityValue: 10,
      quantityUnit: QUANTITY_UNIT.PIECE,
      capacityBasis: CAPACITY_RATE_BASIS.HOUR,
      capacityMultiplier: 1
    }],
    externalInputRevision: {
      routing: 1,
      modelCoverage: 1
    },
    ...overrides
  });
}

export function createApplicationHarness({
  plan = createPlan(),
  planVersion = createPlanVersion(),
  operations = [createOperation()],
  scenario = createScenario(),
  assumptions = [],
  relations = [],
  executionData = createExecutionData(),
  idGenerator = new SequentialIdGenerator(),
  clock = new FixedClock(DIAGNOSIS_TIME),
  planDiagnosisEngine = null,
  diagnosisExecutionDataProvider = null
} = {}) {
  const repositories = createInMemoryDiagnosisRepositories();
  repositories.productionPlans.add(plan);
  repositories.planVersions.add(planVersion);
  repositories.plannedOperations.addAll(operations);
  repositories.diagnosisScenarios.add(scenario);
  repositories.assumptions.addAll(assumptions);
  repositories.scenarioAssumptionRelations.addAll(relations);

  const provider = diagnosisExecutionDataProvider ??
    new InMemoryDiagnosisExecutionDataProvider({ data: [executionData] });
  const engine = planDiagnosisEngine ??
    new PlanDiagnosisEngine({ idGenerator });
  const transactionManager = new InMemoryRepositoryTransactionManager({
    repositories
  });
  const service = new RunPlanDiagnosis({
    transactionManager,
    planDiagnosisEngine: engine,
    diagnosisExecutionDataProvider: provider,
    clock
  });

  return {
    repositories,
    provider,
    engine,
    transactionManager,
    service,
    plan,
    planVersion,
    operations,
    scenario
  };
}
