import { SystemClock } from "./Clock.js";
import { deepFreeze } from "./Immutable.js";
import {
  PERSISTENCE_ERROR_CODES,
  PersistenceError
} from "./PersistenceErrors.js";

function assertSnapshotService(snapshotService) {
  const required = ["createSnapshot", "createJson", "restoreJson"];
  if (required.some((name) => typeof snapshotService?.[name] !== "function")) {
    throw new TypeError("snapshotServiceが必要なContractを満たしていません。");
  }
  return snapshotService;
}

function assertSnapshotStore(snapshotStore) {
  const required = ["save", "load", "delete"];
  if (required.some((name) => typeof snapshotStore?.[name] !== "function")) {
    throw new TypeError("snapshotStoreが必要なContractを満たしていません。");
  }
  return snapshotStore;
}

function backupFileName(exportedAt) {
  const date = new Date(exportedAt);
  if (Number.isNaN(date.getTime())) {
    throw new PersistenceError(
      PERSISTENCE_ERROR_CODES.INVALID_BACKUP_JSON,
      "Backup作成日時が不正です。",
      { exportedAt }
    );
  }
  return `Shogi-Reflection-Backup-${date.toISOString().slice(0, 10)}.json`;
}

export class ReflectionPersistenceCoordinator {
  constructor({ snapshotService, snapshotStore, clock = new SystemClock() } = {}) {
    this.snapshotService = assertSnapshotService(snapshotService);
    this.snapshotStore = assertSnapshotStore(snapshotStore);
    this.clock = clock;
  }

  saveCurrentDataToBrowser() {
    const exportedAt = this.clock.now();
    const jsonText = this.snapshotService.createJson({ exportedAt });
    this.snapshotStore.save(jsonText);
    return deepFreeze({
      status: "SAVED_TO_BROWSER",
      exportedAt,
      byteLength: new TextEncoder().encode(jsonText).length
    });
  }

  loadFromBrowserData() {
    const jsonText = this.snapshotStore.load();
    if (jsonText === null) {
      return deepFreeze({ status: "EMPTY" });
    }
    const restored = this.snapshotService.restoreJson(jsonText);
    return deepFreeze({
      ...restored,
      status: "RESTORED_FROM_BROWSER"
    });
  }

  deleteBrowserSavedData() {
    this.snapshotStore.delete();
    return deepFreeze({ status: "BROWSER_DATA_DELETED" });
  }

  createBackupJson() {
    const exportedAt = this.clock.now();
    const snapshot = this.snapshotService.createSnapshot({ exportedAt });
    const jsonText = JSON.stringify(snapshot, null, 2);
    return deepFreeze({
      status: "BACKUP_READY",
      fileName: backupFileName(exportedAt),
      jsonText,
      exportedAt,
      repositoryRevision: snapshot.repositoryRevision,
      gameReviewCount: snapshot.gameReviews.length
    });
  }

  restoreBackupJson({ jsonText } = {}) {
    if (typeof jsonText !== "string") {
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.INVALID_BACKUP_JSON,
        "Backup JSON文字列を指定してください。"
      );
    }
    const restored = this.snapshotService.restoreJson(jsonText);
    return deepFreeze({
      ...restored,
      status: "RESTORED_FROM_BACKUP"
    });
  }
}
