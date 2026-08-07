import test from "node:test";
import assert from "node:assert/strict";
import { AddCurrentPositionToKeyPosition } from "./AddCurrentPositionToKeyPosition.js";
import { GameReviewFormMapper } from "./GameReviewFormMapper.js";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { SaveGameReview } from "./SaveGameReview.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";

function setup(fileName = "replay-basic.kif") {
  const text = replayFixture(fileName);
  const history = new PositionHistoryBuilder().build(new KifParser().parse({ text }));
  const replay = new ShogiReplayApplicationService(); replay.load(history);
  return { text, history, replay };
}
function completed(candidate, id = "KP-1") {
  return { ...candidate, keyPositionId: id, title: `局面${id}`, fact: "盤上で駒が動いた。", interpretation: "攻めを急ぎたくなった。", hypothesis: "相手の狙いを確認できた可能性がある。" };
}
function form(text, keyPositions) {
  return { reviewId: "REV-INTEGRATION", gameDate: "2026-08-02T20:00", side: "SENTE", result: "LOSS", kifuText: text,
    gameStory: "振り返り", keyPositions, decisionPattern: "確認省略", observationTheme: "相手の狙い", actionRules: ["候補手を二つ"], note: "" };
}

test("KIF Import相当の未保存Formから重要局面を追加できる", () => {
  const { text, replay } = setup(); replay.jump(1);
  assert.equal(new AddCurrentPositionToKeyPosition().execute({ replayState: replay.getState(), existingKeyPositions: [], sourceGameId: "REV-INTEGRATION", sourceKifText: text }).moveNumber, 1);
});
test("任意手数Jump後の局面を追加できる", () => {
  const { text, replay } = setup(); replay.jump(4);
  assert.equal(new AddCurrentPositionToKeyPosition().execute({ replayState: replay.getState(), existingKeyPositions: [], sourceGameId: "REV-INTEGRATION", sourceKifText: text }).candidate.moveNumber, 4);
});
test("前へ戻った局面を追加できる", () => {
  const { text, replay } = setup(); replay.last(); replay.previous();
  assert.equal(new AddCurrentPositionToKeyPosition().execute({ replayState: replay.getState(), existingKeyPositions: [], sourceGameId: "REV-INTEGRATION", sourceKifText: text }).candidate.moveNumber, 4);
});
test("盤面反転中でも正しいSnapshotを追加できる", () => {
  const { text, replay } = setup(); replay.jump(3); replay.toggleFlip();
  const candidate = new AddCurrentPositionToKeyPosition().execute({ replayState: replay.getState(), existingKeyPositions: [], sourceGameId: "REV-INTEGRATION", sourceKifText: text }).candidate;
  assert.deepEqual(candidate.replayReference.snapshot.currentPosition.lastMoveTo, { file: 2, rank: 2 });
});
test("成駒を含むSnapshotを保存できる", () => {
  const { text, replay } = setup(); replay.jump(3);
  const candidate = new AddCurrentPositionToKeyPosition().execute({ replayState: replay.getState(), existingKeyPositions: [], sourceGameId: "REV-INTEGRATION", sourceKifText: text }).candidate;
  assert.equal(candidate.replayReference.snapshot.currentPosition.board.pieces.find((p) => p.square.file === 2 && p.square.rank === 2).promoted, true);
});
test("持ち駒を含むSnapshotを保存できる", () => {
  const { text, replay } = setup(); replay.jump(3);
  const candidate = new AddCurrentPositionToKeyPosition().execute({ replayState: replay.getState(), existingKeyPositions: [], sourceGameId: "REV-INTEGRATION", sourceKifText: text }).candidate;
  assert.equal(candidate.replayReference.snapshot.currentPosition.senteHand.counts.BISHOP, 1);
});
test("3件の候補を完成させGameReviewとして保存できる", () => {
  const { text, replay } = setup(); const add = new AddCurrentPositionToKeyPosition(); const positions = [];
  for (const move of [1,3,5]) { replay.jump(move); positions.push(completed(add.execute({ replayState: replay.getState(), existingKeyPositions: positions, sourceGameId: "REV-INTEGRATION", sourceKifText: text }).candidate, `KP-${positions.length + 1}`)); }
  const entity = new GameReviewFormMapper().toEntity(form(text, positions)); const repo = new InMemoryGameReviewRepository();
  new SaveGameReview({ repository: repo }).execute({ gameReview: entity }); assert.equal(repo.findAll().length, 1);
});
test("保存後にSnapshotを再読込できる", () => {
  const { text, replay } = setup(); replay.jump(3); const add = new AddCurrentPositionToKeyPosition();
  const first = completed(add.execute({ replayState: replay.getState(), existingKeyPositions: [], sourceGameId: "REV-INTEGRATION", sourceKifText: text }).candidate);
  const entity = new GameReviewFormMapper().toEntity(form(text, [first, completed({ ...first, moveNumber: 4, replayReference: null }, "KP-2"), completed({ ...first, moveNumber: 5, replayReference: null }, "KP-3")]));
  const source = new InMemoryGameReviewRepository(); source.save(entity); const json = new GameReviewSnapshotService({ repository: source }).createJson();
  const target = new InMemoryGameReviewRepository(); new GameReviewSnapshotService({ repository: target }).restoreJson(json);
  assert.equal(target.findAll()[0].keyPositions[0].replayReference.moveNumber, 3);
});
test("Warning付き局面を方針どおり候補化できる", () => {
  const { text, replay } = setup("replay-partial-invalid.kif"); replay.jump(1);
  assert.ok(new AddCurrentPositionToKeyPosition().execute({ replayState: replay.getState(), existingKeyPositions: [], sourceGameId: "REV-INTEGRATION", sourceKifText: text }).candidate.replayReference.replayWarning);
});
test("Replay失敗手数以降へJumpできない", () => {
  const { replay, history } = setup("replay-partial-invalid.kif");
  assert.throws(() => replay.jump(history.maxMoveNumber + 1));
});
test("追加後もReplay Stateを変更しない", () => {
  const { text, replay } = setup(); replay.jump(3); const before = replay.getState();
  new AddCurrentPositionToKeyPosition().execute({ replayState: before, existingKeyPositions: [], sourceGameId: "REV-INTEGRATION", sourceKifText: text });
  assert.equal(replay.getState().currentMoveNumber, 3);
});
test("200回のSnapshot生成でもHistoryを再構築しない", () => {
  const { text, replay } = setup(); replay.jump(3); const state = replay.getState(); const add = new AddCurrentPositionToKeyPosition();
  for (let i = 0; i < 200; i += 1) add.execute({ replayState: state, existingKeyPositions: [], sourceGameId: `REV-${i}`, sourceKifText: text });
  assert.equal(replay.getState().history, state.history);
});
