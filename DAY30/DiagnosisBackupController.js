import {
  ERROR_CODES,
  createApplicationError,
  wrapUnexpectedError
} from "./DiagnosisErrors.js";
import {
  assertDiagnosisPersistenceCoordinator
} from "./DiagnosisPersistenceCoordinator.js";

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function initialState() {
  return deepFreeze({
    screenStatus: "IDLE",
    revision: 0,
    message: "Browser保存とBackupを管理します。",
    error: null,
    backupJson: null,
    backupFileName: null,
    lastSavedAt: null,
    lastRestoredAt: null,
    hasStoredSnapshot: false
  });
}

function presentError(error) {
  const normalized = wrapUnexpectedError(error, {
    component: "DiagnosisBackupController"
  });
  return deepFreeze({
    code: normalized.code,
    category: normalized.category,
    message: normalized.message,
    details: { ...normalized.details }
  });
}

export class DiagnosisBackupController {
  #coordinator;
  #state;

  constructor({ persistenceCoordinator } = {}) {
    this.#coordinator = assertDiagnosisPersistenceCoordinator(
      persistenceCoordinator
    );
    this.#state = initialState();
    Object.freeze(this);
  }

  getState() { return this.#state; }

  restoreOnStart() {
    try {
      const result = this.#coordinator.restoreFromStorage();
      return this.#replace({
        screenStatus: result.status === "RESTORED" ? "RESTORED" : "IDLE",
        message: result.status === "RESTORED"
          ? "Browser保存Dataを復元しました。"
          : "保存済みDataはありません。現在の初期Dataを使用します。",
        error: null,
        lastRestoredAt: result.restoredAt,
        hasStoredSnapshot: this.#coordinator.hasStoredSnapshot()
      });
    } catch (error) {
      return this.#replace({
        screenStatus: "ERROR",
        message: "Browser保存Dataを復元できませんでした。現在のDataは変更していません。",
        error: presentError(error),
        hasStoredSnapshot: false
      });
    }
  }

  saveNow() {
    try {
      const result = this.#coordinator.saveToStorage();
      return this.#replace({
        screenStatus: "SAVED",
        message: "現在のDataをBrowserへ保存しました。",
        error: null,
        lastSavedAt: result.savedAt,
        hasStoredSnapshot: true
      });
    } catch (error) {
      return this.#replace({
        screenStatus: "ERROR",
        message: "Browser保存に失敗しました。",
        error: presentError(error)
      });
    }
  }

  createBackup() {
    try {
      const result = this.#coordinator.exportBackupJson();
      return this.#replace({
        screenStatus: "BACKUP_READY",
        message: "Backup JSONを作成しました。Downloadして保管してください。",
        error: null,
        backupJson: result.jsonText,
        backupFileName: result.fileName
      });
    } catch (error) {
      return this.#replace({
        screenStatus: "ERROR",
        message: "Backup JSONを作成できませんでした。",
        error: presentError(error)
      });
    }
  }

  restoreBackup({ jsonText, fileName = "" } = {}) {
    if (typeof fileName !== "string") {
      throw createApplicationError(
        ERROR_CODES.INVALID_BACKUP_CONTROLLER,
        "fileName must be a string.",
        { fileName }
      );
    }
    try {
      const result = this.#coordinator.importBackupJson({ jsonText });
      return this.#replace({
        screenStatus: "RESTORED",
        message: `${fileName.trim() || "Backup JSON"}を復元しました。`,
        error: null,
        backupJson: null,
        backupFileName: null,
        lastRestoredAt: result.restoredAt,
        hasStoredSnapshot: true
      });
    } catch (error) {
      return this.#replace({
        screenStatus: "ERROR",
        message: "Backup JSONを復元できませんでした。現在のDataは変更していません。",
        error: presentError(error)
      });
    }
  }

  clearStorage() {
    try {
      this.#coordinator.clearStorage();
      return this.#replace({
        screenStatus: "STORAGE_CLEARED",
        message: "Browser内の保存Dataを削除しました。現在表示中のDataは、画面を閉じるまで残ります。",
        error: null,
        hasStoredSnapshot: false
      });
    } catch (error) {
      return this.#replace({
        screenStatus: "ERROR",
        message: "Browser保存Dataを削除できませんでした。",
        error: presentError(error)
      });
    }
  }

  #replace(patch) {
    this.#state = deepFreeze({
      ...this.#state,
      ...patch,
      revision: this.#state.revision + 1
    });
    return this.#state;
  }
}

export function assertDiagnosisBackupController(value) {
  const methods = [
    "getState",
    "restoreOnStart",
    "saveNow",
    "createBackup",
    "restoreBackup",
    "clearStorage"
  ];
  if (
    value === null ||
    typeof value !== "object" ||
    methods.some((method) => typeof value[method] !== "function")
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_BACKUP_CONTROLLER,
      "value does not satisfy the Diagnosis Backup Controller contract.",
      { methods }
    );
  }
  return value;
}
