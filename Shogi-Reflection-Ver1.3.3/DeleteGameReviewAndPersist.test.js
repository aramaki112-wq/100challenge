import test from "node:test";
import assert from "node:assert/strict";
import { DeleteGameReview } from "./DeleteGameReview.js";
import { DeleteGameReviewAndPersist } from "./DeleteGameReviewAndPersist.js";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { LocalStorageSnapshotStore } from "./LocalStorageSnapshotStore.js";
import { ReflectionPersistenceCoordinator } from "./ReflectionPersistenceCoordinator.js";
import { createGameReview, FixedClock, MemoryStorage } from "./TestFixtures.js";

function createSubject({ storage = new MemoryStorage(), revision = 3 } = {}) {
  const review = createGameReview();
  const repository = new InMemoryGameReviewRepository({ gameReviews: [review], revision });
  const clock = new FixedClock();
  const snapshotService = new GameReviewSnapshotService({ repository, clock });
  const snapshotStore = new LocalStorageSnapshotStore({ storage });
  const persistenceCoordinator = new ReflectionPersistenceCoordinator({ snapshotService, snapshotStore, clock });
  const subject = new DeleteGameReviewAndPersist({
    deleteGameReview: new DeleteGameReview({ repository }),
    snapshotService,
    persistenceCoordinator
  });
  return { subject, repository, storage, review };
}

test("削除成功時はRepositoryとBrowser保存Dataの両方から消す", () => {
  const { subject, repository, storage, review } = createSubject();
  const result = subject.execute({ reviewId: review.reviewId });

  assert.equal(result.status, "DELETED");
  assert.equal(repository.existsById(review.reviewId), false);
  const json = [...storage.map.values()][0];
  assert.equal(JSON.parse(json).gameReviews.length, 0);
});

test("存在しないReviewはRepository Revisionを変更せずNOT_FOUNDを返す", () => {
  const { subject, repository } = createSubject({ revision: 7 });
  const result = subject.execute({ reviewId: "REV-NOT-FOUND" });
  assert.equal(result.status, "NOT_FOUND");
  assert.equal(repository.getRevision(), 7);
});

test("Browser保存失敗時は削除前のRepository全体へRollbackする", () => {
  class FailingStorage extends MemoryStorage {
    setItem() { throw new Error("quota exceeded"); }
  }
  const { subject, repository, review } = createSubject({ storage: new FailingStorage(), revision: 11 });
  const result = subject.execute({ reviewId: review.reviewId });

  assert.equal(result.status, "DELETE_ROLLED_BACK");
  assert.equal(repository.existsById(review.reviewId), true);
  assert.equal(repository.getRevision(), 11);
  assert.equal(result.repositoryRevision, 11);
});
