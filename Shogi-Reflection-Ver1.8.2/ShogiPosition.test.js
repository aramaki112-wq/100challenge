import test from "node:test";
import assert from "node:assert/strict";
import { InitialShogiPositionFactory } from "./InitialShogiPositionFactory.js";
import {
  PIECE_OWNER,
  PIECE_TYPE
} from "./ShogiPiece.js";
import { ShogiSquare } from "./ShogiSquare.js";

const factory = new InitialShogiPositionFactory();
const create = () => factory.create({ handicap: "平手" });

test("平手初期局面を生成できる", () => {
  assert.equal(create().moveNumber, 0);
});

test("盤面は81Squareを保持する", () => {
  assert.equal(create().board.squareCount, 81);
  assert.equal(create().board.toSquares().length, 81);
});

test("平手初期局面は40駒を配置する", () => {
  assert.equal(create().board.pieceCount, 40);
});

test("先手玉を5九へ配置する", () => {
  const piece = create().board.pieceAt(new ShogiSquare(5, 9));
  assert.equal(piece.type, PIECE_TYPE.KING);
  assert.equal(piece.owner, PIECE_OWNER.SENTE);
});

test("後手王を5一へ配置する", () => {
  const piece = create().board.pieceAt("51");
  assert.equal(piece.type, PIECE_TYPE.KING);
  assert.equal(piece.owner, PIECE_OWNER.GOTE);
});

test("先手飛車を2八へ配置する", () => {
  assert.equal(create().board.pieceAt("28").type, PIECE_TYPE.ROOK);
});

test("後手飛車を8二へ配置する", () => {
  assert.equal(create().board.pieceAt("82").type, PIECE_TYPE.ROOK);
});

test("先手角を8八へ配置する", () => {
  assert.equal(create().board.pieceAt("88").type, PIECE_TYPE.BISHOP);
});

test("後手角を2二へ配置する", () => {
  assert.equal(create().board.pieceAt("22").type, PIECE_TYPE.BISHOP);
});

test("先手と後手の歩を各9枚配置する", () => {
  const entries = create().board.entries();
  assert.equal(entries.filter(([, piece]) =>
    piece.owner === PIECE_OWNER.SENTE && piece.type === PIECE_TYPE.PAWN
  ).length, 9);
  assert.equal(entries.filter(([, piece]) =>
    piece.owner === PIECE_OWNER.GOTE && piece.type === PIECE_TYPE.PAWN
  ).length, 9);
});

test("初期持ち駒は空である", () => {
  const position = create();
  assert.equal(position.hands.SENTE.entries().length, 0);
  assert.equal(position.hands.GOTE.entries().length, 0);
});

test("初期手番は先手である", () => {
  assert.equal(create().sideToMove, PIECE_OWNER.SENTE);
});

test("空きSquareはnullを返す", () => {
  assert.equal(create().board.pieceAt("55"), null);
});

test("PositionとHandsをfreezeする", () => {
  const position = create();
  assert.equal(Object.isFrozen(position), true);
  assert.equal(Object.isFrozen(position.hands), true);
});

test("Board変更は新しいObjectを返し元Boardを変えない", () => {
  const position = create();
  const changed = position.board.withChanges({ remove: ["77"] });
  assert.notEqual(changed, position.board);
  assert.ok(position.board.pieceAt("77"));
  assert.equal(changed.pieceAt("77"), null);
});

test("成駒表示と内部Piece Typeを分離する", () => {
  const rook = create().board.pieceAt("28").promote();
  assert.equal(rook.type, PIECE_TYPE.ROOK);
  assert.equal(rook.label, "龍");
  assert.equal(rook.promoted, true);
});

test("成駒を取ったときに元の駒へ戻せるPiece表現を持つ", () => {
  const promotedPawn = create().board.pieceAt("77").promote();
  const captured = promotedPawn.capturedBy(PIECE_OWNER.GOTE);
  assert.equal(captured.type, PIECE_TYPE.PAWN);
  assert.equal(captured.promoted, false);
  assert.equal(captured.owner, PIECE_OWNER.GOTE);
});

test("未対応手合割を平手として暗黙再現しない", () => {
  assert.throws(
    () => factory.create({ handicap: "香落ち" }),
    (error) => error.code === "SHOGI_INITIAL_POSITION_UNSUPPORTED"
  );
});

test("手合割Headerなしを明示的に拒否する", () => {
  assert.throws(
    () => factory.create({}),
    (error) => error.code === "SHOGI_INITIAL_POSITION_UNSUPPORTED"
  );
});
