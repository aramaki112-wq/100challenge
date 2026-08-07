function required(documentObject, id) {
  const element = documentObject.getElementById(id);
  if (!element) throw new Error(`必要なElementがありません: #${id}`);
  return element;
}

export class BrowserMarkdownExportView {
  constructor({ documentObject = document } = {}) {
    this.panel = required(documentObject, "markdown-export-panel");
    this.heading = required(documentObject, "markdown-export-heading");
    this.description = required(documentObject, "markdown-export-description");
    this.preview = required(documentObject, "markdown-preview");
    this.copyButton = required(documentObject, "copy-markdown");
    this.downloadButton = required(documentObject, "download-markdown");
  }

  renderArtifact(artifact) {
    if (!artifact || typeof artifact.markdownText !== "string") throw new TypeError("Markdown Artifactを指定してください。");
    this.panel.hidden = false;
    this.panel.dataset.kind = artifact.kind;
    this.heading.textContent = artifact.title;
    this.description.textContent = `${artifact.fileName}｜${artifact.markdownText.length}文字`;
    this.preview.value = artifact.markdownText;
    this.copyButton.disabled = false;
    this.downloadButton.disabled = false;
    return Object.freeze({ status: "RENDERED", kind: artifact.kind });
  }

  clear() {
    this.panel.hidden = true;
    this.panel.dataset.kind = "";
    this.heading.textContent = "Markdown Preview";
    this.description.textContent = "保存済み対局からMarkdownを作成すると、ここへ表示されます。";
    this.preview.value = "";
    this.copyButton.disabled = true;
    this.downloadButton.disabled = true;
  }

  scrollIntoView() {
    this.panel.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }
}
