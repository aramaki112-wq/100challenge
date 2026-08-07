import {
  ApplicationError,
  ERROR_CODES,
  isApplicationError,
  toApplicationError
} from "./errors.js";

import {
  Game,
  createGameSummary
} from "./Game.js";

import { assertGameParser } from "./GameParser.js";
import { assertGameRepository } from "./GameRepository.js";

/**
 * KIFを読み込み、
 * Gameを生成して保存するApplication Service。
 *
 * このClassは、次の具体的な技術を知らない。
 *
 * ・KIFをどのように解析するか
 * ・Gameをどこへ保存するか
 * ・Game IDをどの方法で作るか
 * ・現在時刻をどの方法で取得するか
 *
 * 必要なDependencyは、
 * Composition Rootから外側より渡される。
 */
export class ImportKifGame {
  constructor({
    gameParser,
    gameRepository,
    generateGameId,
    getCurrentTime
  } = {}) {
    this.gameParser = assertGameParser(gameParser);
    this.gameRepository = assertGameRepository(gameRepository);

    this.generateGameId = assertFunction({
      name: "generateGameId",
      value: generateGameId
    });

    this.getCurrentTime = assertFunction({
      name: "getCurrentTime",
      value: getCurrentTime
    });
  }

  /**
   * KIF Importを実行する。
   *
   * 成功条件：
   *
   * 1. Inputが有効
   * 2. KIF解析成功
   * 3. Game生成成功
   * 4. Repository保存成功
   */
  async execute({ rawKif } = {}) {
    const normalizedRawKif = normalizeRawKif(rawKif);
    const gameCandidate = await this.parseKif(normalizedRawKif);
    const gameId = this.createGameId();
    const currentTime = this.createCurrentTime();

    const game = createGame({
      gameId,
      gameCandidate,
      importedAt: currentTime,
      savedAt: currentTime
    });

    await this.saveGame(game);

    return {
      status: "success",
      game: game.clone(),
      summary: createGameSummary(game)
    };
  }

  async parseKif(rawKif) {
    try {
      const result = await this.gameParser.parse(rawKif);

      validateGameCandidate(result);

      return result;
    } catch (error) {
      if (isApplicationError(error)) {
        throw error;
      }

      throw new ApplicationError({
        code: ERROR_CODES.KIF_PARSE_FAILED,
        message: "KIFの解析中に予期しないErrorが発生しました。",
        cause: error
      });
    }
  }

  createGameId() {
    try {
      const gameId = this.generateGameId();

      if (
        typeof gameId !== "string" ||
        gameId.trim() === ""
      ) {
        throw new Error("生成されたGame IDが空です。");
      }

      return gameId.trim();
    } catch (error) {
      throw toApplicationError(error, {
        code: ERROR_CODES.KIF_IMPORT_FAILED,
        message: "Game IDを生成できませんでした。"
      });
    }
  }

  createCurrentTime() {
    try {
      const currentTime = this.getCurrentTime();

      if (
        typeof currentTime !== "string" ||
        currentTime.trim() === ""
      ) {
        throw new Error("取得した現在時刻が空です。");
      }

      return currentTime.trim();
    } catch (error) {
      throw toApplicationError(error, {
        code: ERROR_CODES.KIF_IMPORT_FAILED,
        message: "現在時刻を取得できませんでした。"
      });
    }
  }

  async saveGame(game) {
    try {
      await this.gameRepository.save(game);
    } catch (error) {
      if (isApplicationError(error)) {
        throw error;
      }

      throw new ApplicationError({
        code: ERROR_CODES.KIF_IMPORT_FAILED,
        message:
          "Gameを保存できなかったため、KIF Importを完了できませんでした。",
        cause: error
      });
    }
  }
}

function normalizeRawKif(rawKif) {
  if (typeof rawKif !== "string") {
    throw new ApplicationError({
      code: ERROR_CODES.INVALID_KIF_INPUT,
      message: "KIFは文字列で入力してください。",
      details: {
        receivedType: typeof rawKif
      }
    });
  }

  const normalized = rawKif.trim();

  if (normalized === "") {
    throw new ApplicationError({
      code: ERROR_CODES.INVALID_KIF_INPUT,
      message: "KIFが入力されていません。"
    });
  }

  return normalized;
}

function validateGameCandidate(candidate) {
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    Array.isArray(candidate)
  ) {
    throw new ApplicationError({
      code: ERROR_CODES.KIF_PARSE_FAILED,
      message: "Parserから有効なGame Candidateが返されませんでした。",
      details: {
        candidate
      }
    });
  }

  if (
    candidate.metadata === null ||
    typeof candidate.metadata !== "object" ||
    Array.isArray(candidate.metadata)
  ) {
    throw new ApplicationError({
      code: ERROR_CODES.KIF_PARSE_FAILED,
      message: "Parser Resultにmetadataがありません。"
    });
  }

  if (
    !Array.isArray(candidate.moves) ||
    candidate.moves.length === 0
  ) {
    throw new ApplicationError({
      code: ERROR_CODES.KIF_PARSE_FAILED,
      message: "Parser Resultに有効な指し手がありません。",
      details: {
        moveCount: Array.isArray(candidate.moves)
          ? candidate.moves.length
          : null
      }
    });
  }

  if (
    candidate.source === null ||
    typeof candidate.source !== "object" ||
    Array.isArray(candidate.source)
  ) {
    throw new ApplicationError({
      code: ERROR_CODES.KIF_PARSE_FAILED,
      message: "Parser Resultにsourceがありません。"
    });
  }
}

function createGame({
  gameId,
  gameCandidate,
  importedAt,
  savedAt
}) {
  try {
    return new Game({
      gameId,
      metadata: gameCandidate.metadata,
      moves: gameCandidate.moves,
      source: gameCandidate.source,
      importedAt,
      savedAt
    });
  } catch (error) {
    throw new ApplicationError({
      code: ERROR_CODES.KIF_IMPORT_FAILED,
      message: "解析結果からGameを生成できませんでした。",
      cause: error,
      details: {
        gameId,
        moveCount: Array.isArray(gameCandidate.moves)
          ? gameCandidate.moves.length
          : null
      }
    });
  }
}

function assertFunction({ name, value }) {
  if (typeof value !== "function") {
    throw new ApplicationError({
      code: ERROR_CODES.APPLICATION_INITIALIZATION_FAILED,
      message: `${name}にはFunctionを指定してください。`,
      details: {
        name,
        receivedType: typeof value
      }
    });
  }

  return value;
}