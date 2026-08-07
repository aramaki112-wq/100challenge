import {
  ERROR_CODES,
  assertNonEmptyString,
  createApplicationError,
  wrapUnexpectedError
} from "./DiagnosisErrors.js";

function freezeDeep(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) freezeDeep(child);
  return Object.freeze(value);
}

function errorPresentation(error) {
  const normalized = wrapUnexpectedError(error, {
    component: "PlannedOperationCsvImportController"
  });
  return freezeDeep({
    code: normalized.code,
    category: normalized.category,
    message: normalized.message,
    details: { ...normalized.details }
  });
}

function initialState() {
  return freezeDeep({
    screenStatus: "IDLE",
    revision: 0,
    fileName: "",
    expectedPlanVersionId: null,
    preview: null,
    commitResult: null,
    error: null,
    message: "CSV Fileを選択すると、保存前のPreviewを表示します。",
    canCommit: false
  });
}

function assertService(value, label) {
  if (value === null || typeof value !== "object" || typeof value.execute !== "function") {
    throw createApplicationError(
      ERROR_CODES.INVALID_PLANNED_OPERATION_CSV_IMPORT_CONTROLLER,
      `${label} must implement execute().`,
      { label }
    );
  }
  return value;
}

export class PlannedOperationCsvImportController {
  #previewService;
  #commitService;
  #preview = null;
  #state = initialState();

  constructor({
    previewPlannedOperationCsvImport,
    commitPlannedOperationCsvImport
  } = {}) {
    this.#previewService = assertService(
      previewPlannedOperationCsvImport,
      "previewPlannedOperationCsvImport"
    );
    this.#commitService = assertService(
      commitPlannedOperationCsvImport,
      "commitPlannedOperationCsvImport"
    );
    Object.freeze(this);
  }

  getState() {
    return this.#state;
  }

  async previewCsv({
    csvText,
    fileName = "",
    expectedPlanVersionId
  } = {}) {
    const planVersionId = assertNonEmptyString(
      expectedPlanVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "expectedPlanVersionId"
    );
    if (typeof csvText !== "string") {
      throw createApplicationError(
        ERROR_CODES.INVALID_CSV_TEXT,
        "csvText must be a string.",
        { csvTextType: typeof csvText }
      );
    }
    if (typeof fileName !== "string") {
      throw createApplicationError(
        ERROR_CODES.INVALID_PLANNED_OPERATION_CSV_IMPORT_CONTROLLER,
        "fileName must be a string.",
        { fileName }
      );
    }

    this.#replace({
      screenStatus: "PREVIEWING",
      fileName: fileName.trim(),
      expectedPlanVersionId: planVersionId,
      preview: null,
      commitResult: null,
      error: null,
      message: "CSVを検証しています。",
      canCommit: false
    });

    try {
      const preview = await Promise.resolve(this.#previewService.execute({
        csvText,
        fileName: fileName.trim(),
        expectedPlanVersionId: planVersionId
      }));
      this.#preview = preview;
      const snapshot = preview.toSnapshot();
      const message = preview.canCommit()
        ? `Preview完了：追加${snapshot.counts.add}件、更新${snapshot.counts.update}件、変更なし${snapshot.counts.unchanged}件です。`
        : `PreviewにErrorが${snapshot.counts.errors}件あります。修正後に再度Fileを選択してください。`;
      return this.#replace({
        screenStatus: "PREVIEW_READY",
        fileName: snapshot.fileName,
        expectedPlanVersionId: snapshot.expectedPlanVersionId,
        preview: snapshot,
        commitResult: null,
        error: null,
        message,
        canCommit: preview.canCommit()
      });
    } catch (error) {
      this.#preview = null;
      return this.#replace({
        screenStatus: "ERROR",
        preview: null,
        commitResult: null,
        error: errorPresentation(error),
        message: "CSV Previewを作成できませんでした。",
        canCommit: false
      });
    }
  }

  async commit() {
    if (this.#preview === null) {
      return this.#replace({
        screenStatus: "ERROR",
        error: errorPresentation(createApplicationError(
          ERROR_CODES.IMPORT_COMMIT_NOT_ALLOWED,
          "Create an Import Preview before committing.",
          {}
        )),
        message: "先にCSV Fileを選択してPreviewを作成してください。",
        canCommit: false
      });
    }

    this.#replace({
      screenStatus: "COMMITTING",
      error: null,
      message: "Preview内容を保存しています。",
      canCommit: false
    });

    try {
      const result = await this.#commitService.execute({ preview: this.#preview });
      return this.#replace({
        screenStatus: "COMMITTED",
        commitResult: result,
        error: null,
        message: `Import完了：追加${result.added}件、更新${result.updated}件、変更なし${result.unchanged}件です。`,
        canCommit: false
      });
    } catch (error) {
      return this.#replace({
        screenStatus: "ERROR",
        error: errorPresentation(error),
        message: "CSV Importを確定できませんでした。Previewを作り直してください。",
        canCommit: false
      });
    }
  }

  showError(error, { message = "CSV処理に失敗しました。" } = {}) {
    return this.#replace({
      screenStatus: "ERROR",
      error: errorPresentation(error),
      message,
      canCommit: false
    });
  }

  reset({ message = null } = {}) {
    this.#preview = null;
    const next = initialState();
    return this.#replace({
      ...next,
      message: message ?? next.message
    });
  }

  #replace(patch) {
    this.#state = freezeDeep({
      ...this.#state,
      ...patch,
      revision: this.#state.revision + 1
    });
    return this.#state;
  }
}

export function assertPlannedOperationCsvImportController(value) {
  const methods = ["getState", "previewCsv", "commit", "showError", "reset"];
  if (
    value === null ||
    typeof value !== "object" ||
    methods.some((method) => typeof value[method] !== "function")
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_PLANNED_OPERATION_CSV_IMPORT_CONTROLLER,
      "value does not satisfy the Planned Operation CSV Import Controller contract.",
      { methods }
    );
  }
  return value;
}
