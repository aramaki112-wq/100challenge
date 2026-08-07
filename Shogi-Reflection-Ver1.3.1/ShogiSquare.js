import {
  SHOGI_REPLAY_ERROR_CODES,
  ShogiReplayError
} from "./ShogiReplayErrors.js";

export const JAPANESE_FILES = Object.freeze({
  "１": 1, "２": 2, "３": 3, "４": 4, "５": 5,
  "６": 6, "７": 7, "８": 8, "９": 9,
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
  "6": 6, "7": 7, "8": 8, "9": 9
});

export const JAPANESE_RANKS = Object.freeze({
  "一": 1, "二": 2, "三": 3, "四": 4, "五": 5,
  "六": 6, "七": 7, "八": 8, "九": 9,
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
  "6": 6, "7": 7, "8": 8, "9": 9
});

export class ShogiSquare {
  constructor(file, rank) {
    if (
      !Number.isInteger(file) || file < 1 || file > 9 ||
      !Number.isInteger(rank) || rank < 1 || rank > 9
    ) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_DESTINATION_INVALID,
        "Squareの筋・段は1〜9で指定してください。",
        { detail: { file, rank } }
      );
    }
    this.file = file;
    this.rank = rank;
    Object.freeze(this);
  }

  get key() {
    return `${this.file}${this.rank}`;
  }

  equals(other) {
    return other instanceof ShogiSquare &&
      this.file === other.file &&
      this.rank === other.rank;
  }

  static from(value) {
    if (value instanceof ShogiSquare) return value;
    if (typeof value === "string" && /^[1-9][1-9]$/.test(value)) {
      return new ShogiSquare(Number(value[0]), Number(value[1]));
    }
    if (value && Number.isInteger(value.file) && Number.isInteger(value.rank)) {
      return new ShogiSquare(value.file, value.rank);
    }
    throw new ShogiReplayError(
      SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_DESTINATION_INVALID,
      "Squareを読み取れません。",
      { detail: { value } }
    );
  }
}
