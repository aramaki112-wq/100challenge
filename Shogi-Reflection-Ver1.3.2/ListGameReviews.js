import {
  APPLICATION_ERROR_CODES,
  ApplicationError
} from "./ApplicationErrors.js";
import { assertGameReviewRepository } from "./GameReviewRepository.js";
import { deepFreeze } from "./Immutable.js";
import { RepositoryError } from "./RepositoryErrors.js";

export class ListGameReviews {
  constructor({ repository } = {}) {
    this.repository = assertGameReviewRepository(repository);
  }

  execute() {
    try {
      const gameReviews = this.repository.findAll().map((item) => item.toSnapshot());
      return deepFreeze({
        status: gameReviews.length === 0 ? "EMPTY" : "FOUND",
        count: gameReviews.length,
        repositoryRevision: this.repository.getRevision(),
        gameReviews
      });
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ApplicationError(
          APPLICATION_ERROR_CODES.LIST_GAME_REVIEWS_FAILED,
          "GameReview一覧の取得に失敗しました。",
          { repositoryErrorCode: error.code },
          { cause: error }
        );
      }
      throw error;
    }
  }
}
