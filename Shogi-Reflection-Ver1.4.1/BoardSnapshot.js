import { deepFreeze } from "./Immutable.js";
import { PIECE_OWNER, PIECE_TYPE } from "./ShogiPiece.js";
import { ShogiSquare } from "./ShogiSquare.js";
import { KEY_POSITION_REPLAY_ERROR_CODES, KeyPositionReplayError } from "./KeyPositionReplayErrors.js";

function invalid(message, context = {}) {
  throw new KeyPositionReplayError(
    KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_SNAPSHOT_INVALID,
    message,
    context
  );
}

function normalizeEntry(entry, index) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    invalid("Board Snapshotの駒情報はObjectである必要があります。", { index });
  }
  let square;
  try {
    square = ShogiSquare.from(entry.square);
  } catch (error) {
    invalid("Board SnapshotのSquareが不正です。", { index, cause: error.code ?? error.name });
  }
  if (!Object.values(PIECE_TYPE).includes(entry.type)) {
    invalid("Board SnapshotのPiece Typeが不正です。", { index, type: entry.type });
  }
  if (!Object.values(PIECE_OWNER).includes(entry.owner)) {
    invalid("Board SnapshotのPiece Ownerが不正です。", { index, owner: entry.owner });
  }
  return deepFreeze({
    square: deepFreeze({ file: square.file, rank: square.rank }),
    type: entry.type,
    owner: entry.owner,
    promoted: Boolean(entry.promoted)
  });
}

export class BoardSnapshot {
  constructor({ pieces = [] } = {}) {
    if (!Array.isArray(pieces) || pieces.length > 81) {
      invalid("Board Snapshotのpiecesは81件以内の配列である必要があります。", { count: pieces?.length });
    }
    const normalized = pieces.map(normalizeEntry);
    const keys = normalized.map((item) => `${item.square.file}${item.square.rank}`);
    if (new Set(keys).size !== keys.length) {
      invalid("Board Snapshotに同じSquareが重複しています。");
    }
    this.pieces = deepFreeze(normalized.sort((a, b) =>
      a.square.rank - b.square.rank || a.square.file - b.square.file
    ));
    deepFreeze(this);
  }

  static fromBoard(board) {
    if (!board || typeof board.entries !== "function") {
      invalid("ShogiBoardからBoard Snapshotを作成できません。");
    }
    return new BoardSnapshot({
      pieces: board.entries().map(([square, piece]) => ({
        square: { file: square.file, rank: square.rank },
        type: piece.type,
        owner: piece.owner,
        promoted: piece.promoted
      }))
    });
  }

  static fromSnapshot(snapshot) {
    if (snapshot instanceof BoardSnapshot) return snapshot;
    return new BoardSnapshot(snapshot);
  }

  toSnapshot() {
    return deepFreeze({ pieces: this.pieces.map((item) => ({
      square: { ...item.square }, type: item.type, owner: item.owner, promoted: item.promoted
    })) });
  }
}
