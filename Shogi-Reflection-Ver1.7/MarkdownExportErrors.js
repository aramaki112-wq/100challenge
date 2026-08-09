export const MARKDOWN_EXPORT_ERROR_CODES = Object.freeze({
  INVALID_GAME_REVIEW_SNAPSHOT: "INVALID_GAME_REVIEW_SNAPSHOT",
  OBSERVATION_CARD_NOT_READY: "OBSERVATION_CARD_NOT_READY",
  CLIPBOARD_UNAVAILABLE: "CLIPBOARD_UNAVAILABLE",
  CLIPBOARD_WRITE_FAILED: "CLIPBOARD_WRITE_FAILED"
});

export class MarkdownExportError extends Error {
  constructor(code, message, context = {}, options = {}) {
    super(message, options);
    this.name = "MarkdownExportError";
    this.code = code;
    this.context = Object.freeze({ ...context });
  }
}
