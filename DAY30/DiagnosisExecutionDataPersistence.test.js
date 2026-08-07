import test from "node:test";
import assert from "node:assert/strict";
import {
  CAPACITY_RATE_BASIS,
  CAPACITY_RESOURCE_STATUS,
  CAPACITY_RULE_SOURCE,
  DATA_CONFIDENCE,
  EQUIPMENT_AVAILABILITY_STATUS,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";
import { CapacityBucket } from "./CapacityBucket.js";
import { CapacitySnapshot } from "./CapacitySnapshot.js";
import { DiagnosisExecutionData } from "./DiagnosisExecutionData.js";
import { InMemoryDiagnosisExecutionDataProvider } from "./InMemoryDiagnosisExecutionDataProvider.js";
import { DiagnosisExecutionDataSnapshotService } from "./DiagnosisExecutionDataSnapshotService.js";
import { DiagnosisExecutionDataJsonImportController } from "./DiagnosisExecutionDataJsonImportController.js";
import { DiagnosisApplicationSnapshotService } from "./DiagnosisApplicationSnapshotService.js";
import { DiagnosisPersistenceCoordinator } from "./DiagnosisPersistenceCoordinator.js";
import { LocalStorageDiagnosisSnapshotStore } from "./LocalStorageDiagnosisSnapshotStore.js";
import { FixedClock } from "./FixedClock.js";
import { DiagnosisRepositorySnapshotService } from "./DiagnosisRepositorySnapshotService.js";
import { createInMemoryDiagnosisRepositories } from "./InMemoryDiagnosisRepositories.js";
import { ProductionPlan } from "./ProductionPlan.js";
import { ERROR_CODES } from "./DiagnosisErrors.js";

const TIME = "2026-08-02T09:00:00+09:00";

function createData({ scenarioId = "CAP-BASE", month = "2026-08", minutes = 420 } = {}) {
  return new DiagnosisExecutionData({
    capacitySnapshot: new CapacitySnapshot({
      capacityScenarioId: scenarioId,
      targetMonth: month,
      generatedAt: "2026-08-02T06:00:00+09:00",
      sourceRevision: { capacity: 1, calendar: 1 },
      buckets: [new CapacityBucket({
        factoryId: "F-01",
        equipmentId: "EQ-01",
        date: `${month}-03`,
        shiftId: null,
        availableMinutes: minutes,
        availabilityStatus: EQUIPMENT_AVAILABILITY_STATUS.AVAILABLE,
        workerStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
        skillStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
        assignmentStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
        reasonCodes: [],
        dataConfidence: DATA_CONFIDENCE.A
      })]
    }),
    defaultFactoryId: "F-01",
    equipments: [{ equipmentId: "EQ-01", factoryId: "F-01", name: "設備1" }],
    orders: [{ orderId: "ORD-1", priority: 1, dueDate: "2026-08-10" }],
    routingOperations: [{ routingOperationId: "ROP-1", routingId: "R-1", sequence: 1 }],
    shifts: [{ shiftId: "S1", sequence: 1 }],
    capacityRules: [{
      capacityRuleId: "CR-1",
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
    externalInputRevision: { equipment: 1, order: 1, routing: 1, capacityRule: 1 }
  });
}

test("DiagnosisExecutionDataはSnapshot化できる", () => {
  const data = createData();
  const snapshot = data.toSnapshot();
  assert.equal(snapshot.capacitySnapshot.capacityScenarioId, "CAP-BASE");
  assert.equal(snapshot.equipments[0].equipmentId, "EQ-01");
  assert.equal(Object.isFrozen(snapshot), true);
});

test("Providerは一覧・状態保存・全置換を行える", async () => {
  const provider = new InMemoryDiagnosisExecutionDataProvider({ data: [createData()] });
  const state = provider.captureState();
  provider.replaceAll([createData({ scenarioId: "CAP-OT" })]);
  assert.equal(provider.count, 1);
  await assert.rejects(() => provider.load({ capacityScenarioId: "CAP-BASE", targetMonth: "2026-08" }));
  provider.restoreState(state);
  assert.equal((await provider.load({ capacityScenarioId: "CAP-BASE", targetMonth: "2026-08" })).capacitySnapshot.bucketCount, 1);
});

test("外部Data Snapshotを作成し別Providerへ復元できる", async () => {
  const source = new InMemoryDiagnosisExecutionDataProvider({ data: [createData()] });
  const snapshot = new DiagnosisExecutionDataSnapshotService({ executionDataProvider: source })
    .createSnapshot({ exportedAt: TIME });
  const target = new InMemoryDiagnosisExecutionDataProvider();
  const service = new DiagnosisExecutionDataSnapshotService({ executionDataProvider: target });
  const result = service.restoreSnapshot(snapshot);
  assert.equal(result.count, 1);
  const restored = await target.load({ capacityScenarioId: "CAP-BASE", targetMonth: "2026-08" });
  assert.deepEqual(restored.toSnapshot(), createData().toSnapshot());
});

test("外部Data Snapshotの重複Scenario・対象月を拒否する", () => {
  const provider = new InMemoryDiagnosisExecutionDataProvider({ data: [createData()] });
  const service = new DiagnosisExecutionDataSnapshotService({ executionDataProvider: provider });
  const snapshot = structuredClone(service.createSnapshot({ exportedAt: TIME }));
  snapshot.items.push(structuredClone(snapshot.items[0]));
  assert.throws(
    () => service.validateSnapshot(snapshot),
    (error) => error.code === ERROR_CODES.DUPLICATE_DIAGNOSIS_EXECUTION_DATA
  );
});

test("壊れた外部Data Snapshotは現在Providerを変更しない", async () => {
  const provider = new InMemoryDiagnosisExecutionDataProvider({ data: [createData()] });
  const service = new DiagnosisExecutionDataSnapshotService({ executionDataProvider: provider });
  const snapshot = structuredClone(service.createSnapshot({ exportedAt: TIME }));
  snapshot.items[0].capacitySnapshot.buckets[0].availableMinutes = -1;
  assert.throws(() => service.restoreSnapshot(snapshot));
  assert.equal((await provider.load({ capacityScenarioId: "CAP-BASE", targetMonth: "2026-08" })).capacitySnapshot.buckets[0].availableMinutes, 420);
});

test("外部Data JSON ControllerはPreview後にCommitする", () => {
  const source = new InMemoryDiagnosisExecutionDataProvider({ data: [createData()] });
  const sourceService = new DiagnosisExecutionDataSnapshotService({ executionDataProvider: source });
  const jsonText = JSON.stringify(sourceService.createSnapshot({ exportedAt: TIME }));
  const target = new InMemoryDiagnosisExecutionDataProvider();
  const targetService = new DiagnosisExecutionDataSnapshotService({ executionDataProvider: target });
  const controller = new DiagnosisExecutionDataJsonImportController({
    snapshotService: targetService,
    executionDataProvider: target
  });
  const preview = controller.previewJson({ jsonText, fileName: "day29.json" });
  assert.equal(preview.canCommit, true);
  assert.equal(preview.preview.summaries[0].bucketCount, 1);
  const committed = controller.commit();
  assert.equal(committed.screenStatus, "COMMITTED");
  assert.equal(target.count, 1);
});

test("外部Data JSON Preview後にProviderが変わるとCommitを拒否する", () => {
  const source = new InMemoryDiagnosisExecutionDataProvider({ data: [createData()] });
  const jsonText = JSON.stringify(new DiagnosisExecutionDataSnapshotService({ executionDataProvider: source }).createSnapshot({ exportedAt: TIME }));
  const target = new InMemoryDiagnosisExecutionDataProvider();
  const service = new DiagnosisExecutionDataSnapshotService({ executionDataProvider: target });
  const controller = new DiagnosisExecutionDataJsonImportController({ snapshotService: service, executionDataProvider: target });
  controller.previewJson({ jsonText });
  target.set(createData({ scenarioId: "CAP-OTHER" }));
  const state = controller.commit();
  assert.equal(state.screenStatus, "ERROR");
  assert.equal(state.error.code, ERROR_CODES.EXTERNAL_DATA_IMPORT_STALE_PREVIEW);
});

test("Application BackupはRepositoryと外部Dataを同時に復元する", async () => {
  const sourceRepositories = createInMemoryDiagnosisRepositories();
  sourceRepositories.productionPlans.add(new ProductionPlan({
    planId: "PLAN-1",
    name: "計画1",
    targetMonth: "2026-08",
    primaryFactoryId: "F-01",
    createdAt: TIME,
    active: true
  }));
  const sourceProvider = new InMemoryDiagnosisExecutionDataProvider({ data: [createData()] });
  const sourceService = new DiagnosisApplicationSnapshotService({
    repositorySnapshotService: new DiagnosisRepositorySnapshotService({ repositories: sourceRepositories }),
    executionDataSnapshotService: new DiagnosisExecutionDataSnapshotService({ executionDataProvider: sourceProvider })
  });
  const snapshot = sourceService.createSnapshot({ exportedAt: TIME });

  const targetRepositories = createInMemoryDiagnosisRepositories();
  const targetProvider = new InMemoryDiagnosisExecutionDataProvider();
  const targetService = new DiagnosisApplicationSnapshotService({
    repositorySnapshotService: new DiagnosisRepositorySnapshotService({ repositories: targetRepositories }),
    executionDataSnapshotService: new DiagnosisExecutionDataSnapshotService({ executionDataProvider: targetProvider })
  });
  targetService.restoreSnapshot(snapshot);
  assert.equal(targetRepositories.productionPlans.count(), 1);
  assert.equal(targetProvider.count, 1);
});

test("Application Backupは旧Schema Version 1をRepositoryだけ復元できる", () => {
  const sourceRepositories = createInMemoryDiagnosisRepositories();
  sourceRepositories.productionPlans.add(new ProductionPlan({
    planId: "PLAN-1",
    name: "計画1",
    targetMonth: "2026-08",
    primaryFactoryId: "F-01",
    createdAt: TIME,
    active: true
  }));
  const oldSnapshot = new DiagnosisRepositorySnapshotService({ repositories: sourceRepositories })
    .createSnapshot({ exportedAt: TIME });
  const targetRepositories = createInMemoryDiagnosisRepositories();
  const targetProvider = new InMemoryDiagnosisExecutionDataProvider({ data: [createData()] });
  const service = new DiagnosisApplicationSnapshotService({
    repositorySnapshotService: new DiagnosisRepositorySnapshotService({ repositories: targetRepositories }),
    executionDataSnapshotService: new DiagnosisExecutionDataSnapshotService({ executionDataProvider: targetProvider })
  });
  const result = service.restoreSnapshot(oldSnapshot);
  assert.equal(result.legacyBackup, true);
  assert.equal(targetRepositories.productionPlans.count(), 1);
  assert.equal(targetProvider.count, 1);
});

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

test("Browser保存はRepositoryとDAY29外部Dataを同時に復元する", async () => {
  const storage = new MemoryStorage();
  const sourceRepositories = createInMemoryDiagnosisRepositories();
  sourceRepositories.productionPlans.add(new ProductionPlan({
    planId: "PLAN-STORE",
    name: "保存計画",
    targetMonth: "2026-08",
    primaryFactoryId: "F-01",
    createdAt: TIME,
    active: true
  }));
  const sourceProvider = new InMemoryDiagnosisExecutionDataProvider({ data: [createData()] });
  const sourceSnapshotService = new DiagnosisApplicationSnapshotService({
    repositorySnapshotService: new DiagnosisRepositorySnapshotService({ repositories: sourceRepositories }),
    executionDataSnapshotService: new DiagnosisExecutionDataSnapshotService({ executionDataProvider: sourceProvider })
  });
  new DiagnosisPersistenceCoordinator({
    snapshotService: sourceSnapshotService,
    snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage }),
    clock: new FixedClock(TIME)
  }).saveToStorage();

  const targetRepositories = createInMemoryDiagnosisRepositories();
  const targetProvider = new InMemoryDiagnosisExecutionDataProvider();
  const targetSnapshotService = new DiagnosisApplicationSnapshotService({
    repositorySnapshotService: new DiagnosisRepositorySnapshotService({ repositories: targetRepositories }),
    executionDataSnapshotService: new DiagnosisExecutionDataSnapshotService({ executionDataProvider: targetProvider })
  });
  new DiagnosisPersistenceCoordinator({
    snapshotService: targetSnapshotService,
    snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage }),
    clock: new FixedClock("2026-08-02T10:00:00+09:00")
  }).restoreFromStorage();

  assert.equal(targetRepositories.productionPlans.count(), 1);
  assert.equal(targetProvider.count, 1);
  assert.equal((await targetProvider.load({ capacityScenarioId: "CAP-BASE", targetMonth: "2026-08" })).capacitySnapshot.bucketCount, 1);
});
