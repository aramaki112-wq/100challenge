import {
  REFLECTION_ERROR_CODES,
  ReflectionError
} from "./ReflectionErrors.js";
import { KeyPositionReplayReference } from "./KeyPositionReplayReference.js";

export const KEY_POSITION_FACT_TYPE = Object.freeze({
  FACT: "FACT",
  INTERPRETATION: "INTERPRETATION",
  HYPOTHESIS: "HYPOTHESIS"
});

function requireText(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ReflectionError(
      REFLECTION_ERROR_CODES.INVALID_KEY_POSITION,
      `${fieldName}は空にできません。`,
      { fieldName }
    );
  }
  return value.trim();
}

export class KeyPosition {
  constructor({
    keyPositionId,
    moveNumber,
    moveText = "",
    title,
    boardState = "",
    fact,
    interpretation,
    hypothesis,
    myThought = "",
    opponentIntent = "",
    emotion = "",
    decisionImpact = "",
    decisionPattern = "",
    learning = "",
    replayReference = null
  } = {}) {
    this.keyPositionId = requireText(keyPositionId, "keyPositionId");

    if (!Number.isInteger(moveNumber) || moveNumber < 1) {
      throw new ReflectionError(
        REFLECTION_ERROR_CODES.INVALID_KEY_POSITION,
        "moveNumberは1以上の整数で入力してください。",
        { moveNumber }
      );
    }

    this.moveNumber = moveNumber;
    this.moveText = String(moveText ?? "").trim();
    this.title = requireText(title, "title");
    this.boardState = String(boardState ?? "").trim();
    this.fact = requireText(fact, "fact");
    this.interpretation = requireText(interpretation, "interpretation");
    this.hypothesis = requireText(hypothesis, "hypothesis");
    this.myThought = String(myThought ?? "").trim();
    this.opponentIntent = String(opponentIntent ?? "").trim();
    this.emotion = String(emotion ?? "").trim();
    this.decisionImpact = String(decisionImpact ?? "").trim();
    this.decisionPattern = String(decisionPattern ?? "").trim();
    this.learning = String(learning ?? "").trim();
    this.replayReference = KeyPositionReplayReference.fromSnapshot(replayReference);

    if (this.replayReference && this.replayReference.moveNumber !== this.moveNumber) {
      throw new ReflectionError(
        REFLECTION_ERROR_CODES.INVALID_KEY_POSITION,
        "KeyPositionの手数とReplay Snapshotの手数が一致しません。",
        {
          moveNumber: this.moveNumber,
          replayMoveNumber: this.replayReference.moveNumber
        }
      );
    }
    Object.freeze(this);
  }

  toSnapshot() {
    return Object.freeze({
      keyPositionId: this.keyPositionId,
      moveNumber: this.moveNumber,
      moveText: this.moveText,
      title: this.title,
      boardState: this.boardState,
      fact: this.fact,
      interpretation: this.interpretation,
      hypothesis: this.hypothesis,
      myThought: this.myThought,
      opponentIntent: this.opponentIntent,
      emotion: this.emotion,
      decisionImpact: this.decisionImpact,
      decisionPattern: this.decisionPattern,
      learning: this.learning,
      replayReference: this.replayReference?.toSnapshot() ?? null
    });
  }
}
