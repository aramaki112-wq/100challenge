import { PIECE_TYPE } from "./ShogiPiece.js";

export const HAND_PIECE_ORDER = Object.freeze([
  PIECE_TYPE.ROOK,
  PIECE_TYPE.BISHOP,
  PIECE_TYPE.GOLD,
  PIECE_TYPE.SILVER,
  PIECE_TYPE.KNIGHT,
  PIECE_TYPE.LANCE,
  PIECE_TYPE.PAWN
]);

export class ShogiHand {
  constructor(counts = {}) {
    const normalized = {};
    for (const type of HAND_PIECE_ORDER) {
      const count = Number(counts[type] ?? 0);
      if (!Number.isInteger(count) || count < 0) {
        throw new TypeError("持ち駒枚数は0以上の整数で指定してください。");
      }
      normalized[type] = count;
    }
    this.counts = Object.freeze(normalized);
    Object.freeze(this);
  }

  count(type) {
    return this.counts[type] ?? 0;
  }

  add(type, amount = 1) {
    if (!HAND_PIECE_ORDER.includes(type)) {
      throw new TypeError("持ち駒にできない駒種です。");
    }
    return new ShogiHand({
      ...this.counts,
      [type]: this.count(type) + amount
    });
  }

  remove(type, amount = 1) {
    if (this.count(type) < amount) {
      throw new RangeError("持ち駒が不足しています。");
    }
    return new ShogiHand({
      ...this.counts,
      [type]: this.count(type) - amount
    });
  }

  entries() {
    return Object.freeze(
      HAND_PIECE_ORDER
        .map((type) => Object.freeze({ type, count: this.count(type) }))
        .filter((item) => item.count > 0)
    );
  }
}
