import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { shogiPieceSvg } from "./ShogiPieceSvg.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";
import { ShogiReplayViewModel } from "./ShogiReplayViewModel.js";

function initialView() {
  const parsed = new KifParser().parse({ text: replayFixture("replay-basic.kif") });
  const history = new PositionHistoryBuilder().build(parsed);
  const service = new ShogiReplayApplicationService();
  service.load(history);
  return { service, vm: new ShogiReplayViewModel() };
}

test("初期局面は40枚の駒を表示する", () => {
  const { service, vm } = initialView();
  const view = vm.create(service.getState());
  assert.equal(view.squares.filter((square) => square.piece).length, 40);
});

test("駒SVGは全駒で共通の五角形外形を使う", () => {
  const svg = shogiPieceSvg({ label: "歩", type: "PAWN", promoted: false, rotated: false });
  assert.match(svg, /<path class="piece-body" d="M50 5 Q52 5 54 6/);
});

test("成桂・成香・成銀は2文字専用Classで巨大化を防ぐ", () => {
  for (const label of ["成桂", "成香", "成銀"]) {
    assert.match(shogiPieceSvg({ label, type: "X", promoted: true, rotated: false }), /is-two-character/);
  }
});

test("成駒は色だけでなく専用ClassとMarkを持つ", () => {
  const svg = shogiPieceSvg({ label: "馬", type: "BISHOP", promoted: true, rotated: false });
  assert.match(svg, /is-promoted/);
  assert.match(svg, /piece-promotion-mark/);
  assert.match(svg, />馬</);
});

test("後手駒は向きを表すClassを持つ", () => {
  assert.match(shogiPieceSvg({ label: "歩", type: "PAWN", promoted: false, rotated: true }), /is-rotated/);
});

test("盤面反転で駒方向も反転する", () => {
  const { service, vm } = initialView();
  const before = vm.create(service.getState());
  const beforeSente = before.squares.find((square) => square.piece?.owner === "SENTE").piece.rotated;
  service.toggleFlip();
  const after = vm.create(service.getState());
  const afterSente = after.squares.find((square) => square.piece?.owner === "SENTE").piece.rotated;
  assert.notEqual(beforeSente, afterSente);
});

test("盤上駒はownerと駒名を含むaccessible nameを持つ", () => {
  const { service, vm } = initialView();
  const view = vm.create(service.getState());
  const occupied = view.squares.find((square) => square.piece);
  assert.match(occupied.ariaLabel, /(先手|後手)の/);
});

test("Graphicsは外部画像Asset URLへ依存しない", () => {
  const js = fs.readFileSync(new URL("./ShogiPieceSvg.js", import.meta.url), "utf8");
  assert.equal(/https?:\/\//.test(js), false);
  assert.equal(/<image\b/i.test(js), false);
});
