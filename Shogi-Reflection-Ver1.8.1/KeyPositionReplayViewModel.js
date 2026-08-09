import { deepFreeze } from "./Immutable.js";
import { PIECE_LABELS, PIECE_OWNER, PROMOTED_PIECE_LABELS } from "./ShogiPiece.js";
import { ReplayPositionSnapshot } from "./ReplayPositionSnapshot.js";

function ownerLabel(owner) {
  return owner === PIECE_OWNER.SENTE ? "先手" : "後手";
}

function pieceLabel(piece) {
  return piece.promoted ? PROMOTED_PIECE_LABELS[piece.type] : PIECE_LABELS[piece.type];
}

function handEntries(hand) {
  return Object.entries(hand.counts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => deepFreeze({ type, label: PIECE_LABELS[type], count }));
}

export class KeyPositionReplayViewModel {
  create(snapshotInput, { flipped = false } = {}) {
    const snapshot = ReplayPositionSnapshot.fromSnapshot(snapshotInput);
    const position = snapshot.currentPosition;
    const bySquare = new Map(position.board.pieces.map((piece) => [
      `${piece.square.file}${piece.square.rank}`,
      piece
    ]));
    const files = flipped ? [1,2,3,4,5,6,7,8,9] : [9,8,7,6,5,4,3,2,1];
    const ranks = flipped ? [9,8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8,9];
    const squares = [];
    for (const rank of ranks) {
      for (const file of files) {
        const piece = bySquare.get(`${file}${rank}`) ?? null;
        squares.push(deepFreeze({
          key: `${file}${rank}`,
          file,
          rank,
          piece: piece ? deepFreeze({
            ...piece,
            label: pieceLabel(piece),
            ownerLabel: ownerLabel(piece.owner),
            rotated: (piece.owner === PIECE_OWNER.GOTE) !== flipped
          }) : null,
          isLastFrom: position.lastMoveFrom?.file === file && position.lastMoveFrom?.rank === rank,
          isLastTo: position.lastMoveTo?.file === file && position.lastMoveTo?.rank === rank,
          ariaLabel: piece
            ? `${file}筋${rank}段 ${ownerLabel(piece.owner)}の${pieceLabel(piece)}`
            : `${file}筋${rank}段 空きマス`
        }));
      }
    }
    return deepFreeze({
      moveNumber: snapshot.moveNumber,
      currentMove: snapshot.currentMove,
      previousMove: snapshot.previousMove || "なし",
      sideToMove: position.sideToMove,
      sideToMoveLabel: `${ownerLabel(position.sideToMove)}番`,
      senteHand: handEntries(position.senteHand),
      goteHand: handEntries(position.goteHand),
      squares,
      flipped,
      warning: snapshot.replayWarning?.toSnapshot() ?? null,
      snapshotVersion: snapshot.snapshotVersion
    });
  }
}
