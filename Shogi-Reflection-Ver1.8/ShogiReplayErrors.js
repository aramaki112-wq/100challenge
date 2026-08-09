import { ApplicationError } from "./ApplicationErrors.js";

export const SHOGI_REPLAY_ERROR_CODES = Object.freeze({
  SHOGI_REPLAY_NOT_AVAILABLE: "SHOGI_REPLAY_NOT_AVAILABLE",
  SHOGI_INITIAL_POSITION_UNSUPPORTED: "SHOGI_INITIAL_POSITION_UNSUPPORTED",
  SHOGI_MOVE_PARSE_FAILED: "SHOGI_MOVE_PARSE_FAILED",
  SHOGI_MOVE_SOURCE_NOT_FOUND: "SHOGI_MOVE_SOURCE_NOT_FOUND",
  SHOGI_MOVE_SOURCE_AMBIGUOUS: "SHOGI_MOVE_SOURCE_AMBIGUOUS",
  SHOGI_MOVE_DESTINATION_INVALID: "SHOGI_MOVE_DESTINATION_INVALID",
  SHOGI_PIECE_NOT_FOUND: "SHOGI_PIECE_NOT_FOUND",
  SHOGI_DROP_PIECE_NOT_IN_HAND: "SHOGI_DROP_PIECE_NOT_IN_HAND",
  SHOGI_CAPTURE_INVALID: "SHOGI_CAPTURE_INVALID",
  SHOGI_PROMOTION_INVALID: "SHOGI_PROMOTION_INVALID",
  SHOGI_MOVE_NUMBER_INVALID: "SHOGI_MOVE_NUMBER_INVALID",
  SHOGI_POSITION_BUILD_FAILED: "SHOGI_POSITION_BUILD_FAILED",
  SHOGI_REPLAY_JUMP_OUT_OF_RANGE: "SHOGI_REPLAY_JUMP_OUT_OF_RANGE",
  SHOGI_TURN_MISMATCH: "SHOGI_TURN_MISMATCH"
});

const USER_MESSAGES = Object.freeze({
  SHOGI_REPLAY_NOT_AVAILABLE: "棋譜Textがないため、局面を再現できません。",
  SHOGI_INITIAL_POSITION_UNSUPPORTED: "この初期局面または手合割はVer.1.2の再現対象外です。",
  SHOGI_MOVE_PARSE_FAILED: "指し手を安全に読み取れませんでした。",
  SHOGI_MOVE_SOURCE_NOT_FOUND: "移動元の駒を特定できませんでした。",
  SHOGI_MOVE_SOURCE_AMBIGUOUS: "移動元を一意に特定できませんでした。",
  SHOGI_MOVE_DESTINATION_INVALID: "移動先と駒の動きが一致しません。",
  SHOGI_PIECE_NOT_FOUND: "移動元の駒が棋譜表記と一致しません。",
  SHOGI_DROP_PIECE_NOT_IN_HAND: "持ち駒にない駒は打てません。",
  SHOGI_CAPTURE_INVALID: "そのSquareでは駒取りを適用できません。",
  SHOGI_PROMOTION_INVALID: "成・不成の条件が盤面と一致しません。",
  SHOGI_MOVE_NUMBER_INVALID: "手数が連続していません。",
  SHOGI_POSITION_BUILD_FAILED: "局面履歴の生成に失敗しました。",
  SHOGI_REPLAY_JUMP_OUT_OF_RANGE: "指定手数は再現可能範囲外です。",
  SHOGI_TURN_MISMATCH: "棋譜の手番と現在局面の手番が一致しません。"
});

export class ShogiReplayError extends ApplicationError {
  constructor(
    code,
    message,
    {
      moveNumber = null,
      moveText = "",
      replayableUntil = 0,
      detail = {},
      cause
    } = {}
  ) {
    const context = {
      moveNumber: Number.isInteger(moveNumber) ? moveNumber : null,
      moveText: String(moveText ?? ""),
      replayableUntil: Number.isInteger(replayableUntil) ? replayableUntil : 0,
      detail: Object.freeze({ ...detail })
    };
    super(code, message, context, cause ? { cause } : {});
    this.name = "ShogiReplayError";
    this.userMessage = USER_MESSAGES[code] ?? "棋譜再現中に整合性Errorが発生しました。";
    this.moveNumber = Number.isInteger(moveNumber) ? moveNumber : null;
    this.moveText = String(moveText ?? "");
    this.replayableUntil = Number.isInteger(replayableUntil) ? replayableUntil : 0;
    this.detail = Object.freeze({ ...detail });
  }
}

export function toReplayErrorViewModel(error) {
  const source = error instanceof ShogiReplayError
    ? error
    : new ShogiReplayError(
      SHOGI_REPLAY_ERROR_CODES.SHOGI_POSITION_BUILD_FAILED,
      error?.message ?? "局面履歴の生成に失敗しました。",
      { cause: error }
    );

  return Object.freeze({
    code: source.code,
    message: source.userMessage,
    detail: source.message,
    moveNumber: source.moveNumber,
    moveText: source.moveText,
    replayableUntil: source.replayableUntil
  });
}
