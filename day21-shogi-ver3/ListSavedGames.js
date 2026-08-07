import {
  ApplicationError,
  ERROR_CODES,
  isApplicationError
} from "./errors.js";

import {
  assertGameSummaryReadModel
} from "./GameSummaryReadModel.js";

/**
 * 保存済みGameのSummary一覧を取得するApplication Service。
 *
 * 責任：
 *
 * ・Summary一覧を取得する
 * ・保存日時の新しい順へ並べる
 * ・Empty Stateを判断する
 *
 * 一覧をHTMLへ描画する責任は持たない。
 */
export class ListSavedGames {
  constructor({
    gameSummaryReadModel
  } = {}) {
    this.gameSummaryReadModel =
      assertGameSummaryReadModel(
        gameSummaryReadModel
      );
  }

  /**
   * 保存済みGame一覧を取得する。
   *
   * @returns {Promise<{
   *   status: "success"|"empty",
   *   games: object[]
   * }>}
   */
  async execute() {
    let summaries;

    try {
      summaries =
        await this.gameSummaryReadModel.findAllSummaries();
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
          ERROR_CODES.UNKNOWN_APPLICATION_ERROR,

        message:
          "保存済みGame一覧の取得中に予期しないErrorが発生しました。",

        cause:
          error
      });
    }

    validateSummaryArray(
      summaries
    );

    const sortedGames =
      [...summaries]
        .map(
          cloneSummary
        )
        .sort(
          compareBySavedAtDescending
        );

    if (
      sortedGames.length === 0
    ) {
      return {
        status:
          "empty",

        games: []
      };
    }

    return {
      status:
        "success",

      games:
        sortedGames
    };
  }
}

/**
 * Summary一覧を確認する。
 */
function validateSummaryArray(
  summaries
) {
  if (
    !Array.isArray(
      summaries
    )
  ) {
    throw new ApplicationError({
      code:
        ERROR_CODES.GAME_MAPPING_FAILED,

      message:
        "保存済みGame一覧が配列ではありません。",

      details: {
        receivedType:
          typeof summaries
      }
    });
  }

  summaries.forEach(
    (
      summary,
      index
    ) => {
      validateSummary({
        summary,
        index
      });
    }
  );
}

/**
 * 一件のSummaryを確認する。
 */
function validateSummary({
  summary,
  index
}) {
  if (
    summary === null ||
    typeof summary !== "object" ||
    Array.isArray(summary)
  ) {
    throw createSummaryError({
      message:
        "Game SummaryがObjectではありません。",

      index,
      summary
    });
  }

  assertRequiredString({
    name:
      "gameId",

    value:
      summary.gameId,

    index
  });

  assertRequiredString({
    name:
      "title",

    value:
      summary.title,

    index
  });

  assertRequiredString({
    name:
      "senteName",

    value:
      summary.senteName,

    index
  });

  assertRequiredString({
    name:
      "goteName",

    value:
      summary.goteName,

    index
  });

  assertRequiredString({
    name:
      "savedAt",

    value:
      summary.savedAt,

    index
  });

  if (
    summary.playedAt !== null &&
    typeof summary.playedAt !== "string"
  ) {
    throw createSummaryError({
      message:
        "playedAtは文字列またはnullである必要があります。",

      index,
      summary
    });
  }

  if (
    !Number.isInteger(
      summary.moveCount
    ) ||
    summary.moveCount < 1
  ) {
    throw createSummaryError({
      message:
        "moveCountは1以上の整数である必要があります。",

      index,
      summary
    });
  }

  if (
    Number.isNaN(
      Date.parse(
        summary.savedAt
      )
    )
  ) {
    throw createSummaryError({
      message:
        "savedAtを日時として読み取れません。",

      index,
      summary
    });
  }
}

/**
 * 保存日時の新しい順へ並べる。
 */
function compareBySavedAtDescending(
  first,
  second
) {
  const firstTime =
    Date.parse(
      first.savedAt
    );

  const secondTime =
    Date.parse(
      second.savedAt
    );

  return (
    secondTime -
    firstTime
  );
}

/**
 * 呼出し元へ内部参照を渡さないため、
 * SummaryをCloneする。
 */
function cloneSummary(
  summary
) {
  return {
    gameId:
      summary.gameId,

    title:
      summary.title,

    senteName:
      summary.senteName,

    goteName:
      summary.goteName,

    playedAt:
      summary.playedAt,

    savedAt:
      summary.savedAt,

    moveCount:
      summary.moveCount
  };
}

/**
 * 必須文字列を確認する。
 */
function assertRequiredString({
  name,
  value,
  index
}) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw createSummaryError({
      message:
        `${name}は空ではない文字列である必要があります。`,

      index,

      summary: {
        [name]:
          value
      }
    });
  }
}

/**
 * Summary用Errorを生成する。
 */
function createSummaryError({
  message,
  index,
  summary
}) {
  return new ApplicationError({
    code:
      ERROR_CODES.GAME_MAPPING_FAILED,

    message,

    details: {
      summaryIndex:
        index,

      gameId:
        summary &&
        typeof summary === "object"
          ? summary.gameId ?? null
          : null
    }
  });
}