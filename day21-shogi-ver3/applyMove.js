import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";

import {
  Move,
  PLAYERS
} from "./Move.js";

/**
 * 一つのMoveを盤面へ適用し、
 * 新しい盤面を返す。
 *
 * 元のBoardは変更しない。
 *
 * DAY21では次を未対応とする。
 *
 * ・駒打ち
 * ・成り
 * ・不成
 * ・持ち駒管理
 * ・王手や反則などの完全な合法手判定
 */
export function applyMove(
  board,
  moveValue
) {
  validateBoard(
    board
  );

  const move =
    normalizeMove(
      moveValue
    );

  validateSupportedMove(
    move
  );

  const sourceRowIndex =
    move.from
      .toRowIndex();

  const sourceColumnIndex =
    move.from
      .toColumnIndex();

  const destinationRowIndex =
    move.to
      .toRowIndex();

  const destinationColumnIndex =
    move.to
      .toColumnIndex();

  const sourcePiece =
    board[
      sourceRowIndex
    ][
      sourceColumnIndex
    ];

  const destinationPiece =
    board[
      destinationRowIndex
    ][
      destinationColumnIndex
    ];

  validateSourcePiece({
    sourcePiece,
    move
  });

  validateDestination({
    destinationPiece,
    move
  });

  const nextBoard =
    cloneBoard(
      board
    );

  nextBoard[
    sourceRowIndex
  ][
    sourceColumnIndex
  ] = null;

  nextBoard[
    destinationRowIndex
  ][
    destinationColumnIndex
  ] = {
    piece:
      sourcePiece.piece,

    owner:
      sourcePiece.owner
  };

  return freezeBoard(
    nextBoard
  );
}

/**
 * Moveへ変換する。
 */
function normalizeMove(
  moveValue
) {
  try {
    return Move.from(
      moveValue
    );
  } catch (error) {
    throw createApplyMoveError({
      message:
        "盤面へ適用できないMoveです。",

      cause:
        error,

      details: {
        moveValue
      }
    });
  }
}

/**
 * DAY21で対応しているMoveか確認する。
 */
function validateSupportedMove(
  move
) {
  if (
    move.drop
  ) {
    throw createApplyMoveError({
      message:
        "DAY21では駒打ちを盤面へ適用できません。",

      details: {
        moveNumber:
          move.moveNumber
      }
    });
  }

  if (
    move.promote
  ) {
    throw createApplyMoveError({
      message:
        "DAY21では成る指し手を盤面へ適用できません。",

      details: {
        moveNumber:
          move.moveNumber
      }
    });
  }

  if (
    move.from === null
  ) {
    throw createApplyMoveError({
      message:
        "通常移動には移動元Positionが必要です。",

      details: {
        moveNumber:
          move.moveNumber
      }
    });
  }
}

/**
 * 移動元の駒を確認する。
 */
function validateSourcePiece({
  sourcePiece,
  move
}) {
  if (
    sourcePiece === null
  ) {
    throw createApplyMoveError({
      message:
        "移動元に駒がありません。",

      details: {
        moveNumber:
          move.moveNumber,

        from:
          move.from.toJSON()
      }
    });
  }

  if (
    sourcePiece.owner !==
      move.player
  ) {
    throw createApplyMoveError({
      message:
        "移動元の駒の所有者と、指し手の手番が一致しません。",

      details: {
        moveNumber:
          move.moveNumber,

        expectedOwner:
          move.player,

        actualOwner:
          sourcePiece.owner,

        from:
          move.from.toJSON()
      }
    });
  }

  if (
    sourcePiece.piece !==
      move.piece
  ) {
    throw createApplyMoveError({
      message:
        "移動元の駒とKIFに記載された駒が一致しません。",

      details: {
        moveNumber:
          move.moveNumber,

        expectedPiece:
          move.piece,

        actualPiece:
          sourcePiece.piece,

        from:
          move.from.toJSON()
      }
    });
  }
}

/**
 * 移動先を確認する。
 */
function validateDestination({
  destinationPiece,
  move
}) {
  if (
    destinationPiece !==
      null &&
    destinationPiece.owner ===
      move.player
  ) {
    throw createApplyMoveError({
      message:
        "自分の駒がある位置へ移動することはできません。",

      details: {
        moveNumber:
          move.moveNumber,

        destination:
          move.to.toJSON(),

        destinationPiece
      }
    });
  }
}

/**
 * BoardをCloneする。
 */
function cloneBoard(
  board
) {
  return board.map(
    (row) =>
      row.map(
        (cell) => {
          if (
            cell === null
          ) {
            return null;
          }

          return {
            piece:
              cell.piece,

            owner:
              cell.owner
          };
        }
      )
  );
}

/**
 * Board全体をValidationする。
 */
function validateBoard(
  board
) {
  if (
    !Array.isArray(
      board
    ) ||
    board.length !== 9
  ) {
    throw createApplyMoveError({
      message:
        "Boardは9行の配列である必要があります。",

      details: {
        rowCount:
          Array.isArray(board)
            ? board.length
            : null
      }
    });
  }

  board.forEach(
    (
      row,
      rowIndex
    ) => {
      if (
        !Array.isArray(row) ||
        row.length !== 9
      ) {
        throw createApplyMoveError({
          message:
            "Boardの各行は9列である必要があります。",

          details: {
            rowIndex,
            columnCount:
              Array.isArray(row)
                ? row.length
                : null
          }
        });
      }

      row.forEach(
        (
          cell,
          columnIndex
        ) => {
          validateBoardCell({
            cell,
            rowIndex,
            columnIndex
          });
        }
      );
    }
  );
}

/**
 * Boardの一つのCellを確認する。
 */
function validateBoardCell({
  cell,
  rowIndex,
  columnIndex
}) {
  if (
    cell === null
  ) {
    return;
  }

  if (
    typeof cell !==
      "object" ||
    Array.isArray(cell)
  ) {
    throw createApplyMoveError({
      message:
        "Board Cellは駒Objectまたはnullである必要があります。",

      details: {
        rowIndex,
        columnIndex,
        cell
      }
    });
  }

  if (
    typeof cell.piece !==
      "string" ||
    cell.piece.trim() === ""
  ) {
    throw createApplyMoveError({
      message:
        "Board上の駒名が不正です。",

      details: {
        rowIndex,
        columnIndex,
        cell
      }
    });
  }

  const validOwners = [
    PLAYERS.SENTE,
    PLAYERS.GOTE
  ];

  if (
    !validOwners.includes(
      cell.owner
    )
  ) {
    throw createApplyMoveError({
      message:
        "Board上の駒の所有者が不正です。",

      details: {
        rowIndex,
        columnIndex,
        cell
      }
    });
  }
}

/**
 * Board全体を変更できない状態にする。
 */
function freezeBoard(
  board
) {
  board.forEach(
    (row) => {
      row.forEach(
        (cell) => {
          if (
            cell !== null
          ) {
            Object.freeze(
              cell
            );
          }
        }
      );

      Object.freeze(
        row
      );
    }
  );

  return Object.freeze(
    board
  );
}

/**
 * applyMove用Errorを作る。
 */
function createApplyMoveError({
  message,
  cause = null,
  details = null
}) {
  return new ApplicationError({
    code:
      ERROR_CODES
        .INVALID_MOVE,

    message,

    cause,

    details
  });
}