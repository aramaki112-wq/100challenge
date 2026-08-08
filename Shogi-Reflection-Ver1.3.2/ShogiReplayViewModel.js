import {
  PIECE_LABELS,
  PIECE_OWNER
} from "./ShogiPiece.js";

const FILE_LABELS = "１２３４５６７８９";
const RANK_LABELS = "一二三四五六七八九";

function fileLabel(file) {
  return FILE_LABELS[file - 1];
}

function rankLabel(rank) {
  return RANK_LABELS[rank - 1];
}

function ownerLabel(owner) {
  return owner === PIECE_OWNER.SENTE ? "先手" : "後手";
}

function warningViewModel(warning) {
  return Object.freeze({
    code: String(warning?.code ?? "SHOGI_REPLAY_WARNING"),
    message: String(warning?.message ?? "棋譜にWarningがあります。"),
    context: Object.freeze({ ...(warning?.context ?? {}) })
  });
}

function failureViewModel(failure) {
  if (!failure) return null;
  return Object.freeze({
    code: failure.code,
    message: failure.userMessage ?? failure.message,
    detail: failure.message,
    moveNumber: failure.moveNumber,
    moveText: failure.moveText,
    replayableUntil: failure.replayableUntil
  });
}

function handViewModel(hand) {
  return Object.freeze(
    hand.entries().map((item) => Object.freeze({
      type: item.type,
      label: PIECE_LABELS[item.type],
      count: item.count
    }))
  );
}

export class ShogiReplayViewModel {
  create(state) {
    const {
      position,
      history,
      currentMoveNumber,
      flipped
    } = state;

    const files = flipped
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
      : [9, 8, 7, 6, 5, 4, 3, 2, 1];
    const ranks = flipped
      ? [9, 8, 7, 6, 5, 4, 3, 2, 1]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const squares = [];
    for (const rank of ranks) {
      for (const file of files) {
        const square = { file, rank, key: `${file}${rank}` };
        const piece = position.board.pieceAt(square);
        const isLastFrom = Boolean(
          position.lastMove?.from &&
          position.lastMove.from.file === file &&
          position.lastMove.from.rank === rank
        );
        const isLastTo = Boolean(
          position.lastMove?.to &&
          position.lastMove.to.file === file &&
          position.lastMove.to.rank === rank
        );
        const pieceView = piece ? Object.freeze({
          label: piece.label,
          type: piece.type,
          owner: piece.owner,
          ownerLabel: ownerLabel(piece.owner),
          promoted: piece.promoted,
          rotated: (piece.owner === PIECE_OWNER.GOTE) !== flipped
        }) : null;

        squares.push(Object.freeze({
          ...square,
          piece: pieceView,
          isLastFrom,
          isLastTo,
          ariaLabel: piece
            ? `${file}筋${rankLabel(rank)} ${ownerLabel(piece.owner)}の${piece.label}`
            : `${file}筋${rankLabel(rank)} 空きSquare`
        }));
      }
    }

    return Object.freeze({
      squares: Object.freeze(squares),
      fileLabels: Object.freeze(files.map(fileLabel)),
      rankLabels: Object.freeze(ranks.map(rankLabel)),
      senteHand: handViewModel(position.hands.SENTE),
      goteHand: handViewModel(position.hands.GOTE),
      currentMoveNumber,
      currentMoveId: `replay-move-${currentMoveNumber}`,
      moveListScrollTarget: Object.freeze({
        currentMoveId: `replay-move-${currentMoveNumber}`,
        scope: "MOVE_LIST_CONTAINER",
        pageScroll: "NONE"
      }),
      maxMoveNumber: history.maxMoveNumber,
      currentMoveText: state.currentMove?.notation ?? "初期局面",
      previousMoveText: state.previousMove?.notation ?? "なし",
      sideToMove: position.sideToMove,
      sideToMoveLabel: `${ownerLabel(position.sideToMove)}番`,
      canPrevious: state.canPrevious,
      canNext: state.canNext,
      flipped,
      warnings: Object.freeze(history.warnings.map(warningViewModel)),
      failure: failureViewModel(history.failure),
      status: history.status,
      moves: Object.freeze(history.moves.map((move) => Object.freeze({
        id: `replay-move-${move.moveNumber}`,
        moveNumber: move.moveNumber,
        notation: move.notation,
        current: move.moveNumber === currentMoveNumber,
        sourceKifMove: move.sourceKifMove
      }))),
      termination: history.termination,
      currentPosition: position,
      previousPosition: state.previousPosition,
      boardState: position.board,
      handState: position.hands,
      sourceKifMove: state.currentMove?.sourceKifMove ?? null,
      replayWarning: history.failure ?? history.warnings[0] ?? null
    });
  }
}
