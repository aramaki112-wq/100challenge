import test from "node:test";
import assert from "node:assert/strict";
import {
  GAME_RESULT,
  SHOGI_SIDE
} from "./GameReview.js";
import {
  KIF_IMPORT_METADATA_MARKERS,
  KifImportFormMapper
} from "./KifImportFormMapper.js";
import { KifParser } from "./KifParser.js";
import { fixtureText } from "./KifTestHelpers.js";

function dto() {
  return new KifParser().parse({
    text: fixtureText("normal-resign-utf8.kifu"),
    sourceFileName: "normal-resign-utf8.kifu",
    encoding: "utf-8"
  });
}

function currentForm(overrides = {}) {
  return {
    reviewId: "REV-IMPORT",
    gameDate: "2026-08-01T09:00",
    side: SHOGI_SIDE.SENTE,
    result: GAME_RESULT.UNKNOWN,
    opponentName: "入力中の相手",
    timeControl: "",
    kifuText: "入力中の棋譜",
    gameStory: "人間が書いた物語",
    keyPositions: [{ keyPositionId: "KP-1", fact: "事実", interpretation: "解釈", hypothesis: "仮説" }],
    decisionPattern: "判断Pattern",
    observationTheme: "Observation Theme",
    actionRules: ["Rule 1"],
    note: "人間のMemo",
    ...overrides
  };
}

test("Import結果を先手Formへ反映できる", () => {
  const result = new KifImportFormMapper().apply({
    currentForm: currentForm(),
    dto: dto(),
    mySide: SHOGI_SIDE.SENTE
  });
  assert.equal(result.form.side, SHOGI_SIDE.SENTE);
  assert.equal(result.form.opponentName, "ぴよ帝");
  assert.equal(result.form.result, GAME_RESULT.WIN);
});

test("Import結果を後手Formへ反映できる", () => {
  const result = new KifImportFormMapper().apply({
    currentForm: currentForm(),
    dto: dto(),
    mySide: SHOGI_SIDE.GOTE
  });
  assert.equal(result.form.opponentName, "勇太");
  assert.equal(result.form.result, GAME_RESULT.LOSS);
});

test("対局日時と持ち時間を既存Form形式へ変換する", () => {
  const result = new KifImportFormMapper().apply({ currentForm: currentForm(), dto: dto(), mySide: SHOGI_SIDE.SENTE });
  assert.equal(result.form.gameDate, "2026-08-02T10:15");
  assert.equal(result.form.timeControl, "10分切れ負け");
});

test("元のKIF TextをFormへ反映する", () => {
  const result = new KifImportFormMapper().apply({ currentForm: currentForm(), dto: dto(), mySide: SHOGI_SIDE.SENTE });
  assert.equal(result.form.kifuText, dto().rawKifText);
});

test("KIFから対局の物語を自動生成しない", () => {
  const result = new KifImportFormMapper().apply({ currentForm: currentForm(), dto: dto(), mySide: SHOGI_SIDE.SENTE });
  assert.equal(result.form.gameStory, "人間が書いた物語");
});

test("FACT・INTERPRETATION・HYPOTHESISを変更しない", () => {
  const source = currentForm();
  const result = new KifImportFormMapper().apply({ currentForm: source, dto: dto(), mySide: SHOGI_SIDE.SENTE });
  assert.deepEqual(result.form.keyPositions, source.keyPositions);
});

test("判断Pattern・Observation Theme・実行Ruleを変更しない", () => {
  const result = new KifImportFormMapper().apply({ currentForm: currentForm(), dto: dto(), mySide: SHOGI_SIDE.SENTE });
  assert.equal(result.form.decisionPattern, "判断Pattern");
  assert.equal(result.form.observationTheme, "Observation Theme");
  assert.deepEqual(result.form.actionRules, ["Rule 1"]);
});

test("取得した基本情報を人間のMemoと分離して追記する", () => {
  const result = new KifImportFormMapper().apply({ currentForm: currentForm(), dto: dto(), mySide: SHOGI_SIDE.SENTE });
  assert.match(result.form.note, /人間のMemo/);
  assert.match(result.form.note, /KIF Import基本情報/);
  assert.match(result.form.note, /棋戦: 練習対局/);
  assert.match(result.form.note, /総手数: 7/);
});

test("再Import時はKIF基本情報Blockを重複させない", () => {
  const mapper = new KifImportFormMapper();
  const first = mapper.apply({ currentForm: currentForm(), dto: dto(), mySide: SHOGI_SIDE.SENTE });
  const second = mapper.apply({ currentForm: first.form, dto: dto(), mySide: SHOGI_SIDE.SENTE });
  assert.equal(second.form.note.split(KIF_IMPORT_METADATA_MARKERS.start).length - 1, 1);
});

test("Form Mapperの結果は変更不能である", () => {
  const result = new KifImportFormMapper().apply({ currentForm: currentForm(), dto: dto(), mySide: SHOGI_SIDE.SENTE });
  assert.throws(() => { result.form.gameStory = "変更"; }, TypeError);
  assert.throws(() => { result.form.keyPositions[0].fact = "変更"; }, TypeError);
});
