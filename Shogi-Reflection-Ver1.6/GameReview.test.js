import test from "node:test";
import assert from "node:assert/strict";
import {
  GAME_RESULT,
  GameReview,
  SHOGI_SIDE
} from "./GameReview.js";
import { ReflectionError } from "./ReflectionErrors.js";

function createKeyPosition(index, moveNumber) {
  return {
    keyPositionId: `KP-${index}`,
    moveNumber,
    title: `重要局面${index}`,
    fact: `${moveNumber}手目に駒がぶつかった。`,
    interpretation: "攻めを急ぎたくなった。",
    hypothesis: "相手の受けを一手確認すべきだった。",
    myThought: "先に攻めれば間に合うと思った。",
    opponentIntent: "受けながら反撃を狙っていた可能性がある。",
    emotion: "焦り",
    decisionImpact: "候補手の比較を省略した。"
  };
}

function createReview(overrides = {}) {
  return new GameReview({
    reviewId: "REV-001",
    gameDate: "2026-08-02T11:00:00+09:00",
    side: SHOGI_SIDE.SENTE,
    result: GAME_RESULT.LOSS,
    opponentName: "対局相手",
    timeControl: "10分切れ負け",
    kifuText: "開始日時：2026/08/02\n手合割：平手",
    gameStory: "序盤は互角だったが、中盤で攻めを急いだ。",
    keyPositions: [
      createKeyPosition(1, 35),
      createKeyPosition(2, 52),
      createKeyPosition(3, 71)
    ],
    decisionPattern: "攻めが見えると相手の反撃確認を省略する。",
    observationTheme: "攻める前に相手の次の一手を一回言葉にする。",
    actionRules: [
      "攻める前に相手の王手・取り・反撃を確認する。",
      "候補手を最低二つ並べる。"
    ],
    ...overrides
  });
}

test("一局の振り返りSnapshotを作成できる", () => {
  const review = createReview();
  const snapshot = review.toSnapshot();

  assert.equal(snapshot.reviewId, "REV-001");
  assert.equal(snapshot.keyPositions.length, 3);
  assert.equal(snapshot.readyForNextGame, true);
  assert.deepEqual(snapshot.missingReflectionItems, []);
});

test("重要局面は手数順へ並べる", () => {
  const review = createReview({
    keyPositions: [
      createKeyPosition(1, 80),
      createKeyPosition(2, 20),
      createKeyPosition(3, 50)
    ]
  });

  assert.deepEqual(
    review.keyPositions.map((item) => item.moveNumber),
    [20, 50, 80]
  );
});

test("重要局面が3件未満なら次局準備未完了とする", () => {
  const review = createReview({
    keyPositions: [createKeyPosition(1, 40)]
  });

  assert.equal(review.isReadyForNextGame(), false);
  assert.deepEqual(review.getMissingReflectionItems(), ["KEY_POSITIONS"]);
});

test("Observation Themeがなければ次局準備未完了とする", () => {
  const review = createReview({ observationTheme: "" });

  assert.equal(review.isReadyForNextGame(), false);
  assert.ok(review.getMissingReflectionItems().includes("OBSERVATION_THEME"));
});

test("実行Ruleがなければ次局準備未完了とする", () => {
  const review = createReview({ actionRules: [] });

  assert.equal(review.isReadyForNextGame(), false);
  assert.ok(review.getMissingReflectionItems().includes("ACTION_RULES"));
});

test("重要局面は5件を超えて登録できない", () => {
  assert.throws(
    () => createReview({
      keyPositions: [1, 2, 3, 4, 5, 6].map((n) => createKeyPosition(n, n * 10))
    }),
    (error) => error instanceof ReflectionError && error.code === "TOO_MANY_KEY_POSITIONS"
  );
});

test("実行Ruleは3件を超えて登録できない", () => {
  assert.throws(
    () => createReview({ actionRules: ["A", "B", "C", "D"] }),
    (error) => error instanceof ReflectionError && error.code === "TOO_MANY_ACTION_RULES"
  );
});

test("事実・解釈・仮説のいずれかを空にできない", () => {
  assert.throws(
    () => createReview({
      keyPositions: [
        { ...createKeyPosition(1, 30), fact: "" },
        createKeyPosition(2, 50),
        createKeyPosition(3, 70)
      ]
    }),
    (error) => error instanceof ReflectionError && error.code === "INVALID_KEY_POSITION"
  );
});
