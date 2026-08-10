import test from "node:test";
import assert from "node:assert/strict";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { customPosition, replayFixture } from "./ReplayTestHelpers.js";
import { PIECE_OWNER, PIECE_TYPE } from "./ShogiPiece.js";

function parse(text) {
  return new KifParser().parse({ text });
}

function build(fileName = "replay-basic.kif") {
  return new PositionHistoryBuilder().build(parse(replayFixture(fileName)));
}

test("初期局面を0手目として保持する", () => {
  assert.equal(build().at(0).moveNumber, 0);
});

test("指し手数+1件のPositionを生成する", () => {
  const history = build();
  assert.equal(history.moves.length, 5);
  assert.equal(history.positions.length, 6);
});

test("任意手数のPositionを取得できる", () => {
  assert.equal(build().at(3).moveNumber, 3);
});

test("前のPositionを変更しない", () => {
  const history = build();
  assert.ok(history.at(0).board.pieceAt("77"));
  assert.equal(history.at(1).board.pieceAt("77"), null);
});

test("同の指し手をPosition Historyで適用できる", () => {
  const history = build();
  assert.equal(history.at(4).board.pieceAt("22").owner, "GOTE");
});

test("駒打ちをPosition Historyで適用できる", () => {
  const history = build();
  assert.equal(history.at(5).board.pieceAt("55").type, "BISHOP");
  assert.equal(history.at(5).hands.SENTE.count("BISHOP"), 0);
});

test("終局表記を指し手とは別に保持する", () => {
  const history = build();
  assert.equal(history.termination.notation, "投了");
  assert.equal(history.termination.moveNumber, 6);
});

test("全局面再現可能な場合FULLを返す", () => {
  assert.equal(build().status, "FULL");
  assert.equal(build().failure, null);
});

test("Replay失敗手数を取得できる", () => {
  const history = build("replay-partial-invalid.kif");
  assert.equal(history.status, "PARTIAL");
  assert.equal(history.failure.moveNumber, 3);
});

test("途中失敗でも正常なPositionを保持する", () => {
  const history = build("replay-partial-invalid.kif");
  assert.equal(history.positions.length, 3);
  assert.equal(history.maxMoveNumber, 2);
  assert.equal(history.failure.replayableUntil, 2);
});

test("未対応手合割はReplay拒否となる", () => {
  const history = build("replay-unsupported-handicap.kif");
  assert.equal(history.status, "REJECTED");
  assert.equal(history.positions.length, 0);
  assert.equal(history.failure.code, "SHOGI_INITIAL_POSITION_UNSUPPORTED");
});

test("手合割HeaderなしはReplay拒否となる", () => {
  const history = build("replay-missing-handicap.kif");
  assert.equal(history.status, "REJECTED");
  assert.equal(history.failure.code, "SHOGI_INITIAL_POSITION_UNSUPPORTED");
});

test("Jump範囲外は明示的に拒否する", () => {
  assert.throws(
    () => build().at(99),
    (error) => error.code === "SHOGI_REPLAY_JUMP_OUT_OF_RANGE"
  );
});

test("手数重複をBuilder境界でも拒否する", () => {
  const parsed = {
    handicap: "平手",
    warnings: [],
    moves: [
      { moveNumber: 1, notation: "７六歩(77)" },
      { moveNumber: 1, notation: "３四歩(33)" }
    ]
  };
  const history = new PositionHistoryBuilder().build(parsed);
  assert.equal(history.status, "PARTIAL");
  assert.equal(history.failure.code, "SHOGI_MOVE_NUMBER_INVALID");
});

test("手数の飛びをBuilder境界でも拒否する", () => {
  const parsed = {
    handicap: "平手",
    warnings: [],
    moves: [
      { moveNumber: 1, notation: "７六歩(77)" },
      { moveNumber: 3, notation: "３四歩(33)" }
    ]
  };
  const history = new PositionHistoryBuilder().build(parsed);
  assert.equal(history.status, "PARTIAL");
  assert.equal(history.failure.detail.expectedMoveNumber, 2);
});

test("KIF Parser WarningをHistoryへ保持する", () => {
  const parsed = parse("手合割：平手\n先手：A\n後手：B\n1 ７六歩(77)\n");
  const history = new PositionHistoryBuilder().build(parsed);
  assert.ok(history.warnings.length >= 1);
});

test("300手級のPosition Historyを実用時間内で生成する", () => {
  const moves = [];
  for (let moveNumber = 1; moveNumber <= 300; moveNumber += 1) {
    const cycle = (moveNumber - 1) % 4;
    const notation = [
      "５八金(59)",
      "５二金(51)",
      "５九金(58)",
      "５一金(52)"
    ][cycle];
    moves.push({ moveNumber, notation });
  }

  const builder = new PositionHistoryBuilder({
    initialPositionFactory: {
      create() {
        return customPosition({
          pieces: [
            [5, 9, PIECE_TYPE.GOLD, PIECE_OWNER.SENTE],
            [5, 1, PIECE_TYPE.GOLD, PIECE_OWNER.GOTE]
          ]
        });
      }
    }
  });

  const startedAt = performance.now();
  const history = builder.build({
    handicap: "平手",
    moves,
    warnings: []
  });
  const elapsed = performance.now() - startedAt;

  assert.equal(history.status, "FULL");
  assert.equal(history.maxMoveNumber, 300);
  assert.ok(elapsed < 1000, `300手History生成が遅すぎます: ${elapsed}ms`);
});
