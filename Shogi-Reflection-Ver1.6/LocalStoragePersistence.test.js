import test from "node:test";
import assert from "node:assert/strict";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { LocalStorageSnapshotStore } from "./LocalStorageSnapshotStore.js";
import { PersistenceError } from "./PersistenceErrors.js";
import { ReflectionBackupController } from "./ReflectionBackupController.js";
import { ReflectionPersistenceCoordinator } from "./ReflectionPersistenceCoordinator.js";
import {
  createGameReview,
  FixedClock,
  MemoryStorage
} from "./TestFixtures.js";

function createHarness({ repository, storage = new MemoryStorage() } = {}) {
  const actualRepository = repository ?? new InMemoryGameReviewRepository();
  const snapshotService = new GameReviewSnapshotService({
    repository: actualRepository,
    clock: new FixedClock("2026-08-02T13:00:00+09:00")
  });
  const snapshotStore = new LocalStorageSnapshotStore({ storage });
  const coordinator = new ReflectionPersistenceCoordinator({
    snapshotService,
    snapshotStore,
    clock: new FixedClock("2026-08-02T13:00:00+09:00")
  });
  return {
    repository: actualRepository,
    storage,
    snapshotStore,
    coordinator,
    controller: new ReflectionBackupController({ persistenceCoordinator: coordinator })
  };
}

test("LocalStorage Adapterで文字列を保存できる", () => {
  const storage = new MemoryStorage();
  const store = new LocalStorageSnapshotStore({ storage });
  store.save('{"ok":true}');
  assert.equal(store.load(), '{"ok":true}');
});

test("LocalStorage Adapterで保存文字列を読込できる", () => {
  const storage = new MemoryStorage();
  const store = new LocalStorageSnapshotStore({ storage });
  storage.setItem(store.storageKey, "saved-json");
  assert.equal(store.load(), "saved-json");
});

test("LocalStorage Adapterで保存Dataを削除できる", () => {
  const storage = new MemoryStorage();
  const store = new LocalStorageSnapshotStore({ storage });
  store.save("data");
  store.delete();
  assert.equal(store.load(), null);
});

test("LocalStorageが利用できない場合は理由付きErrorを返す", () => {
  const store = new LocalStorageSnapshotStore({ storage: null });
  assert.throws(
    () => store.save("data"),
    (error) => error instanceof PersistenceError && error.code === "LOCAL_STORAGE_UNAVAILABLE"
  );
});

test("LocalStorage保存失敗でも現在Domain Dataを保持する", () => {
  const repository = new InMemoryGameReviewRepository();
  repository.save(createGameReview());
  const failingStorage = {
    setItem() { throw new Error("quota exceeded"); },
    getItem() { return null; },
    removeItem() {}
  };
  const harness = createHarness({ repository, storage: failingStorage });

  assert.throws(
    () => harness.coordinator.saveCurrentDataToBrowser(),
    (error) => error instanceof PersistenceError && error.code === "LOCAL_STORAGE_SAVE_FAILED"
  );
  assert.equal(repository.findAll().length, 1);
});

test("Persistence Coordinatorで現在DataをBrowserへ保存できる", () => {
  const harness = createHarness();
  harness.repository.save(createGameReview());
  const result = harness.coordinator.saveCurrentDataToBrowser();
  assert.equal(result.status, "SAVED_TO_BROWSER");
  assert.match(harness.snapshotStore.load(), /SHOGI_REFLECTION_INTERLUDE/);
});

test("Browser保存Dataから別Repositoryへ復元できる", () => {
  const storage = new MemoryStorage();
  const source = createHarness({ storage });
  source.repository.save(createGameReview());
  source.coordinator.saveCurrentDataToBrowser();

  const target = createHarness({ storage });
  const result = target.coordinator.loadFromBrowserData();
  assert.equal(result.status, "RESTORED_FROM_BROWSER");
  assert.equal(target.repository.findAll().length, 1);
});

test("Browser保存Dataがない場合はEMPTYを返す", () => {
  const result = createHarness().coordinator.loadFromBrowserData();
  assert.deepEqual(result, { status: "EMPTY" });
});

test("Backup JSONを作成できる", () => {
  const harness = createHarness();
  harness.repository.save(createGameReview());
  const backup = harness.controller.createBackupJson();
  const parsed = JSON.parse(backup.jsonText);
  assert.equal(backup.status, "BACKUP_READY");
  assert.equal(backup.fileName, "Shogi-Reflection-Backup-2026-08-02.json");
  assert.equal(parsed.gameReviews.length, 1);
});

test("Backup JSONから復元できる", () => {
  const source = createHarness();
  source.repository.save(createGameReview());
  const backup = source.controller.createBackupJson();

  const target = createHarness();
  const result = target.controller.restoreBackupJson({ jsonText: backup.jsonText });
  assert.equal(result.status, "RESTORED_FROM_BACKUP");
  assert.equal(target.repository.existsById("REV-001"), true);
});

test("壊れたBackup復元は現在Dataを変更しない", () => {
  const harness = createHarness();
  harness.repository.save(createGameReview({ reviewId: "CURRENT" }));
  const beforeRevision = harness.repository.getRevision();

  assert.throws(
    () => harness.controller.restoreBackupJson({ jsonText: "not-json" }),
    (error) => error instanceof PersistenceError && error.code === "INVALID_SNAPSHOT_JSON"
  );
  assert.equal(harness.repository.existsById("CURRENT"), true);
  assert.equal(harness.repository.getRevision(), beforeRevision);
});

test("Controller境界からBrowser保存Dataを削除できる", () => {
  const harness = createHarness();
  harness.repository.save(createGameReview());
  harness.controller.saveCurrentDataToBrowser();
  const result = harness.controller.deleteBrowserSavedData();
  assert.equal(result.status, "BROWSER_DATA_DELETED");
  assert.equal(harness.snapshotStore.load(), null);
  assert.equal(harness.repository.findAll().length, 1);
});
