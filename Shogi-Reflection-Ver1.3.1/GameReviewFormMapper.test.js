import test from "node:test";
import assert from "node:assert/strict";
import { GameReviewFormMapper } from "./GameReviewFormMapper.js";
import { ReflectionError } from "./ReflectionErrors.js";

function position(index, overrides = {}) {
  return {
    keyPositionId: `KP-${index}`,
    moveNumber: String(index * 10),
    title: `局面${index}`,
    boardState: `盤面${index}`,
    fact: `事実${index}`,
    interpretation: `解釈${index}`,
    hypothesis: `仮説${index}`,
    myThought: `思考${index}`,
    opponentIntent: `狙い${index}`,
    emotion: "焦り",
    decisionImpact: "候補手を省略した",
    ...overrides
  };
}

function input(overrides = {}) {
  return {
    reviewId: " REV-FORM-001 ",
    gameDate: "2026-08-02T12:30",
    side: "SENTE",
    result: "LOSS",
    opponentName: " 相手 ",
    timeControl: "10分切れ負け",
    kifuText: " 棋譜 ",
    gameStory: " 対局の物語 ",
    keyPositions: [position(1), position(2), position(3)],
    decisionPattern: " 攻めを急ぐ ",
    observationTheme: " 相手の狙いを見る ",
    actionRules: [" Rule 1 ", "", " Rule 2 "],
    note: " Memo ",
    ...overrides
  };
}

test("Form InputをGameReview Domain Entityへ変換できる", () => {
  const entity = new GameReviewFormMapper().toEntity(input());
  assert.equal(entity.reviewId, "REV-FORM-001");
  assert.equal(entity.keyPositions.length, 3);
  assert.deepEqual(entity.actionRules, ["Rule 1", "Rule 2"]);
  assert.equal(entity.isReadyForNextGame(), true);
});

test("空の重要局面Cardは保存対象から除外する", () => {
  const entity = new GameReviewFormMapper().toEntity(input({ keyPositions: [position(1), position(2), position(3), {}] }));
  assert.equal(entity.keyPositions.length, 3);
});

test("一部だけ入力された重要局面はDomain Ruleで拒否する", () => {
  assert.throws(
    () => new GameReviewFormMapper().toEntity(input({ keyPositions: [position(1), position(2), { moveNumber: "30", title: "途中" }] })),
    (error) => error instanceof ReflectionError && error.code === "INVALID_KEY_POSITION"
  );
});

test("FACT・INTERPRETATION・HYPOTHESISを別Fieldのまま保持する", () => {
  const entity = new GameReviewFormMapper().toEntity(input({
    keyPositions: [position(1, { fact: "盤上の事実", interpretation: "自分の解釈", hypothesis: "別の仮説" })]
  }));
  const snapshot = entity.keyPositions[0].toSnapshot();
  assert.equal(snapshot.fact, "盤上の事実");
  assert.equal(snapshot.interpretation, "自分の解釈");
  assert.equal(snapshot.hypothesis, "別の仮説");
});

test("重要局面6件は既存Domain Ruleで拒否する", () => {
  assert.throws(
    () => new GameReviewFormMapper().toEntity(input({ keyPositions: [1, 2, 3, 4, 5, 6].map(position) })),
    (error) => error instanceof ReflectionError && error.code === "TOO_MANY_KEY_POSITIONS"
  );
});

test("空の実行Ruleは除外し3件以内で保持する", () => {
  const entity = new GameReviewFormMapper().toEntity(input({ actionRules: ["確認1", "  ", "確認2"] }));
  assert.deepEqual(entity.actionRules, ["確認1", "確認2"]);
});
