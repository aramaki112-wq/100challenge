import {
  KIF_IMPORT_ERROR_CODES,
  KifImportError
} from "./KifImportErrors.js";

function assertMethod(target, methodName, label) {
  if (typeof target?.[methodName] !== "function") {
    throw new TypeError(`${label}.${methodName}が必要です。`);
  }
  return target;
}

export class KifImportController {
  #pendingImport = null;

  constructor({ importService, formMapper } = {}) {
    this.importService = assertMethod(importService, "execute", "importService");
    this.formMapper = assertMethod(formMapper, "apply", "formMapper");
  }

  get hasPendingPreview() {
    return this.#pendingImport !== null;
  }

  async selectFile({ file } = {}) {
    const imported = await this.importService.execute({ file });
    this.#pendingImport = imported;
    return Object.freeze({
      status: "PREVIEW_READY",
      preview: imported.preview
    });
  }

  applyToForm({ currentForm, mySide } = {}) {
    if (!this.#pendingImport) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_PREVIEW_NOT_FOUND,
        "Formへ反映できるImport Previewがありません。"
      );
    }

    const mapped = this.formMapper.apply({
      currentForm,
      dto: this.#pendingImport.dto,
      mySide
    });
    this.#pendingImport = null;
    return Object.freeze({
      status: "APPLIED_TO_FORM",
      ...mapped
    });
  }

  cancel() {
    const hadPendingPreview = this.#pendingImport !== null;
    this.#pendingImport = null;
    return Object.freeze({
      status: hadPendingPreview ? "IMPORT_CANCELLED" : "NO_PREVIEW"
    });
  }
}
