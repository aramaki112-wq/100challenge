import {
  PIECE_OWNER,
  PIECE_TYPE
} from "./ShogiPiece.js";
import {
  SHOGI_REPLAY_ERROR_CODES,
  ShogiReplayError
} from "./ShogiReplayErrors.js";
import {
  JAPANESE_FILES,
  JAPANESE_RANKS,
  ShogiSquare
} from "./ShogiSquare.js";

const PIECE_DEFINITIONS = Object.freeze([
  Object.freeze({ text: "成銀", type: PIECE_TYPE.SILVER, promoted: true }),
  Object.freeze({ text: "成桂", type: PIECE_TYPE.KNIGHT, promoted: true }),
  Object.freeze({ text: "成香", type: PIECE_TYPE.LANCE, promoted: true }),
  Object.freeze({ text: "龍", type: PIECE_TYPE.ROOK, promoted: true }),
  Object.freeze({ text: "竜", type: PIECE_TYPE.ROOK, promoted: true }),
  Object.freeze({ text: "馬", type: PIECE_TYPE.BISHOP, promoted: true }),
  Object.freeze({ text: "と", type: PIECE_TYPE.PAWN, promoted: true }),
  Object.freeze({ text: "王", type: PIECE_TYPE.KING, promoted: false }),
  Object.freeze({ text: "玉", type: PIECE_TYPE.KING, promoted: false }),
  Object.freeze({ text: "飛", type: PIECE_TYPE.ROOK, promoted: false }),
  Object.freeze({ text: "角", type: PIECE_TYPE.BISHOP, promoted: false }),
  Object.freeze({ text: "金", type: PIECE_TYPE.GOLD, promoted: false }),
  Object.freeze({ text: "銀", type: PIECE_TYPE.SILVER, promoted: false }),
  Object.freeze({ text: "桂", type: PIECE_TYPE.KNIGHT, promoted: false }),
  Object.freeze({ text: "香", type: PIECE_TYPE.LANCE, promoted: false }),
  Object.freeze({ text: "歩", type: PIECE_TYPE.PAWN, promoted: false })
]);

const TERMINATION_NOTATIONS = new Set([
  "投了",
  "詰み",
  "切れ負け",
  "時間切れ",
  "反則負け",
  "反則勝ち",
  "千日手",
  "持将棋",
  "中断",
  "入玉勝ち",
  "不戦勝",
  "不戦敗"
]);

const SUPPORTED_QUALIFIERS = Object.freeze([
  "右", "左", "直", "寄", "引", "上", "行"
]);

function resolveMoveNumber(sourceMove) {
  const value = sourceMove?.moveNumber ?? sourceMove?.number;
  if (!Number.isInteger(value) || value < 1) {
    throw new ShogiReplayError(
      SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_NUMBER_INVALID,
      "指し手の手数は1以上の整数である必要があります。",
      {
        moveNumber: Number.isInteger(value) ? value : null,
        moveText: sourceMove?.notation ?? "",
        detail: { value }
      }
    );
  }
  return value;
}

function parseDestination(rest, previousDestination, moveNumber, notation) {
  if (rest.startsWith("同")) {
    if (!(previousDestination instanceof ShogiSquare)) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_PARSE_FAILED,
        "「同」の参照先となる直前の移動先がありません。",
        { moveNumber, moveText: notation }
      );
    }
    return {
      destination: previousDestination,
      rest: rest.slice(1),
      sameDestination: true
    };
  }

  const file = JAPANESE_FILES[rest[0]];
  const rank = JAPANESE_RANKS[rest[1]];
  if (!file || !rank) {
    throw new ShogiReplayError(
      SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_PARSE_FAILED,
      "指し手の移動先を読み取れません。",
      { moveNumber, moveText: notation }
    );
  }

  return {
    destination: new ShogiSquare(file, rank),
    rest: rest.slice(2),
    sameDestination: false
  };
}

function parsePiece(rest, moveNumber, notation) {
  const definition = PIECE_DEFINITIONS.find((item) => rest.startsWith(item.text));
  if (!definition) {
    throw new ShogiReplayError(
      SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_PARSE_FAILED,
      "指し手の駒種を読み取れません。",
      { moveNumber, moveText: notation }
    );
  }
  return {
    definition,
    rest: rest.slice(definition.text.length)
  };
}

export class KifMoveNormalizer {
  normalize(sourceMove, { previousDestination = null } = {}) {
    const moveNumber = resolveMoveNumber(sourceMove);
    const notation = String(sourceMove?.notation ?? "").trim();
    if (!notation) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_PARSE_FAILED,
        "指し手表記が空です。",
        { moveNumber }
      );
    }

    let rest = notation.replace(/[\s　]+/g, "");
    if (TERMINATION_NOTATIONS.has(rest)) {
      return Object.freeze({
        kind: "TERMINATION",
        moveNumber,
        notation,
        sourceKifMove: Object.freeze({ ...sourceMove })
      });
    }

    const destinationResult = parseDestination(
      rest,
      previousDestination,
      moveNumber,
      notation
    );
    rest = destinationResult.rest;

    const pieceResult = parsePiece(rest, moveNumber, notation);
    rest = pieceResult.rest;

    const sourceMatch = rest.match(/\(([1-9])([1-9])\)$/);
    const source = sourceMatch
      ? new ShogiSquare(Number(sourceMatch[1]), Number(sourceMatch[2]))
      : null;
    if (sourceMatch) rest = rest.slice(0, sourceMatch.index);

    if (rest.includes("入")) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_PARSE_FAILED,
        "Ver.1.2では「入」表記を安全に解釈できません。",
        { moveNumber, moveText: notation }
      );
    }

    const nonPromote = rest.includes("不成");
    const drop = rest.includes("打");
    const promote = !nonPromote &&
      rest.includes("成") &&
      !pieceResult.definition.promoted;
    const qualifiers = SUPPORTED_QUALIFIERS.filter((item) => rest.includes(item));

    const unknown = rest
      .replace(/不成/g, "")
      .replace(/成/g, "")
      .replace(/打/g, "")
      .replace(/[右左直寄引上行]/g, "");
    if (unknown) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_PARSE_FAILED,
        "未対応の指し手補助表記があります。",
        {
          moveNumber,
          moveText: notation,
          detail: { unknown }
        }
      );
    }

    if (drop && source) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_PARSE_FAILED,
        "駒打ちと元Squareを同時に指定できません。",
        { moveNumber, moveText: notation }
      );
    }
    if (drop && (promote || nonPromote || pieceResult.definition.promoted)) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_PROMOTION_INVALID,
        "駒打ちに成駒・成・不成表記を使用できません。",
        { moveNumber, moveText: notation }
      );
    }
    if (pieceResult.definition.promoted && (promote || nonPromote)) {
      throw new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_PROMOTION_INVALID,
        "すでに成っている駒へ成・不成表記を追加できません。",
        { moveNumber, moveText: notation }
      );
    }

    return Object.freeze({
      kind: "MOVE",
      moveNumber,
      notation,
      owner: moveNumber % 2 === 1 ? PIECE_OWNER.SENTE : PIECE_OWNER.GOTE,
      destination: destinationResult.destination,
      sameDestination: destinationResult.sameDestination,
      source,
      pieceType: pieceResult.definition.type,
      pieceWasPromoted: pieceResult.definition.promoted,
      promote,
      nonPromote,
      drop,
      qualifiers: Object.freeze(qualifiers),
      sourceKifMove: Object.freeze({ ...sourceMove })
    });
  }
}
