import {
  GAME_RESULT,
  GameReview,
  SHOGI_SIDE
} from "./GameReview.js";

export function createKeyPosition(index, moveNumber = index * 10) {
  return {
    keyPositionId: `KP-${index}`,
    moveNumber,
    title: `重要局面${index}`,
    boardState: `盤面${index}`,
    fact: `${moveNumber}手目に駒がぶつかった。`,
    interpretation: "攻めを急ぎたくなった。",
    hypothesis: "相手の受けを一手確認すべきだった。",
    myThought: "先に攻めれば間に合うと思った。",
    opponentIntent: "受けながら反撃を狙っていた可能性がある。",
    emotion: "焦り",
    decisionImpact: "候補手の比較を省略した。"
  };
}

export function createGameReview(overrides = {}) {
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
    note: "Phase2 Test Data",
    ...overrides
  });
}

export class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  removeItem(key) {
    this.map.delete(key);
  }
}

export class FixedClock {
  constructor(value = "2026-08-02T12:00:00+09:00") {
    this.value = value;
  }
  now() {
    return this.value;
  }
}
