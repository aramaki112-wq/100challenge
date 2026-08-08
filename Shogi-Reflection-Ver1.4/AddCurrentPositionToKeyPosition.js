import { deepFreeze } from "./Immutable.js";
import { KeyPositionReplayReference } from "./KeyPositionReplayReference.js";
import { ReplayPositionSnapshotFactory } from "./ReplayPositionSnapshotFactory.js";
import { createKifFingerprint } from "./ReplaySnapshotFingerprint.js";
import {
  KEY_POSITION_REPLAY_ERROR_CODES,
  KeyPositionReplayError
} from "./KeyPositionReplayErrors.js";

const MAX_KEY_POSITIONS = 5;

function text(value) {
  return String(value ?? "").trim();
}

export function isMeaningfulKeyPositionInput(item = {}) {
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
  ].some((value) => value !== null && typeof value === "object" ? true : text(value) !== "");
}

function nextKeyPositionId(items) {
  const used = new Set(items.map((item) => text(item.keyPositionId)).filter(Boolean));
  for (let index = 1; index <= MAX_KEY_POSITIONS; index += 1) {
    const candidate = `KP-${index}`;
    if (!used.has(candidate)) return candidate;
  }
  return `KP-${Date.now()}`;
}

export class AddCurrentPositionToKeyPosition {
  constructor({ snapshotFactory = new ReplayPositionSnapshotFactory() } = {}) {
    this.snapshotFactory = snapshotFactory;
  }

  execute({
    replayState,
    existingKeyPositions = [],
    sourceGameId,
    sourceKifText
  } = {}) {
    if (!Array.isArray(existingKeyPositions)) {
      throw new TypeError("existingKeyPositionsは配列で指定してください。");
    }
    const meaningful = existingKeyPositions.filter(isMeaningfulKeyPositionInput);
    if (meaningful.length >= MAX_KEY_POSITIONS) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_LIMIT_REACHED,
        "重要局面が5件登録済みです。",
        { count: meaningful.length }
      );
    }
    if (!replayState?.history) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_NOT_AVAILABLE,
        "Replay Stateがありません。"
      );
    }
    if (!Number.isInteger(replayState.currentMoveNumber) || replayState.currentMoveNumber < 1) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_MOVE_REQUIRED,
        "0手目は重要局面へ追加しません。",
        { moveNumber: replayState?.currentMoveNumber ?? null }
      );
    }
    const duplicateIndex = existingKeyPositions.findIndex((item) =>
      isMeaningfulKeyPositionInput(item) && Number(item.moveNumber) === replayState.currentMoveNumber
    );
    if (duplicateIndex >= 0) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_DUPLICATE,
        "同じ手数の重要局面がすでに入力されています。",
        { moveNumber: replayState.currentMoveNumber, duplicateIndex }
      );
    }
    const normalizedSourceGameId = text(sourceGameId);
    const normalizedKifText = text(sourceKifText);
    if (!normalizedSourceGameId || !normalizedKifText) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_SOURCE_MISMATCH,
        "Source Gameまたは棋譜Textを識別できません。",
        { sourceGameId: normalizedSourceGameId }
      );
    }
    const historyText = text(replayState.history.source?.rawKifText ?? replayState.history.source?.rawText ?? replayState.history.source?.kifuText ?? "");
    if (historyText && createKifFingerprint(historyText) !== createKifFingerprint(normalizedKifText)) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_SOURCE_MISMATCH,
        "再現元とFormの棋譜Fingerprintが一致しません。",
        { sourceGameId: normalizedSourceGameId }
      );
    }

    const snapshot = this.snapshotFactory.create({ replayState });
    const replayReference = KeyPositionReplayReference.create({
      sourceGameId: normalizedSourceGameId,
      sourceKifText: normalizedKifText,
      snapshot
    });
    const candidate = deepFreeze({
      keyPositionId: nextKeyPositionId(meaningful),
      moveNumber: snapshot.moveNumber,
      moveText: snapshot.currentMove,
      title: "",
      boardState: "",
      fact: "",
      interpretation: "",
      hypothesis: "",
      myThought: "",
      opponentIntent: "",
      emotion: "",
      decisionImpact: "",
      decisionPattern: "",
      learning: "",
      replayReference: replayReference.toSnapshot(),
      replayAdded: true
    });

    return deepFreeze({
      status: "CANDIDATE_ADDED",
      candidate,
      moveNumber: snapshot.moveNumber,
      currentMove: snapshot.currentMove,
      hasWarning: Boolean(snapshot.replayWarning),
      saved: false
    });
  }
}
