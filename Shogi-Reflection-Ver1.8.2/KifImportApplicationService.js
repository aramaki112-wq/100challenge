function assertMethod(target, methodName, label) {
  if (typeof target?.[methodName] !== "function") {
    throw new TypeError(`${label}.${methodName}が必要です。`);
  }
  return target;
}

export class KifImportApplicationService {
  constructor({ fileReader, parser, compatibility, previewPresenter } = {}) {
    this.fileReader = assertMethod(fileReader, "read", "fileReader");
    this.parser = assertMethod(parser, "parse", "parser");
    this.compatibility = assertMethod(compatibility, "inspect", "compatibility");
    this.previewPresenter = assertMethod(previewPresenter, "present", "previewPresenter");
  }

  async execute({ file } = {}) {
    const readResult = await this.fileReader.read({ file });
    const dto = this.parser.parse({
      text: readResult.text,
      sourceFileName: readResult.sourceFileName,
      byteLength: readResult.byteLength,
      encoding: readResult.encoding,
      readerWarnings: readResult.warnings
    });
    const compatibility = this.compatibility.inspect({ dto });
    const preview = this.previewPresenter.present({ dto, compatibility });
    return Object.freeze({
      status: "KIF_PREVIEW_READY",
      dto,
      compatibility,
      preview
    });
  }
}
