import { ApplicationError } from "./ApplicationErrors.js";

export const KEY_POSITION_REPLAY_ERROR_CODES = Object.freeze({
  KEY_POSITION_REPLAY_NOT_AVAILABLE: "KEY_POSITION_REPLAY_NOT_AVAILABLE",
  KEY_POSITION_REPLAY_MOVE_REQUIRED: "KEY_POSITION_REPLAY_MOVE_REQUIRED",
  KEY_POSITION_REPLAY_SNAPSHOT_INVALID: "KEY_POSITION_REPLAY_SNAPSHOT_INVALID",
  KEY_POSITION_REPLAY_DUPLICATE: "KEY_POSITION_REPLAY_DUPLICATE",
  KEY_POSITION_LIMIT_REACHED: "KEY_POSITION_LIMIT_REACHED",
  KEY_POSITION_REPLAY_SOURCE_MISMATCH: "KEY_POSITION_REPLAY_SOURCE_MISMATCH",
  KEY_POSITION_REPLAY_REFERENCE_INVALID: "KEY_POSITION_REPLAY_REFERENCE_INVALID",
  KEY_POSITION_SNAPSHOT_VERSION_UNSUPPORTED: "KEY_POSITION_SNAPSHOT_VERSION_UNSUPPORTED",
  KEY_POSITION_REPLAY_ADD_FAILED: "KEY_POSITION_REPLAY_ADD_FAILED"
});

const USER_MESSAGES = Object.freeze({
  KEY_POSITION_REPLAY_NOT_AVAILABLE: "棋譜再現を開始してから重要局面へ追加してください。",
  KEY_POSITION_REPLAY_MOVE_REQUIRED: "0手目の初期局面は重要局面へ追加できません。1手目以降へ移動してください。",
  KEY_POSITION_REPLAY_SNAPSHOT_INVALID: "現在局面を安全なSnapshotとして取得できませんでした。",
  KEY_POSITION_REPLAY_DUPLICATE: "同じ手数の重要局面がすでに入力されています。",
  KEY_POSITION_LIMIT_REACHED: "重要局面は最大5件です。既存の局面を整理してから追加してください。",
  KEY_POSITION_REPLAY_SOURCE_MISMATCH: "再現中の棋譜と編集中Formの棋譜が一致しません。",
  KEY_POSITION_REPLAY_REFERENCE_INVALID: "重要局面のReplay参照Dataが不正です。",
  KEY_POSITION_SNAPSHOT_VERSION_UNSUPPORTED: "対応していない局面Snapshot Versionです。",
  KEY_POSITION_REPLAY_ADD_FAILED: "現在局面を重要局面候補へ追加できませんでした。"
});

export class KeyPositionReplayError extends ApplicationError {
  constructor(code, message, context = {}, options = {}) {
    super(code, message, context, options);
    this.name = "KeyPositionReplayError";
    this.userMessage = USER_MESSAGES[code] ?? USER_MESSAGES.KEY_POSITION_REPLAY_ADD_FAILED;
  }
}

export function toKeyPositionReplayErrorViewModel(error) {
  const source = error instanceof KeyPositionReplayError
    ? error
    : new KeyPositionReplayError(
      KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_ADD_FAILED,
      error?.message ?? "重要局面追加中に予期しないErrorが発生しました。",
      {},
      { cause: error }
    );
  return Object.freeze({
    code: source.code,
    message: source.userMessage,
    detail: source.message,
    context: source.context
  });
}
