import {
  PLAYERS
} from "./Move.js";

/**
 * 将棋の初期盤面を生成する。
 *
 * Boardは9行×9列の二次元配列。
 *
 * Row：
 *
 * index 0
 * 1段目
 *
 * index 8
 * 9段目
 *
 * Column：
 *
 * index 0
 * 9筋
 *
 * index 8
 * 1筋
 *
 * 一つの駒は次の形を持つ。
 *
 * {
 *   piece: "歩",
 *   owner: "sente"
 * }
 */
export function createInitialBoard() {
  const emptyRow = () =>
    Array(9).fill(null);

  const board = [
    [
      createPiece(
        "香",
        PLAYERS.GOTE
      ),

      createPiece(
        "桂",
        PLAYERS.GOTE
      ),

      createPiece(
        "銀",
        PLAYERS.GOTE
      ),

      createPiece(
        "金",
        PLAYERS.GOTE
      ),

      createPiece(
        "玉",
        PLAYERS.GOTE
      ),

      createPiece(
        "金",
        PLAYERS.GOTE
      ),

      createPiece(
        "銀",
        PLAYERS.GOTE
      ),

      createPiece(
        "桂",
        PLAYERS.GOTE
      ),

      createPiece(
        "香",
        PLAYERS.GOTE
      )
    ],

    [
      null,

      createPiece(
        "飛",
        PLAYERS.GOTE
      ),

      null,
      null,
      null,
      null,
      null,

      createPiece(
        "角",
        PLAYERS.GOTE
      ),

      null
    ],

    Array
      .from(
        {
          length: 9
        },
        () =>
          createPiece(
            "歩",
            PLAYERS.GOTE
          )
      ),

    emptyRow(),

    emptyRow(),

    emptyRow(),

    Array
      .from(
        {
          length: 9
        },
        () =>
          createPiece(
            "歩",
            PLAYERS.SENTE
          )
      ),

    [
      null,

      createPiece(
        "角",
        PLAYERS.SENTE
      ),

      null,
      null,
      null,
      null,
      null,

      createPiece(
        "飛",
        PLAYERS.SENTE
      ),

      null
    ],

    [
      createPiece(
        "香",
        PLAYERS.SENTE
      ),

      createPiece(
        "桂",
        PLAYERS.SENTE
      ),

      createPiece(
        "銀",
        PLAYERS.SENTE
      ),

      createPiece(
        "金",
        PLAYERS.SENTE
      ),

      createPiece(
        "玉",
        PLAYERS.SENTE
      ),

      createPiece(
        "金",
        PLAYERS.SENTE
      ),

      createPiece(
        "銀",
        PLAYERS.SENTE
      ),

      createPiece(
        "桂",
        PLAYERS.SENTE
      ),

      createPiece(
        "香",
        PLAYERS.SENTE
      )
    ]
  ];

  return freezeBoard(
    board
  );
}

/**
 * 盤面上の駒を作る。
 */
function createPiece(
  piece,
  owner
) {
  return Object.freeze({
    piece,
    owner
  });
}

/**
 * Board全体を変更できない状態にする。
 *
 * applyMoveは元のBoardを変更せず、
 * Cloneした新しいBoardを返す。
 */
function freezeBoard(
  board
) {
  board.forEach(
    (row) => {
      Object.freeze(
        row
      );
    }
  );

  return Object.freeze(
    board
  );
}