import {
  ERROR_CODES,
  createApplicationError
} from "./DiagnosisErrors.js";
import { assertClock, readClockNow } from "./Clock.js";
import {
  assertDiagnosisRepositorySnapshotService
} from "./DiagnosisRepositorySnapshotService.js";

function assertStore(value) {
  const methods = ["save", "load", "remove", "hasSnapshot"];
  if (
    value === null ||
    typeof value !== "object" ||
    methods.some((method) => typeof value[method] !== "function")
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_PERSISTENCE_COORDINATOR,
      "snapshotStore does not satisfy the required contract.",
      { methods }
    );
  }
  return value;
}

function freezeResult(value) {
  return Object.freeze({ ...value });
}

export class DiagnosisPersistenceCoordinator {
  #snapshotService;
  #snapshotStore;
  #clock;

  constructor({ snapshotService, snapshotStore, clock } = {}) {
    this.#snapshotService = assertDiagnosisRepositorySnapshotService(
      snapshotService
    );
    this.#snapshotStore = assertStore(snapshotStore);
    this.#clock = assertClock(clock);
    Object.freeze(this);
  }

  saveToStorage() {
    const savedAt = readClockNow(this.#clock);
    const snapshot = this.#snapshotService.createSnapshot({ exportedAt: savedAt });
    this.#snapshotStore.save(snapshot);
    return freezeResult({ status: "SAVED", savedAt, snapshot });
  }

  restoreFromStorage() {
    const snapshot = this.#snapshotStore.load();
    if (snapshot === null) {
      return freezeResult({ status: "EMPTY", restoredAt: null, result: null });
    }
    const result = this.#snapshotService.restoreSnapshot(snapshot);
    return freezeResult({
      status: "RESTORED",
      restoredAt: readClockNow(this.#clock),
      result
    });
  }

  exportBackupJson({ pretty = true } = {}) {
    if (typeof pretty !== "boolean") {
      throw createApplicationError(
        ERROR_CODES.INVALID_PERSISTENCE_COORDINATOR,
        "pretty must be a boolean.",
        { pretty }
      );
    }
    const exportedAt = readClockNow(this.#clock);
    const snapshot = this.#snapshotService.createSnapshot({ exportedAt });
    return freezeResult({
      exportedAt,
      fileName: `DAY30-backup-${exportedAt.slice(0, 10)}.json`,
      jsonText: JSON.stringify(snapshot, null, pretty ? 2 : 0)
    });
  }

  importBackupJson({ jsonText, saveAfterRestore = true } = {}) {
    if (typeof jsonText !== "string" || jsonText.trim() === "") {
      throw createApplicationError(
        ERROR_CODES.INVALID_BACKUP_DOCUMENT,
        "jsonText must be a non-empty JSON string.",
        { jsonTextType: typeof jsonText }
      );
    }
    if (typeof saveAfterRestore !== "boolean") {
      throw createApplicationError(
        ERROR_CODES.INVALID_PERSISTENCE_COORDINATOR,
        "saveAfterRestore must be a boolean.",
        { saveAfterRestore }
      );
    }
    let snapshot;
    try {
      snapshot = JSON.parse(jsonText);
    } catch (cause) {
      throw createApplicationError(
        ERROR_CODES.INVALID_BACKUP_DOCUMENT,
        "The Backup JSON could not be parsed.",
        {},
        cause
      );
    }
    const result = this.#snapshotService.restoreSnapshot(snapshot);
    if (saveAfterRestore) {
      const normalizedSnapshot = this.#snapshotService.createSnapshot({
        exportedAt: readClockNow(this.#clock)
      });
      this.#snapshotStore.save(normalizedSnapshot);
    }
    return freezeResult({
      status: "RESTORED_FROM_BACKUP",
      restoredAt: readClockNow(this.#clock),
      result
    });
  }

  clearStorage() {
    this.#snapshotStore.remove();
    return freezeResult({
      status: "STORAGE_CLEARED",
      clearedAt: readClockNow(this.#clock)
    });
  }

  hasStoredSnapshot() {
    return this.#snapshotStore.hasSnapshot();
  }
}

export function assertDiagnosisPersistenceCoordinator(value) {
  const methods = [
    "saveToStorage",
    "restoreFromStorage",
    "exportBackupJson",
    "importBackupJson",
    "clearStorage",
    "hasStoredSnapshot"
  ];
  if (
    value === null ||
    typeof value !== "object" ||
    methods.some((method) => typeof value[method] !== "function")
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_PERSISTENCE_COORDINATOR,
      "value does not satisfy the Diagnosis Persistence Coordinator contract.",
      { methods }
    );
  }
  return value;
}
