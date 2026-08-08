import {
  SHOGI_REPLAY_ERROR_CODES,
  ShogiReplayError
} from "./ShogiReplayErrors.js";

export class ShogiReplayApplicationService {
  constructor() {
    this.history = null;
    this.currentMoveNumber = 0;
    this.flipped = false;
  }

  load(history) {
    if (!history || history.positions.length === 0) {
      throw history?.failure ?? new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_REPLAY_NOT_AVAILABLE,
        "再現可能な局面がありません。"
      );
    }
    this.history = history;
    this.currentMoveNumber = 0;
    this.flipped = false;
    return this.getState();
  }

  ensureLoaded() {
    if (!this.history) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_REPLAY_NOT_AVAILABLE,
        "棋譜再現を開始してください。"
      );
    }
  }

  first() {
    this.ensureLoaded();
    this.currentMoveNumber = 0;
    return this.getState();
  }

  last() {
    this.ensureLoaded();
    this.currentMoveNumber = this.history.maxMoveNumber;
    return this.getState();
  }

  previous() {
    this.ensureLoaded();
    if (this.currentMoveNumber > 0) this.currentMoveNumber -= 1;
    return this.getState();
  }

  next() {
    this.ensureLoaded();
    if (this.currentMoveNumber < this.history.maxMoveNumber) {
      this.currentMoveNumber += 1;
    }
    return this.getState();
  }

  jump(moveNumber) {
    this.ensureLoaded();
    if (
      !Number.isInteger(moveNumber) ||
      moveNumber < 0 ||
      moveNumber > this.history.maxMoveNumber
    ) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_REPLAY_JUMP_OUT_OF_RANGE,
        "指定手数は再現可能範囲外です。",
        {
          moveNumber,
          replayableUntil: this.history.maxMoveNumber
        }
      );
    }
    this.currentMoveNumber = moveNumber;
    return this.getState();
  }

  toggleFlip() {
    this.ensureLoaded();
    this.flipped = !this.flipped;
    return this.getState();
  }

  getState() {
    this.ensureLoaded();
    const position = this.history.at(this.currentMoveNumber);
    const previousPosition = this.currentMoveNumber > 0
      ? this.history.at(this.currentMoveNumber - 1)
      : null;
    return Object.freeze({
      history: this.history,
      currentMoveNumber: this.currentMoveNumber,
      position,
      previousPosition,
      currentMove: this.currentMoveNumber > 0
        ? this.history.moves[this.currentMoveNumber - 1]
        : null,
      previousMove: this.currentMoveNumber > 1
        ? this.history.moves[this.currentMoveNumber - 2]
        : null,
      canPrevious: this.currentMoveNumber > 0,
      canNext: this.currentMoveNumber < this.history.maxMoveNumber,
      flipped: this.flipped
    });
  }
}
