import test from "node:test";
import assert from "node:assert/strict";
import { AddCurrentPositionToKeyPosition } from "./AddCurrentPositionToKeyPosition.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";

function replay(moveNumber = 3, fileName = "replay-basic.kif") {
  const text = replayFixture(fileName);
  const history = new PositionHistoryBuilder().build(new KifParser().parse({ text }));
  const service = new ShogiReplayApplicationService(); service.load(history); service.jump(Math.min(moveNumber, history.maxMoveNumber));
  return { text, state: service.getState() };
}
function execute({ moveNumber = 3, existingKeyPositions = [], fileName = "replay-basic.kif", textOverride } = {}) {
  const source = replay(moveNumber, fileName);
  return new AddCurrentPositionToKeyPosition().execute({
    replayState: source.state,
    existingKeyPositions,
    sourceGameId: "REV-ADD-001",
    sourceKifText: textOverride ?? source.text
  });
}

test("現在局面をKeyPosition候補へ追加できる", () => assert.equal(execute().status, "CANDIDATE_ADDED"));
test("手数を自動入力できる", () => assert.equal(execute().candidate.moveNumber, 3));
test("指し手を自動入力できる", () => assert.equal(execute().candidate.moveText, "２二角成(88)"));
test("Snapshotを生成できる", () => assert.equal(execute().candidate.replayReference.snapshot.moveNumber, 3));
test("元KIF指し手を保持できる", () => assert.match(execute().candidate.replayReference.sourceKifMove.rawLine, /^3 /));
test("FACTを自動入力しない", () => assert.equal(execute().candidate.fact, ""));
test("INTERPRETATIONを自動入力しない", () => assert.equal(execute().candidate.interpretation, ""));
test("HYPOTHESISを自動入力しない", () => assert.equal(execute().candidate.hypothesis, ""));
test("感情を自動入力しない", () => assert.equal(execute().candidate.emotion, ""));
test("判断Patternを自動入力しない", () => assert.equal(execute().candidate.decisionPattern, ""));
test("学びを自動入力しない", () => assert.equal(execute().candidate.learning, ""));
test("0手目を拒否できる", () => assert.throws(() => execute({ moveNumber: 0 }), (error) => error.code === "KEY_POSITION_REPLAY_MOVE_REQUIRED"));
test("同一手数の重複を検出できる", () => assert.throws(() => execute({ existingKeyPositions: [{ keyPositionId: "KP-1", moveNumber: "3", title: "入力中" }] }), (error) => error.code === "KEY_POSITION_REPLAY_DUPLICATE"));
test("5件登録済みの場合は拒否できる", () => assert.throws(() => execute({ existingKeyPositions: [1,2,3,4,5].map((n) => ({ moveNumber: n, title: `局面${n}` })) }), (error) => error.code === "KEY_POSITION_LIMIT_REACHED"));
test("空Cardは上限件数へ数えない", () => assert.equal(execute({ existingKeyPositions: [{ keyPositionId: "KP-1" }, {}, {}] }).status, "CANDIDATE_ADDED"));
test("Replay未開始を拒否できる", () => assert.throws(() => new AddCurrentPositionToKeyPosition().execute({ existingKeyPositions: [], sourceGameId: "R", sourceKifText: "x" }), (error) => error.code === "KEY_POSITION_REPLAY_NOT_AVAILABLE"));
test("Form棋譜とのSource不一致を拒否できる", () => assert.throws(() => execute({ textOverride: "手合割：平手\n先手：別" }), (error) => error.code === "KEY_POSITION_REPLAY_SOURCE_MISMATCH"));
test("Warning付き局面を追加できる", () => assert.equal(execute({ moveNumber: 1, fileName: "replay-partial-invalid.kif" }).hasWarning, true));
test("WarningをSnapshotへ引き継ぐ", () => assert.ok(execute({ moveNumber: 1, fileName: "replay-partial-invalid.kif" }).candidate.replayReference.replayWarning));
test("追加操作だけではRepositoryへ保存されない", () => {
  const repository = new InMemoryGameReviewRepository();
  const revision = repository.getRevision(); execute();
  assert.equal(repository.findAll().length, 0); assert.equal(repository.getRevision(), revision);
});
test("既存入力配列を直接変更しない", () => {
  const existing = [{ moveNumber: 1, title: "既存" }];
  const before = structuredClone(existing); execute({ existingKeyPositions: existing });
  assert.deepEqual(existing, before);
});
test("Candidateは不変Objectである", () => assert.equal(Object.isFrozen(execute().candidate), true));
test("追加結果は未保存状態を明示する", () => assert.equal(execute().saved, false));
