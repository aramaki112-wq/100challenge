import {
  ERROR_CODES,
  createApplicationError,
  wrapUnexpectedError
} from "./DiagnosisErrors.js";
import {
  assertDiagnosisExecutionDataSnapshotService
} from "./DiagnosisExecutionDataSnapshotService.js";
import { InMemoryDiagnosisExecutionDataProvider } from "./InMemoryDiagnosisExecutionDataProvider.js";

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    for (const child of value) deepFreeze(child);
  } else {
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return Object.freeze(value);
}

function initialState() {
  return deepFreeze({
    screenStatus: "IDLE",
    revision: 0,
    message: "DAY29外部Data JSONを選択すると、保存前のPreviewを表示します。",
    error: null,
    fileName: "",
    preview: null,
    canCommit: false
  });
}

function presentError(error) {
  const normalized = wrapUnexpectedError(error, {
    component: "DiagnosisExecutionDataJsonImportController"
  });
  return deepFreeze({
    code: normalized.code,
    category: normalized.category,
    message: normalized.message,
    details: { ...normalized.details }
  });
}

export class DiagnosisExecutionDataJsonImportController {
  #snapshotService;
  #provider;
  #state;
  #pendingSnapshot;
  #pendingItems;
  #expectedProviderRevision;

  constructor({ snapshotService, executionDataProvider } = {}) {
    this.#snapshotService = assertDiagnosisExecutionDataSnapshotService(
      snapshotService
    );
    if (!(executionDataProvider instanceof InMemoryDiagnosisExecutionDataProvider)) {
      throw createApplicationError(
        ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_PROVIDER,
        "executionDataProvider must be an InMemoryDiagnosisExecutionDataProvider.",
        {}
      );
    }
    this.#provider = executionDataProvider;
    this.#state = initialState();
    this.#pendingSnapshot = null;
    this.#pendingItems = null;
    this.#expectedProviderRevision = null;
    Object.freeze(this);
  }

  getState() {
    return this.#state;
  }

  previewJson({ jsonText, fileName = "" } = {}) {
    try {
      if (typeof fileName !== "string") {
        throw createApplicationError(
          ERROR_CODES.INVALID_EXTERNAL_DATA_DOCUMENT,
          "fileName must be a string.",
          { fileName }
        );
      }
      const snapshot = this.#snapshotService.parseJson({ jsonText });
      const validation = this.#snapshotService.validateSnapshot(snapshot);
      this.#pendingSnapshot = snapshot;
      this.#pendingItems = validation.items;
      this.#expectedProviderRevision = this.#provider.revision;
      return this.#replace({
        screenStatus: "PREVIEW_READY",
        message: `${validation.count}件の外部Dataを確認しました。内容を確認して保存してください。`,
        error: null,
        fileName: fileName.trim(),
        preview: {
          count: validation.count,
          providerRevision: validation.providerRevision,
          summaries: validation.summaries
        },
        canCommit: true
      });
    } catch (error) {
      this.#pendingSnapshot = null;
      this.#pendingItems = null;
      this.#expectedProviderRevision = null;
      return this.#replace({
        screenStatus: "ERROR",
        message: "外部Data JSONをPreviewできませんでした。",
        error: presentError(error),
        fileName: typeof fileName === "string" ? fileName : "",
        preview: null,
        canCommit: false
      });
    }
  }

  commit() {
    if (this.#pendingSnapshot === null || !this.#state.canCommit) {
      return this.showError(
        createApplicationError(
          ERROR_CODES.EXTERNAL_DATA_IMPORT_COMMIT_NOT_ALLOWED,
          "Commitできる外部Data Previewがありません。",
          {}
        )
      );
    }
    if (this.#provider.revision !== this.#expectedProviderRevision) {
      return this.showError(
        createApplicationError(
          ERROR_CODES.EXTERNAL_DATA_IMPORT_STALE_PREVIEW,
          "Preview後に外部Dataが変更されました。再Previewしてください。",
          {
            expectedRevision: this.#expectedProviderRevision,
            actualRevision: this.#provider.revision
          }
        )
      );
    }
    try {
      const previousState = this.#provider.captureState();
      let count;
      try {
        count = this.#provider.replaceAll(this.#pendingItems).length;
      } catch (cause) {
        this.#provider.restoreState(previousState);
        throw cause;
      }
      this.#pendingSnapshot = null;
      this.#pendingItems = null;
      this.#expectedProviderRevision = null;
      return this.#replace({
        screenStatus: "COMMITTED",
        message: `${count}件の外部Dataを保存しました。関連Scenarioを再診断してください。`,
        error: null,
        canCommit: false
      });
    } catch (error) {
      return this.showError(error, {
        message: "外部Dataを保存できませんでした。現在Dataは変更していません。"
      });
    }
  }

  reset({ message = "外部Data Previewをクリアしました。" } = {}) {
    this.#pendingSnapshot = null;
    this.#pendingItems = null;
    this.#expectedProviderRevision = null;
    return this.#replace({
      screenStatus: "IDLE",
      message,
      error: null,
      fileName: "",
      preview: null,
      canCommit: false
    });
  }

  showError(error, { message = "外部Data Importに失敗しました。" } = {}) {
    return this.#replace({
      screenStatus: "ERROR",
      message,
      error: presentError(error),
      canCommit: false
    });
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

export function assertDiagnosisExecutionDataJsonImportController(value) {
  const methods = ["getState", "previewJson", "commit", "reset", "showError"];
  if (
    value === null ||
    typeof value !== "object" ||
    methods.some((method) => typeof value[method] !== "function")
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_EXTERNAL_DATA_IMPORT_CONTROLLER,
      "value does not satisfy the external data import controller contract.",
      { methods }
    );
  }
  return value;
}
