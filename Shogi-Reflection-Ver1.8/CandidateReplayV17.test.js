import test from "node:test";
import assert from "node:assert/strict";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";
import { ShogiReplayViewModel } from "./ShogiReplayViewModel.js";
import { ReplayPositionSnapshotFactory } from "./ReplayPositionSnapshotFactory.js";

test("Engine Candidate plyを既存Replayへ渡すとCurrent Move・Highlight・盤面が一致する", () => {
  const parsed = new KifParser().parse({ text: replayFixture("replay-capture-promote.kifu") });
  const history = new PositionHistoryBuilder().build(parsed);
  const service = new ShogiReplayApplicationService();
  service.load(history);
  const candidate = { ply: 3, moveNumber: 3 };
  const state = service.jump(candidate.ply);
  const vm = new ShogiReplayViewModel().create(state);
  assert.equal(vm.currentMoveNumber, candidate.ply);
  assert.equal(vm.currentMoveId, "replay-move-3");
  assert.equal(vm.moves.find((move) => move.current)?.moveNumber, candidate.ply);
  assert.equal(vm.squares.length, 81);
  assert.ok(vm.squares.some((square) => square.piece?.label === "馬"));
  assert.equal(vm.moveListScrollTarget.scope, "MOVE_LIST_CONTAINER");
  assert.equal(vm.moveListScrollTarget.pageScroll, "NONE");
});

test("Candidate移動後のReplay Position Snapshotは同じplyと実戦手を保持する", () => {
  const parsed = new KifParser().parse({ text: replayFixture("replay-capture-promote.kifu") });
  const history = new PositionHistoryBuilder().build(parsed);
  const service = new ShogiReplayApplicationService();
  service.load(history);
  const state = service.jump(3);
  const snapshot = new ReplayPositionSnapshotFactory().create({ replayState: state });
  assert.equal(snapshot.moveNumber, 3);
  assert.equal(snapshot.currentMove, state.currentMove.notation);
  assert.ok(snapshot.currentPosition);
  assert.ok(snapshot.previousPosition);
});
