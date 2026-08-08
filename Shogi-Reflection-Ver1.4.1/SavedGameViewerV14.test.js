import test from "node:test";
import assert from "node:assert/strict";
import { GameReviewLibraryPresenter, countKifMoves } from "./GameReviewLibraryPresenter.js";
import { createGameReview } from "./TestFixtures.js";

function snapshot(overrides = {}) {
  return createGameReview({
    reviewId: overrides.reviewId ?? "REV-V14-LIB",
    workflowStatus: overrides.workflowStatus,
    createdAt: "2026-08-08T09:00:00Z",
    updatedAt: "2026-08-08T10:00:00Z",
    ...overrides
  }).toSnapshot();
}

test("一覧はReplay Positionを生成せずKIF行から手数を要約する", () => {
  const text = "1 ７六歩(77)\n2 ３四歩(33)\n3 ２二角成(88)";
  assert.equal(countKifMoves(text), 3);
});

test("保存済み対局一覧に状態と保存更新日時を出す", () => {
  const presenter = new GameReviewLibraryPresenter();
  const view = presenter.presentList([snapshot({ workflowStatus: "REFLECTION_COMPLETE" })]);
  assert.equal(view.count, 1);
  assert.equal(view.items[0].workflowStatusLabel, "振り返り完了");
  assert.notEqual(view.items[0].createdAtLabel, "記録なし");
  assert.notEqual(view.items[0].updatedAtLabel, "記録なし");
});

test("旧SnapshotのStatus欠落時は内容から状態を推定する", () => {
  const presenter = new GameReviewLibraryPresenter();
  const legacy = { ...snapshot(), workflowStatus: undefined, reflectionComplete: undefined };
  const view = presenter.presentList([legacy]);
  assert.equal(view.items[0].workflowStatusLabel, "振り返り完了");
});

test("詳細Viewerは棋譜・重要局面・振り返り・次局接続を返す", () => {
  const detail = new GameReviewLibraryPresenter().presentDetail(snapshot({ workflowStatus: "REFLECTION_COMPLETE" }));
  assert.ok(detail.kifuText);
  assert.equal(detail.keyPositions.length, 3);
  assert.ok(detail.gameStory);
  assert.ok(detail.observationTheme);
  assert.equal(detail.actionRules.length, 2);
});
