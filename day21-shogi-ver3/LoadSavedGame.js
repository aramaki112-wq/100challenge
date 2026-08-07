import {
  ApplicationError,
  ERROR_CODES,
  isApplicationError
} from "./errors.js";

import {
  Game
} from "./Game.js";

import {
  assertGameRepository
} from "./GameRepository.js";

/**
 * 保存済みGameを取得し、
 * Replay Controllerへ渡せる形へ変換するApplication Service。
 *
 * RepositoryはGameを取得する。
 *
 * LoadSavedGameは、
 *
 * ・指定IDの確認
 * ・Gameの存在確認
 * ・Replay開始位置の決定
 *
 * を担当する。
 */
export class LoadSavedGame {
  constructor({
    gameRepository
  } = {}) {
    this.gameRepository =
      assertGameRepository(
        gameRepository
      );
  }

  /**
   * 保存済みGameを読み込む。
   *
   * @param {{ gameId: string }} input
   * @returns {Promise<{
   *   status: "success",
   *   gameId: string,
   *   metadata: object,
   *   moves: Move[],
   *   replay: {
   *     currentMoveIndex: number
   *   }
   * }>}
   */
  async execute({
    gameId
  } = {}) {
    const normalizedGameId =
      normalizeGameId(
        gameId
      );

    let foundGame;

    try {
      foundGame =
        await this.gameRepository.findById(
          normalizedGameId
        );
    } catch (error) {
      if (
        isApplicationError(
          error
        )
      ) {
        throw error;
      }

      throw new ApplicationError({
        code:
          ERROR_CODES.GAME_CANNOT_BE_LOADED,

        message:
          "保存済みGameの取得中に予期しないErrorが発生しました。",

        cause:
          error,

        details: {
          gameId:
            normalizedGameId
        }
      });
    }

    if (
      foundGame === null
    ) {
      throw new ApplicationError({
        code:
          ERROR_CODES.GAME_NOT_FOUND,

        message:
          "指定されたGameが見つかりません。",

        details: {
          gameId:
            normalizedGameId
        }
      });
    }

    const game =
      normalizeLoadedGame({
        foundGame,

        expectedGameId:
          normalizedGameId
      });

    return {
      status:
        "success",

      gameId:
        game.gameId,

      metadata: {
        title:
          game.metadata.title,

        senteName:
          game.metadata.senteName,

        goteName:
          game.metadata.goteName,

        playedAt:
          game.metadata.playedAt
      },

      moves:
        game.moves.map(
          (move) =>
            move.clone()
        ),

      replay: {
        currentMoveIndex:
          0
      }
    };
  }
}

/**
 * Game IDを確認する。
 */
function normalizeGameId(
  gameId
) {
  if (
    typeof gameId !== "string" ||
    gameId.trim() === ""
  ) {
    throw new ApplicationError({
      code:
        ERROR_CODES.INVALID_GAME_ID,

      message:
        "読み込むGame IDを指定してください。",

      details: {
        gameId
      }
    });
  }

  return gameId.trim();
}

/**
 * Repositoryから戻ったGameを確認する。
 */
function normalizeLoadedGame({
  foundGame,
  expectedGameId
}) {
  let game;

  try {
    game =
      Game.from(
        foundGame
      );
  } catch (error) {
    throw new ApplicationError({
      code:
        ERROR_CODES.GAME_CANNOT_BE_LOADED,

      message:
        "保存済みDataをReplay可能なGameへ復元できませんでした。",

      cause:
        error,

      details: {
        expectedGameId
      }
    });
  }

  if (
    game.gameId !== expectedGameId
  ) {
    throw new ApplicationError({
      code:
        ERROR_CODES.GAME_CANNOT_BE_LOADED,

      message:
        "取得したGameのIDが要求したIDと一致しません。",

      details: {
        expectedGameId,

        receivedGameId:
          game.gameId
      }
    });
  }

  if (
    !Array.isArray(
      game.moves
    ) ||
    game.moves.length === 0
  ) {
    throw new ApplicationError({
      code:
        ERROR_CODES.GAME_CANNOT_BE_LOADED,

      message:
        "取得したGameにReplay可能な指し手がありません。",

      details: {
        gameId:
          game.gameId
      }
    });
  }

  return game;
}