import { GameReview } from "./GameReview.js";

function text(value) {
  return String(value ?? "").trim();
}

function isBlankKeyPosition(item = {}) {
  return [
    item.moveNumber,
    item.moveText,
    item.title,
    item.boardState,
    item.fact,
    item.interpretation,
    item.hypothesis,
    item.myThought,
    item.opponentIntent,
    item.emotion,
    item.decisionImpact,
    item.decisionPattern,
    item.learning,
    item.replayReference
  ].every((value) => value !== null && typeof value === "object" ? false : text(value) === "");
}

function mapKeyPosition(item, index) {
  return {
    keyPositionId: text(item.keyPositionId) || `KP-${index + 1}`,
    moveNumber: Number(item.moveNumber),
    moveText: text(item.moveText),
    title: text(item.title),
    boardState: text(item.boardState),
    fact: text(item.fact),
    interpretation: text(item.interpretation),
    hypothesis: text(item.hypothesis),
    myThought: text(item.myThought),
    opponentIntent: text(item.opponentIntent),
    emotion: text(item.emotion),
    decisionImpact: text(item.decisionImpact),
    decisionPattern: text(item.decisionPattern),
    learning: text(item.learning),
    replayReference: item.replayReference ?? null
  };
}

export class GameReviewFormMapper {
  toEntity(input = {}) {
    const keyPositions = Array.isArray(input.keyPositions)
      ? input.keyPositions
        .filter((item) => !isBlankKeyPosition(item))
        .map(mapKeyPosition)
      : input.keyPositions;

    const actionRules = Array.isArray(input.actionRules)
      ? input.actionRules.map(text).filter(Boolean)
      : input.actionRules;

    return new GameReview({
      reviewId: text(input.reviewId),
      gameDate: input.gameDate,
      side: input.side,
      result: input.result,
      opponentName: text(input.opponentName),
      timeControl: text(input.timeControl),
      kifuText: text(input.kifuText),
      gameStory: text(input.gameStory),
      keyPositions,
      decisionPattern: text(input.decisionPattern),
      observationTheme: text(input.observationTheme),
      actionRules,
      note: text(input.note)
    });
  }
}
