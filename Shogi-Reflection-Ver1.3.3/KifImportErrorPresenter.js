import {
  KIF_IMPORT_ERROR_CODES,
  KifImportError
} from "./KifImportErrors.js";

const TITLE_BY_CODE = Object.freeze({
  [KIF_IMPORT_ERROR_CODES.KIF_FILE_NOT_SELECTED]: "ファイルが選択されていません",
  [KIF_IMPORT_ERROR_CODES.KIF_FILE_EMPTY]: "空のKIFファイルです",
  [KIF_IMPORT_ERROR_CODES.KIF_FILE_TOO_LARGE]: "KIFファイルが大きすぎます",
  [KIF_IMPORT_ERROR_CODES.KIF_FILE_EXTENSION_INVALID]: "対応していないファイル形式です",
  [KIF_IMPORT_ERROR_CODES.KIF_READ_FAILED]: "KIFファイルを読み取れません",
  [KIF_IMPORT_ERROR_CODES.KIF_CLIPBOARD_UNAVAILABLE]: "クリップボードからの直接読み込みを利用できません",
  [KIF_IMPORT_ERROR_CODES.KIF_CLIPBOARD_READ_FAILED]: "クリップボードを読み取れません",
  [KIF_IMPORT_ERROR_CODES.KIF_ENCODING_UNSUPPORTED]: "文字コードを判定できません",
  [KIF_IMPORT_ERROR_CODES.INVALID_KIF_FORMAT]: "KIF形式として認識できません",
  [KIF_IMPORT_ERROR_CODES.KIF_HEADER_INVALID]: "KIFヘッダーが壊れています",
  [KIF_IMPORT_ERROR_CODES.KIF_MOVES_NOT_FOUND]: "指し手が見つかりません",
  [KIF_IMPORT_ERROR_CODES.KIF_MOVE_INVALID]: "指し手行が不正です",
  [KIF_IMPORT_ERROR_CODES.KIF_MOVE_NUMBER_DUPLICATE]: "手数が重複しています",
  [KIF_IMPORT_ERROR_CODES.KIF_MOVE_NUMBER_GAP]: "手数が飛んでいます",
  [KIF_IMPORT_ERROR_CODES.KIF_TERMINATION_INVALID]: "終局表記が不正です",
  [KIF_IMPORT_ERROR_CODES.KIF_CONTENT_CONFLICT]: "KIF内部の内容が矛盾しています",
  [KIF_IMPORT_ERROR_CODES.KIF_PREVIEW_NOT_FOUND]: "棋譜読み込み確認がありません"
});

export class KifImportErrorPresenter {
  present(error) {
    if (error instanceof KifImportError) {
      return Object.freeze({
        kind: "error",
        title: TITLE_BY_CODE[error.code] ?? "KIFの読み込みに失敗しました",
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
      title: "KIFの読み込みに失敗しました",
      message: "予期しないエラーが発生しました。現在入力中のフォームは変更されていません。",
      details: Object.freeze([])
    });
  }
}
