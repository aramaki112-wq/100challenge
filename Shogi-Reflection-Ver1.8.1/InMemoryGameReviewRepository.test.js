import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { RepositoryError } from "./RepositoryErrors.js";
import { createGameReview } from "./TestFixtures.js";

test("InMemory Repositoryへ新規保存できる", () => {
  const repository = new InMemoryGameReviewRepository();
  const saved = repository.save(createGameReview());
  assert.equal(saved.reviewId, "REV-001");
  assert.equal(repository.existsById("REV-001"), true);
});

test("既存GameReviewを同じIDで更新保存できる", () => {
  const repository = new InMemoryGameReviewRepository();
  repository.save(createGameReview());
  repository.save(createGameReview({ note: "更新後" }));
  assert.equal(repository.findById("REV-001").note, "更新後");
  assert.equal(repository.findAll().length, 1);
});

test("IDによる取得は存在しない場合nullを返す", () => {
  const repository = new InMemoryGameReviewRepository();
  assert.equal(repository.findById("REV-NONE"), null);
});

test("全件一覧を取得できる", () => {
  const repository = new InMemoryGameReviewRepository();
  repository.save(createGameReview({ reviewId: "REV-001" }));
  repository.save(createGameReview({ reviewId: "REV-002" }));
  assert.deepEqual(
    repository.findAll().map((item) => item.reviewId),
    ["REV-001", "REV-002"]
  );
});

test("GameReviewを削除できる", () => {
  const repository = new InMemoryGameReviewRepository();
  repository.save(createGameReview());
  assert.equal(repository.deleteById("REV-001"), true);
  assert.equal(repository.existsById("REV-001"), false);
  assert.equal(repository.deleteById("REV-001"), false);
});

test("Repository Revisionは成功した変更ごとに更新する", () => {
  const repository = new InMemoryGameReviewRepository();
  assert.equal(repository.getRevision(), 0);
  repository.save(createGameReview());
  assert.equal(repository.getRevision(), 1);
  repository.save(createGameReview({ note: "更新" }));
  assert.equal(repository.getRevision(), 2);
  repository.deleteById("REV-NONE");
  assert.equal(repository.getRevision(), 2);
  repository.deleteById("REV-001");
  assert.equal(repository.getRevision(), 3);
});

test("保存元・取得結果・一覧からRepository内部Dataを変更できない", () => {
  const repository = new InMemoryGameReviewRepository();
  const source = createGameReview();
  repository.save(source);
  const found = repository.findById("REV-001");
  const all = repository.findAll();

  assert.throws(() => { found.note = "改ざん"; }, TypeError);
  assert.throws(() => { all.push(source); }, TypeError);
  assert.equal(repository.findById("REV-001").note, "Phase2 Test Data");
});

test("replaceAllは全件検証後に一括置換しRevisionを復元する", () => {
  const repository = new InMemoryGameReviewRepository();
  repository.save(createGameReview({ reviewId: "OLD" }));
  const result = repository.replaceAll({
    gameReviews: [
      createGameReview({ reviewId: "REV-010" }),
      createGameReview({ reviewId: "REV-011" })
    ],
    revision: 25
  });
  assert.deepEqual(result, { count: 2, revision: 25 });
  assert.equal(repository.existsById("OLD"), false);
  assert.equal(repository.getRevision(), 25);
});

test("replaceAllの重複ID Errorでは現在Dataを保持する", () => {
  const repository = new InMemoryGameReviewRepository();
  repository.save(createGameReview({ reviewId: "CURRENT" }));

  assert.throws(
    () => repository.replaceAll({
      gameReviews: [
        createGameReview({ reviewId: "DUP" }),
        createGameReview({ reviewId: "DUP" })
      ],
      revision: 10
    }),
    (error) => error instanceof RepositoryError && error.code === "DUPLICATE_REVIEW_ID"
  );

  assert.equal(repository.existsById("CURRENT"), true);
  assert.equal(repository.getRevision(), 1);
});
