import {
  KIF_IMPORT_ERROR_CODES,
  KifImportError
} from "./KifImportErrors.js";

const DEFAULT_SOURCE_FILE_NAME = "clipboard-paste.kifu";

export class KifPastedTextAdapter {
  toFile({ text, sourceFileName = DEFAULT_SOURCE_FILE_NAME } = {}) {
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_FILE_EMPTY,
        "貼り付けられたKIF Textが空です。KIF全文を貼り付けてください。",
        { inputSource: "PASTED_TEXT" }
      );
    }

    const normalizedFileName = String(sourceFileName ?? "").trim() || DEFAULT_SOURCE_FILE_NAME;
    const bytes = new TextEncoder().encode(text);

    return Object.freeze({
      name: normalizedFileName,
      size: bytes.byteLength,
      type: "text/plain;charset=utf-8",
      async arrayBuffer() {
        return bytes.slice().buffer;
      }
    });
  }
}
