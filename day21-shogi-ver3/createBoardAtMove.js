import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";

import {
  createInitialBoard
} from "./createInitialBoard.js";

import {
  applyMove
} from "./applyMove.js";

/**
 * 初期盤面へ指し手を順番に適用し、
 * 指定手数時点の盤面を作る。
 *
 * currentMoveIndexは、
 * 「適用済みの指し手数」を表す。
 *
 * 0：
 * 初期局面
 *
 * 1：
 * 1手目まで適用
 *
 * moves.length：
 * 最終局面
 */
export function createBoardAtMove(
  moves,
  currentMoveIndex
) {
  validateInput({
    moves,
    currentMoveIndex
  });

  let board =
    createInitialBoard();

  for (
    let index = 0;
    index <
      currentMoveIndex;
    index += 1
  ) {
    try {
      board =
        applyMove(
          board,
          moves[index]
        );
    } catch (error) {
      throw new ApplicationError({
        code:
          ERROR_CODES
            .INVALID_MOVE,

        message:
          `${index + 1}手目を盤面へ適用できませんでした。`,

        cause:
          error,

        details: {
          moveIndex:
            index,

          currentMoveIndex
        }
      });
    }
  }

  return board;
}

/**
 * 入力を確認する。
 */
function validateInput({
  moves,
  currentMoveIndex
}) {
  if (
    !Array.isArray(moves)
  ) {
    throw new ApplicationError({
      code:
        ERROR_CODES
          .INVALID_GAME,

      message:
        "盤面再構築に使用するmovesは配列である必要があります。",

      details: {
        moves
      }
    });
  }

  if (
    !Number.isInteger(
      currentMoveIndex
    )
  ) {
    throw new ApplicationError({
      code:
        ERROR_CODES
          .INVALID_GAME,

      message:
        "currentMoveIndexは整数である必要があります。",

      details: {
        currentMoveIndex
      }
    });
  }

  if (
    currentMoveIndex < 0 ||
    currentMoveIndex >
      moves.length
  ) {
    throw new ApplicationError({
      code:
        ERROR_CODES
          .INVALID_GAME,

      message:
        "currentMoveIndexが指し手数の範囲外です。",

      details: {
        currentMoveIndex,

        moveCount:
          moves.length
      }
    });
  }
}