import test from "node:test";
import assert from "node:assert/strict";
import { ApplicationError } from "./ApplicationErrors.js";
import { DeleteGameReview } from "./DeleteGameReview.js";
import { GetGameReview } from "./GetGameReview.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { ListGameReviews } from "./ListGameReviews.js";
import { RepositoryError } from "./RepositoryErrors.js";
import { SaveGameReview } from "./SaveGameReview.js";
import { createGameReview } from "./TestFixtures.js";

test("SaveGameReviewは新規と更新を区別し変更不能Snapshotを返す", () => {
  const repository = new InMemoryGameReviewRepository();
  const service = new SaveGameReview({ repository });
  const created = service.execute({ gameReview: createGameReview() });
  const updated = service.execute({ gameReview: createGameReview({ note: "更新" }) });

  assert.equal(created.status, "CREATED");
  assert.equal(updated.status, "UPDATED");
  assert.equal(updated.repositoryRevision, 2);
  assert.throws(() => { updated.gameReview.note = "改ざん"; }, TypeError);
});

test("SaveGameReviewはDomain Entity以外を拒否する", () => {
  const service = new SaveGameReview({
    repository: new InMemoryGameReviewRepository()
  });
  assert.throws(
    () => service.execute({ gameReview: { reviewId: "REV-1" } }),
    (error) => error instanceof ApplicationError && error.code === "INVALID_GAME_REVIEW"
  );
});

test("GetGameReviewで保存済みReviewを取得できる", () => {
  const repository = new InMemoryGameReviewRepository();
  repository.save(createGameReview());
  const result = new GetGameReview({ repository }).execute({ reviewId: "REV-001" });
  assert.equal(result.status, "FOUND");
  assert.equal(result.gameReview.reviewId, "REV-001");
});

test("GetGameReviewは存在しないIDをApplication Errorにする", () => {
  const service = new GetGameReview({
    repository: new InMemoryGameReviewRepository()
  });
  assert.throws(
    () => service.execute({ reviewId: "NONE" }),
    (error) => error instanceof ApplicationError && error.code === "GAME_REVIEW_NOT_FOUND"
  );
});

test("ListGameReviewsは空と全件を区別する", () => {
  const repository = new InMemoryGameReviewRepository();
  const service = new ListGameReviews({ repository });
  assert.equal(service.execute().status, "EMPTY");
  repository.save(createGameReview());
  const result = service.execute();
  assert.equal(result.status, "FOUND");
  assert.equal(result.count, 1);
  assert.throws(() => { result.gameReviews.push({}); }, TypeError);
});

test("DeleteGameReviewは削除と未存在を区別する", () => {
  const repository = new InMemoryGameReviewRepository();
  repository.save(createGameReview());
  const service = new DeleteGameReview({ repository });
  assert.equal(service.execute({ reviewId: "REV-001" }).status, "DELETED");
  assert.equal(service.execute({ reviewId: "REV-001" }).status, "NOT_FOUND");
});

test("Repository ErrorをApplication Errorへ変換する", () => {
  const failingRepository = {
    save() { throw new RepositoryError("BROKEN", "broken"); },
    findById() { return null; },
    findAll() { return []; },
    deleteById() { return false; },
    existsById() { throw new RepositoryError("BROKEN", "broken"); },
    getRevision() { return 0; },
    replaceAll() {}
  };
  const service = new SaveGameReview({ repository: failingRepository });
  assert.throws(
    () => service.execute({ gameReview: createGameReview() }),
    (error) => error instanceof ApplicationError && error.code === "SAVE_GAME_REVIEW_FAILED"
  );
});
