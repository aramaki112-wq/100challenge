import test from "node:test";
import assert from "node:assert/strict";
import { BrowserGameReviewLibraryView } from "./BrowserGameReviewLibraryView.js";

function createView() {
  const elements = {
    "saved-review-list": { innerHTML: "" },
    "saved-review-detail": { innerHTML: "" },
    "saved-review-library": { innerHTML: "" }
  };
  const documentObject = { getElementById: (id) => elements[id] ?? null };
  return { view: new BrowserGameReviewLibraryView({ documentObject }), elements };
}

test("一覧Cardに詳細・編集・削除の操作境界を描画する", () => {
  const { view, elements } = createView();
  view.renderList({
    status: "FOUND",
    items: [{
      reviewId: "REV-001", displayDate: "2026/08/02 11:00", sideLabel: "先手",
      resultLabel: "負け", opponentLabel: "相手", timeControlLabel: "10分",
      storyExcerpt: "振り返り", keyPositionCount: 3, actionRuleCount: 2, readyForNextGame: true
    }]
  });
  const html = elements["saved-review-list"].innerHTML;
  assert.match(html, /data-view-review="REV-001"/);
  assert.match(html, /data-edit-review="REV-001"/);
  assert.match(html, /data-delete-review="REV-001"/);
});

test("保存済み本文をHTML Escapeして詳細表示する", () => {
  const { view, elements } = createView();
  view.renderDetail({
    reviewId: "REV-001", displayDate: "2026/08/02 11:00", sideLabel: "先手",
    resultLabel: "負け", opponentLabel: "<script>alert(1)</script>", kifuText: "<img src=x>",
    gameStory: "<b>物語</b>", keyPositions: [], decisionPattern: "", observationTheme: "",
    actionRules: [], note: "", readyForNextGame: false
  });
  const html = elements["saved-review-detail"].innerHTML;
  assert.equal(html.includes("<script>alert(1)</script>"), false);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x&gt;/);
  assert.match(html, /&lt;b&gt;物語&lt;\/b&gt;/);
});


test("詳細画面に二種類のMarkdown出力境界を描画する", () => {
  const { view, elements } = createView();
  view.renderDetail({
    reviewId: "REV-001", displayDate: "2026/08/02 11:00", sideLabel: "先手",
    resultLabel: "負け", opponentLabel: "相手", kifuText: "棋譜", gameStory: "物語",
    keyPositions: [], decisionPattern: "Pattern", observationTheme: "Theme",
    actionRules: ["Rule"], note: "", readyForNextGame: true, missingReflectionItems: []
  });
  const html = elements["saved-review-detail"].innerHTML;
  assert.match(html, /data-replay-review="REV-001"/);
  assert.match(html, /data-preview-review-markdown="REV-001"/);
  assert.match(html, /data-preview-observation-card="REV-001"/);
  assert.equal(html.includes("Observation Cardを作成できます"), true);
});

test("振り返り途中ではObservation Card Buttonを無効化し不足項目を表示する", () => {
  const { view, elements } = createView();
  view.renderDetail({
    reviewId: "REV-002", displayDate: "2026/08/02 11:00", sideLabel: "先手",
    resultLabel: "未設定", opponentLabel: "相手", kifuText: "棋譜", gameStory: "",
    keyPositions: [], decisionPattern: "", observationTheme: "", actionRules: [], note: "",
    readyForNextGame: false, missingReflectionItems: ["KEY_POSITIONS", "OBSERVATION_THEME", "ACTION_RULES"]
  });
  const html = elements["saved-review-detail"].innerHTML;
  assert.match(html, /data-preview-observation-card="REV-002"[^>]* disabled/);
  assert.match(html, /重要局面を3件以上記録する/);
  assert.match(html, /次局の観察テーマを1件決める/);
});
