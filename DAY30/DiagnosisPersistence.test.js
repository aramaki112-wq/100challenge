import test from "node:test";
import assert from "node:assert/strict";
import {
  createApplicationHarness,
  createAssumption,
  createRelation,
  DIAGNOSIS_TIME
} from "./DiagnosisApplicationTestFixture.js";
import { createInMemoryDiagnosisRepositories } from "./InMemoryDiagnosisRepositories.js";
import { DiagnosisRepositorySnapshotService } from "./DiagnosisRepositorySnapshotService.js";
import { LocalStorageDiagnosisSnapshotStore } from "./LocalStorageDiagnosisSnapshotStore.js";
import { DiagnosisPersistenceCoordinator } from "./DiagnosisPersistenceCoordinator.js";
import { DiagnosisBackupController } from "./DiagnosisBackupController.js";
import { FixedClock } from "./FixedClock.js";
import { ERROR_CODES } from "./DiagnosisErrors.js";

class FakeStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

async function createPopulatedRepositories() {
  const assumption = createAssumption({ blocking: true });
  const relation = createRelation();
  const harness = createApplicationHarness({
    assumptions: [assumption],
    relations: [relation]
  });
  await harness.service.execute({
    diagnosisScenarioId: harness.scenario.diagnosisScenarioId
  });
  return harness.repositories;
}

test("全RepositoryをSnapshot化しFresh Repositoryへ復元できる", async () => {
  const source = await createPopulatedRepositories();
  const snapshotService = new DiagnosisRepositorySnapshotService({
    repositories: source
  });
  const snapshot = snapshotService.createSnapshot({ exportedAt: DIAGNOSIS_TIME });
  const target = createInMemoryDiagnosisRepositories();
  const targetService = new DiagnosisRepositorySnapshotService({ repositories: target });
  const result = targetService.restoreSnapshot(snapshot);

  assert.equal(result.counts.productionPlans, 1);
  assert.equal(result.counts.planVersions, 1);
  assert.equal(result.counts.plannedOperations, 1);
  assert.equal(result.counts.assumptions, 1);
  assert.equal(result.counts.diagnosisScenarios, 1);
  assert.equal(result.counts.scenarioAssumptionRelations, 1);
  assert.equal(result.counts.diagnosisResults, 1);
  assert.equal(target.diagnosisResults.findAll()[0].status, "UNKNOWN");
});

test("Repository RevisionをBackupから復元する", async () => {
  const source = await createPopulatedRepositories();
  source.productionPlans.save(source.productionPlans.findAll()[0]);
  const snapshot = new DiagnosisRepositorySnapshotService({ repositories: source })
    .createSnapshot({ exportedAt: DIAGNOSIS_TIME });
  const target = createInMemoryDiagnosisRepositories();
  new DiagnosisRepositorySnapshotService({ repositories: target })
    .restoreSnapshot(snapshot);
  for (const [name, document] of Object.entries(snapshot.repositories)) {
    assert.equal(target[name].revision, document.revision);
  }
});

test("Diagnosis ResultのOperation・Finding・Summaryを復元できる", async () => {
  const source = await createPopulatedRepositories();
  const original = source.diagnosisResults.findAll()[0];
  const snapshot = new DiagnosisRepositorySnapshotService({ repositories: source })
    .createSnapshot({ exportedAt: DIAGNOSIS_TIME });
  const target = createInMemoryDiagnosisRepositories();
  new DiagnosisRepositorySnapshotService({ repositories: target })
    .restoreSnapshot(snapshot);
  const restored = target.diagnosisResults.findById(original.diagnosisResultId);
  assert.deepEqual(restored.toSnapshot(), original.toSnapshot());
});

test("未対応Schema Versionは現在Dataを変更せず拒否する", async () => {
  const target = await createPopulatedRepositories();
  const before = target.productionPlans.captureState();
  const service = new DiagnosisRepositorySnapshotService({ repositories: target });
  const snapshot = service.createSnapshot({ exportedAt: DIAGNOSIS_TIME });
  const invalid = { ...snapshot, schemaVersion: 999 };
  assert.throws(
    () => service.restoreSnapshot(invalid),
    (error) => error.code === ERROR_CODES.UNSUPPORTED_BACKUP_SCHEMA_VERSION
  );
  assert.equal(target.productionPlans.count(), before.items.size);
  assert.equal(target.productionPlans.revision, before.revision);
});

test("参照切れRelationを含むBackupは現在Dataを壊さない", async () => {
  const target = await createPopulatedRepositories();
  const service = new DiagnosisRepositorySnapshotService({ repositories: target });
  const snapshot = service.createSnapshot({ exportedAt: DIAGNOSIS_TIME });
  const invalid = structuredClone(snapshot);
  invalid.repositories.assumptions.items = [];
  const beforeCount = target.assumptions.count();
  assert.throws(
    () => service.restoreSnapshot(invalid),
    (error) => error.code === ERROR_CODES.INVALID_REPOSITORY_SNAPSHOT
  );
  assert.equal(target.assumptions.count(), beforeCount);
});

test("Snapshotは外部から変更できない", async () => {
  const source = await createPopulatedRepositories();
  const snapshot = new DiagnosisRepositorySnapshotService({ repositories: source })
    .createSnapshot({ exportedAt: DIAGNOSIS_TIME });
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.repositories.productionPlans.items), true);
  assert.throws(() => {
    snapshot.repositories.productionPlans.items.push({});
  }, TypeError);
});

test("LocalStorage Storeへ保存・読込・削除できる", () => {
  const storage = new FakeStorage();
  const store = new LocalStorageDiagnosisSnapshotStore({ storage, storageKey: "TEST" });
  store.save({ value: 1 });
  assert.equal(store.hasSnapshot(), true);
  assert.deepEqual(store.load(), { value: 1 });
  store.remove();
  assert.equal(store.load(), null);
});

test("壊れたLocalStorage JSONを明示的に拒否する", () => {
  const storage = new FakeStorage();
  storage.setItem("TEST", "{broken");
  const store = new LocalStorageDiagnosisSnapshotStore({ storage, storageKey: "TEST" });
  assert.throws(
    () => store.load(),
    (error) => error.code === ERROR_CODES.PERSISTENCE_STORAGE_ERROR
  );
});

test("Persistence CoordinatorでBrowser保存と復元ができる", async () => {
  const source = await createPopulatedRepositories();
  const storage = new FakeStorage();
  const coordinator = new DiagnosisPersistenceCoordinator({
    snapshotService: new DiagnosisRepositorySnapshotService({ repositories: source }),
    snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage }),
    clock: new FixedClock(DIAGNOSIS_TIME)
  });
  const saved = coordinator.saveToStorage();
  assert.equal(saved.status, "SAVED");

  const target = createInMemoryDiagnosisRepositories();
  const restoreCoordinator = new DiagnosisPersistenceCoordinator({
    snapshotService: new DiagnosisRepositorySnapshotService({ repositories: target }),
    snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage }),
    clock: new FixedClock("2026-08-02T07:00:00+09:00")
  });
  const restored = restoreCoordinator.restoreFromStorage();
  assert.equal(restored.status, "RESTORED");
  assert.equal(target.diagnosisResults.count(), 1);
});

test("保存Dataがない場合はEMPTYを返す", () => {
  const repositories = createInMemoryDiagnosisRepositories();
  const coordinator = new DiagnosisPersistenceCoordinator({
    snapshotService: new DiagnosisRepositorySnapshotService({ repositories }),
    snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage: new FakeStorage() }),
    clock: new FixedClock(DIAGNOSIS_TIME)
  });
  assert.equal(coordinator.restoreFromStorage().status, "EMPTY");
});

test("Backup JSONを書き出して別Repositoryへ復元できる", async () => {
  const source = await createPopulatedRepositories();
  const storage = new FakeStorage();
  const coordinator = new DiagnosisPersistenceCoordinator({
    snapshotService: new DiagnosisRepositorySnapshotService({ repositories: source }),
    snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage }),
    clock: new FixedClock(DIAGNOSIS_TIME)
  });
  const backup = coordinator.exportBackupJson();
  assert.match(backup.fileName, /^DAY30-backup-/);

  const target = createInMemoryDiagnosisRepositories();
  const targetCoordinator = new DiagnosisPersistenceCoordinator({
    snapshotService: new DiagnosisRepositorySnapshotService({ repositories: target }),
    snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage: new FakeStorage() }),
    clock: new FixedClock("2026-08-02T08:00:00+09:00")
  });
  const result = targetCoordinator.importBackupJson({ jsonText: backup.jsonText });
  assert.equal(result.status, "RESTORED_FROM_BACKUP");
  assert.equal(target.productionPlans.count(), 1);
  assert.equal(target.diagnosisResults.count(), 1);
});

test("壊れたBackup JSONは現在Dataを変更しない", async () => {
  const repositories = await createPopulatedRepositories();
  const coordinator = new DiagnosisPersistenceCoordinator({
    snapshotService: new DiagnosisRepositorySnapshotService({ repositories }),
    snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage: new FakeStorage() }),
    clock: new FixedClock(DIAGNOSIS_TIME)
  });
  const before = repositories.productionPlans.count();
  assert.throws(
    () => coordinator.importBackupJson({ jsonText: "not-json" }),
    (error) => error.code === ERROR_CODES.INVALID_BACKUP_DOCUMENT
  );
  assert.equal(repositories.productionPlans.count(), before);
});

test("Backup Controllerは保存・Backup作成・復元状態を日本語で保持する", async () => {
  const repositories = await createPopulatedRepositories();
  const coordinator = new DiagnosisPersistenceCoordinator({
    snapshotService: new DiagnosisRepositorySnapshotService({ repositories }),
    snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage: new FakeStorage() }),
    clock: new FixedClock(DIAGNOSIS_TIME)
  });
  const controller = new DiagnosisBackupController({ persistenceCoordinator: coordinator });
  assert.equal(controller.saveNow().screenStatus, "SAVED");
  const backupState = controller.createBackup();
  assert.equal(backupState.screenStatus, "BACKUP_READY");
  assert.match(backupState.backupJson, /DAY30_PRODUCTION_PLAN_DIAGNOSIS/);
  assert.match(backupState.message, /Backup JSON/);
});

test("Backup Controllerは復元Errorを状態化し現在Dataを残す", async () => {
  const repositories = await createPopulatedRepositories();
  const controller = new DiagnosisBackupController({
    persistenceCoordinator: new DiagnosisPersistenceCoordinator({
      snapshotService: new DiagnosisRepositorySnapshotService({ repositories }),
      snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage: new FakeStorage() }),
      clock: new FixedClock(DIAGNOSIS_TIME)
    })
  });
  const before = repositories.productionPlans.count();
  const state = controller.restoreBackup({ jsonText: "{broken", fileName: "broken.json" });
  assert.equal(state.screenStatus, "ERROR");
  assert.equal(repositories.productionPlans.count(), before);
});

test("Browser保存Dataを削除しても現在Repositoryは消さない", async () => {
  const repositories = await createPopulatedRepositories();
  const storage = new FakeStorage();
  const controller = new DiagnosisBackupController({
    persistenceCoordinator: new DiagnosisPersistenceCoordinator({
      snapshotService: new DiagnosisRepositorySnapshotService({ repositories }),
      snapshotStore: new LocalStorageDiagnosisSnapshotStore({ storage }),
      clock: new FixedClock(DIAGNOSIS_TIME)
    })
  });
  controller.saveNow();
  const state = controller.clearStorage();
  assert.equal(state.hasStoredSnapshot, false);
  assert.equal(repositories.productionPlans.count(), 1);
});
