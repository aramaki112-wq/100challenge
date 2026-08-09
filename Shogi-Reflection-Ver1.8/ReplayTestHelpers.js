import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { InitialShogiPositionFactory } from "./InitialShogiPositionFactory.js";
import { KifMoveNormalizer } from "./KifMoveNormalizer.js";
import { ShogiBoard } from "./ShogiBoard.js";
import { ShogiHand } from "./ShogiHand.js";
import {
  PIECE_OWNER,
  ShogiPiece
} from "./ShogiPiece.js";
import { ShogiPosition } from "./ShogiPosition.js";
import { ShogiSquare } from "./ShogiSquare.js";

export function replayFixture(fileName) {
  return readFileSync(
    fileURLToPath(new URL(`./fixtures/${fileName}`, import.meta.url)),
    "utf8"
  );
}

export function initialPosition() {
  return new InitialShogiPositionFactory().create({ handicap: "平手" });
}

export function normalizedMove(moveNumber, notation, previousDestination = null) {
  return new KifMoveNormalizer().normalize(
    { moveNumber, notation },
    { previousDestination }
  );
}

export function customPosition({
  pieces = [],
  senteHand = {},
  goteHand = {},
  sideToMove = PIECE_OWNER.SENTE,
  moveNumber = 0,
  lastMove = null
} = {}) {
  const entries = pieces.map(([
    file,
    rank,
    type,
    owner = PIECE_OWNER.SENTE,
    promoted = false
  ]) => [
    new ShogiSquare(file, rank),
    new ShogiPiece({ type, owner, promoted })
  ]);

  return new ShogiPosition({
    board: new ShogiBoard(entries),
    hands: {
      SENTE: new ShogiHand(senteHand),
      GOTE: new ShogiHand(goteHand)
    },
    sideToMove,
    moveNumber,
    lastMove
  });
}
