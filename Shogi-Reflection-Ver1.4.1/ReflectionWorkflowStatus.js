import { deepFreeze } from "./Immutable.js";

export const GAME_REVIEW_WORKFLOW_STATUS = Object.freeze({
  GAME_ONLY: "GAME_ONLY",
  REFLECTION_IN_PROGRESS: "REFLECTION_IN_PROGRESS",
  REFLECTION_COMPLETE: "REFLECTION_COMPLETE"
});

export const GAME_REVIEW_WORKFLOW_STATUS_LABEL = Object.freeze({
  [GAME_REVIEW_WORKFLOW_STATUS.GAME_ONLY]: "棋譜のみ",
  [GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_IN_PROGRESS]: "振り返り中",
  [GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_COMPLETE]: "振り返り完了"
});

function text(value) {
  return String(value ?? "").trim();
}

function hasMeaningfulKeyPosition(item = {}) {
  if (item === null || typeof item !== "object") return false;
  const textFields = [
    "moveNumber", "moveText", "title", "boardState", "fact", "interpretation",
    "hypothesis", "myThought", "opponentIntent", "emotion", "decisionImpact",
    "decisionPattern", "learning"
  ];
  return textFields.some((field) => text(item[field])) || Boolean(item.replayReference);
}

export function hasReflectionContent(snapshot = {}) {
  const keyPositions = Array.isArray(snapshot.keyPositions) ? snapshot.keyPositions : [];
  const actionRules = Array.isArray(snapshot.actionRules) ? snapshot.actionRules : [];
  return Boolean(
    text(snapshot.gameStory) ||
    keyPositions.some(hasMeaningfulKeyPosition) ||
    text(snapshot.decisionPattern) ||
    text(snapshot.observationTheme) ||
    actionRules.some((item) => text(item))
  );
}

export function isReflectionReady(snapshot = {}) {
  const keyPositions = Array.isArray(snapshot.keyPositions) ? snapshot.keyPositions : [];
  const actionRules = Array.isArray(snapshot.actionRules) ? snapshot.actionRules : [];
  return (
    keyPositions.length >= 3 &&
    keyPositions.length <= 5 &&
    text(snapshot.observationTheme) !== "" &&
    actionRules.length >= 1 &&
    actionRules.length <= 3
  );
}

export function inferWorkflowStatus(snapshot = {}) {
  if (isReflectionReady(snapshot)) return GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_COMPLETE;
  if (hasReflectionContent(snapshot)) return GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_IN_PROGRESS;
  return GAME_REVIEW_WORKFLOW_STATUS.GAME_ONLY;
}

export function workflowStatusView(status) {
  const normalized = Object.values(GAME_REVIEW_WORKFLOW_STATUS).includes(status)
    ? status
    : GAME_REVIEW_WORKFLOW_STATUS.GAME_ONLY;
  return deepFreeze({
    value: normalized,
    label: GAME_REVIEW_WORKFLOW_STATUS_LABEL[normalized]
  });
}
