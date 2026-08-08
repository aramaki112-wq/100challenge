import { deepFreeze } from "./Immutable.js";
import { ReplayPositionSnapshot, REPLAY_POSITION_SNAPSHOT_VERSION } from "./ReplayPositionSnapshot.js";
import { createKifFingerprint } from "./ReplaySnapshotFingerprint.js";
import { KEY_POSITION_REPLAY_ERROR_CODES, KeyPositionReplayError } from "./KeyPositionReplayErrors.js";

function requiredText(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new KeyPositionReplayError(
      KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_REFERENCE_INVALID,
      `${fieldName}は必須です。`,
      { fieldName }
    );
  }
  return value.trim();
}

export class KeyPositionReplayReference {
  constructor({ sourceGameId, sourceKifFingerprint, snapshot } = {}) {
    this.sourceGameId = requiredText(sourceGameId, "sourceGameId");
    this.sourceKifFingerprint = requiredText(sourceKifFingerprint, "sourceKifFingerprint");
    this.snapshot = ReplayPositionSnapshot.fromSnapshot(snapshot);
    this.moveNumber = this.snapshot.moveNumber;
    this.sourceKifMove = this.snapshot.sourceKifMove;
    this.snapshotVersion = this.snapshot.snapshotVersion;
    this.replayWarning = this.snapshot.replayWarning;
    deepFreeze(this);
  }

  static create({ sourceGameId, sourceKifText, snapshot } = {}) {
    return new KeyPositionReplayReference({
      sourceGameId,
      sourceKifFingerprint: createKifFingerprint(sourceKifText),
      snapshot
    });
  }

  static fromSnapshot(snapshot) {
    if (!snapshot) return null;
    if (snapshot instanceof KeyPositionReplayReference) return snapshot;
    return new KeyPositionReplayReference(snapshot);
  }

  matchesSource({ sourceGameId, sourceKifText }) {
    return this.sourceGameId === sourceGameId &&
      this.sourceKifFingerprint === createKifFingerprint(sourceKifText);
  }

  toSnapshot() {
    return deepFreeze({
      sourceGameId: this.sourceGameId,
      sourceKifFingerprint: this.sourceKifFingerprint,
      snapshotVersion: REPLAY_POSITION_SNAPSHOT_VERSION,
      moveNumber: this.moveNumber,
      sourceKifMove: { ...this.sourceKifMove },
      replayWarning: this.replayWarning?.toSnapshot() ?? null,
      snapshot: this.snapshot.toSnapshot()
    });
  }
}
