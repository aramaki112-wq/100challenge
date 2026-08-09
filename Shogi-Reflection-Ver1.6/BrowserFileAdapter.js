export class BrowserFileAdapter {
  constructor({ documentObject = globalThis.document, urlObject = globalThis.URL } = {}) {
    this.documentObject = documentObject;
    this.urlObject = urlObject;
  }

  downloadText({ fileName, text, mimeType = "application/json" } = {}) {
    if (typeof fileName !== "string" || fileName.trim() === "") {
      throw new TypeError("fileNameは必須です。");
    }
    if (typeof text !== "string") {
      throw new TypeError("Download対象は文字列である必要があります。");
    }

    const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
    const url = this.urlObject.createObjectURL(blob);
    const anchor = this.documentObject.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.hidden = true;
    this.documentObject.body.append(anchor);
    anchor.click();
    anchor.remove();
    this.urlObject.revokeObjectURL(url);
    return Object.freeze({ status: "DOWNLOADED", fileName });
  }

  async readText(file) {
    if (!file || typeof file.text !== "function") {
      throw new TypeError("読込対象Fileを指定してください。");
    }
    return file.text();
  }
}
