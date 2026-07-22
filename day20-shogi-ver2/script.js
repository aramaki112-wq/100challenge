```javascript
"use strict";

/*
========================================
DAY20 将棋棋譜再現アプリ Ver2
KIF棋譜読み込み編
========================================

今回の中心設計

Input
↓
Parser
↓
Validation
↓
Storage
↓
State
↓
Render
*/


// ========================================
// 1. 定数
// ========================================

const STORAGE_KEY =
  "day20-shogi-kif-data";

const STORAGE_VERSION = 1;

const PLAYER_SENTE = "sente";
const PLAYER_GOTE = "gote";

const MESSAGE_TYPE_INFORMATION =
  "information";

const MESSAGE_TYPE_SUCCESS =
  "success";

const MESSAGE_TYPE_ERROR =
  "error";


// KIFの全角数字を半角数字へ変換するために使用する
const FULL_WIDTH_NUMBERS = {
  "１": 1,
  "２": 2,
  "３": 3,
  "４": 4,
  "５": 5,
  "６": 6,
  "７": 7,
  "８": 8,
  "９": 9
};


// KIFの段を数字へ変換するために使用する
const KANJI_NUMBERS = {
  "一": 1,
  "二": 2,
  "三": 3,
  "四": 4,
  "五": 5,
  "六": 6,
  "七": 7,
  "八": 8,
  "九": 9
};


// 初回表示用のKIF
const SAMPLE_KIF = `手合割：平手
棋戦：DAY20 サンプル対局
先手：先手
後手：後手
手数----指手---------消費時間--
1 ７六歩(77)
2 ３四歩(33)
3 ２六歩(27)
4 ８四歩(83)
5 ２五歩(26)
6 ８五歩(84)
7 ７八金(69)
8 ３二金(41)
9 ２四歩(25)
10 ２四歩(23)`;


// ========================================
// 2. State
// ========================================

const state = {
  moves: [],

  currentMoveIndex: 0,

  metadata: {
    title: "未設定",
    sente: "先手",
    gote: "後手"
  },

  rawKif: "",

  message: "KIFを入力してください。",

  messageType:
    MESSAGE_TYPE_INFORMATION
};


// ========================================
// 3. DOM取得
// ========================================

const kifInputElement =
  document.getElementById("kif-input");

const loadKifButton =
  document.getElementById(
    "load-kif-button"
  );

const loadSavedButton =
  document.getElementById(
    "load-saved-button"
  );

const clearInputButton =
  document.getElementById(
    "clear-input-button"
  );

const inputMessageElement =
  document.getElementById(
    "input-message"
  );

const gameTitleElement =
  document.getElementById(
    "game-title"
  );

const senteNameElement =
  document.getElementById(
    "sente-name"
  );

const goteNameElement =
  document.getElementById(
    "gote-name"
  );

const totalMoveCountElement =
  document.getElementById(
    "total-move-count"
  );

const boardElement =
  document.getElementById(
    "shogi-board"
  );

const moveNumberElement =
  document.getElementById(
    "move-number"
  );

const currentMoveElement =
  document.getElementById(
    "current-move"
  );

const firstButton =
  document.getElementById(
    "first-button"
  );

const backButton =
  document.getElementById(
    "back-button"
  );

const nextButton =
  document.getElementById(
    "next-button"
  );

const lastButton =
  document.getElementById(
    "last-button"
  );

const moveCountElement =
  document.getElementById(
    "move-count"
  );

const moveListElement =
  document.getElementById(
    "move-list"
  );


// ========================================
// 4. 初期化
// ========================================

function init() {
  setupEvents();

  const savedGameData =
    loadGameData();

  if (savedGameData !== null) {
    applyGameDataToState(
      savedGameData
    );

    kifInputElement.value =
      savedGameData.rawKif;

    setMessage(
      "保存済み棋譜を読み込みました。",
      MESSAGE_TYPE_SUCCESS
    );
  } else {
    loadSampleKif();
  }

  render();
}


// ========================================
// 5. Event登録
// ========================================

function setupEvents() {
  loadKifButton.addEventListener(
    "click",
    handleLoadKif
  );

  loadSavedButton.addEventListener(
    "click",
    handleLoadSavedKif
  );

  clearInputButton.addEventListener(
    "click",
    handleClearInput
  );

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


// ========================================
// 6. KIF入力Event
// ========================================

function handleLoadKif() {
  const rawKif =
    kifInputElement.value.trim();

  if (rawKif === "") {
    setMessage(
      "KIFデータを入力してください。",
      MESSAGE_TYPE_ERROR
    );

    renderMessage();

    return;
  }

  try {
    const parsedGameData =
      parseKif(rawKif);

    validateParsedGameData(
      parsedGameData
    );

    applyGameDataToState(
      parsedGameData
    );

    const wasSaved =
      saveGameData(
        createStorageData()
      );

    if (wasSaved) {
      setMessage(
        `${state.moves.length}手の棋譜を読み込み、保存しました。`,
        MESSAGE_TYPE_SUCCESS
      );
    } else {
      setMessage(
        `${state.moves.length}手の棋譜を読み込みました。保存には失敗しました。`,
        MESSAGE_TYPE_INFORMATION
      );
    }

    render();
  } catch (error) {
    console.error(
      "KIFの読み込みに失敗しました。",
      error
    );

    setMessage(
      error instanceof Error
        ? error.message
        : "KIFの読み込みに失敗しました。",
      MESSAGE_TYPE_ERROR
    );

    renderMessage();
  }
}


function handleLoadSavedKif() {
  const savedGameData =
    loadGameData();

  if (savedGameData === null) {
    setMessage(
      "保存済みの棋譜がありません。",
      MESSAGE_TYPE_ERROR
    );

    renderMessage();

    return;
  }

  applyGameDataToState(
    savedGameData
  );

  kifInputElement.value =
    savedGameData.rawKif;

  setMessage(
    `${state.moves.length}手の保存済み棋譜を読み込みました。`,
    MESSAGE_TYPE_SUCCESS
  );

  render();
}


function handleClearInput() {
  kifInputElement.value = "";

  setMessage(
    "入力欄をクリアしました。保存済み棋譜は削除していません。",
    MESSAGE_TYPE_INFORMATION
  );

  renderMessage();

  kifInputElement.focus();
}


// ========================================
// 7. 棋譜再生Event
// ========================================

function moveToFirst() {
  state.currentMoveIndex = 0;

  render();
}


function moveBack() {
  if (
    state.currentMoveIndex <= 0
  ) {
    return;
  }

  state.currentMoveIndex -= 1;

  render();
}


function moveNext() {
  if (
    state.currentMoveIndex >=
    state.moves.length
  ) {
    return;
  }

  state.currentMoveIndex += 1;

  render();
}


function moveToLast() {
  state.currentMoveIndex =
    state.moves.length;

  render();
}


// ========================================
// 8. Parser
// ========================================

function parseKif(rawKif) {
  const normalizedKif =
    normalizeLineBreaks(rawKif);

  const lines =
    normalizedKif.split("\n");

  const metadata =
    parseKifMetadata(lines);

  const moveLines =
    extractMoveLines(lines);

  if (moveLines.length === 0) {
    throw new Error(
      "読み込める指し手が見つかりませんでした。移動元を含むKIF形式か確認してください。"
    );
  }

  const moves =
    moveLines.map(
      (line) => parseMoveLine(line)
    );

  return {
    metadata,
    moves,
    rawKif: normalizedKif
  };
}


function parseKifMetadata(lines) {
  const metadata = {
    title: "未設定",
    sente: "先手",
    gote: "後手"
  };

  lines.forEach((line) => {
    const trimmedLine =
      line.trim();

    if (
      trimmedLine.startsWith(
        "棋戦："
      )
    ) {
      metadata.title =
        getMetadataValue(
          trimmedLine,
          "棋戦："
        );
    }

    if (
      trimmedLine.startsWith(
        "先手："
      )
    ) {
      metadata.sente =
        getMetadataValue(
          trimmedLine,
          "先手："
        );
    }

    if (
      trimmedLine.startsWith(
        "後手："
      )
    ) {
      metadata.gote =
        getMetadataValue(
          trimmedLine,
          "後手："
        );
    }
  });

  return metadata;
}


function extractMoveLines(lines) {
  return lines.filter((line) => {
    return /^\s*\d+\s+/.test(line);
  });
}


function parseMoveLine(line) {
  /*
  対応例

  1 ７六歩(77)
  2 ３四歩(33)
  3 ２六歩(27)   ( 0:01/00:00:01)

  DAY20では次に未対応

  同
  打
  成
  不成
  */

  if (
    line.includes(" 同") ||
    line.includes("同　")
  ) {
    throw new Error(
      `「同」を含む指し手には、まだ対応していません。\n${line.trim()}`
    );
  }

  if (line.includes("打")) {
    throw new Error(
      `「打」を含む指し手には、まだ対応していません。\n${line.trim()}`
    );
  }

  if (
    line.includes("成") ||
    line.includes("不成")
  ) {
    throw new Error(
      `「成」「不成」を含む指し手には、まだ対応していません。\n${line.trim()}`
    );
  }

  const movePattern =
    /^\s*(\d+)\s+([１２３４５６７８９1-9])([一二三四五六七八九1-9])([歩香桂銀金角飛玉王と馬龍竜]+)\((\d)(\d)\)/;

  const match =
    line.match(movePattern);

  if (match === null) {
    throw new Error(
      `解析できない指し手です。\n${line.trim()}`
    );
  }

  const moveNumber =
    Number(match[1]);

  const destinationFile =
    convertKifNumber(match[2]);

  const destinationRank =
    convertKifNumber(match[3]);

  const piece =
    normalizePieceName(match[4]);

  const sourceFile =
    Number(match[5]);

  const sourceRank =
    Number(match[6]);

  const player =
    moveNumber % 2 === 1
      ? PLAYER_SENTE
      : PLAYER_GOTE;

  const playerSymbol =
    player === PLAYER_SENTE
      ? "▲"
      : "△";

  return {
    moveNumber,

    notation:
      `${playerSymbol}${match[2]}${match[3]}${piece}`,

    from: {
      row: sourceRank,
      col: sourceFile
    },

    to: {
      row: destinationRank,
      col: destinationFile
    },

    piece,

    player
  };
}


// ========================================
// 9. Validation
// ========================================

function validateParsedGameData(
  gameData
) {
  if (
    typeof gameData !== "object" ||
    gameData === null
  ) {
    throw new Error(
      "解析結果が正しいObjectではありません。"
    );
  }

  if (
    !Array.isArray(gameData.moves) ||
    gameData.moves.length === 0
  ) {
    throw new Error(
      "棋譜データがありません。"
    );
  }

  const areMovesValid =
    gameData.moves.every(
      (move, index) => {
        return isValidMove(
          move,
          index
        );
      }
    );

  if (!areMovesValid) {
    throw new Error(
      "解析後の棋譜データに不正な値があります。"
    );
  }

  validateMoveNumbers(
    gameData.moves
  );
}


function isValidMove(move, index) {
  if (
    typeof move !== "object" ||
    move === null
  ) {
    console.error(
      `棋譜${index + 1}件目がObjectではありません。`
    );

    return false;
  }

  return (
    Number.isInteger(
      move.moveNumber
    ) &&
    typeof move.notation ===
      "string" &&
    move.notation !== "" &&
    typeof move.piece ===
      "string" &&
    move.piece !== "" &&
    (
      move.player ===
        PLAYER_SENTE ||
      move.player ===
        PLAYER_GOTE
    ) &&
    isValidPosition(move.from) &&
    isValidPosition(move.to)
  );
}


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


function validateMoveNumbers(moves) {
  moves.forEach((move, index) => {
    const expectedMoveNumber =
      index + 1;

    if (
      move.moveNumber !==
      expectedMoveNumber
    ) {
      throw new Error(
        `${expectedMoveNumber}手目の棋譜が見つかりません。手数が連続しているか確認してください。`
      );
    }
  });
}


// ========================================
// 10. State更新
// ========================================

function applyGameDataToState(
  gameData
) {
  state.moves =
    cloneMoves(gameData.moves);

  state.metadata = {
    title:
      gameData.metadata.title,

    sente:
      gameData.metadata.sente,

    gote:
      gameData.metadata.gote
  };

  state.rawKif =
    gameData.rawKif;

  state.currentMoveIndex = 0;
}


function setMessage(
  message,
  messageType
) {
  state.message = message;

  state.messageType =
    messageType;
}


// ========================================
// 11. Storage
// ========================================

function createStorageData() {
  return {
    version: STORAGE_VERSION,

    metadata: {
      ...state.metadata
    },

    moves:
      cloneMoves(state.moves),

    rawKif:
      state.rawKif
  };
}


function saveGameData(gameData) {
  try {
    const gameDataJson =
      JSON.stringify(gameData);

    localStorage.setItem(
      STORAGE_KEY,
      gameDataJson
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


function loadGameData() {
  try {
    const savedGameDataJson =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (
      savedGameDataJson === null
    ) {
      return null;
    }

    const savedGameData =
      JSON.parse(
        savedGameDataJson
      );

    validateStoredGameData(
      savedGameData
    );

    return {
      metadata: {
        ...savedGameData.metadata
      },

      moves:
        cloneMoves(
          savedGameData.moves
        ),

      rawKif:
        savedGameData.rawKif
    };
  } catch (error) {
    console.error(
      "保存済み棋譜の読み込みに失敗しました。",
      error
    );

    return null;
  }
}


function validateStoredGameData(
  gameData
) {
  if (
    typeof gameData !== "object" ||
    gameData === null
  ) {
    throw new Error(
      "保存データがObjectではありません。"
    );
  }

  if (
    gameData.version !==
    STORAGE_VERSION
  ) {
    throw new Error(
      "保存データのVersionが対応していません。"
    );
  }

  if (
    typeof gameData.metadata !==
      "object" ||
    gameData.metadata === null
  ) {
    throw new Error(
      "保存された対局情報が不正です。"
    );
  }

  if (
    typeof gameData.rawKif !==
      "string"
  ) {
    throw new Error(
      "保存されたKIFテキストが不正です。"
    );
  }

  validateParsedGameData({
    metadata:
      gameData.metadata,

    moves:
      gameData.moves,

    rawKif:
      gameData.rawKif
  });
}


// ========================================
// 12. Render
// ========================================

function render() {
  const currentBoard =
    createBoardAtMove(
      state.currentMoveIndex
    );

  renderBoard(currentBoard);

  renderGameInformation();

  renderMoveInformation();

  renderMoveList();

  updateButtons();

  renderMessage();
}


function renderBoard(board) {
  boardElement.innerHTML = "";

  /*
  KIFの筋は右から左へ9〜1と並ぶ。

  内部Dataはcol 1〜9で管理しているため、
  表示時だけ9から1へ逆順で読む。
  */

  board.forEach(
    (row, rowIndex) => {
      for (
        let fileNumber = 9;
        fileNumber >= 1;
        fileNumber -= 1
      ) {
        const colIndex =
          fileNumber - 1;

        const cell =
          row[colIndex];

        const cellElement =
          document.createElement(
            "div"
          );

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
            fileNumber
          )
        );

        if (cell !== null) {
          const pieceElement =
            document.createElement(
              "span"
            );

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
      }
    }
  );
}


function renderGameInformation() {
  gameTitleElement.textContent =
    state.metadata.title;

  senteNameElement.textContent =
    state.metadata.sente;

  goteNameElement.textContent =
    state.metadata.gote;

  totalMoveCountElement.textContent =
    `${state.moves.length}手`;
}


function renderMoveInformation() {
  moveNumberElement.textContent =
    `${state.currentMoveIndex} / ${state.moves.length}手`;

  if (
    state.currentMoveIndex === 0
  ) {
    currentMoveElement.textContent =
      "開始局面";

    return;
  }

  const currentMove =
    state.moves[
      state.currentMoveIndex - 1
    ];

  currentMoveElement.textContent =
    currentMove.notation;
}


function renderMoveList() {
  moveListElement.innerHTML = "";

  moveCountElement.textContent =
    `全${state.moves.length}手`;

  state.moves.forEach(
    (move, index) => {
      const listItem =
        document.createElement(
          "li"
        );

      listItem.classList.add(
        "move-list-item"
      );

      listItem.textContent =
        move.notation;

      const moveNumber =
        index + 1;

      if (
        moveNumber ===
        state.currentMoveIndex
      ) {
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
    }
  );

  scrollCurrentMoveIntoView();
}


function updateButtons() {
  const hasMoves =
    state.moves.length > 0;

  const isFirstPosition =
    state.currentMoveIndex === 0;

  const isLastPosition =
    state.currentMoveIndex ===
    state.moves.length;

  firstButton.disabled =
    !hasMoves ||
    isFirstPosition;

  backButton.disabled =
    !hasMoves ||
    isFirstPosition;

  nextButton.disabled =
    !hasMoves ||
    isLastPosition;

  lastButton.disabled =
    !hasMoves ||
    isLastPosition;
}


function renderMessage() {
  inputMessageElement.textContent =
    state.message;

  inputMessageElement.classList.remove(
    "success",
    "error"
  );

  if (
    state.messageType ===
    MESSAGE_TYPE_SUCCESS
  ) {
    inputMessageElement.classList.add(
      "success"
    );
  }

  if (
    state.messageType ===
    MESSAGE_TYPE_ERROR
  ) {
    inputMessageElement.classList.add(
      "error"
    );
  }
}


// ========================================
// 13. 局面再構築
// ========================================

function createBoardAtMove(
  moveIndex
) {
  const board =
    createInitialBoard();

  const movesToApply =
    state.moves.slice(
      0,
      moveIndex
    );

  movesToApply.forEach((move) => {
    applyMove(board, move);
  });

  return board;
}


function applyMove(board, move) {
  const fromRowIndex =
    move.from.row - 1;

  const fromColIndex =
    move.from.col - 1;

  const toRowIndex =
    move.to.row - 1;

  const toColIndex =
    move.to.col - 1;

  const movingPiece =
    board[fromRowIndex][
      fromColIndex
    ];

  if (movingPiece === null) {
    throw new Error(
      `${move.moveNumber}手目「${move.notation}」の移動元に駒がありません。`
    );
  }

  if (
    movingPiece.player !==
    move.player
  ) {
    throw new Error(
      `${move.moveNumber}手目「${move.notation}」の手番と駒の所有者が一致しません。`
    );
  }

  if (
    normalizePieceName(
      movingPiece.name
    ) !==
    normalizePieceName(
      move.piece
    )
  ) {
    throw new Error(
      `${move.moveNumber}手目「${move.notation}」の駒名と移動元の駒が一致しません。`
    );
  }

  board[fromRowIndex][
    fromColIndex
  ] = null;

  /*
  Ver2では、移動先にある駒は盤面から消える。

  取った駒を駒台へ移す処理は、
  今回はまだ実装しない。
  */
  board[toRowIndex][toColIndex] =
    movingPiece;
}


// ========================================
// 14. 初期盤面
// ========================================

function createInitialBoard() {
  const board =
    Array.from(
      { length: 9 },
      () => {
        return Array(9).fill(null);
      }
    );

  // 後手1段目
  setPiece(
    board,
    1,
    9,
    "香",
    PLAYER_GOTE
  );

  setPiece(
    board,
    1,
    8,
    "桂",
    PLAYER_GOTE
  );

  setPiece(
    board,
    1,
    7,
    "銀",
    PLAYER_GOTE
  );

  setPiece(
    board,
    1,
    6,
    "金",
    PLAYER_GOTE
  );

  setPiece(
    board,
    1,
    5,
    "玉",
    PLAYER_GOTE
  );

  setPiece(
    board,
    1,
    4,
    "金",
    PLAYER_GOTE
  );

  setPiece(
    board,
    1,
    3,
    "銀",
    PLAYER_GOTE
  );

  setPiece(
    board,
    1,
    2,
    "桂",
    PLAYER_GOTE
  );

  setPiece(
    board,
    1,
    1,
    "香",
    PLAYER_GOTE
  );

  // 後手2段目
  setPiece(
    board,
    2,
    8,
    "飛",
    PLAYER_GOTE
  );

  setPiece(
    board,
    2,
    2,
    "角",
    PLAYER_GOTE
  );

  // 後手3段目の歩
  for (
    let file = 1;
    file <= 9;
    file += 1
  ) {
    setPiece(
      board,
      3,
      file,
      "歩",
      PLAYER_GOTE
    );
  }

  // 先手7段目の歩
  for (
    let file = 1;
    file <= 9;
    file += 1
  ) {
    setPiece(
      board,
      7,
      file,
      "歩",
      PLAYER_SENTE
    );
  }

  // 先手8段目
  setPiece(
    board,
    8,
    8,
    "角",
    PLAYER_SENTE
  );

  setPiece(
    board,
    8,
    2,
    "飛",
    PLAYER_SENTE
  );

  // 先手9段目
  setPiece(
    board,
    9,
    9,
    "香",
    PLAYER_SENTE
  );

  setPiece(
    board,
    9,
    8,
    "桂",
    PLAYER_SENTE
  );

  setPiece(
    board,
    9,
    7,
    "銀",
    PLAYER_SENTE
  );

  setPiece(
    board,
    9,
    6,
    "金",
    PLAYER_SENTE
  );

  setPiece(
    board,
    9,
    5,
    "玉",
    PLAYER_SENTE
  );

  setPiece(
    board,
    9,
    4,
    "金",
    PLAYER_SENTE
  );

  setPiece(
    board,
    9,
    3,
    "銀",
    PLAYER_SENTE
  );

  setPiece(
    board,
    9,
    2,
    "桂",
    PLAYER_SENTE
  );

  setPiece(
    board,
    9,
    1,
    "香",
    PLAYER_SENTE
  );

  return board;
}


function setPiece(
  board,
  row,
  col,
  name,
  player
) {
  board[row - 1][col - 1] =
    createPiece(
      name,
      player
    );
}


function createPiece(
  name,
  player
) {
  return {
    name,
    player
  };
}


// ========================================
// 15. Utility
// ========================================

function loadSampleKif() {
  try {
    kifInputElement.value =
      SAMPLE_KIF;

    const sampleGameData =
      parseKif(SAMPLE_KIF);

    validateParsedGameData(
      sampleGameData
    );

    applyGameDataToState(
      sampleGameData
    );

    saveGameData(
      createStorageData()
    );

    setMessage(
      "DAY20のサンプル棋譜を表示しています。",
      MESSAGE_TYPE_INFORMATION
    );
  } catch (error) {
    console.error(
      "サンプル棋譜の読み込みに失敗しました。",
      error
    );

    setMessage(
      "サンプル棋譜の読み込みに失敗しました。",
      MESSAGE_TYPE_ERROR
    );
  }
}


function normalizeLineBreaks(text) {
  return text.replace(
    /\r\n?/g,
    "\n"
  );
}


function getMetadataValue(
  line,
  prefix
) {
  const value =
    line.slice(prefix.length).trim();

  return value === ""
    ? "未設定"
    : value;
}


function convertKifNumber(value) {
  if (
    Object.hasOwn(
      FULL_WIDTH_NUMBERS,
      value
    )
  ) {
    return FULL_WIDTH_NUMBERS[value];
  }

  if (
    Object.hasOwn(
      KANJI_NUMBERS,
      value
    )
  ) {
    return KANJI_NUMBERS[value];
  }

  const numberValue =
    Number(value);

  if (
    Number.isInteger(numberValue) &&
    numberValue >= 1 &&
    numberValue <= 9
  ) {
    return numberValue;
  }

  throw new Error(
    `変換できない将棋座標です：${value}`
  );
}


function normalizePieceName(
  pieceName
) {
  if (pieceName === "王") {
    return "玉";
  }

  if (pieceName === "竜") {
    return "龍";
  }

  return pieceName;
}


function cloneMoves(moves) {
  return moves.map((move) => {
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


function createCellLabel(
  cell,
  rowIndex,
  fileNumber
) {
  const rankNumber =
    rowIndex + 1;

  if (cell === null) {
    return (
      `${fileNumber}筋` +
      `${rankNumber}段、空き`
    );
  }

  const playerName =
    cell.player === PLAYER_SENTE
      ? "先手"
      : "後手";

  return (
    `${fileNumber}筋` +
    `${rankNumber}段、` +
    `${playerName}の${cell.name}`
  );
}


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


// ========================================
// 16. アプリ開始
// ========================================

init();
```
