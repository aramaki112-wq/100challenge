import { ShogiBoard } from "./ShogiBoard.js";
import { ShogiHand } from "./ShogiHand.js";
import { PIECE_OWNER } from "./ShogiPiece.js";

export function oppositeSide(side) {
  return side === PIECE_OWNER.SENTE ? PIECE_OWNER.GOTE : PIECE_OWNER.SENTE;
}

export class ShogiPosition {
  constructor({
    board,
    hands,
    sideToMove = PIECE_OWNER.SENTE,
    moveNumber = 0,
    lastMove = null
  } = {}) {
    if (!(board instanceof ShogiBoard)) {
      throw new TypeError("PositionにはShogiBoardが必要です。");
    }
    if (
      !hands ||
      !(hands.SENTE instanceof ShogiHand) ||
      !(hands.GOTE instanceof ShogiHand)
    ) {
      throw new TypeError("Positionには先手・後手のShogiHandが必要です。");
    }
    if (!Object.values(PIECE_OWNER).includes(sideToMove)) {
      throw new TypeError("sideToMoveが不正です。");
    }
    if (!Number.isInteger(moveNumber) || moveNumber < 0) {
      throw new TypeError("moveNumberは0以上の整数で指定してください。");
    }

    this.board = board;
    this.hands = Object.freeze({
      SENTE: hands.SENTE,
      GOTE: hands.GOTE
    });
    this.sideToMove = sideToMove;
    this.moveNumber = moveNumber;
    this.lastMove = lastMove ? Object.freeze({ ...lastMove }) : null;
    Object.freeze(this);
  }

  handOf(owner) {
    return this.hands[owner];
  }
}
