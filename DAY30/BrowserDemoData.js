import {
  CAPACITY_RATE_BASIS,
  CAPACITY_RESOURCE_STATUS,
  CAPACITY_RULE_SOURCE,
  DATA_CONFIDENCE,
  DIAGNOSIS_SCENARIO_CATEGORY,
  EQUIPMENT_AVAILABILITY_STATUS,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";
import { ProductionPlan } from "./ProductionPlan.js";
import { ProductionPlanVersion } from "./ProductionPlanVersion.js";
import { PlannedOperation } from "./PlannedOperation.js";
import { DiagnosisScenario } from "./DiagnosisScenario.js";
import { CapacityBucket } from "./CapacityBucket.js";
import { CapacitySnapshot } from "./CapacitySnapshot.js";
import { DiagnosisExecutionData } from "./DiagnosisExecutionData.js";
import { InMemoryDiagnosisExecutionDataProvider } from "./InMemoryDiagnosisExecutionDataProvider.js";
import { createInMemoryDiagnosisRepositories } from "./InMemoryDiagnosisRepositories.js";
import { InMemoryRepositoryTransactionManager } from "./InMemoryRepositoryTransactionManager.js";
import { SequentialIdGenerator } from "./SequentialIdGenerator.js";
import { PlanDiagnosisEngine } from "./PlanDiagnosisEngine.js";
import { SystemClock } from "./SystemClock.js";
import { RunPlanDiagnosis } from "./RunPlanDiagnosis.js";
import { PreviewPlannedOperationCsvImport } from "./PreviewPlannedOperationCsvImport.js";
import { CommitPlannedOperationCsvImport } from "./CommitPlannedOperationCsvImport.js";
import { PreviewAssumptionCsvImport } from "./PreviewAssumptionCsvImport.js";
import { CommitAssumptionCsvImport } from "./CommitAssumptionCsvImport.js";
import { PreviewDiagnosisScenarioCsvImport } from "./PreviewDiagnosisScenarioCsvImport.js";
import { CommitDiagnosisScenarioCsvImport } from "./CommitDiagnosisScenarioCsvImport.js";
import { PreviewScenarioAssumptionRelationCsvImport } from "./PreviewScenarioAssumptionRelationCsvImport.js";
import { CommitScenarioAssumptionRelationCsvImport } from "./CommitScenarioAssumptionRelationCsvImport.js";
import { DiagnosisRepositorySnapshotService } from "./DiagnosisRepositorySnapshotService.js";
import { DiagnosisExecutionDataSnapshotService } from "./DiagnosisExecutionDataSnapshotService.js";
import { DiagnosisApplicationSnapshotService } from "./DiagnosisApplicationSnapshotService.js";
import { DiagnosisExecutionDataJsonImportController } from "./DiagnosisExecutionDataJsonImportController.js";
import { LocalStorageDiagnosisSnapshotStore } from "./LocalStorageDiagnosisSnapshotStore.js";
import { DiagnosisPersistenceCoordinator } from "./DiagnosisPersistenceCoordinator.js";
import { createDiagnosisBrowserApplication } from "./DiagnosisBrowserApplication.js";

export function createBrowserDemoHarness({ document, storage = null, rootSelector = "#app" } = {}) {
  const repositories = createInMemoryDiagnosisRepositories();

  const plan = new ProductionPlan({
    planId: "PLAN-DEMO",
    name: "2026年8月 デモ生産計画",
    targetMonth: "2026-08",
    primaryFactoryId: "F-01",
    createdAt: "2026-08-01T18:00:00+09:00",
    active: true
  });
  const version = new ProductionPlanVersion({
    planVersionId: "PV-DEMO-1",
    planId: plan.planId,
    versionNumber: 1,
    versionName: "初回デモ版",
    createdAt: "2026-08-01T18:05:00+09:00",
    active: true
  });
  const operations = [
    new PlannedOperation({
      plannedOperationId: "POP-DEMO-1",
      planVersionId: version.planVersionId,
      orderId: "ORD-1001",
      routingOperationId: "ROP-1001",
      equipmentId: "EQ-01",
      plannedDate: "2026-08-03",
      plannedQuantity: 60,
      quantityUnit: QUANTITY_UNIT.PIECE,
      priority: 1,
      productGroup: "PIPE-A"
    }),
    new PlannedOperation({
      plannedOperationId: "POP-DEMO-2",
      planVersionId: version.planVersionId,
      orderId: "ORD-1002",
      routingOperationId: "ROP-1002",
      equipmentId: "EQ-01",
      plannedDate: "2026-08-03",
      plannedQuantity: 30,
      quantityUnit: QUANTITY_UNIT.PIECE,
      priority: 2,
      productGroup: "PIPE-A"
    })
  ];
  const scenario = new DiagnosisScenario({
    diagnosisScenarioId: "DGS-DEMO-BASE",
    name: "基準Capacityで診断",
    planVersionId: version.planVersionId,
    capacityScenarioId: "CAP-DEMO-BASE",
    createdAt: "2026-08-01T18:10:00+09:00",
    active: true
  });
  const comparisonScenario = new DiagnosisScenario({
    diagnosisScenarioId: "DGS-DEMO-OT",
    name: "残業2時間追加Scenario",
    planVersionId: version.planVersionId,
    capacityScenarioId: "CAP-DEMO-OT",
    scenarioCategory: DIAGNOSIS_SCENARIO_CATEGORY.COMPARISON,
    baseDiagnosisScenarioId: scenario.diagnosisScenarioId,
    changeSummary: "設備利用可能時間を420分から540分へ増やす",
    createdAt: "2026-08-01T18:12:00+09:00",
    active: true
  });
  repositories.productionPlans.add(plan);
  repositories.planVersions.add(version);
  repositories.plannedOperations.addAll(operations);
  repositories.diagnosisScenarios.add(scenario);
  repositories.diagnosisScenarios.add(comparisonScenario);

  const capacitySnapshot = new CapacitySnapshot({
    capacityScenarioId: scenario.capacityScenarioId,
    targetMonth: plan.targetMonth,
    generatedAt: "2026-08-02T06:00:00+09:00",
    sourceRevision: { capacity: 1, calendar: 1, assignment: 1 },
    buckets: [new CapacityBucket({
      factoryId: plan.primaryFactoryId,
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
    })]
  });

  const executionData = new DiagnosisExecutionData({
    capacitySnapshot,
    equipments: [{ equipmentId: "EQ-01", factoryId: "F-01", name: "デモ設備1" }],
    orders: [
      { orderId: "ORD-1001", priority: 1, dueDate: "2026-08-10" },
      { orderId: "ORD-1002", priority: 2, dueDate: "2026-08-12" }
    ],
    routingOperations: [
      { routingOperationId: "ROP-1001", routingId: "ROUTING-1001", sequence: 1 },
      { routingOperationId: "ROP-1002", routingId: "ROUTING-1002", sequence: 1 }
    ],
    capacityRules: [{
      capacityRuleId: "CR-DEMO-01",
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
    externalInputRevision: { routing: 1, modelCoverage: 1 }
  });

  const comparisonExecutionData = new DiagnosisExecutionData({
    capacitySnapshot: new CapacitySnapshot({
      capacityScenarioId: comparisonScenario.capacityScenarioId,
      targetMonth: plan.targetMonth,
      generatedAt: "2026-08-02T06:05:00+09:00",
      sourceRevision: { capacity: 2, calendar: 1, assignment: 1 },
      buckets: [new CapacityBucket({
        factoryId: plan.primaryFactoryId,
        equipmentId: "EQ-01",
        date: "2026-08-03",
        shiftId: null,
        availableMinutes: 540,
        availabilityStatus: EQUIPMENT_AVAILABILITY_STATUS.AVAILABLE,
        workerStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
        skillStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
        assignmentStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
        reasonCodes: ["OVERTIME_120_MINUTES"],
        dataConfidence: DATA_CONFIDENCE.A
      })]
    }),
    equipments: [{ equipmentId: "EQ-01", factoryId: "F-01", name: "デモ設備1" }],
    orders: [
      { orderId: "ORD-1001", priority: 1, dueDate: "2026-08-10" },
      { orderId: "ORD-1002", priority: 2, dueDate: "2026-08-12" }
    ],
    routingOperations: [
      { routingOperationId: "ROP-1001", routingId: "ROUTING-1001", sequence: 1 },
      { routingOperationId: "ROP-1002", routingId: "ROUTING-1002", sequence: 1 }
    ],
    capacityRules: executionData.capacityRules,
    externalInputRevision: { routing: 1, modelCoverage: 1 }
  });

  const dataProvider = new InMemoryDiagnosisExecutionDataProvider({
    data: [executionData, comparisonExecutionData]
  });
  const transactionManager = new InMemoryRepositoryTransactionManager({ repositories });
  const idGenerator = new SequentialIdGenerator();
  const clock = new SystemClock();
  const runPlanDiagnosis = new RunPlanDiagnosis({
    transactionManager,
    planDiagnosisEngine: new PlanDiagnosisEngine({ idGenerator }),
    diagnosisExecutionDataProvider: dataProvider,
    clock
  });
  const previewPlannedOperationCsvImport = new PreviewPlannedOperationCsvImport({
    planVersionRepository: repositories.planVersions,
    plannedOperationRepository: repositories.plannedOperations,
    clock,
    idGenerator
  });
  const commitPlannedOperationCsvImport = new CommitPlannedOperationCsvImport({
    transactionManager,
    clock
  });
  const previewAssumptionCsvImport = new PreviewAssumptionCsvImport({
    productionPlanRepository: repositories.productionPlans,
    planVersionRepository: repositories.planVersions,
    plannedOperationRepository: repositories.plannedOperations,
    assumptionRepository: repositories.assumptions,
    clock,
    idGenerator
  });
  const commitAssumptionCsvImport = new CommitAssumptionCsvImport({
    transactionManager,
    clock
  });
  const previewDiagnosisScenarioCsvImport = new PreviewDiagnosisScenarioCsvImport({
    planVersionRepository: repositories.planVersions,
    diagnosisScenarioRepository: repositories.diagnosisScenarios,
    clock,
    idGenerator
  });
  const commitDiagnosisScenarioCsvImport = new CommitDiagnosisScenarioCsvImport({
    transactionManager,
    clock
  });
  const previewScenarioAssumptionRelationCsvImport = new PreviewScenarioAssumptionRelationCsvImport({
    planVersionRepository: repositories.planVersions,
    diagnosisScenarioRepository: repositories.diagnosisScenarios,
    assumptionRepository: repositories.assumptions,
    relationRepository: repositories.scenarioAssumptionRelations,
    clock,
    idGenerator
  });
  const commitScenarioAssumptionRelationCsvImport = new CommitScenarioAssumptionRelationCsvImport({
    transactionManager,
    clock
  });
  const executionDataSnapshotService = new DiagnosisExecutionDataSnapshotService({
    executionDataProvider: dataProvider
  });
  const executionDataImportController = new DiagnosisExecutionDataJsonImportController({
    snapshotService: executionDataSnapshotService,
    executionDataProvider: dataProvider
  });
  const persistenceCoordinator = storage === null
    ? null
    : new DiagnosisPersistenceCoordinator({
        snapshotService: new DiagnosisApplicationSnapshotService({
          repositorySnapshotService: new DiagnosisRepositorySnapshotService({ repositories }),
          executionDataSnapshotService
        }),
        snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage }),
        clock
      });
  const application = createDiagnosisBrowserApplication({
    document,
    repositories,
    runPlanDiagnosis,
    previewPlannedOperationCsvImport,
    commitPlannedOperationCsvImport,
    previewAssumptionCsvImport,
    commitAssumptionCsvImport,
    previewDiagnosisScenarioCsvImport,
    commitDiagnosisScenarioCsvImport,
    previewScenarioAssumptionRelationCsvImport,
    commitScenarioAssumptionRelationCsvImport,
    executionDataImportController,
    persistenceCoordinator,
    rootSelector
  });

  return Object.freeze({
    application,
    repositories,
    dataProvider,
    runPlanDiagnosis,
    previewPlannedOperationCsvImport,
    commitPlannedOperationCsvImport,
    previewAssumptionCsvImport,
    commitAssumptionCsvImport,
    previewDiagnosisScenarioCsvImport,
    commitDiagnosisScenarioCsvImport,
    previewScenarioAssumptionRelationCsvImport,
    commitScenarioAssumptionRelationCsvImport,
    executionDataSnapshotService,
    executionDataImportController,
    persistenceCoordinator,
    plan,
    version,
    operations,
    scenario,
    comparisonScenario
  });
}
