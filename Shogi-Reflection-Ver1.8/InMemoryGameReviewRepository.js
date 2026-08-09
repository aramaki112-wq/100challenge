import { GameReview } from "./GameReview.js";
import { GameReviewRepository } from "./GameReviewRepository.js";
import {
  REPOSITORY_ERROR_CODES,
  RepositoryError
} from "./RepositoryErrors.js";

function requireReviewId(reviewId) {
  if (typeof reviewId !== "string" || reviewId.trim() === "") {
    throw new RepositoryError(
      REPOSITORY_ERROR_CODES.INVALID_REVIEW_ID,
      "reviewIdは空にできません。",
      { reviewId }
    );
  }
  return reviewId.trim();
}

function requireGameReview(gameReview) {
  if (!(gameReview instanceof GameReview)) {
    throw new RepositoryError(
      REPOSITORY_ERROR_CODES.INVALID_REVIEW_ENTITY,
      "GameReview Domain Entityだけを保存できます。"
    );
  }
  return gameReview;
}

function cloneGameReview(gameReview) {
  return new GameReview(gameReview.toSnapshot());
}

function requireRevision(revision) {
  if (!Number.isInteger(revision) || revision < 0) {
    throw new RepositoryError(
      REPOSITORY_ERROR_CODES.INVALID_REPOSITORY_REVISION,
      "Repository Revisionは0以上の整数である必要があります。",
      { revision }
    );
  }
  return revision;
}

export class InMemoryGameReviewRepository extends GameReviewRepository {
  #items = new Map();
  #revision = 0;

  constructor({ gameReviews = [], revision = 0 } = {}) {
    super();
    this.replaceAll({ gameReviews, revision });
  }

  save(gameReview) {
    const entity = requireGameReview(gameReview);
    const stored = cloneGameReview(entity);
    this.#items.set(stored.reviewId, stored);
    this.#revision += 1;
    return cloneGameReview(stored);
  }

  findById(reviewId) {
    const id = requireReviewId(reviewId);
    const found = this.#items.get(id);
    return found ? cloneGameReview(found) : null;
  }

  findAll() {
    return Object.freeze(
      [...this.#items.values()].map((item) => cloneGameReview(item))
    );
  }

  deleteById(reviewId) {
    const id = requireReviewId(reviewId);
    const deleted = this.#items.delete(id);
    if (deleted) this.#revision += 1;
    return deleted;
  }

  existsById(reviewId) {
    const id = requireReviewId(reviewId);
    return this.#items.has(id);
  }

  getRevision() {
    return this.#revision;
  }

  replaceAll({ gameReviews, revision }) {
    if (!Array.isArray(gameReviews)) {
      throw new RepositoryError(
        REPOSITORY_ERROR_CODES.INVALID_REVIEW_ENTITY,
        "gameReviewsは配列で入力してください。"
      );
    }

    const nextRevision = requireRevision(revision);
    const nextItems = new Map();

    for (const gameReview of gameReviews) {
      const entity = requireGameReview(gameReview);
      const clone = cloneGameReview(entity);
      if (nextItems.has(clone.reviewId)) {
        throw new RepositoryError(
          REPOSITORY_ERROR_CODES.DUPLICATE_REVIEW_ID,
          "同じreviewIdを二重登録できません。",
          { reviewId: clone.reviewId }
        );
      }
      nextItems.set(clone.reviewId, clone);
    }

    // 全件検証が完了してから内部Stateを差し替える。
    this.#items = nextItems;
    this.#revision = nextRevision;
    return Object.freeze({ count: nextItems.size, revision: this.#revision });
  }
}
