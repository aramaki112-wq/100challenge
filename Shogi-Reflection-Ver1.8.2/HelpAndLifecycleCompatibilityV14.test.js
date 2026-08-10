import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { FixedClock, createGameReview } from "./TestFixtures.js";

const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("./style.css", import.meta.url), "utf8");

test("取扱説明書をHeaderから開ける", () => {
  assert.match(html, /id="nav-help"[^>]*>使い方</);
  assert.match(html, /id="help-view"/);
});

test("主要Help Sectionが揃っている", () => {
  for (const id of ["help-purpose", "help-kif", "help-save", "help-library", "help-replay", "help-key-position", "help-reflection", "help-next", "help-report", "help-backup"]) {
    assert.ok(html.includes(`id="${id}"`), id);
  }
});

test("各主要StepからContext Helpへ移動できる", () => {
  for (const target of ["help-kif", "help-save", "help-replay", "help-key-position", "help-reflection", "help-next", "help-report"]) {
    assert.ok(html.includes(`data-help-target="${target}"`), target);
  }
});

test("390px前後のSmartphone Layout Ruleを持つ", () => {
  assert.match(css, /@media \(max-width:800px\)/);
  assert.match(css, /step-navigation/);
  assert.match(css, /review-list-card/);
  assert.match(css, /replay-piece/);
});

test("Ver1.3.3相当のStatusなしBackupを復元できる", () => {
  const repository = new InMemoryGameReviewRepository();
  const service = new GameReviewSnapshotService({ repository, clock: new FixedClock() });
  const legacyReview = createGameReview().toSnapshot();
  const { workflowStatus, createdAt, updatedAt, reflectionComplete, readyForNextGame, missingReflectionItems, ...legacy } = legacyReview;
  const backup = {
    applicationId: "SHOGI_REFLECTION_INTERLUDE",
    schemaVersion: 1,
    exportedAt: "2026-08-02T03:00:00.000Z",
    repositoryRevision: 1,
    gameReviews: [legacy]
  };
  const result = service.restoreJson(JSON.stringify(backup));
  assert.equal(result.count, 1);
  assert.equal(repository.findById(legacy.reviewId).workflowStatus, "REFLECTION_COMPLETE");
});

test("新しいLifecycle DataもschemaVersion 1 Backupへ含まれる", () => {
  const repository = new InMemoryGameReviewRepository({ gameReviews: [createGameReview({ workflowStatus: "REFLECTION_COMPLETE", createdAt: "2026-08-08T09:00:00Z", updatedAt: "2026-08-08T10:00:00Z" })], revision: 1 });
  const snapshot = new GameReviewSnapshotService({ repository, clock: new FixedClock() }).createSnapshot();
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.gameReviews[0].workflowStatus, "REFLECTION_COMPLETE");
  assert.equal(snapshot.gameReviews[0].createdAt, "2026-08-08T09:00:00.000Z");
});
