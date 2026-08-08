import {
  MARKDOWN_EXPORT_ERROR_CODES,
  MarkdownExportError
} from "./MarkdownExportErrors.js";

export class BrowserClipboardAdapter {
  constructor({ clipboard = globalThis.navigator?.clipboard } = {}) {
    this.clipboard = clipboard;
  }

  async writeText(text) {
    if (typeof text !== "string") throw new TypeError("Copy対象は文字列である必要があります。");
    if (!this.clipboard || typeof this.clipboard.writeText !== "function") {
      throw new MarkdownExportError(
        MARKDOWN_EXPORT_ERROR_CODES.CLIPBOARD_UNAVAILABLE,
        "このBrowserではClipboardへのCopyを利用できません。"
      );
    }
    try {
      await this.clipboard.writeText(text);
      return Object.freeze({ status: "COPIED", characterCount: text.length });
    } catch (error) {
      throw new MarkdownExportError(
        MARKDOWN_EXPORT_ERROR_CODES.CLIPBOARD_WRITE_FAILED,
        "ClipboardへのCopyに失敗しました。",
        {},
        { cause: error }
      );
    }
  }
}
