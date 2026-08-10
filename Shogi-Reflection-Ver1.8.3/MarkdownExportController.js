export class MarkdownExportController {
  constructor({ reviewExporter, observationCardExporter, clipboardAdapter, fileAdapter } = {}) {
    if (!reviewExporter || typeof reviewExporter.execute !== "function") throw new TypeError("reviewExporterを指定してください。");
    if (!observationCardExporter || typeof observationCardExporter.execute !== "function") throw new TypeError("observationCardExporterを指定してください。");
    if (!clipboardAdapter || typeof clipboardAdapter.writeText !== "function") throw new TypeError("clipboardAdapterを指定してください。");
    if (!fileAdapter || typeof fileAdapter.downloadText !== "function") throw new TypeError("fileAdapterを指定してください。");
    this.reviewExporter = reviewExporter;
    this.observationCardExporter = observationCardExporter;
    this.clipboardAdapter = clipboardAdapter;
    this.fileAdapter = fileAdapter;
  }

  createGameReviewMarkdown({ reviewId } = {}) {
    return this.reviewExporter.execute({ reviewId });
  }

  createObservationCardMarkdown({ reviewId } = {}) {
    return this.observationCardExporter.execute({ reviewId });
  }

  async copy({ artifact } = {}) {
    this.#assertArtifact(artifact);
    const result = await this.clipboardAdapter.writeText(artifact.markdownText);
    return Object.freeze({ ...result, fileName: artifact.fileName, kind: artifact.kind });
  }

  download({ artifact } = {}) {
    this.#assertArtifact(artifact);
    const result = this.fileAdapter.downloadText({
      fileName: artifact.fileName,
      text: artifact.markdownText,
      mimeType: "text/markdown"
    });
    return Object.freeze({ ...result, kind: artifact.kind });
  }

  #assertArtifact(artifact) {
    if (!artifact || typeof artifact.markdownText !== "string" || typeof artifact.fileName !== "string") {
      throw new TypeError("Markdown Artifactを指定してください。");
    }
  }
}
