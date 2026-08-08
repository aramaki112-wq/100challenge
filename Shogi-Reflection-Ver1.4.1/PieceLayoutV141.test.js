import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { shogiPieceMarkup, shogiPieceSvg } from "./ShogiPieceSvg.js";

const css = fs.readFileSync(new URL("./style.css", import.meta.url), "utf8");

for (const label of ["歩", "馬", "龍", "成桂", "成香", "成銀"]) {
  test(`${label}は共通の五角形SVG外形に収まる`, () => {
    const svg = shogiPieceSvg({ label, type: "TEST", promoted: label !== "歩", rotated: false });
    assert.match(svg, /viewBox="0 0 100 112"/);
    assert.match(svg, /points="50,5 84,22 94,104 6,104 16,22"/);
  });
}

test("1文字駒も2文字駒も固定Piece Containerへ入る", () => {
  const one = shogiPieceMarkup({ label: "歩", type: "PAWN", promoted: false, rotated: false }, { containerClassName: "replay-piece-container" });
  const two = shogiPieceMarkup({ label: "成桂", type: "KNIGHT", promoted: true, rotated: false }, { containerClassName: "replay-piece-container" });
  assert.match(one, /data-piece-container="true"/);
  assert.match(two, /data-piece-container="true"/);
  assert.match(two, /is-two-character/);
  assert.match(two, /is-成桂/);
});

test("成桂・成香・成銀はSquareを拡張せずPiece内部でFontを調整する", () => {
  assert.match(css, /\.replay-piece\.is-two-character \.piece-label[\s\S]*font-size:29px/);
  for (const label of ["成桂", "成香", "成銀"]) {
    assert.match(css, new RegExp(`\\.replay-piece\\.is-${label} \\.piece-label`));
  }
});

test("成駒は色だけでなくPromotion Markと文字で区別する", () => {
  for (const label of ["と", "成香", "成桂", "成銀", "馬", "龍"]) {
    const svg = shogiPieceSvg({ label, type: "TEST", promoted: true, rotated: false });
    assert.match(svg, /is-promoted/);
    assert.match(svg, /piece-promotion-mark/);
    assert.match(svg, new RegExp(`>${label}<`));
  }
});

test("後手方向はrotation classで表現しaccessible nameはSquare側に残す", () => {
  assert.match(shogiPieceSvg({ label: "歩", type: "PAWN", promoted: false, rotated: true }), /is-rotated/);
  const replayView = fs.readFileSync(new URL("./BrowserShogiReplayView.js", import.meta.url), "utf8");
  assert.match(replayView, /aria-label="\$\{escapeHtml\(square\.ariaLabel\)\}"/);
});
