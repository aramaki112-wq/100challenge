import { ReplayPositionSnapshot } from "./ReplayPositionSnapshot.js";
import { ReplayWarningReference } from "./ReplayWarningReference.js";
import { ShogiPositionSnapshot } from "./ShogiPositionSnapshot.js";
import { KEY_POSITION_REPLAY_ERROR_CODES, KeyPositionReplayError } from "./KeyPositionReplayErrors.js";

export class ReplayPositionSnapshotFactory {
  create({ replayState } = {}) {
    if (!replayState?.history || !replayState.position) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_NOT_AVAILABLE,
        "Replay Stateが読み込まれていません。"
      );
    }
    if (!Number.isInteger(replayState.currentMoveNumber) || replayState.currentMoveNumber < 1) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_MOVE_REQUIRED,
        "0手目は重要局面Snapshotの対象外です。",
        { moveNumber: replayState.currentMoveNumber }
      );
    }
    if (!replayState.currentMove || !replayState.previousPosition) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_SNAPSHOT_INVALID,
        "現在指し手または直前局面を取得できません。",
        { moveNumber: replayState.currentMoveNumber }
      );
    }
    const warning = replayState.history.failure ?? replayState.history.warnings[0] ?? null;
    return new ReplayPositionSnapshot({
      moveNumber: replayState.currentMoveNumber,
      currentMove: replayState.currentMove.notation,
      previousMove: replayState.previousMove?.notation ?? "",
      sourceKifMove: replayState.currentMove.sourceKifMove ?? replayState.currentMove.notation,
      currentPosition: ShogiPositionSnapshot.fromPosition(replayState.position),
      previousPosition: ShogiPositionSnapshot.fromPosition(replayState.previousPosition),
      replayWarning: ReplayWarningReference.fromReplayWarning(warning),
      termination: replayState.history.termination
    });
  }
}
