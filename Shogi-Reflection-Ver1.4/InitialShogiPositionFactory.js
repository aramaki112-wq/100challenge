import { ShogiBoard } from "./ShogiBoard.js";
import { ShogiHand } from "./ShogiHand.js";
import {
  PIECE_OWNER,
  PIECE_TYPE,
  ShogiPiece
} from "./ShogiPiece.js";
import { ShogiPosition } from "./ShogiPosition.js";
import {
  SHOGI_REPLAY_ERROR_CODES,
  ShogiReplayError
} from "./ShogiReplayErrors.js";
import { ShogiSquare } from "./ShogiSquare.js";

const BACK_RANK = Object.freeze([
  PIECE_TYPE.LANCE,
  PIECE_TYPE.KNIGHT,
  PIECE_TYPE.SILVER,
  PIECE_TYPE.GOLD,
  PIECE_TYPE.KING,
  PIECE_TYPE.GOLD,
  PIECE_TYPE.SILVER,
  PIECE_TYPE.KNIGHT,
  PIECE_TYPE.LANCE
]);

function piece(type, owner) {
  return new ShogiPiece({ type, owner });
}

export class InitialShogiPositionFactory {
  create({ handicap } = {}) {
    if (!handicap) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_INITIAL_POSITION_UNSUPPORTED,
        "手合割Headerがないため初期局面を確定できません。",
        { detail: { handicap: null } }
      );
    }
    if (handicap !== "平手") {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_INITIAL_POSITION_UNSUPPORTED,
        "Ver.1.2は平手の初期局面のみ正式対応です。",
        { detail: { handicap } }
      );
    }

    const entries = [];
    for (let index = 0; index < 9; index += 1) {
      const file = 9 - index;
      entries.push(
        [new ShogiSquare(file, 1), piece(BACK_RANK[index], PIECE_OWNER.GOTE)],
        [new ShogiSquare(file, 3), piece(PIECE_TYPE.PAWN, PIECE_OWNER.GOTE)],
        [new ShogiSquare(file, 7), piece(PIECE_TYPE.PAWN, PIECE_OWNER.SENTE)],
        [new ShogiSquare(file, 9), piece(BACK_RANK[index], PIECE_OWNER.SENTE)]
      );
    }

    entries.push(
      [new ShogiSquare(8, 2), piece(PIECE_TYPE.ROOK, PIECE_OWNER.GOTE)],
      [new ShogiSquare(2, 2), piece(PIECE_TYPE.BISHOP, PIECE_OWNER.GOTE)],
      [new ShogiSquare(2, 8), piece(PIECE_TYPE.ROOK, PIECE_OWNER.SENTE)],
      [new ShogiSquare(8, 8), piece(PIECE_TYPE.BISHOP, PIECE_OWNER.SENTE)]
    );

    return new ShogiPosition({
      board: new ShogiBoard(entries),
      hands: {
        SENTE: new ShogiHand(),
        GOTE: new ShogiHand()
      },
      sideToMove: PIECE_OWNER.SENTE,
      moveNumber: 0,
      lastMove: null
    });
  }
}
