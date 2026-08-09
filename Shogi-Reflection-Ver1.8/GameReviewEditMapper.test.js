import test from "node:test";
import assert from "node:assert/strict";
import { GameReviewEditMapper } from "./GameReviewEditMapper.js";
import { createGameReview } from "./TestFixtures.js";

const mapper = new GameReviewEditMapper();

test("保存済みSnapshotを同じReview IDの編集Form Dataへ変換する", () => {
  const source = createGameReview().toSnapshot();
  const input = mapper.toFormInput(source);

  assert.equal(input.reviewId, source.reviewId);
  assert.equal(input.kifuText, source.kifuText);
  assert.equal(input.keyPositions.length, 3);
  assert.equal(input.keyPositions[0].keyPositionId, source.keyPositions[0].keyPositionId);
  assert.deepEqual(input.actionRules, source.actionRules);
  assert.match(input.gameDate, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  assert.equal(Object.isFrozen(input), true);
});

test("編集Form Dataを外部から変更できない", () => {
  const input = mapper.toFormInput(createGameReview().toSnapshot());
  assert.throws(() => input.actionRules.push("追加"), TypeError);
  assert.throws(() => { input.keyPositions[0].fact = "改変"; }, TypeError);
});
