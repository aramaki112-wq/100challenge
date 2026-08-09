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

export class DeleteGameReview {
  constructor({ repository } = {}) {
    this.repository = assertGameReviewRepository(repository);
  }

  execute({ reviewId } = {}) {
    const id = requireReviewId(reviewId);
    try {
      const deleted = this.repository.deleteById(id);
      return deepFreeze({
        status: deleted ? "DELETED" : "NOT_FOUND",
        reviewId: id,
        repositoryRevision: this.repository.getRevision()
      });
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ApplicationError(
          APPLICATION_ERROR_CODES.DELETE_GAME_REVIEW_FAILED,
          "GameReviewの削除に失敗しました。",
          { reviewId: id, repositoryErrorCode: error.code },
          { cause: error }
        );
      }
      throw error;
    }
  }
}
