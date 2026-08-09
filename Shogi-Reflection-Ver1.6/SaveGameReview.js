import {
  APPLICATION_ERROR_CODES,
  ApplicationError
} from "./ApplicationErrors.js";
import { SystemClock } from "./Clock.js";
import { GameReview } from "./GameReview.js";
import { assertGameReviewRepository } from "./GameReviewRepository.js";
import { deepFreeze } from "./Immutable.js";
import { RepositoryError } from "./RepositoryErrors.js";

export class SaveGameReview {
  constructor({ repository, clock = new SystemClock() } = {}) {
    this.repository = assertGameReviewRepository(repository);
    if (!clock || typeof clock.now !== "function") throw new TypeError("clock.nowが必要です。");
    this.clock = clock;
  }

  execute({ gameReview } = {}) {
    if (!(gameReview instanceof GameReview)) {
      throw new ApplicationError(
        APPLICATION_ERROR_CODES.INVALID_GAME_REVIEW,
        "正式なGameReview Domain Entityを指定してください。"
      );
    }

    try {
      const existing = this.repository.findById(gameReview.reviewId);
      const isUpdate = Boolean(existing);
      const now = this.clock.now();
      const entityWithMetadata = new GameReview({
        ...gameReview.toSnapshot(),
        createdAt: existing?.createdAt ?? gameReview.createdAt ?? now,
        updatedAt: now
      });
      const saved = this.repository.save(entityWithMetadata);
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
