function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

export class BrowserKifImportView {
  constructor({ documentObject = document } = {}) {
    this.document = documentObject;
    this.root = this.#required("kif-import-panel");
    this.preview = this.#required("kif-import-preview");
    this.status = this.#required("kif-import-status");
    this.fileInput = this.#required("kif-file-input");
    this.dropZone = this.#required("kif-drop-zone");
    this.pasteText = this.#required("kif-paste-text");
    this.sideSelect = this.#required("kif-my-side");
  }

  #required(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`必要な画面要素がありません: #${id}`);
    return element;
  }

  getPastedText() {
    return this.pasteText.value;
  }

  setPastedText(text) {
    this.pasteText.value = String(text ?? "");
  }

  focusPastedText() {
    this.pasteText.focus();
  }

  setSelectedSide(side) {
    if ([...this.sideSelect.options].some((option) => option.value === side)) {
      this.sideSelect.value = side;
    }
  }

  getSelectedSide() {
    return this.sideSelect.value;
  }

  renderPreview(model) {
    const fieldValues = {
      "preview-file": model.fileName,
      "preview-encoding": model.encoding,
      "preview-date": model.playedAt,
      "preview-sente": model.senteName,
      "preview-gote": model.goteName,
      "preview-event": model.eventName,
      "preview-place": model.place,
      "preview-handicap": model.handicap,
      "preview-time-control": model.timeControl,
      "preview-result": model.result,
      "preview-termination": model.terminationReason,
      "preview-moves": model.totalMoves,
      "preview-summary": model.summary,
      "preview-source": model.sourceCompatibility
    };

    for (const [dataName, value] of Object.entries(fieldValues)) {
      const element = this.preview.querySelector(`[data-${dataName}]`);
      if (element) element.textContent = String(value);
    }

    const warningList = this.preview.querySelector("[data-preview-warnings]");
    warningList.innerHTML = model.warnings.length === 0
      ? "<li>注意事項はありません。</li>"
      : model.warnings.map((item) =>
        `<li><strong>${escapeHtml(item.code)}</strong> ${escapeHtml(item.message)}</li>`
      ).join("");

    const compatibilityList = this.preview.querySelector("[data-preview-compatibility]");
    compatibilityList.innerHTML = model.compatibilityNotes.length === 0
      ? "<li>標準的なKIFとして解析しました。</li>"
      : model.compatibilityNotes.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

    this.preview.hidden = false;
    this.status.dataset.kind = "success";
    this.status.textContent = "KIFを解析しました。内容と自分の手番を確認してから入力フォームへ反映してください。";
  }

  showFeedback({ kind = "info", title, message, details = [] }) {
    this.status.dataset.kind = kind;
    this.status.innerHTML = [
      `<strong>${escapeHtml(title)}</strong>`,
      `<p>${escapeHtml(message)}</p>`,
      details.length
        ? `<ul>${details.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : ""
    ].join("");
  }

  resetPreview(message = "棋譜読み込み確認を閉じました。", { focusInput = false } = {}) {
    this.preview.hidden = true;
    this.status.dataset.kind = "info";
    this.status.textContent = message;
    this.fileInput.value = "";
    if (focusInput) this.focusPastedText();
  }

  clearInput(message = "KIF入力をクリアしました。保存済み対局とクリップボードは変更していません。") {
    this.pasteText.value = "";
    this.resetPreview(message, { focusInput: true });
  }

  clearPreview(message = "棋譜読み込み確認を閉じました。") {
    this.resetPreview(message);
  }

  setDropActive(active) {
    this.dropZone.dataset.dragActive = active ? "true" : "false";
  }
}
