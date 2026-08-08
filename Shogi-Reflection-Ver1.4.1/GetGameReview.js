import {
  APPLICATION_ERROR_CODES,
  ApplicationError
} from "./ApplicationErrors.js";
import { assertGameReviewRepository } from "./GameReviewRepository.js";
import { deepFreeze } from "./Immutable.js";
import { RepositoryError } from "./RepositoryErrors.js";

function requireReviewId(reviewId) {
  if (typeof reviewId !== "string" || reviewId.trim() === "") {
    throw new ApplicationError(
      APPLICATION_ERROR_CODES.INVALID_REVIEW_ID,
      "reviewIdは必須です。"
    );
  }
  return reviewId.trim();
}

export class GetGameReview {
  constructor({ repository } = {}) {
    this.repository = assertGameReviewRepository(repository);
  }

  execute({ reviewId } = {}) {
    const id = requireReviewId(reviewId);
    try {
      const found = this.repository.findById(id);
      if (!found) {
        throw new ApplicationError(
          APPLICATION_ERROR_CODES.GAME_REVIEW_NOT_FOUND,
          "指定したGameReviewが見つかりません。",
          { reviewId: id }
        );
      }
      return deepFreeze({
        status: "FOUND",
        gameReview: found.toSnapshot()
      });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      if (error instanceof RepositoryError) {
        throw new ApplicationError(
          APPLICATION_ERROR_CODES.GET_GAME_REVIEW_FAILED,
          "GameReviewの取得に失敗しました。",
          { reviewId: id, repositoryErrorCode: error.code },
          { cause: error }
        );
      }
      throw error;
    }
  }
}
