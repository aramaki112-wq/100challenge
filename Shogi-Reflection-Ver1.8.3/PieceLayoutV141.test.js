import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { shogiPieceMarkup, shogiPieceSvg } from "./ShogiPieceSvg.js";

const css = fs.readFileSync(new URL("./style.css", import.meta.url), "utf8");

for (const label of ["歩", "馬", "龍", "成桂", "成香", "成銀"]) {
  test(`${label}は共通の五角形SVG外形に収まる`, () => {
    const svg = shogiPieceSvg({ label, type: "TEST", promoted: label !== "歩", rotated: false });
    assert.match(svg, /viewBox="0 0 100 112"/);
    assert.match(svg, /d="M50 5 C52 5 53\.5 5\.6 55\.1 6\.6[\s\S]*H11\.9[\s\S]*L44\.9 6\.6/);
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
  assert.match(css, /\.replay-piece \.piece-label-stacked,[\s\S]*font-size:27px/);
  for (const label of ["成桂", "成香", "成銀"]) {
    assert.match(css, new RegExp(`\\.replay-piece\\.is-${label} \\.piece-label`));
  }
});

test("成駒はPromotion Classと文字で区別し2文字成駒は縦積みする", () => {
  for (const label of ["と", "成香", "成桂", "成銀", "馬", "龍"]) {
    const svg = shogiPieceSvg({ label, type: "TEST", promoted: true, rotated: false });
    assert.match(svg, /is-promoted/);
    if (["成香", "成桂", "成銀"].includes(label)) {
      assert.match(svg, /piece-label-stacked/);
      assert.match(svg, /<tspan/);
    } else {
      assert.match(svg, new RegExp(`>${label}<`));
    }
  }
});

test("後手方向はrotation classで表現しaccessible nameはSquare側に残す", () => {
  assert.match(shogiPieceSvg({ label: "歩", type: "PAWN", promoted: false, rotated: true }), /is-rotated/);
  const replayView = fs.readFileSync(new URL("./BrowserShogiReplayView.js", import.meta.url), "utf8");
  assert.match(replayView, /aria-label="\$\{escapeHtml\(square\.ariaLabel\)\}"/);
});
