import {
  SHOGI_REPLAY_ERROR_CODES,
  ShogiReplayError
} from "./ShogiReplayErrors.js";

export const POSITION_HISTORY_STATUS = Object.freeze({
  FULL: "FULL",
  PARTIAL: "PARTIAL",
  REJECTED: "REJECTED"
});

export class PositionHistory {
  constructor({
    positions = [],
    moves = [],
    warnings = [],
    failure = null,
    status = POSITION_HISTORY_STATUS.FULL,
    termination = null,
    source = null
  } = {}) {
    this.positions = Object.freeze([...positions]);
    this.moves = Object.freeze([...moves]);
    this.warnings = Object.freeze([...warnings]);
    this.failure = failure;
    this.status = status;
    this.termination = termination ? Object.freeze({ ...termination }) : null;
    this.source = source;
    Object.freeze(this);
  }

  get maxMoveNumber() {
    return Math.max(0, this.positions.length - 1);
  }

  at(moveNumber) {
    if (
      !Number.isInteger(moveNumber) ||
      moveNumber < 0 ||
      moveNumber > this.maxMoveNumber ||
      this.positions.length === 0
    ) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_REPLAY_JUMP_OUT_OF_RANGE,
        "指定手数はPosition Historyの範囲外です。",
        { moveNumber, replayableUntil: this.maxMoveNumber }
      );
    }
    return this.positions[moveNumber];
  }
}
