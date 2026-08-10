import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { shogiPieceSvg } from "./ShogiPieceSvg.js";

const css = fs.readFileSync(new URL("./style.css", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("./ShogiPieceSvg.js", import.meta.url), "utf8");
const labels = ["歩", "香", "桂", "銀", "金", "角", "飛", "玉", "と", "成香", "成桂", "成銀", "馬", "龍"];

test("全主要駒種が同一viewBoxのオリジナルSVGで描画される", () => {
  for (const label of labels) {
    const svg = shogiPieceSvg({ label, type: "TEST", promoted: ["と","成香","成桂","成銀","馬","龍"].includes(label), rotated: false });
    assert.match(svg, /viewBox="0 0 100 112"/);
    assert.match(svg, /class="piece-body"/);
    assert.match(svg, /piece-face-highlight/);
  }
  assert.equal(/https?:\/\//.test(source), false);
  assert.equal(/<image\b/i.test(source), false);
});

test("成桂・成香・成銀は縦積みTextで固定幅内の視認性を確保する", () => {
  for (const label of ["成桂", "成香", "成銀"]) {
    const svg = shogiPieceSvg({ label, type: "TEST", promoted: true, rotated: false });
    assert.match(svg, /is-two-character/);
    assert.match(svg, /piece-label-stacked/);
    assert.equal((svg.match(/<tspan/g) ?? []).length, 2);
  }
});

test("外周線はVer.1.6より抑制したstrokeで、外部Font Fileを同梱しない", () => {
  assert.match(css, /stroke-width:1\.35/);
  assert.match(css, /Hiragino Mincho ProN/);
  assert.match(css, /Yu Mincho/);
  assert.doesNotMatch(css, /@font-face/);
});

test("後手向き・Board Flip用rotation classを保持する", () => {
  assert.match(shogiPieceSvg({ label: "歩", type: "PAWN", promoted: false, rotated: true }), /is-rotated/);
  assert.match(css, /\.replay-piece\.is-rotated,\.snapshot-piece\.is-rotated \{ transform:rotate\(180deg\); \}/);
});
