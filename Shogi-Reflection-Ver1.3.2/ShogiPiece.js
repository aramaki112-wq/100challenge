export const PIECE_OWNER = Object.freeze({
  SENTE: "SENTE",
  GOTE: "GOTE"
});

export const PIECE_TYPE = Object.freeze({
  KING: "KING",
  ROOK: "ROOK",
  BISHOP: "BISHOP",
  GOLD: "GOLD",
  SILVER: "SILVER",
  KNIGHT: "KNIGHT",
  LANCE: "LANCE",
  PAWN: "PAWN"
});

export const PROMOTABLE_PIECE_TYPES = Object.freeze([
  PIECE_TYPE.ROOK,
  PIECE_TYPE.BISHOP,
  PIECE_TYPE.SILVER,
  PIECE_TYPE.KNIGHT,
  PIECE_TYPE.LANCE,
  PIECE_TYPE.PAWN
]);

export const PIECE_LABELS = Object.freeze({
  [PIECE_TYPE.KING]: "玉",
  [PIECE_TYPE.ROOK]: "飛",
  [PIECE_TYPE.BISHOP]: "角",
  [PIECE_TYPE.GOLD]: "金",
  [PIECE_TYPE.SILVER]: "銀",
  [PIECE_TYPE.KNIGHT]: "桂",
  [PIECE_TYPE.LANCE]: "香",
  [PIECE_TYPE.PAWN]: "歩"
});

export const PROMOTED_PIECE_LABELS = Object.freeze({
  [PIECE_TYPE.ROOK]: "龍",
  [PIECE_TYPE.BISHOP]: "馬",
  [PIECE_TYPE.SILVER]: "成銀",
  [PIECE_TYPE.KNIGHT]: "成桂",
  [PIECE_TYPE.LANCE]: "成香",
  [PIECE_TYPE.PAWN]: "と"
});

export class ShogiPiece {
  constructor({ type, owner, promoted = false } = {}) {
    if (!Object.values(PIECE_TYPE).includes(type)) {
      throw new TypeError("不正なPiece Typeです。");
    }
    if (!Object.values(PIECE_OWNER).includes(owner)) {
      throw new TypeError("不正なPiece Ownerです。");
    }
    if (promoted && !PROMOTABLE_PIECE_TYPES.includes(type)) {
      throw new TypeError("この駒は成駒として表現できません。");
    }
    this.type = type;
    this.owner = owner;
    this.promoted = Boolean(promoted);
    Object.freeze(this);
  }

  get label() {
    return this.promoted
      ? PROMOTED_PIECE_LABELS[this.type]
      : PIECE_LABELS[this.type];
  }

  promote() {
    if (!PROMOTABLE_PIECE_TYPES.includes(this.type) || this.promoted) {
      throw new TypeError("この駒はこれ以上成れません。");
    }
    return new ShogiPiece({
      type: this.type,
      owner: this.owner,
      promoted: true
    });
  }

  capturedBy(owner) {
    return new ShogiPiece({ type: this.type, owner, promoted: false });
  }
}
