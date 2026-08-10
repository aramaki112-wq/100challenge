import test from "node:test";
import assert from "node:assert/strict";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";

function history() {
  const parsed = new KifParser().parse({ text: replayFixture("replay-basic.kif") });
  return new PositionHistoryBuilder().build(parsed);
}

function loadedService() {
  const service = new ShogiReplayApplicationService();
  service.load(history());
  return service;
}

test("KIF Historyを読み込むと初期局面へ移動する", () => {
  assert.equal(loadedService().getState().currentMoveNumber, 0);
});

test("最初へ移動できる", () => {
  const service = loadedService();
  service.last();
  assert.equal(service.first().currentMoveNumber, 0);
});

test("前へ移動できる", () => {
  const service = loadedService();
  service.jump(3);
  assert.equal(service.previous().currentMoveNumber, 2);
});

test("次へ移動できる", () => {
  assert.equal(loadedService().next().currentMoveNumber, 1);
});

test("最後へ移動できる", () => {
  const service = loadedService();
  assert.equal(service.last().currentMoveNumber, service.history.maxMoveNumber);
});

test("任意手数へJumpできる", () => {
  assert.equal(loadedService().jump(3).position.moveNumber, 3);
});

test("範囲外Jumpを拒否できる", () => {
  assert.throws(
    () => loadedService().jump(99),
    (error) => error.code === "SHOGI_REPLAY_JUMP_OUT_OF_RANGE"
  );
});

test("小数Jumpを拒否できる", () => {
  assert.throws(
    () => loadedService().jump(1.5),
    (error) => error.code === "SHOGI_REPLAY_JUMP_OUT_OF_RANGE"
  );
});

test("初期局面では前へ進めない", () => {
  const service = loadedService();
  const state = service.previous();
  assert.equal(state.currentMoveNumber, 0);
  assert.equal(state.canPrevious, false);
});

test("最終局面では次へ進めない", () => {
  const service = loadedService();
  service.last();
  const state = service.next();
  assert.equal(state.currentMoveNumber, state.history.maxMoveNumber);
  assert.equal(state.canNext, false);
});

test("盤面反転状態を切り替えられる", () => {
  const service = loadedService();
  assert.equal(service.toggleFlip().flipped, true);
  assert.equal(service.toggleFlip().flipped, false);
});

test("新しいHistory読込時は反転を解除する", () => {
  const service = loadedService();
  service.toggleFlip();
  assert.equal(service.load(history()).flipped, false);
});

test("現在指し手と直前指し手を取得できる", () => {
  const service = loadedService();
  const state = service.jump(3);
  assert.equal(state.currentMove.notation, "２二角成(88)");
  assert.equal(state.previousMove.notation, "３四歩(33)");
});

test("直前Positionと現在Positionを取得できる", () => {
  const state = loadedService().jump(3);
  assert.equal(state.previousPosition.moveNumber, 2);
  assert.equal(state.position.moveNumber, 3);
});

test("Replay未読込の操作を拒否する", () => {
  const service = new ShogiReplayApplicationService();
  assert.throws(
    () => service.next(),
    (error) => error.code === "SHOGI_REPLAY_NOT_AVAILABLE"
  );
});

test("Replay操作はHistoryのPositionを変更しない", () => {
  const service = loadedService();
  const initial = service.history.at(0);
  service.last();
  service.first();
  assert.equal(service.history.at(0), initial);
});
