import {
  APPLICATION_ERROR_CODES,
  ApplicationError
} from "./ApplicationErrors.js";
import { GameReview } from "./GameReview.js";
import { assertGameReviewRepository } from "./GameReviewRepository.js";
import { deepFreeze } from "./Immutable.js";
import { RepositoryError } from "./RepositoryErrors.js";

export class SaveGameReview {
  constructor({ repository } = {}) {
    this.repository = assertGameReviewRepository(repository);
  }

  execute({ gameReview } = {}) {
    if (!(gameReview instanceof GameReview)) {
      throw new ApplicationError(
        APPLICATION_ERROR_CODES.INVALID_GAME_REVIEW,
        "正式なGameReview Domain Entityを指定してください。"
      );
    }

    try {
      const isUpdate = this.repository.existsById(gameReview.reviewId);
      const saved = this.repository.save(gameReview);
      return deepFreeze({
        status: isUpdate ? "UPDATED" : "CREATED",
        repositoryRevision: this.repository.getRevision(),
        gameReview: saved.toSnapshot()
      });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      if (error instanceof RepositoryError) {
        throw new ApplicationError(
          APPLICATION_ERROR_CODES.SAVE_GAME_REVIEW_FAILED,
          "GameReviewの保存に失敗しました。",
          { repositoryErrorCode: error.code },
          { cause: error }
        );
      }
      throw error;
    }
  }
}
