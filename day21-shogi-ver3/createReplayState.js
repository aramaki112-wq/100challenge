import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";

import {
  DEFAULT_GAME_METADATA
} from "./Game.js";

import {
  Move
} from "./Move.js";

/**
 * Replay画面で使用するStateを生成する。
 *
 * Replay Stateは、次の情報を持つ。
 *
 * ・現在表示しているGame
 * ・Game Metadata
 * ・すべての指し手
 * ・何手目まで適用しているか
 *
 * 現在盤面そのものは保存しない。
 *
 * 現在盤面は、
 *
 * moves
 * ＋
 * currentMoveIndex
 *
 * から導出する。
 */
export function createReplayState({
  gameId = null,
  metadata = null,
  moves = [],
  currentMoveIndex = 0
} = {}) {
  const normalizedGameId =
    normalizeGameId(
      gameId
    );

  const normalizedMetadata =
    normalizeMetadata(
      metadata
    );

  const normalizedMoves =
    normalizeMoves(
      moves
    );

  validateCurrentMoveIndex({
    currentMoveIndex,
    moveCount:
      normalizedMoves.length
  });

  Object.freeze(
    normalizedMetadata
  );

  Object.freeze(
    normalizedMoves
  );

  return Object.freeze({
    gameId:
      normalizedGameId,

    metadata:
      normalizedMetadata,

    moves:
      normalizedMoves,

    currentMoveIndex
  });
}

/**
 * Gameが読み込まれていない状態を作る。
 */
export function createEmptyReplayState() {
  return createReplayState({
    gameId:
      null,

    metadata:
      null,

    moves: [],

    currentMoveIndex:
      0
  });
}

/**
 * Replay Stateの手数だけを変更する。
 *
 * 元のStateは変更せず、
 * 新しいStateを返す。
 */
export function updateReplayMoveIndex(
  replayState,
  nextMoveIndex
) {
  validateReplayState(
    replayState
  );

  return createReplayState({
    gameId:
      replayState.gameId,

    metadata:
      replayState.metadata,

    moves:
      replayState.moves,

    currentMoveIndex:
      nextMoveIndex
  });
}

/**
 * Game IDを標準化する。
 */
function normalizeGameId(
  gameId
) {
  if (
    gameId === null ||
    gameId === undefined
  ) {
    return null;
  }

  if (
    typeof gameId !==
      "string" ||
    gameId.trim() === ""
  ) {
    throw createReplayStateError({
      message:
        "gameIdは空ではない文字列またはnullである必要があります。",

      details: {
        gameId
      }
    });
  }

  return gameId.trim();
}

/**
 * Metadataを標準化する。
 */
function normalizeMetadata(
  metadata
) {
  if (
    metadata === null ||
    metadata === undefined
  ) {
    return {
      title:
        DEFAULT_GAME_METADATA
          .title,

      senteName:
        DEFAULT_GAME_METADATA
          .senteName,

      goteName:
        DEFAULT_GAME_METADATA
          .goteName,

      playedAt:
        DEFAULT_GAME_METADATA
          .playedAt
    };
  }

  if (
    typeof metadata !==
      "object" ||
    Array.isArray(metadata)
  ) {
    throw createReplayStateError({
      message:
        "metadataはObjectまたはnullである必要があります。",

      details: {
        metadata
      }
    });
  }

  return {
    title:
      normalizeDisplayText({
        value:
          metadata.title,

        defaultValue:
          DEFAULT_GAME_METADATA
            .title
      }),

    senteName:
      normalizeDisplayText({
        value:
          metadata.senteName,

        defaultValue:
          DEFAULT_GAME_METADATA
            .senteName
      }),

    goteName:
      normalizeDisplayText({
        value:
          metadata.goteName,

        defaultValue:
          DEFAULT_GAME_METADATA
            .goteName
      }),

    playedAt:
      normalizePlayedAt(
        metadata.playedAt
      )
  };
}

/**
 * 表示用文字列を標準化する。
 */
function normalizeDisplayText({
  value,
  defaultValue
}) {
  if (
    typeof value !==
      "string"
  ) {
    return defaultValue;
  }

  const normalized =
    value.trim();

  return (
    normalized === ""
      ? defaultValue
      : normalized
  );
}

/**
 * 対局日時を標準化する。
 */
function normalizePlayedAt(
  playedAt
) {
  if (
    playedAt === null ||
    playedAt === undefined ||
    playedAt === ""
  ) {
    return null;
  }

  if (
    typeof playedAt !==
      "string"
  ) {
    throw createReplayStateError({
      message:
        "playedAtは文字列またはnullである必要があります。",

      details: {
        playedAt
      }
    });
  }

  return playedAt;
}

/**
 * Move一覧をCloneする。
 */
function normalizeMoves(
  moves
) {
  if (
    !Array.isArray(moves)
  ) {
    throw createReplayStateError({
      message:
        "movesは配列である必要があります。",

      details: {
        moves
      }
    });
  }

  return moves.map(
    (
      move,
      index
    ) => {
      try {
        return Move.from(
          move
        );
      } catch (error) {
        throw createReplayStateError({
          message:
            `${index + 1}件目のMoveをReplay Stateへ登録できませんでした。`,

          cause:
            error,

          details: {
            moveIndex:
              index
          }
        });
      }
    }
  );
}

/**
 * 現在手数を確認する。
 */
function validateCurrentMoveIndex({
  currentMoveIndex,
  moveCount
}) {
  if (
    !Number.isInteger(
      currentMoveIndex
    )
  ) {
    throw createReplayStateError({
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
      moveCount
  ) {
    throw createReplayStateError({
      message:
        "currentMoveIndexがReplay可能な範囲を超えています。",

      details: {
        currentMoveIndex,
        moveCount
      }
    });
  }
}

/**
 * updateReplayMoveIndexへ渡された
 * Stateの最低限の形を確認する。
 */
function validateReplayState(
  replayState
) {
  if (
    replayState === null ||
    typeof replayState !==
      "object" ||
    Array.isArray(
      replayState
    )
  ) {
    throw createReplayStateError({
      message:
        "有効なReplay Stateを指定してください。",

      details: {
        replayState
      }
    });
  }

  if (
    !Array.isArray(
      replayState.moves
    )
  ) {
    throw createReplayStateError({
      message:
        "Replay Stateのmovesが配列ではありません。"
    });
  }
}

/**
 * Replay State用Errorを作る。
 */
function createReplayStateError({
  message,
  cause = null,
  details = null
}) {
  return new ApplicationError({
    code:
      ERROR_CODES
        .INVALID_GAME,

    message,

    cause,

    details
  });
}