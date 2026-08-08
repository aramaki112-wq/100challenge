import test from "node:test";
import assert from "node:assert/strict";
import { GameReviewLibraryPresenter } from "./GameReviewLibraryPresenter.js";
import { createGameReview } from "./TestFixtures.js";

const presenter = new GameReviewLibraryPresenter();

test("保存済みGameReviewを対局日時の新しい順へ表示整形する", () => {
  const older = createGameReview({ reviewId: "REV-OLD", gameDate: "2026-07-01T10:00:00+09:00" }).toSnapshot();
  const newer = createGameReview({ reviewId: "REV-NEW", gameDate: "2026-08-02T10:00:00+09:00", result: "WIN" }).toSnapshot();
  const result = presenter.presentList([older, newer]);

  assert.equal(result.status, "FOUND");
  assert.equal(result.count, 2);
  assert.deepEqual(result.items.map((item) => item.reviewId), ["REV-NEW", "REV-OLD"]);
  assert.equal(result.items[0].resultLabel, "勝ち");
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.items), true);
});

test("空一覧はEMPTY表示Modelになる", () => {
  assert.deepEqual(presenter.presentList([]), { status: "EMPTY", count: 0, items: [] });
});

test("詳細表示ModelはFACT・INTERPRETATION・HYPOTHESISを欠落させない", () => {
  const detail = presenter.presentDetail(createGameReview().toSnapshot());
  assert.equal(detail.keyPositions.length, 3);
  assert.match(detail.keyPositions[0].fact, /駒がぶつかった/);
  assert.match(detail.keyPositions[0].interpretation, /攻めを急ぎ/);
  assert.match(detail.keyPositions[0].hypothesis, /相手の受け/);
  assert.equal(detail.readyForNextGame, true);
});
