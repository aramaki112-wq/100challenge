import test from "node:test";
import assert from "node:assert/strict";
import { KeyPositionReplayViewModel } from "./KeyPositionReplayViewModel.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { ReplayPositionSnapshotFactory } from "./ReplayPositionSnapshotFactory.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";

function snapshot(move = 3, fixture = "replay-basic.kif") {
  const text = replayFixture(fixture);
  const history = new PositionHistoryBuilder().build(new KifParser().parse({ text }));
  const service = new ShogiReplayApplicationService(); service.load(history); service.jump(Math.min(move, history.maxMoveNumber));
  return new ReplayPositionSnapshotFactory().create({ replayState: service.getState() });
}

test("現在手数を表示できる", () => assert.equal(new KeyPositionReplayViewModel().create(snapshot()).moveNumber, 3));
test("現在指し手を表示できる", () => assert.equal(new KeyPositionReplayViewModel().create(snapshot()).currentMove, "２二角成(88)"));
test("直前指し手を表示できる", () => assert.equal(new KeyPositionReplayViewModel().create(snapshot()).previousMove, "３四歩(33)"));
test("Snapshotありの盤面Preview Dataを生成できる", () => assert.equal(new KeyPositionReplayViewModel().create(snapshot()).squares.length, 81));
test("持ち駒表示Dataを生成できる", () => assert.equal(new KeyPositionReplayViewModel().create(snapshot()).senteHand[0].label, "角"));
test("成駒表示Dataを生成できる", () => assert.equal(new KeyPositionReplayViewModel().create(snapshot()).squares.find((s) => s.key === "22").piece.label, "馬"));
test("最終移動元を強調できる", () => assert.equal(new KeyPositionReplayViewModel().create(snapshot()).squares.find((s) => s.key === "88").isLastFrom, true));
test("最終移動先を強調できる", () => assert.equal(new KeyPositionReplayViewModel().create(snapshot()).squares.find((s) => s.key === "22").isLastTo, true));
test("Warningを表示できる", () => assert.ok(new KeyPositionReplayViewModel().create(snapshot(1, "replay-partial-invalid.kif")).warning));
test("盤面反転で表示順だけを変更する", () => {
  const vm = new KeyPositionReplayViewModel(); const source = snapshot();
  assert.equal(vm.create(source).squares[0].key, "91");
  assert.equal(vm.create(source, { flipped: true }).squares[0].key, "19");
});
test("盤面反転しても内部Snapshotを変更しない", () => {
  const source = snapshot(); const before = source.toSnapshot();
  new KeyPositionReplayViewModel().create(source, { flipped: true });
  assert.deepEqual(source.toSnapshot(), before);
});
test("駒のaria-labelを生成できる", () => assert.match(new KeyPositionReplayViewModel().create(snapshot()).squares.find((s) => s.key === "22").ariaLabel, /先手の馬/));
test("Snapshot Versionを表示できる", () => assert.equal(new KeyPositionReplayViewModel().create(snapshot()).snapshotVersion, 1));
