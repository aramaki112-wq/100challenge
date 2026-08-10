import test from "node:test";
import assert from "node:assert/strict";
import {
  GameReviewSnapshotService,
  SHOGI_REFLECTION_APPLICATION_ID,
  SHOGI_REFLECTION_SCHEMA_VERSION
} from "./GameReviewSnapshotService.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { PersistenceError } from "./PersistenceErrors.js";
import {
  createGameReview,
  FixedClock
} from "./TestFixtures.js";

function createService(repository = new InMemoryGameReviewRepository()) {
  return new GameReviewSnapshotService({
    repository,
    clock: new FixedClock("2026-08-02T12:30:00+09:00")
  });
}

function validSnapshot(overrides = {}) {
  const source = new InMemoryGameReviewRepository();
  source.save(createGameReview());
  return {
    ...createService(source).createSnapshot(),
    ...overrides
  };
}

test("Version付きSnapshotへ全GameReview DataをExportできる", () => {
  const repository = new InMemoryGameReviewRepository();
  repository.save(createGameReview());
  const snapshot = createService(repository).createSnapshot();

  assert.equal(snapshot.applicationId, SHOGI_REFLECTION_APPLICATION_ID);
  assert.equal(snapshot.schemaVersion, SHOGI_REFLECTION_SCHEMA_VERSION);
  assert.equal(snapshot.repositoryRevision, 1);
  assert.equal(snapshot.gameReviews.length, 1);
  assert.equal(snapshot.gameReviews[0].keyPositions.length, 3);
  assert.equal(snapshot.gameReviews[0].observationTheme.includes("相手"), true);
  assert.equal(snapshot.gameReviews[0].actionRules.length, 2);
  assert.equal("readyForNextGame" in snapshot.gameReviews[0], false);
});

test("SnapshotからRepository全体を復元できる", () => {
  const target = new InMemoryGameReviewRepository();
  const result = createService(target).restoreSnapshot(validSnapshot());
  assert.equal(result.status, "RESTORED");
  assert.equal(target.findAll().length, 1);
  assert.equal(target.getRevision(), 1);
});

test("壊れたJSONを拒否する", () => {
  const service = createService();
  assert.throws(
    () => service.restoreJson("{broken"),
    (error) => error instanceof PersistenceError && error.code === "INVALID_SNAPSHOT_JSON"
  );
});

test("Application ID不一致を拒否する", () => {
  const service = createService();
  assert.throws(
    () => service.restoreSnapshot(validSnapshot({ applicationId: "OTHER_APP" })),
    (error) => error instanceof PersistenceError && error.code === "INVALID_APPLICATION_ID"
  );
});

test("未対応Schema Versionを拒否する", () => {
  const service = createService();
  assert.throws(
    () => service.restoreSnapshot(validSnapshot({ schemaVersion: 999 })),
    (error) => error instanceof PersistenceError && error.code === "UNSUPPORTED_SCHEMA_VERSION"
  );
});

test("GameReview ID重複を拒否する", () => {
  const snapshot = validSnapshot();
  snapshot.gameReviews = [snapshot.gameReviews[0], snapshot.gameReviews[0]];
  assert.throws(
    () => createService().restoreSnapshot(snapshot),
    (error) => error instanceof PersistenceError && error.code === "DUPLICATE_GAME_REVIEW_ID"
  );
});

test("Domain Rule違反Dataを拒否する", () => {
  const snapshot = validSnapshot();
  snapshot.gameReviews = [{ ...snapshot.gameReviews[0], kifuText: "" }];
  assert.throws(
    () => createService().restoreSnapshot(snapshot),
    (error) => error instanceof PersistenceError && error.code === "DOMAIN_RULE_VIOLATION"
  );
});

test("KeyPosition ID重複を不整合として拒否する", () => {
  const snapshot = validSnapshot();
  const review = snapshot.gameReviews[0];
  snapshot.gameReviews = [{
    ...review,
    keyPositions: [
      review.keyPositions[0],
      { ...review.keyPositions[1], keyPositionId: review.keyPositions[0].keyPositionId },
      review.keyPositions[2]
    ]
  }];
  assert.throws(
    () => createService().restoreSnapshot(snapshot),
    (error) => error instanceof PersistenceError && error.code === "DUPLICATE_KEY_POSITION_ID"
  );
});

test("必須項目不足を拒否する", () => {
  const snapshot = validSnapshot();
  const review = { ...snapshot.gameReviews[0] };
  delete review.reviewId;
  snapshot.gameReviews = [review];
  assert.throws(
    () => createService().restoreSnapshot(snapshot),
    (error) => error instanceof PersistenceError && error.code === "DOMAIN_RULE_VIOLATION"
  );
});

test("復元失敗時に現在DataとRevisionを保持する", () => {
  const target = new InMemoryGameReviewRepository();
  target.save(createGameReview({ reviewId: "CURRENT" }));
  const beforeRevision = target.getRevision();
  const snapshot = validSnapshot();
  snapshot.gameReviews = [{ ...snapshot.gameReviews[0], side: "INVALID" }];

  assert.throws(() => createService(target).restoreSnapshot(snapshot));
  assert.equal(target.existsById("CURRENT"), true);
  assert.equal(target.findAll().length, 1);
  assert.equal(target.getRevision(), beforeRevision);
});
