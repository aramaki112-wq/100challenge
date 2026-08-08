import {
  KIF_IMPORT_ERROR_CODES,
  KifImportError
} from "./KifImportErrors.js";

export class BrowserKifClipboardAdapter {
  constructor({ clipboard = globalThis.navigator?.clipboard } = {}) {
    this.clipboard = clipboard;
  }

  async readText() {
    if (!this.clipboard || typeof this.clipboard.readText !== "function") {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_CLIPBOARD_UNAVAILABLE,
        "このブラウザではクリップボードからの直接読み込みを利用できません。下の貼り付け欄を長押しして「ペースト」を選んでください。"
      );
    }

    try {
      return await this.clipboard.readText();
    } catch (cause) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_CLIPBOARD_READ_FAILED,
        "クリップボードを読み取れませんでした。ブラウザの権限を確認するか、貼り付け欄を長押しして手動でペーストしてください。",
        {},
        { cause }
      );
    }
  }
}
