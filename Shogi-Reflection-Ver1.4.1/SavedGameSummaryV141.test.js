import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { GameReviewLibraryPresenter } from "./GameReviewLibraryPresenter.js";
import { createGameReview } from "./TestFixtures.js";
import { GAME_REVIEW_WORKFLOW_STATUS } from "./ReflectionWorkflowStatus.js";

function rawKif() {
  return [
    "# ---- ぴよ将棋 棋譜ファイル ----",
    "棋戦：ぴよ将棋 R対局",
    "戦型：四間飛車",
    "開始日時：2026/06/17 16:48:48",
    "手合割：平手",
    "1 ７六歩(77)",
    "2 ３四歩(33)"
  ].join("\n");
}

test("保存済み対局Summaryは対局日を日付だけへ整形する", () => {
  const snapshot = createGameReview({ gameDate: "2026-06-17T16:48:48+09:00" }).toSnapshot();
  const item = new GameReviewLibraryPresenter().presentList([snapshot]).items[0];
  assert.equal(item.displayDate, "2026/06/17");
});

test("戦型はKIF Import Metadataから読み取りDomain追加を要求しない", () => {
  const note = "<!-- KIF_IMPORT_METADATA_START -->\n## KIF Import基本情報\n- 戦型: 四間飛車\n<!-- KIF_IMPORT_METADATA_END -->";
  const snapshot = createGameReview({ note }).toSnapshot();
  const item = new GameReviewLibraryPresenter().presentList([snapshot]).items[0];
  assert.equal(item.openingNameLabel, "四間飛車");
  assert.equal(Object.hasOwn(snapshot, "openingName"), false);
});

test("旧保存DataでもRaw KIFから戦型だけを読み取れる", () => {
  const snapshot = createGameReview({ kifuText: rawKif(), note: "" }).toSnapshot();
  const item = new GameReviewLibraryPresenter().presentList([snapshot]).items[0];
  assert.equal(item.openingNameLabel, "四間飛車");
});

test("戦型不明は未設定とする", () => {
  const snapshot = createGameReview({ kifuText: "手合割：平手\n1 ７六歩(77)", note: "" }).toSnapshot();
  assert.equal(new GameReviewLibraryPresenter().presentList([snapshot]).items[0].openingNameLabel, "未設定");
});

test("振り返り未入力でもRaw KIF HeaderをstoryExcerptへ表示しない", () => {
  const snapshot = createGameReview({
    kifuText: rawKif(), gameStory: "", decisionPattern: "", keyPositions: [], observationTheme: "", actionRules: [], note: "",
    workflowStatus: GAME_REVIEW_WORKFLOW_STATUS.GAME_ONLY
  }).toSnapshot();
  const item = new GameReviewLibraryPresenter().presentList([snapshot]).items[0];
  assert.equal(item.storyExcerpt, "");
  assert.equal(item.moveCount, 2);
});

test("Browser Cardは対局日Label・戦型・相手・勝敗・手数・Statusを表示する", () => {
  const view = fs.readFileSync(new URL("./BrowserGameReviewLibraryView.js", import.meta.url), "utf8");
  for (const text of ["対局日：", "対戦相手：", "自分の側：", "勝敗：", "戦型：", "手数：", "workflow-badge"]) {
    assert.ok(view.includes(text), text);
  }
});

test("Browser CardはRaw kifuTextを直接描画しない", () => {
  const view = fs.readFileSync(new URL("./BrowserGameReviewLibraryView.js", import.meta.url), "utf8");
  const listMethod = view.slice(view.indexOf("renderList"), view.indexOf("renderDetail"));
  assert.equal(listMethod.includes("kifuText"), false);
});
