import {
  createKifImportWarning,
  KIF_IMPORT_ERROR_CODES,
  KIF_IMPORT_WARNING_CODES,
  KifImportError
} from "./KifImportErrors.js";

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const KIF_MARKERS = [
  "開始日時：",
  "対局日：",
  "先手：",
  "後手：",
  "下手：",
  "上手：",
  "手合割：",
  "手数----指手",
  "棋譜ファイル"
];

function decode(buffer, encoding) {
  return new TextDecoder(encoding, { fatal: true })
    .decode(buffer)
    .replace(/^\uFEFF/, "");
}

function textScore(text) {
  const markerScore = KIF_MARKERS.reduce(
    (score, marker) => score + (text.includes(marker) ? 5 : 0),
    0
  );
  const moveScore = /^\s*[０-９0-9]+\s+\S+/m.test(text) ? 8 : 0;
  const replacementPenalty = (text.match(/�/g)?.length ?? 0) * 20;
  const controlPenalty = (text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g)?.length ?? 0) * 10;
  return markerScore + moveScore - replacementPenalty - controlPenalty;
}

function expectedEncodings(fileName, bytes) {
  const hasUtf8Bom = bytes.length >= 3 &&
    bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
  if (hasUtf8Bom || /\.kifu$/i.test(fileName)) return ["utf-8", "shift_jis"];
  return ["shift_jis", "utf-8"];
}

export class KifFileReaderAdapter {
  constructor({ maxBytes = DEFAULT_MAX_BYTES } = {}) {
    this.maxBytes = maxBytes;
  }

  async read({ file } = {}) {
    if (!file) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_FILE_NOT_SELECTED,
        "KIFファイルが選択されていません。"
      );
    }

    const sourceFileName = String(file.name ?? "").trim();
    if (!/\.kifu?$/i.test(sourceFileName)) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_FILE_EXTENSION_INVALID,
        ".kifまたは.kifu形式のFileを選択してください。",
        { sourceFileName }
      );
    }

    const declaredSize = Number(file.size ?? 0);
    if (declaredSize === 0) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_FILE_EMPTY,
        "KIFファイルが空です。",
        { sourceFileName }
      );
    }
    if (!Number.isFinite(declaredSize) || declaredSize < 0) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_READ_FAILED,
        "KIFファイルのSize情報が不正です。",
        { sourceFileName, declaredSize }
      );
    }
    if (declaredSize > this.maxBytes) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_FILE_TOO_LARGE,
        `KIFファイルが大きすぎます。上限は${this.maxBytes} byteです。`,
        { sourceFileName, declaredSize, maxBytes: this.maxBytes }
      );
    }

    let buffer;
    try {
      if (typeof file.arrayBuffer !== "function") {
        throw new TypeError("File.arrayBufferが利用できません。");
      }
      buffer = await file.arrayBuffer();
    } catch (cause) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_READ_FAILED,
        "KIFファイルを読み取れませんでした。Fileを選び直してください。",
        { sourceFileName },
        { cause }
      );
    }

    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength === 0) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_FILE_EMPTY,
        "KIFファイルが空です。",
        { sourceFileName }
      );
    }
    if (buffer.byteLength > this.maxBytes) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_FILE_TOO_LARGE,
        `KIFファイルが大きすぎます。上限は${this.maxBytes} byteです。`,
        { sourceFileName, actualSize: buffer.byteLength, maxBytes: this.maxBytes }
      );
    }

    const bytes = new Uint8Array(buffer);
    const candidates = [];
    for (const encoding of expectedEncodings(sourceFileName, bytes)) {
      try {
        const text = decode(buffer, encoding);
        candidates.push({ encoding, text, score: textScore(text) });
      } catch {
        // 次のEncoding候補を試す。
      }
    }

    if (candidates.length === 0) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_ENCODING_UNSUPPORTED,
        "文字Encodingを判定できませんでした。UTF-8またはShift_JISのKIFを使用してください。",
        { sourceFileName }
      );
    }

    candidates.sort((left, right) => right.score - left.score);
    const best = candidates[0];
    if (best.score <= 0) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.INVALID_KIF_FORMAT,
        "選択したFileはKIF形式として認識できません。",
        { sourceFileName, triedEncodings: candidates.map((item) => item.encoding) }
      );
    }

    const warnings = [];
    const extensionExpectedEncoding = /\.kifu$/i.test(sourceFileName)
      ? "utf-8"
      : "shift_jis";
    if (best.encoding !== extensionExpectedEncoding) {
      warnings.push(createKifImportWarning(
        KIF_IMPORT_WARNING_CODES.ENCODING_EXTENSION_MISMATCH,
        "拡張子の標準Encodingと実際の内容が異なります。内容を優先して読み込みました。",
        {
          sourceFileName,
          expectedEncoding: extensionExpectedEncoding,
          detectedEncoding: best.encoding
        }
      ));
    }

    return Object.freeze({
      sourceFileName,
      byteLength: buffer.byteLength,
      encoding: best.encoding,
      text: best.text,
      warnings: Object.freeze(warnings)
    });
  }
}
