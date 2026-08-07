import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function source(fileName) {
  return readFileSync(
    fileURLToPath(new URL(`./${fileName}`, import.meta.url)),
    "utf8"
  );
}

const html = source("index.html");
const main = source("main.js");
const css = source("style.css");

const requiredIds = [
  "shogi-replay-panel",
  "replay-current-form",
  "shogi-board",
  "sente-hand",
  "gote-hand",
  "replay-status",
  "replay-move-list",
  "replay-warning",
  "replay-error",
  "replay-empty",
  "replay-first",
  "replay-previous",
  "replay-next",
  "replay-last",
  "replay-jump",
  "replay-jump-number",
  "replay-jump-button",
  "replay-flip"
];

test("棋譜再現盤に必要なBrowser Elementを保持する", () => {
  for (const id of requiredIds) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `#${id}`);
  }
});

test("Navigation Buttonに明確な日本語Labelを表示する", () => {
  for (const label of ["最初へ", "前へ", "次へ", "最後へ", "盤面を反転"]) {
    assert.match(html, new RegExp(label));
  }
});

test("Rangeと数値入力の二つのJump手段を残す", () => {
  assert.match(html, /id="replay-jump"[^>]*type="range"/);
  assert.match(html, /id="replay-jump-number"[^>]*type="number"/);
});

test("Replay UIをApplication ServiceとControllerへ接続する", () => {
  for (const name of [
    "PositionHistoryBuilder",
    "ShogiReplayApplicationService",
    "ShogiReplayController",
    "ShogiReplayViewModel",
    "BrowserShogiReplayView"
  ]) {
    assert.match(main, new RegExp(name));
  }
});

test("KIF Import後と保存済みGameReviewからReplayを読み込む", () => {
  assert.match(main, /loadReplay\(result\.form\.kifuText/);
  assert.match(main, /loadReplay\(found\.gameReview\.kifuText/);
  assert.match(main, /data-replay-review/);
});

test("Keyboard Navigationは入力Elementを除外する", () => {
  assert.match(main, /ArrowLeft/);
  assert.match(main, /ArrowRight/);
  assert.match(main, /Home/);
  assert.match(main, /End/);
  assert.match(main, /HTMLInputElement/);
  assert.match(main, /HTMLTextAreaElement/);
  assert.match(main, /HTMLSelectElement/);
});

test("Smartphone幅で盤面と棋譜一覧を縦配置する", () => {
  assert.match(css, /@media \(max-width:1000px\)/);
  assert.match(css, /\.replay-layout\s*\{\s*grid-template-columns:1fr/);
  assert.match(css, /@media \(max-width:800px\)/);
});

test("最終移動強調は色だけでなく線種とBorderを使用する", () => {
  assert.match(css, /\.replay-square\.is-last-from::before/);
  assert.match(css, /border:2px dashed/);
  assert.match(css, /\.replay-square\.is-last-to::after/);
  assert.match(css, /border:4px solid/);
});
