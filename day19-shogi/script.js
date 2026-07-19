"use strict";

/* ========================================
   LocalStorage設定
======================================== */

const STORAGE_KEY = "day19-shogi-moves";


/* ========================================
   駒データを作る関数
======================================== */

function createPiece(name, player) {
  return {
    name,
    player
  };
}


/* ========================================
   初期盤面データ
======================================== */

const INITIAL_BOARD = [
  [
    createPiece("香", "gote"),
    createPiece("桂", "gote"),
    createPiece("銀", "gote"),
    createPiece("金", "gote"),
    createPiece("王", "gote"),
    createPiece("金", "gote"),
    createPiece("銀", "gote"),
    createPiece("桂", "gote"),
    createPiece("香", "gote")
  ],
  [
    null,
    createPiece("角", "gote"),
    null,
    null,
    null,
    null,
    null,
    createPiece("飛", "gote"),
    null
  ],
  [
    createPiece("歩", "gote"),
    createPiece("歩", "gote"),
    createPiece("歩", "gote"),
    createPiece("歩", "gote"),
    createPiece("歩", "gote"),
    createPiece("歩", "gote"),
    createPiece("歩", "gote"),
    createPiece("歩", "gote"),
    createPiece("歩", "gote")
  ],
  [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ],
  [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ],
  [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ],
  [
    createPiece("歩", "sente"),
    createPiece("歩", "sente"),
    createPiece("歩", "sente"),
    createPiece("歩", "sente"),
    createPiece("歩", "sente"),
    createPiece("歩", "sente"),
    createPiece("歩", "sente"),
    createPiece("歩", "sente"),
    createPiece("歩", "sente")
  ],
  [
    null,
    createPiece("飛", "sente"),
    null,
    null,
    null,
    null,
    null,
    createPiece("角", "sente"),
    null
  ],
  [
    createPiece("香", "sente"),
    createPiece("桂", "sente"),
    createPiece("銀", "sente"),
    createPiece("金", "sente"),
    createPiece("玉", "sente"),
    createPiece("金", "sente"),
    createPiece("銀", "sente"),
    createPiece("桂", "sente"),
    createPiece("香", "sente")
  ]
];


/* ========================================
   サンプル棋譜データ
======================================== */

const SAMPLE_MOVES = [
  {
    notation: "▲７六歩",
    from: {
      row: 7,
      col: 7
    },
    to: {
      row: 6,
      col: 7
    },
    piece: "歩",
    player: "sente"
  },
  {
    notation: "△３四歩",
    from: {
      row: 3,
      col: 3
    },
    to: {
      row: 4,
      col: 3
    },
    piece: "歩",
    player: "gote"
  },
  {
    notation: "▲２六歩",
    from: {
      row: 7,
      col: 2
    },
    to: {
      row: 6,
      col: 2
    },
    piece: "歩",
    player: "sente"
  },
  {
    notation: "△８四歩",
    from: {
      row: 3,
      col: 8
    },
    to: {
      row: 4,
      col: 8
    },
    piece: "歩",
    player: "gote"
  },
  {
    notation: "▲２五歩",
    from: {
      row: 6,
      col: 2
    },
    to: {
      row: 5,
      col: 2
    },
    piece: "歩",
    player: "sente"
  },
  {
    notation: "△８五歩",
    from: {
      row: 4,
      col: 8
    },
    to: {
      row: 5,
      col: 8
    },
    piece: "歩",
    player: "gote"
  }
];


/* ========================================
   State
======================================== */

let moves = [];
let currentMoveIndex = 0;


/* ========================================
   DOM取得
======================================== */

const boardElement = document.getElementById("shogi-board");

const moveNumberElement = document.getElementById("move-number");
const currentMoveElement = document.getElementById("current-move");

const moveListElement = document.getElementById("move-list");
const moveCountElement = document.getElementById("move-count");

const storageStatusElement =
  document.getElementById("storage-status");

const firstButton = document.getElementById("first-button");
const backButton = document.getElementById("back-button");
const nextButton = document.getElementById("next-button");
const lastButton = document.getElementById("last-button");


/* ========================================
   初期化
======================================== */

function init() {
  moves = loadMoves();

  setupEvents();
  render();
}


/* ========================================
   イベント登録
======================================== */

function setupEvents() {
  firstButton.addEventListener(
    "click",
    moveToFirst
  );

  backButton.addEventListener(
    "click",
    moveBack
  );

  nextButton.addEventListener(
    "click",
    moveNext
  );

  lastButton.addEventListener(
    "click",
    moveToLast
  );
}


/* ========================================
   最初へ移動
======================================== */

function moveToFirst() {
  currentMoveIndex = 0;

  render();
}


/* ========================================
   1手戻る
======================================== */

function moveBack() {
  if (currentMoveIndex <= 0) {
    return;
  }

  currentMoveIndex -= 1;

  render();
}


/* ========================================
   1手進む
======================================== */

function moveNext() {
  if (currentMoveIndex >= moves.length) {
    return;
  }

  currentMoveIndex += 1;

  render();
}


/* ========================================
   最後へ移動
======================================== */

function moveToLast() {
  currentMoveIndex = moves.length;

  render();
}


/* ========================================
   画面全体を更新
======================================== */

function render() {
  const currentBoard =
    createBoardAtMove(currentMoveIndex);

  renderBoard(currentBoard);
  renderMoveInformation();
  renderMoveList();
  updateButtons();
}


/* ========================================
   指定した手数の盤面を作る
======================================== */

function createBoardAtMove(moveIndex) {
  const board = cloneInitialBoard();

  const movesToApply = moves.slice(
    0,
    moveIndex
  );

  movesToApply.forEach((move) => {
    applyMove(board, move);
  });

  return board;
}


/* ========================================
   初期盤面を複製
======================================== */

function cloneInitialBoard() {
  return INITIAL_BOARD.map((row) => {
    return row.map((cell) => {
      if (cell === null) {
        return null;
      }

      return {
        ...cell
      };
    });
  });
}


/* ========================================
   一手を盤面へ適用
======================================== */

function applyMove(board, move) {
  const fromRowIndex = move.from.row - 1;
  const fromColIndex = move.from.col - 1;

  const toRowIndex = move.to.row - 1;
  const toColIndex = move.to.col - 1;

  const movingPiece =
    board[fromRowIndex][fromColIndex];

  board[fromRowIndex][fromColIndex] = null;

  board[toRowIndex][toColIndex] =
    movingPiece ??
    createPiece(
      move.piece,
      move.player
    );
}


/* ========================================
   将棋盤を表示
======================================== */

function renderBoard(board) {
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellElement =
        document.createElement("div");

      cellElement.classList.add(
        "board-cell"
      );

      cellElement.setAttribute(
        "role",
        "gridcell"
      );

      cellElement.setAttribute(
        "aria-label",
        createCellLabel(
          cell,
          rowIndex,
          colIndex
        )
      );

      if (cell !== null) {
        const pieceElement =
          document.createElement("span");

        pieceElement.classList.add(
          "piece",
          cell.player
        );

        pieceElement.textContent =
          cell.name;

        cellElement.appendChild(
          pieceElement
        );
      }

      boardElement.appendChild(
        cellElement
      );
    });
  });
}


/* ========================================
   マスの説明を作る
======================================== */

function createCellLabel(
  cell,
  rowIndex,
  colIndex
) {
  const rowNumber = rowIndex + 1;
  const colNumber = colIndex + 1;

  if (cell === null) {
    return `${rowNumber}行${colNumber}列、空き`;
  }

  const playerName =
    cell.player === "sente"
      ? "先手"
      : "後手";

  return (
    `${rowNumber}行${colNumber}列、` +
    `${playerName}の${cell.name}`
  );
}


/* ========================================
   手数と現在手を表示
======================================== */

function renderMoveInformation() {
  moveNumberElement.textContent =
    `${currentMoveIndex}手目`;

  if (currentMoveIndex === 0) {
    currentMoveElement.textContent =
      "開始局面";

    return;
  }

  const currentMove =
    moves[currentMoveIndex - 1];

  currentMoveElement.textContent =
    currentMove.notation;
}


/* ========================================
   棋譜一覧を表示
======================================== */

function renderMoveList() {
  moveListElement.innerHTML = "";

  moveCountElement.textContent =
    `全${moves.length}手`;

  moves.forEach((move, index) => {
    const listItem =
      document.createElement("li");

    listItem.classList.add(
      "move-list-item"
    );

    listItem.textContent =
      move.notation;

    const moveNumber = index + 1;

    if (moveNumber === currentMoveIndex) {
      listItem.classList.add(
        "current"
      );

      listItem.setAttribute(
        "aria-current",
        "step"
      );
    }

    moveListElement.appendChild(
      listItem
    );
  });

  scrollCurrentMoveIntoView();
}


/* ========================================
   現在手が見える位置へ移動
======================================== */

function scrollCurrentMoveIntoView() {
  const currentItem =
    moveListElement.querySelector(
      ".move-list-item.current"
    );

  if (currentItem === null) {
    return;
  }

  currentItem.scrollIntoView({
    block: "nearest"
  });
}


/* ========================================
   ボタン状態を更新
======================================== */

function updateButtons() {
  const isFirstPosition =
    currentMoveIndex === 0;

  const isLastPosition =
    currentMoveIndex === moves.length;

  firstButton.disabled =
    isFirstPosition;

  backButton.disabled =
    isFirstPosition;

  nextButton.disabled =
    isLastPosition;

  lastButton.disabled =
    isLastPosition;
}


/* ========================================
   棋譜をLocalStorageへ保存
======================================== */

function saveMoves(movesToSave) {
  try {
    const movesJson =
      JSON.stringify(movesToSave);

    localStorage.setItem(
      STORAGE_KEY,
      movesJson
    );

    return true;
  } catch (error) {
    console.error(
      "棋譜の保存に失敗しました。",
      error
    );

    return false;
  }
}


/* ========================================
   棋譜をLocalStorageから読み込む
======================================== */

function loadMoves() {
  try {
    const savedMovesJson =
      localStorage.getItem(STORAGE_KEY);

    if (savedMovesJson === null) {
      const initialMoves =
        cloneSampleMoves();

      const wasSaved =
        saveMoves(initialMoves);

      storageStatusElement.textContent =
        wasSaved
          ? "サンプル棋譜を保存しました。"
          : "サンプル棋譜を使用しています。";

      return initialMoves;
    }

    const savedMoves =
      JSON.parse(savedMovesJson);

    if (!isValidMoves(savedMoves)) {
      throw new Error(
        "保存されている棋譜の形式が正しくありません。"
      );
    }

    storageStatusElement.textContent =
      "保存済み棋譜を読み込みました。";

    return savedMoves;
  } catch (error) {
    console.error(
      "棋譜の読み込みに失敗しました。",
      error
    );

    const fallbackMoves =
      cloneSampleMoves();

    saveMoves(fallbackMoves);

    storageStatusElement.textContent =
      "保存データを読み込めないため、サンプル棋譜を使用します。";

    return fallbackMoves;
  }
}


/* ========================================
   サンプル棋譜を複製
======================================== */

function cloneSampleMoves() {
  return SAMPLE_MOVES.map((move) => {
    return {
      ...move,
      from: {
        ...move.from
      },
      to: {
        ...move.to
      }
    };
  });
}


/* ========================================
   棋譜データの形式を確認
======================================== */

function isValidMoves(value) {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((move) => {
    return (
      typeof move === "object" &&
      move !== null &&
      typeof move.notation === "string" &&
      typeof move.piece === "string" &&
      typeof move.player === "string" &&
      isValidPosition(move.from) &&
      isValidPosition(move.to)
    );
  });
}


/* ========================================
   座標データの形式を確認
======================================== */

function isValidPosition(position) {
  if (
    typeof position !== "object" ||
    position === null
  ) {
    return false;
  }

  const isRowValid =
    Number.isInteger(position.row) &&
    position.row >= 1 &&
    position.row <= 9;

  const isColValid =
    Number.isInteger(position.col) &&
    position.col >= 1 &&
    position.col <= 9;

  return (
    isRowValid &&
    isColValid
  );
}


/* ========================================
   アプリ開始
======================================== */

init();