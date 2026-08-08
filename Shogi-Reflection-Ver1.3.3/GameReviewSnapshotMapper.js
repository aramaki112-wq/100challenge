import { GameReview } from "./GameReview.js";
import { deepFreeze } from "./Immutable.js";
import {
  PERSISTENCE_ERROR_CODES,
  PersistenceError
} from "./PersistenceErrors.js";
import { ReflectionError } from "./ReflectionErrors.js";
import { KeyPositionReplayError } from "./KeyPositionReplayErrors.js";

function assertPlainObject(value, fieldName) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new PersistenceError(
      PERSISTENCE_ERROR_CODES.INVALID_SNAPSHOT_DOCUMENT,
      `${fieldName}はObjectである必要があります。`,
      { fieldName }
    );
  }
}

function assertKeyPositionConsistency(reviewSnapshot) {
  if (!Array.isArray(reviewSnapshot.keyPositions)) {
    throw new PersistenceError(
      PERSISTENCE_ERROR_CODES.INVALID_SNAPSHOT_DOCUMENT,
      "keyPositionsは配列である必要があります。",
      { reviewId: reviewSnapshot.reviewId }
    );
  }

  const ids = new Set();
  for (const item of reviewSnapshot.keyPositions) {
    assertPlainObject(item, "keyPosition");
    const id = item.keyPositionId;
    if (typeof id === "string" && ids.has(id)) {
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.DUPLICATE_KEY_POSITION_ID,
        "一局の中でkeyPositionIdが重複しています。",
        { reviewId: reviewSnapshot.reviewId, keyPositionId: id }
      );
    }
    if (typeof id === "string") ids.add(id);
  }
}

function cloneKeyPosition(item) {
  return {
    ...item,
    replayReference: item.replayReference ? structuredClone(item.replayReference) : null
  };
}

export function gameReviewToPersistentSnapshot(gameReview) {
  if (!(gameReview instanceof GameReview)) {
    throw new PersistenceError(
      PERSISTENCE_ERROR_CODES.DOMAIN_RULE_VIOLATION,
      "GameReview Domain EntityだけをSnapshotへ変換できます。"
    );
  }

  const source = gameReview.toSnapshot();
  return deepFreeze({
    reviewId: source.reviewId,
    gameDate: source.gameDate,
    side: source.side,
    result: source.result,
    opponentName: source.opponentName,
    timeControl: source.timeControl,
    kifuText: source.kifuText,
    gameStory: source.gameStory,
    keyPositions: source.keyPositions.map(cloneKeyPosition),
    decisionPattern: source.decisionPattern,
    observationTheme: source.observationTheme,
    actionRules: [...source.actionRules],
    note: source.note
  });
}

export function gameReviewFromPersistentSnapshot(reviewSnapshot) {
  assertPlainObject(reviewSnapshot, "gameReview");
  assertKeyPositionConsistency(reviewSnapshot);

  try {
    return new GameReview({
      reviewId: reviewSnapshot.reviewId,
      gameDate: reviewSnapshot.gameDate,
      side: reviewSnapshot.side,
      result: reviewSnapshot.result,
      opponentName: reviewSnapshot.opponentName,
      timeControl: reviewSnapshot.timeControl,
      kifuText: reviewSnapshot.kifuText,
      gameStory: reviewSnapshot.gameStory,
      keyPositions: reviewSnapshot.keyPositions,
      decisionPattern: reviewSnapshot.decisionPattern,
      observationTheme: reviewSnapshot.observationTheme,
      actionRules: reviewSnapshot.actionRules,
      note: reviewSnapshot.note
    });
  } catch (error) {
    if (error instanceof ReflectionError || error instanceof KeyPositionReplayError || error instanceof TypeError) {
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.DOMAIN_RULE_VIOLATION,
        "GameReviewまたはReplay SnapshotのRuleに違反するDataです。",
        {
          reviewId: reviewSnapshot.reviewId,
          domainErrorCode: error.code ?? error.name
        },
        { cause: error }
      );
    }
    throw error;
  }
}
