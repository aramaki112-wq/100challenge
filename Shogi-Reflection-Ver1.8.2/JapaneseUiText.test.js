import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("./main.js", import.meta.url), "utf8");
const formView = fs.readFileSync(new URL("./BrowserGameReviewFormView.js", import.meta.url), "utf8");
const libraryView = fs.readFileSync(new URL("./BrowserGameReviewLibraryView.js", import.meta.url), "utf8");
const replayView = fs.readFileSync(new URL("./BrowserShogiReplayView.js", import.meta.url), "utf8");
const errorPresenter = fs.readFileSync(new URL("./KifImportErrorPresenter.js", import.meta.url), "utf8");

test("主要Browser UI Labelを日本語で表示する", () => {
  for (const label of [
    "保存・バックアップ",
    "KIF読み込み · 先に内容確認",
    "貼り付けたKIFを確認",
    "入力をクリア",
    "棋譜入力へ戻る",
    "棋譜読み込み確認",
    "この内容を入力フォームへ反映",
    "棋譜再現盤",
    "現在の入力フォームの棋譜を再現",
    "保存済み対局",
    "Markdown確認",
    "次局の観察テーマ",
    "次局で守るルール"
  ]) assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("主要aria-labelを日本語中心に維持する", () => {
  assert.match(html, /aria-label="KIFファイルをドラッグ＆ドロップ"/);
  assert.match(html, /aria-label="棋譜操作"/);
  assert.match(html, /aria-label="棋譜の最初へ移動"/);
  assert.match(html, /aria-label="指し手一覧"/);
  assert.match(html, /aria-label="Markdown確認"/);
});

test("Presentation文言は日本語化し内部Domain名は維持する", () => {
  assert.match(formView, /事実（FACT）/);
  assert.match(formView, /局面記録を表示/);
  assert.match(libraryView, /次局の観察テーマ/);
  assert.match(replayView, /replayStatusLabel/);
  assert.match(errorPresenter, /KIFの読み込みに失敗しました/);

  // Internal code identifiers stay stable.
  assert.match(main, /GameReview/);
  assert.match(main, /KeyPositionReplayController/);
  assert.match(main, /ShogiReplayController/);
  assert.match(main, /KifImportController/);
});

test("利用者向け主要操作に旧英語UI文言を残さない", () => {
  const prohibited = [
    "KIF IMPORT · PREVIEW FIRST",
    "IMPORT PREVIEW",
    "POSITION HISTORY · NAVIGATION",
    "SAVED REVIEWS",
    "ClipboardへCopy",
    ".mdをDownload",
    "Importを中止",
    "現在Formの棋譜を再現",
    "手数をRangeで移動"
  ];
  for (const text of prohibited) assert.equal(html.includes(text), false, text);
});
