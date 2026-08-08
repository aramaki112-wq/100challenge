import { deepFreeze } from "./Immutable.js";
import { KEY_POSITION_REPLAY_ERROR_CODES, KeyPositionReplayError } from "./KeyPositionReplayErrors.js";
import { ReplayWarningReference } from "./ReplayWarningReference.js";
import { ShogiPositionSnapshot } from "./ShogiPositionSnapshot.js";

export const REPLAY_POSITION_SNAPSHOT_VERSION = 1;

function requiredText(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new KeyPositionReplayError(
      KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_SNAPSHOT_INVALID,
      `${fieldName}は必須です。`,
      { fieldName }
    );
  }
  return value.trim();
}

function sourceMoveSnapshot(value) {
  if (typeof value === "string" && value.trim()) {
    return deepFreeze({ notation: value.trim(), rawLine: value.trim() });
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new KeyPositionReplayError(
      KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_SNAPSHOT_INVALID,
      "sourceKifMoveはObjectまたは文字列で指定してください。",
      { fieldName: "sourceKifMove" }
    );
  }
  const notation = requiredText(value.notation ?? value.rawLine, "sourceKifMove.notation");
  return deepFreeze({
    moveNumber: Number.isInteger(value.moveNumber) ? value.moveNumber : null,
    notation,
    elapsed: value.elapsed == null ? null : String(value.elapsed),
    totalElapsed: value.totalElapsed == null ? null : String(value.totalElapsed),
    lineNumber: Number.isInteger(value.lineNumber) ? value.lineNumber : null,
    rawLine: String(value.rawLine ?? notation)
  });
}

export class ReplayPositionSnapshot {
  constructor({
    snapshotVersion = REPLAY_POSITION_SNAPSHOT_VERSION,
    moveNumber,
    currentMove,
    previousMove = "",
    sourceKifMove,
    currentPosition,
    previousPosition,
    replayWarning = null,
    termination = null
  } = {}) {
    if (snapshotVersion !== REPLAY_POSITION_SNAPSHOT_VERSION) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_SNAPSHOT_VERSION_UNSUPPORTED,
        "対応していないReplay Position Snapshot Versionです。",
        { supported: REPLAY_POSITION_SNAPSHOT_VERSION, actual: snapshotVersion }
      );
    }
    if (!Number.isInteger(moveNumber) || moveNumber < 1) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_MOVE_REQUIRED,
        "Replay Position Snapshotは1手目以降で作成してください。",
        { moveNumber }
      );
    }
    this.snapshotVersion = snapshotVersion;
    this.moveNumber = moveNumber;
    this.currentMove = requiredText(currentMove, "currentMove");
    this.previousMove = String(previousMove ?? "").trim();
    this.sourceKifMove = sourceMoveSnapshot(sourceKifMove);
    this.currentPosition = ShogiPositionSnapshot.fromSnapshot(currentPosition);
    if (!previousPosition) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_SNAPSHOT_INVALID,
        "previousPositionは必須です。",
        { moveNumber }
      );
    }
    this.previousPosition = ShogiPositionSnapshot.fromSnapshot(previousPosition);
    this.replayWarning = ReplayWarningReference.fromSnapshot(replayWarning);
    this.termination = termination ? deepFreeze({
      moveNumber: Number.isInteger(termination.moveNumber) ? termination.moveNumber : null,
      notation: String(termination.notation ?? ""),
      resultText: termination.resultText == null ? null : String(termination.resultText)
    }) : null;
    deepFreeze(this);
  }

  static fromSnapshot(snapshot) {
    if (snapshot instanceof ReplayPositionSnapshot) return snapshot;
    return new ReplayPositionSnapshot(snapshot);
  }

  toSnapshot() {
    return deepFreeze({
      snapshotVersion: this.snapshotVersion,
      moveNumber: this.moveNumber,
      currentMove: this.currentMove,
      previousMove: this.previousMove,
      sourceKifMove: { ...this.sourceKifMove },
      currentPosition: this.currentPosition.toSnapshot(),
      previousPosition: this.previousPosition.toSnapshot(),
      replayWarning: this.replayWarning?.toSnapshot() ?? null,
      termination: this.termination ? { ...this.termination } : null
    });
  }
}
