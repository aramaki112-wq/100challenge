import test from "node:test";
import assert from "node:assert/strict";
import { applyShogiMove } from "./ApplyShogiMove.js";
import {
  PIECE_OWNER,
  PIECE_TYPE
} from "./ShogiPiece.js";
import { ShogiSquare } from "./ShogiSquare.js";
import {
  customPosition,
  initialPosition,
  normalizedMove
} from "./ReplayTestHelpers.js";

const at = (position, square) => position.board.pieceAt(square);

test("歩を移動できる", () => {
  const position = applyShogiMove(
    initialPosition(),
    normalizedMove(1, "７六歩(77)")
  );
  assert.equal(at(position, "76").type, PIECE_TYPE.PAWN);
  assert.equal(at(position, "77"), null);
});

test("一手適用後は手番を交代する", () => {
  const position = applyShogiMove(
    initialPosition(),
    normalizedMove(1, "７六歩(77)")
  );
  assert.equal(position.sideToMove, PIECE_OWNER.GOTE);
});

test("飛車を移動できる", () => {
  const source = customPosition({ pieces: [[2, 8, PIECE_TYPE.ROOK]] });
  const result = applyShogiMove(source, normalizedMove(1, "２四飛(28)"));
  assert.equal(at(result, "24").type, PIECE_TYPE.ROOK);
});

test("角を移動できる", () => {
  const source = customPosition({ pieces: [[8, 8, PIECE_TYPE.BISHOP]] });
  const result = applyShogiMove(source, normalizedMove(1, "２二角(88)"));
  assert.equal(at(result, "22").type, PIECE_TYPE.BISHOP);
});

test("香を移動できる", () => {
  const source = customPosition({ pieces: [[9, 9, PIECE_TYPE.LANCE]] });
  assert.equal(
    at(applyShogiMove(source, normalizedMove(1, "９五香(99)")), "95").type,
    PIECE_TYPE.LANCE
  );
});

test("桂を移動できる", () => {
  const source = customPosition({ pieces: [[8, 9, PIECE_TYPE.KNIGHT]] });
  assert.equal(
    at(applyShogiMove(source, normalizedMove(1, "７七桂(89)")), "77").type,
    PIECE_TYPE.KNIGHT
  );
});

test("銀を移動できる", () => {
  const source = customPosition({ pieces: [[7, 9, PIECE_TYPE.SILVER]] });
  assert.equal(
    at(applyShogiMove(source, normalizedMove(1, "６八銀(79)")), "68").type,
    PIECE_TYPE.SILVER
  );
});

test("金を移動できる", () => {
  const source = customPosition({ pieces: [[6, 9, PIECE_TYPE.GOLD]] });
  assert.equal(
    at(applyShogiMove(source, normalizedMove(1, "５八金(69)")), "58").type,
    PIECE_TYPE.GOLD
  );
});

test("玉を移動できる", () => {
  const source = customPosition({ pieces: [[5, 9, PIECE_TYPE.KING]] });
  assert.equal(
    at(applyShogiMove(source, normalizedMove(1, "５八玉(59)")), "58").type,
    PIECE_TYPE.KING
  );
});

test("駒を取れる", () => {
  const source = customPosition({
    pieces: [
      [8, 8, PIECE_TYPE.BISHOP],
      [2, 2, PIECE_TYPE.BISHOP, PIECE_OWNER.GOTE]
    ]
  });
  const result = applyShogiMove(source, normalizedMove(1, "２二角成(88)"));
  assert.equal(at(result, "22").owner, PIECE_OWNER.SENTE);
});

test("取った駒を持ち駒へ追加できる", () => {
  const source = customPosition({
    pieces: [
      [8, 8, PIECE_TYPE.BISHOP],
      [2, 2, PIECE_TYPE.BISHOP, PIECE_OWNER.GOTE]
    ]
  });
  const result = applyShogiMove(source, normalizedMove(1, "２二角成(88)"));
  assert.equal(result.hands.SENTE.count(PIECE_TYPE.BISHOP), 1);
});

test("成駒を取ると元の駒として持ち駒へ追加する", () => {
  const source = customPosition({
    pieces: [
      [5, 5, PIECE_TYPE.ROOK],
      [5, 4, PIECE_TYPE.PAWN, PIECE_OWNER.GOTE, true]
    ]
  });
  const result = applyShogiMove(source, normalizedMove(1, "５四飛(55)"));
  assert.equal(result.hands.SENTE.count(PIECE_TYPE.PAWN), 1);
});

test("持ち駒を打てる", () => {
  const source = customPosition({
    senteHand: { [PIECE_TYPE.BISHOP]: 1 }
  });
  const result = applyShogiMove(source, normalizedMove(1, "５五角打"));
  assert.equal(at(result, "55").type, PIECE_TYPE.BISHOP);
});

test("駒打ち後に持ち駒が減る", () => {
  const source = customPosition({
    senteHand: { [PIECE_TYPE.BISHOP]: 2 }
  });
  const result = applyShogiMove(source, normalizedMove(1, "５五角打"));
  assert.equal(result.hands.SENTE.count(PIECE_TYPE.BISHOP), 1);
});

test("駒を成れる", () => {
  const source = customPosition({
    pieces: [
      [8, 8, PIECE_TYPE.BISHOP],
      [2, 2, PIECE_TYPE.PAWN, PIECE_OWNER.GOTE]
    ]
  });
  const result = applyShogiMove(source, normalizedMove(1, "２二角成(88)"));
  assert.equal(at(result, "22").promoted, true);
  assert.equal(at(result, "22").label, "馬");
});

test("不成を維持できる", () => {
  const source = customPosition({ pieces: [[8, 8, PIECE_TYPE.BISHOP]] });
  const result = applyShogiMove(source, normalizedMove(1, "２二角不成(88)"));
  assert.equal(at(result, "22").promoted, false);
});

test("同の指し手を適用できる", () => {
  let position = customPosition({
    pieces: [
      [8, 8, PIECE_TYPE.BISHOP],
      [2, 2, PIECE_TYPE.BISHOP, PIECE_OWNER.GOTE],
      [3, 1, PIECE_TYPE.SILVER, PIECE_OWNER.GOTE]
    ]
  });
  position = applyShogiMove(position, normalizedMove(1, "２二角成(88)"));
  const result = applyShogiMove(
    position,
    normalizedMove(2, "同銀(31)", new ShogiSquare(2, 2))
  );
  assert.equal(at(result, "22").owner, PIECE_OWNER.GOTE);
  assert.equal(result.hands.GOTE.count(PIECE_TYPE.BISHOP), 1);
});

test("移動元に駒がない場合は拒否する", () => {
  assert.throws(
    () => applyShogiMove(initialPosition(), normalizedMove(1, "７六歩(78)")),
    (error) => error.code === "SHOGI_PIECE_NOT_FOUND"
  );
});

test("持ち駒にない駒打ちを拒否する", () => {
  assert.throws(
    () => applyShogiMove(initialPosition(), normalizedMove(1, "５五角打")),
    (error) => error.code === "SHOGI_DROP_PIECE_NOT_IN_HAND"
  );
});

test("駒があるSquareへの駒打ちを拒否する", () => {
  const source = customPosition({
    pieces: [[5, 5, PIECE_TYPE.PAWN, PIECE_OWNER.GOTE]],
    senteHand: { [PIECE_TYPE.BISHOP]: 1 }
  });
  assert.throws(
    () => applyShogiMove(source, normalizedMove(1, "５五角打")),
    (error) => error.code === "SHOGI_MOVE_DESTINATION_INVALID"
  );
});

test("不正な移動先を拒否する", () => {
  assert.throws(
    () => applyShogiMove(initialPosition(), normalizedMove(1, "９八飛(28)")),
    (error) => error.code === "SHOGI_MOVE_DESTINATION_INVALID"
  );
});

test("自分の駒を取る移動を拒否する", () => {
  assert.throws(
    () => applyShogiMove(initialPosition(), normalizedMove(1, "７七角(88)")),
    (error) => error.code === "SHOGI_CAPTURE_INVALID"
  );
});

test("成れない駒の成りを拒否する", () => {
  const source = customPosition({ pieces: [[5, 4, PIECE_TYPE.GOLD]] });
  const move = {
    ...normalizedMove(1, "５三金(54)"),
    promote: true
  };
  assert.throws(
    () => applyShogiMove(source, move),
    (error) => error.code === "SHOGI_PROMOTION_INVALID"
  );
});

test("成りZone外の成りを拒否する", () => {
  const source = customPosition({ pieces: [[7, 7, PIECE_TYPE.PAWN]] });
  assert.throws(
    () => applyShogiMove(source, normalizedMove(1, "７六歩成(77)")),
    (error) => error.code === "SHOGI_PROMOTION_INVALID"
  );
});

test("不正な不成表記を拒否する", () => {
  const source = customPosition({ pieces: [[7, 7, PIECE_TYPE.PAWN]] });
  assert.throws(
    () => applyShogiMove(source, normalizedMove(1, "７六歩不成(77)")),
    (error) => error.code === "SHOGI_PROMOTION_INVALID"
  );
});

test("先手後手の手番矛盾を拒否する", () => {
  assert.throws(
    () => applyShogiMove(initialPosition(), normalizedMove(2, "３四歩(33)")),
    (error) => error.code === "SHOGI_TURN_MISMATCH"
  );
});

test("前のPositionを変更しない", () => {
  const source = initialPosition();
  applyShogiMove(source, normalizedMove(1, "７六歩(77)"));
  assert.ok(at(source, "77"));
  assert.equal(at(source, "76"), null);
});

test("元Square省略時に一意候補を解決する", () => {
  const source = customPosition({ pieces: [[7, 7, PIECE_TYPE.PAWN]] });
  const result = applyShogiMove(source, normalizedMove(1, "７六歩"));
  assert.equal(at(result, "76").type, PIECE_TYPE.PAWN);
});

test("曖昧な元Squareを推測で決めず拒否する", () => {
  const source = customPosition({
    pieces: [
      [4, 9, PIECE_TYPE.GOLD],
      [6, 9, PIECE_TYPE.GOLD]
    ]
  });
  assert.throws(
    () => applyShogiMove(source, normalizedMove(1, "５八金")),
    (error) => error.code === "SHOGI_MOVE_SOURCE_AMBIGUOUS"
  );
});

test("右表記で候補を一意に絞る", () => {
  const source = customPosition({
    pieces: [
      [4, 9, PIECE_TYPE.GOLD],
      [6, 9, PIECE_TYPE.GOLD]
    ]
  });
  const result = applyShogiMove(source, normalizedMove(1, "５八金右"));
  assert.equal(at(result, "49"), null);
  assert.ok(at(result, "69"));
});

test("左表記で候補を一意に絞る", () => {
  const source = customPosition({
    pieces: [
      [4, 9, PIECE_TYPE.GOLD],
      [6, 9, PIECE_TYPE.GOLD]
    ]
  });
  const result = applyShogiMove(source, normalizedMove(1, "５八金左"));
  assert.equal(at(result, "69"), null);
  assert.ok(at(result, "49"));
});

test("滑走駒の途中に駒がある場合は拒否する", () => {
  const source = customPosition({
    pieces: [
      [2, 8, PIECE_TYPE.ROOK],
      [2, 6, PIECE_TYPE.PAWN]
    ]
  });
  assert.throws(
    () => applyShogiMove(source, normalizedMove(1, "２四飛(28)")),
    (error) => error.code === "SHOGI_MOVE_DESTINATION_INVALID"
  );
});

test("Last MoveにSource KIF Moveを保持する", () => {
  const result = applyShogiMove(
    initialPosition(),
    normalizedMove(1, "７六歩(77)")
  );
  assert.equal(result.lastMove.sourceKifMove.notation, "７六歩(77)");
});
