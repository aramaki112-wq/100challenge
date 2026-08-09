import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";
import { ShogiReplayViewModel } from "./ShogiReplayViewModel.js";

const css = fs.readFileSync(new URL("./style.css", import.meta.url), "utf8");
const replayView = fs.readFileSync(new URL("./BrowserShogiReplayView.js", import.meta.url), "utf8");
const snapshotView = fs.readFileSync(new URL("./BrowserGameReviewFormView.js", import.meta.url), "utf8");

function viewModelFor(fixture = "replay-capture-promote.kifu") {
  const parsed = new KifParser().parse({ text: replayFixture(fixture) });
  const history = new PositionHistoryBuilder().build(parsed);
  const service = new ShogiReplayApplicationService();
  service.load(history);
  return { service, vm: new ShogiReplayViewModel() };
}

test("Replay盤は81升を持つ", () => {
  const { service, vm } = viewModelFor();
  assert.equal(vm.create(service.getState()).squares.length, 81);
});

test("9列9行を同一fractionで固定するCSSを持つ", () => {
  assert.match(css, /\.replay-board-grid,[\s\S]*grid-template-columns:repeat\(9,minmax\(0,1fr\)\);/);
  assert.match(css, /\.replay-board-grid,[\s\S]*grid-template-rows:repeat\(9,minmax\(0,1fr\)\);/);
  assert.match(css, /\.snapshot-board[\s\S]*grid-template-rows:repeat\(9,minmax\(0,1fr\)\);/);
});

test("Empty SquareとPiece Squareは同じreplay-square classを使う", () => {
  assert.match(replayView, /const classes = \["replay-square"\]/);
  assert.match(replayView, /shogiPieceMarkup\(square\.piece/);
});

test("駒はSquare直下のSize決定要素ではなくPiece Container内へ入る", () => {
  assert.match(replayView, /containerClassName: "replay-piece-container"/);
  assert.match(snapshotView, /containerClassName: "snapshot-piece-container"/);
  assert.match(css, /\.replay-piece-container,[\s\S]*width:82%;[\s\S]*height:88%;/);
});

test("Squareは内容のはみ出しをLayoutへ反映しない", () => {
  assert.match(css, /\.replay-square,[\s\S]*overflow:hidden;/);
  assert.match(css, /\.replay-square,[\s\S]*contain:layout paint;/);
});

test("成駒局面と盤面反転でも81升構造を維持する", () => {
  const { service, vm } = viewModelFor();
  service.jump(3);
  const promoted = vm.create(service.getState());
  assert.equal(promoted.squares.length, 81);
  assert.ok(promoted.squares.some((square) => square.piece?.promoted));
  service.toggleFlip();
  assert.equal(vm.create(service.getState()).squares.length, 81);
});

test("SnapshotもReplayと同じPiece componentを使う", () => {
  assert.match(snapshotView, /shogiPieceMarkup\(square\.piece/);
  assert.match(css, /\.snapshot-board[\s\S]*aspect-ratio:1 \/ 1;/);
});
