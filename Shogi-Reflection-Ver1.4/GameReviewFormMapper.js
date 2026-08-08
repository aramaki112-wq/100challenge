import { GameReview } from "./GameReview.js";
import { GAME_REVIEW_WORKFLOW_STATUS, hasReflectionContent } from "./ReflectionWorkflowStatus.js";

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

function normalizedReflection(input = {}) {
  const keyPositions = Array.isArray(input.keyPositions)
    ? input.keyPositions.filter((item) => !isBlankKeyPosition(item)).map(mapKeyPosition)
    : input.keyPositions;
  const actionRules = Array.isArray(input.actionRules)
    ? input.actionRules.map(text).filter(Boolean)
    : input.actionRules;
  return { keyPositions, actionRules };
}

export class GameReviewFormMapper {
  toEntity(input = {}, { workflowStatus } = {}) {
    const { keyPositions, actionRules } = normalizedReflection(input);
    const reflectionProbe = {
      gameStory: text(input.gameStory),
      keyPositions: Array.isArray(keyPositions) ? keyPositions : [],
      decisionPattern: text(input.decisionPattern),
      observationTheme: text(input.observationTheme),
      actionRules: Array.isArray(actionRules) ? actionRules : [],
      note: text(input.note)
    };
    const effectiveStatus = workflowStatus ?? (
      hasReflectionContent(reflectionProbe)
        ? GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_IN_PROGRESS
        : GAME_REVIEW_WORKFLOW_STATUS.GAME_ONLY
    );

    return new GameReview({
      reviewId: text(input.reviewId),
      gameDate: input.gameDate,
      side: input.side,
      result: input.result,
      opponentName: text(input.opponentName),
      senteName: text(input.senteName),
      goteName: text(input.goteName),
      timeControl: text(input.timeControl),
      kifuText: text(input.kifuText),
      gameStory: reflectionProbe.gameStory,
      keyPositions,
      decisionPattern: reflectionProbe.decisionPattern,
      observationTheme: reflectionProbe.observationTheme,
      actionRules,
      note: reflectionProbe.note,
      workflowStatus: effectiveStatus,
      createdAt: input.createdAt ?? null,
      updatedAt: input.updatedAt ?? null
    });
  }
}
