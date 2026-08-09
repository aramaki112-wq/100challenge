import test from "node:test";
import assert from "node:assert/strict";
import { BoardSnapshot } from "./BoardSnapshot.js";
import { HandSnapshot } from "./HandSnapshot.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { ReplayPositionSnapshot } from "./ReplayPositionSnapshot.js";
import { ReplayPositionSnapshotFactory } from "./ReplayPositionSnapshotFactory.js";
import { ReplayPositionSnapshotSerializer } from "./ReplayPositionSnapshotSerializer.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";

function stateAt(moveNumber = 3, fileName = "replay-basic.kif") {
  const text = replayFixture(fileName);
  const parsed = new KifParser().parse({ text });
  const history = new PositionHistoryBuilder().build(parsed);
  const service = new ShogiReplayApplicationService();
  service.load(history);
  service.jump(Math.min(moveNumber, history.maxMoveNumber));
  return { text, state: service.getState() };
}

function snapshotAt(moveNumber = 3, fileName = "replay-basic.kif") {
  return new ReplayPositionSnapshotFactory().create({ replayState: stateAt(moveNumber, fileName).state });
}

test("現在手数を保持できる", () => assert.equal(snapshotAt(3).moveNumber, 3));
test("現在の指し手を保持できる", () => assert.equal(snapshotAt(3).currentMove, "２二角成(88)"));
test("直前の指し手を保持できる", () => assert.equal(snapshotAt(3).previousMove, "３四歩(33)"));
test("元KIF指し手の原文行を保持できる", () => assert.match(snapshotAt(3).sourceKifMove.rawLine, /^3 ２二角成/));
test("Board Stateを保持できる", () => assert.equal(snapshotAt(3).currentPosition.board.pieces.length, 39));
test("先手持ち駒を保持できる", () => assert.equal(snapshotAt(3).currentPosition.senteHand.counts.BISHOP, 1));
test("後手持ち駒を保持できる", () => assert.equal(snapshotAt(3).currentPosition.goteHand.counts.BISHOP, 0));
test("Side to Moveを保持できる", () => assert.equal(snapshotAt(3).currentPosition.sideToMove, "GOTE"));
test("最終移動元を保持できる", () => assert.deepEqual(snapshotAt(3).currentPosition.lastMoveFrom, { file: 8, rank: 8 }));
test("最終移動先を保持できる", () => assert.deepEqual(snapshotAt(3).currentPosition.lastMoveTo, { file: 2, rank: 2 }));
test("直前局面を保持できる", () => assert.equal(snapshotAt(3).previousPosition.sideToMove, "SENTE"));
test("現在局面と直前局面は別Dataである", () => assert.notDeepEqual(snapshotAt(3).currentPosition.toSnapshot(), snapshotAt(3).previousPosition.toSnapshot()));
test("Snapshot Versionを保持できる", () => assert.equal(snapshotAt(3).snapshotVersion, 1));
test("終局情報を保持できる", () => assert.equal(snapshotAt(3).termination.notation, "投了"));
test("盤面反転状態を参照しない", () => {
  const { state } = stateAt(3);
  const first = new ReplayPositionSnapshotFactory().create({ replayState: state });
  const flippedState = Object.freeze({ ...state, flipped: true });
  const second = new ReplayPositionSnapshotFactory().create({ replayState: flippedState });
  assert.deepEqual(second.toSnapshot(), first.toSnapshot());
});
test("不変Objectとして扱える", () => assert.equal(Object.isFrozen(snapshotAt(3)), true));
test("Board Snapshotを安全なCopyとして保持する", () => {
  const snapshot = snapshotAt(3);
  assert.equal(Object.isFrozen(snapshot.currentPosition.board.pieces), true);
  assert.throws(() => snapshot.currentPosition.board.pieces.push({}), TypeError);
});
test("JSONへ変換できる", () => assert.match(new ReplayPositionSnapshotSerializer().serialize(snapshotAt(3)), /snapshotVersion/));
test("JSONから復元できる", () => {
  const source = snapshotAt(3);
  const restored = new ReplayPositionSnapshotSerializer().deserialize(new ReplayPositionSnapshotSerializer().serialize(source));
  assert.deepEqual(restored.toSnapshot(), source.toSnapshot());
});
test("Objectから復元できる", () => {
  const source = snapshotAt(3).toSnapshot();
  assert.deepEqual(ReplayPositionSnapshot.fromSnapshot(source).toSnapshot(), source);
});
test("0手目Snapshotを拒否する", () => {
  const { state } = stateAt(0);
  assert.throws(() => new ReplayPositionSnapshotFactory().create({ replayState: state }), /0手目/);
});
test("不正Snapshot Versionを拒否する", () => {
  const source = structuredClone(snapshotAt(3).toSnapshot());
  source.snapshotVersion = 999;
  assert.throws(() => ReplayPositionSnapshot.fromSnapshot(source), (error) => error.code === "KEY_POSITION_SNAPSHOT_VERSION_UNSUPPORTED");
});
test("不正Board Stateを拒否する", () => assert.throws(() => new BoardSnapshot({ pieces: [{ square: { file: 10, rank: 1 }, type: "PAWN", owner: "SENTE" }] })));
test("同じSquareの重複を拒否する", () => assert.throws(() => new BoardSnapshot({ pieces: [
  { square: { file: 1, rank: 1 }, type: "PAWN", owner: "SENTE" },
  { square: { file: 1, rank: 1 }, type: "PAWN", owner: "GOTE" }
] })));
test("不正Hand Stateを拒否する", () => assert.throws(() => new HandSnapshot({ counts: { PAWN: -1 } })));
test("不正Side to Moveを拒否する", () => {
  const source = structuredClone(snapshotAt(3).toSnapshot());
  source.currentPosition.sideToMove = "INVALID";
  assert.throws(() => ReplayPositionSnapshot.fromSnapshot(source));
});
test("不正Last Moveを拒否する", () => {
  const source = structuredClone(snapshotAt(3).toSnapshot());
  source.currentPosition.lastMoveFrom = { file: 0, rank: 9 };
  assert.throws(() => ReplayPositionSnapshot.fromSnapshot(source));
});
test("元KIF指し手がないSnapshotを拒否する", () => {
  const source = structuredClone(snapshotAt(3).toSnapshot());
  source.sourceKifMove = null;
  assert.throws(() => ReplayPositionSnapshot.fromSnapshot(source));
});
test("Replay Warningを保持できる", () => {
  const { state } = stateAt(1, "replay-partial-invalid.kif");
  const snapshot = new ReplayPositionSnapshotFactory().create({ replayState: state });
  assert.ok(snapshot.replayWarning);
  assert.equal(snapshot.replayWarning.replayableUntil, state.history.maxMoveNumber);
});
