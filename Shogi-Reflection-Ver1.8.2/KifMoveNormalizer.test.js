import test from "node:test";
import assert from "node:assert/strict";
import { KifMoveNormalizer } from "./KifMoveNormalizer.js";
import {
  PIECE_OWNER,
  PIECE_TYPE
} from "./ShogiPiece.js";
import { ShogiSquare } from "./ShogiSquare.js";

const normalizer = new KifMoveNormalizer();
const normalize = (moveNumber, notation, previousDestination = null) =>
  normalizer.normalize(
    { moveNumber, notation, rawLine: `${moveNumber} ${notation}` },
    { previousDestination }
  );

test("通常指し手を正規化できる", () => {
  const move = normalize(1, "７六歩(77)");
  assert.equal(move.destination.key, "76");
  assert.equal(move.source.key, "77");
  assert.equal(move.pieceType, PIECE_TYPE.PAWN);
});

test("Ver.1.1 ParserのmoveNumber Contractを使用する", () => {
  assert.equal(normalize(1, "７六歩(77)").moveNumber, 1);
});

test("互換入力としてnumberも読み取れる", () => {
  const move = normalizer.normalize({ number: 1, notation: "７六歩(77)" });
  assert.equal(move.moveNumber, 1);
});

test("奇数手を先手として正規化する", () => {
  assert.equal(normalize(1, "７六歩(77)").owner, PIECE_OWNER.SENTE);
});

test("偶数手を後手として正規化する", () => {
  assert.equal(normalize(2, "３四歩(33)").owner, PIECE_OWNER.GOTE);
});

test("同を直前移動先へ正規化できる", () => {
  const move = normalize(4, "同　銀(31)", new ShogiSquare(2, 2));
  assert.equal(move.destination.key, "22");
  assert.equal(move.sameDestination, true);
});

test("同の参照先がない場合は拒否する", () => {
  assert.throws(() => normalize(4, "同銀(31)"), /参照先/);
});

test("成を正規化できる", () => {
  assert.equal(normalize(3, "２二角成(88)").promote, true);
});

test("不成を正規化できる", () => {
  assert.equal(normalize(3, "２二角不成(88)").nonPromote, true);
});

test("打を正規化できる", () => {
  const move = normalize(5, "５五角打");
  assert.equal(move.drop, true);
  assert.equal(move.source, null);
});

test("元Squareを取得できる", () => {
  assert.equal(normalize(1, "７六歩(77)").source.key, "77");
});

test("龍と竜を同じ内部Piece Typeへ変換する", () => {
  for (const label of ["龍", "竜"]) {
    const move = normalize(21, `５五${label}(54)`);
    assert.equal(move.pieceType, PIECE_TYPE.ROOK);
    assert.equal(move.pieceWasPromoted, true);
  }
});

test("馬・成銀・成桂・成香・とを成駒として正規化する", () => {
  const values = [
    ["馬", PIECE_TYPE.BISHOP],
    ["成銀", PIECE_TYPE.SILVER],
    ["成桂", PIECE_TYPE.KNIGHT],
    ["成香", PIECE_TYPE.LANCE],
    ["と", PIECE_TYPE.PAWN]
  ];
  for (const [label, type] of values) {
    const move = normalize(21, `５五${label}(54)`);
    assert.equal(move.pieceType, type);
    assert.equal(move.pieceWasPromoted, true);
  }
});

test("右左直寄引上行を補助表記として保持する", () => {
  for (const qualifier of ["右", "左", "直", "寄", "引", "上", "行"]) {
    assert.deepEqual(normalize(21, `５八金${qualifier}(49)`).qualifiers, [qualifier]);
  }
});

test("複数方向表記の順序を保持する", () => {
  assert.deepEqual(normalize(21, "５八銀右上(69)").qualifiers, ["右", "上"]);
});

test("全角Spaceを除去して同を解析する", () => {
  assert.equal(
    normalize(4, "同　銀(31)", new ShogiSquare(2, 2)).pieceType,
    PIECE_TYPE.SILVER
  );
});

test("不正な移動先を拒否する", () => {
  assert.throws(() => normalize(1, "十六歩(77)"), /移動先/);
});

test("不正な駒名を拒否する", () => {
  assert.throws(() => normalize(1, "７六猫(77)"), /駒種/);
});

test("未知の補助表記を推測で処理しない", () => {
  assert.throws(() => normalize(1, "７六歩謎(77)"), /未対応/);
});

test("打と元Squareの併記を拒否する", () => {
  assert.throws(() => normalize(1, "７六歩打(77)"), /同時/);
});

test("成駒を打つ表記を拒否する", () => {
  assert.throws(() => normalize(1, "５五馬打"), /駒打ち/);
});

test("すでに成っている駒への不成表記を拒否する", () => {
  assert.throws(() => normalize(1, "５五馬不成(44)"), /すでに成って/);
});

test("終局表記を指し手と分離できる", () => {
  assert.equal(normalize(6, "投了").kind, "TERMINATION");
});

test("Ver.1.2未対応の入表記を明示的に拒否する", () => {
  assert.throws(() => normalize(1, "５八金入"), /入/);
});

test("Source KIF Moveを保持する", () => {
  const move = normalizer.normalize({
    moveNumber: 1,
    notation: "７六歩(77)",
    lineNumber: 10
  });
  assert.equal(move.sourceKifMove.lineNumber, 10);
});
