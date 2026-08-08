import {
  PIECE_OWNER,
  PIECE_TYPE,
  PROMOTABLE_PIECE_TYPES,
  ShogiPiece
} from "./ShogiPiece.js";
import {
  SHOGI_REPLAY_ERROR_CODES,
  ShogiReplayError
} from "./ShogiReplayErrors.js";
import {
  oppositeSide,
  ShogiPosition
} from "./ShogiPosition.js";
import { ShogiSquare } from "./ShogiSquare.js";

function forwardSign(owner) {
  return owner === PIECE_OWNER.SENTE ? -1 : 1;
}

function isPathClear(board, source, destination) {
  const fileStep = Math.sign(destination.file - source.file);
  const rankStep = Math.sign(destination.rank - source.rank);
  let file = source.file + fileStep;
  let rank = source.rank + rankStep;

  while (file !== destination.file || rank !== destination.rank) {
    if (board.pieceAt(new ShogiSquare(file, rank))) return false;
    file += fileStep;
    rank += rankStep;
  }
  return true;
}

function isGoldLikeMove(relativeFile, relativeRank) {
  return [
    [0, 1], [1, 1], [-1, 1],
    [1, 0], [-1, 0], [0, -1]
  ].some(([file, rank]) => file === relativeFile && rank === relativeRank);
}

export function canPieceMove(piece, source, destination, board) {
  const fileDelta = destination.file - source.file;
  const rankDelta = destination.rank - source.rank;
  const absoluteFile = Math.abs(fileDelta);
  const absoluteRank = Math.abs(rankDelta);
  const sign = forwardSign(piece.owner);
  const relativeFile = fileDelta * sign;
  const relativeRank = rankDelta * sign;

  if (absoluteFile === 0 && absoluteRank === 0) return false;

  if (
    piece.promoted &&
    [
      PIECE_TYPE.SILVER,
      PIECE_TYPE.KNIGHT,
      PIECE_TYPE.LANCE,
      PIECE_TYPE.PAWN
    ].includes(piece.type)
  ) {
    return isGoldLikeMove(relativeFile, relativeRank);
  }

  switch (piece.type) {
    case PIECE_TYPE.KING:
      return absoluteFile <= 1 && absoluteRank <= 1;
    case PIECE_TYPE.GOLD:
      return isGoldLikeMove(relativeFile, relativeRank);
    case PIECE_TYPE.SILVER:
      return [
        [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]
      ].some(([file, rank]) => file === relativeFile && rank === relativeRank);
    case PIECE_TYPE.KNIGHT:
      return relativeRank === 2 && Math.abs(relativeFile) === 1;
    case PIECE_TYPE.LANCE:
      return relativeFile === 0 &&
        relativeRank > 0 &&
        isPathClear(board, source, destination);
    case PIECE_TYPE.PAWN:
      return relativeFile === 0 && relativeRank === 1;
    case PIECE_TYPE.ROOK:
      return (
        ((absoluteFile === 0) !== (absoluteRank === 0)) &&
        isPathClear(board, source, destination)
      ) || (
        piece.promoted && absoluteFile === 1 && absoluteRank === 1
      );
    case PIECE_TYPE.BISHOP:
      return (
        absoluteFile === absoluteRank &&
        isPathClear(board, source, destination)
      ) || (
        piece.promoted && absoluteFile + absoluteRank === 1
      );
    default:
      return false;
  }
}

function isPromotionZone(owner, rank) {
  return owner === PIECE_OWNER.SENTE ? rank <= 3 : rank >= 7;
}

function filterByQualifiers(candidates, move) {
  let current = [...candidates];
  const owner = move.owner;

  if (move.qualifiers.includes("右")) {
    const selectedFile = owner === PIECE_OWNER.SENTE
      ? Math.min(...current.map((item) => item.file))
      : Math.max(...current.map((item) => item.file));
    current = current.filter((item) => item.file === selectedFile);
  }
  if (move.qualifiers.includes("左")) {
    const selectedFile = owner === PIECE_OWNER.SENTE
      ? Math.max(...current.map((item) => item.file))
      : Math.min(...current.map((item) => item.file));
    current = current.filter((item) => item.file === selectedFile);
  }
  if (move.qualifiers.includes("直")) {
    current = current.filter((item) => item.file === move.destination.file);
  }
  if (move.qualifiers.includes("寄")) {
    current = current.filter((item) => item.rank === move.destination.rank);
  }
  if (move.qualifiers.includes("引")) {
    current = current.filter((item) =>
      owner === PIECE_OWNER.SENTE
        ? item.rank < move.destination.rank
        : item.rank > move.destination.rank
    );
  }
  if (move.qualifiers.includes("上") || move.qualifiers.includes("行")) {
    current = current.filter((item) =>
      owner === PIECE_OWNER.SENTE
        ? item.rank > move.destination.rank
        : item.rank < move.destination.rank
    );
  }
  return current;
}

function replayError(code, message, position, move, detail = {}) {
  return new ShogiReplayError(code, message, {
    moveNumber: move.moveNumber,
    moveText: move.notation,
    replayableUntil: position.moveNumber,
    detail
  });
}

function resolveSource(position, move) {
  if (move.source) return move.source;

  const candidates = position.board.entries()
    .filter(([square, piece]) =>
      piece.owner === move.owner &&
      piece.type === move.pieceType &&
      piece.promoted === move.pieceWasPromoted &&
      canPieceMove(piece, square, move.destination, position.board)
    )
    .map(([square]) => square);

  const qualified = filterByQualifiers(candidates, move);
  if (qualified.length === 0) {
    throw replayError(
      SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_SOURCE_NOT_FOUND,
      "移動元となる駒を盤面上で特定できません。",
      position,
      move
    );
  }
  if (qualified.length > 1) {
    throw replayError(
      SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_SOURCE_AMBIGUOUS,
      "移動元候補が複数あるため推測で適用できません。",
      position,
      move,
      { candidates: qualified.map((item) => item.key) }
    );
  }
  return qualified[0];
}

function validatePromotion(position, move, piece, source) {
  if (move.promote) {
    if (
      piece.promoted ||
      !PROMOTABLE_PIECE_TYPES.includes(piece.type) ||
      (
        !isPromotionZone(move.owner, source.rank) &&
        !isPromotionZone(move.owner, move.destination.rank)
      )
    ) {
      throw replayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_PROMOTION_INVALID,
        "成りの条件を満たしていません。",
        position,
        move,
        { source: source.key, destination: move.destination.key }
      );
    }
  }

  if (move.nonPromote) {
    if (
      piece.promoted ||
      !PROMOTABLE_PIECE_TYPES.includes(piece.type) ||
      (
        !isPromotionZone(move.owner, source.rank) &&
        !isPromotionZone(move.owner, move.destination.rank)
      )
    ) {
      throw replayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_PROMOTION_INVALID,
        "この局面では不成表記を使用できません。",
        position,
        move,
        { source: source.key, destination: move.destination.key }
      );
    }
  }
}

export function applyShogiMove(position, move) {
  if (!(position instanceof ShogiPosition)) {
    throw new TypeError("applyShogiMoveにはShogiPositionが必要です。");
  }
  if (!move || move.kind !== "MOVE") {
    throw new TypeError("applyShogiMoveには正規化済みMOVEが必要です。");
  }
  if (move.owner !== position.sideToMove) {
    throw replayError(
      SHOGI_REPLAY_ERROR_CODES.SHOGI_TURN_MISMATCH,
      "棋譜の手番とPositionの手番が一致しません。",
      position,
      move
    );
  }

  const target = position.board.pieceAt(move.destination);
  if (target && target.owner === move.owner) {
    throw replayError(
      SHOGI_REPLAY_ERROR_CODES.SHOGI_CAPTURE_INVALID,
      "自分の駒があるSquareへ移動できません。",
      position,
      move,
      { destination: move.destination.key }
    );
  }

  let board = position.board;
  const hands = {
    SENTE: position.hands.SENTE,
    GOTE: position.hands.GOTE
  };
  let source = null;
  let movedPiece = null;

  if (move.drop) {
    if (target) {
      throw replayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_DESTINATION_INVALID,
        "駒打ちは空いているSquareへだけ適用できます。",
        position,
        move,
        { destination: move.destination.key }
      );
    }
    if (hands[move.owner].count(move.pieceType) < 1) {
      throw replayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_DROP_PIECE_NOT_IN_HAND,
        "持ち駒に存在しない駒を打とうとしました。",
        position,
        move,
        { pieceType: move.pieceType }
      );
    }

    movedPiece = new ShogiPiece({
      type: move.pieceType,
      owner: move.owner,
      promoted: false
    });
    hands[move.owner] = hands[move.owner].remove(move.pieceType);
    board = board.withChanges({ set: [[move.destination, movedPiece]] });
  } else {
    source = resolveSource(position, move);
    movedPiece = board.pieceAt(source);
    if (
      !movedPiece ||
      movedPiece.owner !== move.owner ||
      movedPiece.type !== move.pieceType ||
      movedPiece.promoted !== move.pieceWasPromoted
    ) {
      throw replayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_PIECE_NOT_FOUND,
        "元Squareの駒とKIFの駒表記が一致しません。",
        position,
        move,
        { source: source.key }
      );
    }
    if (!canPieceMove(movedPiece, source, move.destination, board)) {
      throw replayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_DESTINATION_INVALID,
        "駒の移動規則または途中の駒配置と一致しません。",
        position,
        move,
        { source: source.key, destination: move.destination.key }
      );
    }

    validatePromotion(position, move, movedPiece, source);
    if (move.promote) movedPiece = movedPiece.promote();

    if (target) {
      hands[move.owner] = hands[move.owner].add(target.type);
    }
    board = board.withChanges({
      remove: [source],
      set: [[move.destination, movedPiece]]
    });
  }

  return new ShogiPosition({
    board,
    hands,
    sideToMove: oppositeSide(position.sideToMove),
    moveNumber: move.moveNumber,
    lastMove: {
      from: source,
      to: move.destination,
      notation: move.notation,
      owner: move.owner,
      pieceType: move.pieceType,
      drop: move.drop,
      promote: move.promote,
      sourceKifMove: move.sourceKifMove
    }
  });
}
