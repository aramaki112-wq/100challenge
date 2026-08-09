import { ShogiPiece } from "./ShogiPiece.js";
import { ShogiSquare } from "./ShogiSquare.js";

export class ShogiBoard {
  #pieces;

  constructor(entries = []) {
    const map = new Map();
    for (const [squareValue, piece] of entries) {
      const square = ShogiSquare.from(squareValue);
      if (!(piece instanceof ShogiPiece)) {
        throw new TypeError("Boardへ配置できるのはShogiPieceだけです。");
      }
      if (map.has(square.key)) {
        throw new TypeError(`同じSquareへ複数の駒を配置できません: ${square.key}`);
      }
      map.set(square.key, piece);
    }
    this.#pieces = map;
    Object.freeze(this);
  }

  get squareCount() {
    return 81;
  }

  get pieceCount() {
    return this.#pieces.size;
  }

  pieceAt(squareValue) {
    const square = ShogiSquare.from(squareValue);
    return this.#pieces.get(square.key) ?? null;
  }

  entries() {
    return Object.freeze(
      [...this.#pieces.entries()].map(([key, piece]) =>
        Object.freeze([ShogiSquare.from(key), piece])
      )
    );
  }

  withChanges({ remove = [], set = [] } = {}) {
    const next = new Map(this.#pieces);
    for (const squareValue of remove) {
      next.delete(ShogiSquare.from(squareValue).key);
    }
    for (const [squareValue, piece] of set) {
      if (!(piece instanceof ShogiPiece)) {
        throw new TypeError("Boardへ配置できるのはShogiPieceだけです。");
      }
      next.set(ShogiSquare.from(squareValue).key, piece);
    }
    return new ShogiBoard(
      [...next.entries()].map(([key, piece]) => [ShogiSquare.from(key), piece])
    );
  }

  toSquares() {
    const squares = [];
    for (let rank = 1; rank <= 9; rank += 1) {
      for (let file = 1; file <= 9; file += 1) {
        const square = new ShogiSquare(file, rank);
        squares.push(Object.freeze({
          square,
          piece: this.pieceAt(square)
        }));
      }
    }
    return Object.freeze(squares);
  }
}
