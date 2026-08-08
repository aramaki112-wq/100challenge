import {
  REFLECTION_ERROR_CODES,
  ReflectionError
} from "./ReflectionErrors.js";
import { KeyPosition } from "./KeyPosition.js";

export const SHOGI_SIDE = Object.freeze({
  SENTE: "SENTE",
  GOTE: "GOTE"
});

export const GAME_RESULT = Object.freeze({
  WIN: "WIN",
  LOSS: "LOSS",
  DRAW: "DRAW",
  UNKNOWN: "UNKNOWN"
});

function requireText(value, code, message, context = {}) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ReflectionError(code, message, context);
  }
  return value.trim();
}

export class GameReview {
  constructor({
    reviewId,
    gameDate,
    side,
    result,
    opponentName = "",
    timeControl = "",
    kifuText,
    gameStory = "",
    keyPositions = [],
    decisionPattern = "",
    observationTheme = "",
    actionRules = [],
    note = ""
  } = {}) {
    this.reviewId = requireText(
      reviewId,
      REFLECTION_ERROR_CODES.INVALID_REVIEW_ID,
      "reviewIdは必須です。"
    );

    const parsedDate = new Date(gameDate);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new ReflectionError(
        REFLECTION_ERROR_CODES.INVALID_GAME_DATE,
        "gameDateは有効な日時で入力してください。",
        { gameDate }
      );
    }

    if (!Object.values(SHOGI_SIDE).includes(side)) {
      throw new ReflectionError(
        REFLECTION_ERROR_CODES.INVALID_SIDE,
        "sideはSENTEまたはGOTEで入力してください。",
        { side }
      );
    }

    if (!Object.values(GAME_RESULT).includes(result)) {
      throw new ReflectionError(
        REFLECTION_ERROR_CODES.INVALID_RESULT,
        "resultが正式な値ではありません。",
        { result }
      );
    }

    this.gameDate = parsedDate.toISOString();
    this.side = side;
    this.result = result;
    this.opponentName = String(opponentName ?? "").trim();
    this.timeControl = String(timeControl ?? "").trim();
    this.kifuText = requireText(
      kifuText,
      REFLECTION_ERROR_CODES.INVALID_KIFU_TEXT,
      "kifuTextは必須です。"
    );
    this.gameStory = String(gameStory ?? "").trim();

    if (!Array.isArray(keyPositions)) {
      throw new ReflectionError(
        REFLECTION_ERROR_CODES.INVALID_KEY_POSITION,
        "keyPositionsは配列で入力してください。"
      );
    }

    if (keyPositions.length > 5) {
      throw new ReflectionError(
        REFLECTION_ERROR_CODES.TOO_MANY_KEY_POSITIONS,
        "重要局面は5件以内で入力してください。",
        { count: keyPositions.length }
      );
    }

    this.keyPositions = Object.freeze(
      [...keyPositions]
        .map((item) => item instanceof KeyPosition ? item : new KeyPosition(item))
        .sort((a, b) => a.moveNumber - b.moveNumber)
    );

    this.decisionPattern = String(decisionPattern ?? "").trim();
    this.observationTheme = String(observationTheme ?? "").trim();

    if (!Array.isArray(actionRules)) {
      throw new ReflectionError(
        REFLECTION_ERROR_CODES.INVALID_ACTION_RULE,
        "actionRulesは配列で入力してください。"
      );
    }

    if (actionRules.length > 3) {
      throw new ReflectionError(
        REFLECTION_ERROR_CODES.TOO_MANY_ACTION_RULES,
        "実行Ruleは3件以内で入力してください。",
        { count: actionRules.length }
      );
    }

    this.actionRules = Object.freeze(
      actionRules.map((rule, index) => requireText(
        rule,
        REFLECTION_ERROR_CODES.INVALID_ACTION_RULE,
        "実行Ruleは空にできません。",
        { index }
      ))
    );
    this.note = String(note ?? "").trim();
    Object.freeze(this);
  }

  isReadyForNextGame() {
    return (
      this.keyPositions.length >= 3 &&
      this.keyPositions.length <= 5 &&
      this.observationTheme !== "" &&
      this.actionRules.length >= 1 &&
      this.actionRules.length <= 3
    );
  }

  getMissingReflectionItems() {
    const missing = [];
    if (this.keyPositions.length < 3) missing.push("KEY_POSITIONS");
    if (this.observationTheme === "") missing.push("OBSERVATION_THEME");
    if (this.actionRules.length === 0) missing.push("ACTION_RULES");
    return Object.freeze(missing);
  }

  toSnapshot() {
    return Object.freeze({
      reviewId: this.reviewId,
      gameDate: this.gameDate,
      side: this.side,
      result: this.result,
      opponentName: this.opponentName,
      timeControl: this.timeControl,
      kifuText: this.kifuText,
      gameStory: this.gameStory,
      keyPositions: Object.freeze(this.keyPositions.map((item) => item.toSnapshot())),
      decisionPattern: this.decisionPattern,
      observationTheme: this.observationTheme,
      actionRules: Object.freeze([...this.actionRules]),
      note: this.note,
      readyForNextGame: this.isReadyForNextGame(),
      missingReflectionItems: this.getMissingReflectionItems()
    });
  }
}
