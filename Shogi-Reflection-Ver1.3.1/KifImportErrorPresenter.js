import {
  KIF_IMPORT_ERROR_CODES,
  KifImportError
} from "./KifImportErrors.js";

const TITLE_BY_CODE = Object.freeze({
  [KIF_IMPORT_ERROR_CODES.KIF_FILE_NOT_SELECTED]: "Fileが選択されていません",
  [KIF_IMPORT_ERROR_CODES.KIF_FILE_EMPTY]: "空のKIF Fileです",
  [KIF_IMPORT_ERROR_CODES.KIF_FILE_TOO_LARGE]: "KIF Fileが大きすぎます",
  [KIF_IMPORT_ERROR_CODES.KIF_FILE_EXTENSION_INVALID]: "対応していないFile形式です",
  [KIF_IMPORT_ERROR_CODES.KIF_READ_FAILED]: "KIF Fileを読み取れません",
  [KIF_IMPORT_ERROR_CODES.KIF_CLIPBOARD_UNAVAILABLE]: "Clipboardの直接読込を利用できません",
  [KIF_IMPORT_ERROR_CODES.KIF_CLIPBOARD_READ_FAILED]: "Clipboardを読み取れません",
  [KIF_IMPORT_ERROR_CODES.KIF_ENCODING_UNSUPPORTED]: "文字Encodingを判定できません",
  [KIF_IMPORT_ERROR_CODES.INVALID_KIF_FORMAT]: "KIF形式として認識できません",
  [KIF_IMPORT_ERROR_CODES.KIF_HEADER_INVALID]: "KIF Headerが壊れています",
  [KIF_IMPORT_ERROR_CODES.KIF_MOVES_NOT_FOUND]: "指し手が見つかりません",
  [KIF_IMPORT_ERROR_CODES.KIF_MOVE_INVALID]: "指し手行が不正です",
  [KIF_IMPORT_ERROR_CODES.KIF_MOVE_NUMBER_DUPLICATE]: "手数が重複しています",
  [KIF_IMPORT_ERROR_CODES.KIF_MOVE_NUMBER_GAP]: "手数が飛んでいます",
  [KIF_IMPORT_ERROR_CODES.KIF_TERMINATION_INVALID]: "終局表記が不正です",
  [KIF_IMPORT_ERROR_CODES.KIF_CONTENT_CONFLICT]: "KIF内部の内容が矛盾しています",
  [KIF_IMPORT_ERROR_CODES.KIF_PREVIEW_NOT_FOUND]: "Import Previewがありません"
});

export class KifImportErrorPresenter {
  present(error) {
    if (error instanceof KifImportError) {
      return Object.freeze({
        kind: "error",
        title: TITLE_BY_CODE[error.code] ?? "KIF Importに失敗しました",
        message: error.userMessage,
        details: Object.freeze([
          error.code,
          ...Object.entries(error.context).map(([key, value]) =>
            `${key}: ${String(value)}`
          )
        ])
      });
    }

    return Object.freeze({
      kind: "error",
      title: "KIF Importに失敗しました",
      message: "予期しないErrorが発生しました。現在入力中のFormは変更されていません。",
      details: Object.freeze([])
    });
  }
}
