import { deepFreeze } from "./Immutable.js";
import { PIECE_OWNER } from "./ShogiPiece.js";
import { BoardSnapshot } from "./BoardSnapshot.js";
import { HandSnapshot } from "./HandSnapshot.js";
import { ShogiSquare } from "./ShogiSquare.js";
import { KEY_POSITION_REPLAY_ERROR_CODES, KeyPositionReplayError } from "./KeyPositionReplayErrors.js";

function squareSnapshot(value, fieldName) {
  if (value === null || value === undefined) return null;
  try {
    const square = ShogiSquare.from(value);
    return deepFreeze({ file: square.file, rank: square.rank });
  } catch (error) {
    throw new KeyPositionReplayError(
      KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_SNAPSHOT_INVALID,
      `${fieldName}が不正です。`,
      { fieldName, cause: error.code ?? error.name }
    );
  }
}

export class ShogiPositionSnapshot {
  constructor({ board, senteHand, goteHand, sideToMove, lastMoveFrom = null, lastMoveTo = null } = {}) {
    if (!Object.values(PIECE_OWNER).includes(sideToMove)) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_SNAPSHOT_INVALID,
        "Position SnapshotのsideToMoveが不正です。",
        { sideToMove }
      );
    }
    this.board = BoardSnapshot.fromSnapshot(board);
    this.senteHand = HandSnapshot.fromSnapshot(senteHand);
    this.goteHand = HandSnapshot.fromSnapshot(goteHand);
    this.sideToMove = sideToMove;
    this.lastMoveFrom = squareSnapshot(lastMoveFrom, "lastMoveFrom");
    this.lastMoveTo = squareSnapshot(lastMoveTo, "lastMoveTo");
    deepFreeze(this);
  }

  static fromPosition(position) {
    if (!position?.board || !position?.hands) {
      throw new KeyPositionReplayError(
        KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_SNAPSHOT_INVALID,
        "ShogiPositionからSnapshotを作成できません。"
      );
    }
    return new ShogiPositionSnapshot({
      board: BoardSnapshot.fromBoard(position.board),
      senteHand: HandSnapshot.fromHand(position.hands.SENTE),
      goteHand: HandSnapshot.fromHand(position.hands.GOTE),
      sideToMove: position.sideToMove,
      lastMoveFrom: position.lastMove?.from ?? null,
      lastMoveTo: position.lastMove?.to ?? null
    });
  }

  static fromSnapshot(snapshot) {
    if (snapshot instanceof ShogiPositionSnapshot) return snapshot;
    return new ShogiPositionSnapshot(snapshot);
  }

  toSnapshot() {
    return deepFreeze({
      board: this.board.toSnapshot(),
      senteHand: this.senteHand.toSnapshot(),
      goteHand: this.goteHand.toSnapshot(),
      sideToMove: this.sideToMove,
      lastMoveFrom: this.lastMoveFrom ? { ...this.lastMoveFrom } : null,
      lastMoveTo: this.lastMoveTo ? { ...this.lastMoveTo } : null
    });
  }
}
