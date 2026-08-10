function assertMethod(target, methodName, label) {
  if (typeof target?.[methodName] !== "function") {
    throw new TypeError(`${label}.${methodName}が必要です。`);
  }
  return target;
}

/**
 * KIF読み込み中の一時状態だけを破棄するPresentation Controller。
 * Repository / LocalStorage / Clipboardは依存先に持たない。
 */
export class KifImportDraftResetController {
  constructor({ importController, view } = {}) {
    this.importController = assertMethod(importController, "cancel", "importController");
    this.view = assertMethod(assertMethod(view, "clearInput", "view"), "resetPreview", "view");
  }

  clearInput() {
    const previewResult = this.importController.cancel();
    this.view.clearInput(
      "KIF入力をクリアしました。保存済み対局・ブラウザ保存データ・クリップボードは変更していません。"
    );
    return Object.freeze({
      status: "KIF_INPUT_CLEARED",
      previewStatus: previewResult.status
    });
  }

  retryInput() {
    const previewResult = this.importController.cancel();
    this.view.resetPreview(
      previewResult.status === "IMPORT_CANCELLED"
        ? "棋譜入力へ戻りました。貼り付けたKIF本文は残しているので、修正してもう一度確認できます。"
        : "読み込み確認はありません。KIF本文を入力して確認してください。",
      { focusInput: true }
    );
    return Object.freeze({
      status: "KIF_IMPORT_RETRY_READY",
      previewStatus: previewResult.status
    });
  }
}
