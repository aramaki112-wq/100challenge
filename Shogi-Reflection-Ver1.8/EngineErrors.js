export const ENGINE_ERROR_CODES = Object.freeze({
  ENGINE_NOT_FOUND: "ENGINE_NOT_FOUND",
  ENGINE_INITIALIZATION_FAILED: "ENGINE_INITIALIZATION_FAILED",
  UNSUPPORTED_VERSION: "UNSUPPORTED_VERSION",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  TIMEOUT: "TIMEOUT",
  ANALYSIS_CANCELLED: "ANALYSIS_CANCELLED",
  EVALUATION_FILE_MISSING: "EVALUATION_FILE_MISSING",
  ENGINE_CRASH: "ENGINE_CRASH",
  UNSUPPORTED_BROWSER: "UNSUPPORTED_BROWSER",
  ANALYSIS_PARTIAL_RESULT: "ANALYSIS_PARTIAL_RESULT"
});

const USER_MESSAGES = Object.freeze({
  [ENGINE_ERROR_CODES.ENGINE_NOT_FOUND]: "解析Engineが設定されていません。手動の振り返り機能はそのまま利用できます。",
  [ENGINE_ERROR_CODES.ENGINE_INITIALIZATION_FAILED]: "解析Engineを初期化できませんでした。Engine設定を確認してください。",
  [ENGINE_ERROR_CODES.UNSUPPORTED_VERSION]: "このEngine Versionは現在のAdapterでは利用できません。",
  [ENGINE_ERROR_CODES.INVALID_RESPONSE]: "解析Engineから解釈できない応答を受け取りました。",
  [ENGINE_ERROR_CODES.TIMEOUT]: "解析が時間内に完了しませんでした。",
  [ENGINE_ERROR_CODES.ANALYSIS_CANCELLED]: "解析を中止しました。",
  [ENGINE_ERROR_CODES.EVALUATION_FILE_MISSING]: "Engineが必要とする評価Fileを確認できませんでした。",
  [ENGINE_ERROR_CODES.ENGINE_CRASH]: "解析Engineが異常終了しました。",
  [ENGINE_ERROR_CODES.UNSUPPORTED_BROWSER]: "このBrowser環境では設定されたEngine実行方式を利用できません。",
  [ENGINE_ERROR_CODES.ANALYSIS_PARTIAL_RESULT]: "一部の局面だけ解析できました。結果は参考情報として扱ってください。"
});

export class EngineAnalysisError extends Error {
  constructor(code, message = "", { cause = null, details = null } = {}) {
    super(message || USER_MESSAGES[code] || "Engine解析でErrorが発生しました。", cause ? { cause } : undefined);
    this.name = "EngineAnalysisError";
    this.code = code;
    this.userMessage = USER_MESSAGES[code] || this.message;
    this.details = details;
  }
}

export function isEngineAnalysisError(error) {
  return error instanceof EngineAnalysisError;
}
