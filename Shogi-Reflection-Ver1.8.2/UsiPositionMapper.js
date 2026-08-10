import { PIECE_OWNER, PIECE_TYPE } from "./ShogiPiece.js";

const USI_PIECE = Object.freeze({
  [PIECE_TYPE.KING]: "K",
  [PIECE_TYPE.ROOK]: "R",
  [PIECE_TYPE.BISHOP]: "B",
  [PIECE_TYPE.GOLD]: "G",
  [PIECE_TYPE.SILVER]: "S",
  [PIECE_TYPE.KNIGHT]: "N",
  [PIECE_TYPE.LANCE]: "L",
  [PIECE_TYPE.PAWN]: "P"
});
const HAND_ORDER = Object.freeze([PIECE_TYPE.ROOK, PIECE_TYPE.BISHOP, PIECE_TYPE.GOLD, PIECE_TYPE.SILVER, PIECE_TYPE.KNIGHT, PIECE_TYPE.LANCE, PIECE_TYPE.PAWN]);

function rankLetter(rank) { return String.fromCharCode("a".charCodeAt(0) + rank - 1); }
function pieceCode(piece) {
  const base = USI_PIECE[piece.type];
  if (!base) throw new TypeError("USIへ変換できない駒種です。");
  const owned = piece.owner === PIECE_OWNER.SENTE ? base : base.toLowerCase();
  return piece.promoted ? `+${owned}` : owned;
}

function handText(hand, owner) {
  const chunks = [];
  for (const type of HAND_ORDER) {
    const count = hand.count(type);
    if (!count) continue;
    const base = owner === PIECE_OWNER.SENTE ? USI_PIECE[type] : USI_PIECE[type].toLowerCase();
    chunks.push(`${count > 1 ? count : ""}${base}`);
  }
  return chunks.join("");
}

export class UsiPositionMapper {
  toSfen(position) {
    const ranks = [];
    for (let rank = 1; rank <= 9; rank += 1) {
      let empty = 0;
      let text = "";
      for (let file = 9; file >= 1; file -= 1) {
        const piece = position.board.pieceAt({ file, rank });
        if (!piece) { empty += 1; continue; }
        if (empty) { text += String(empty); empty = 0; }
        text += pieceCode(piece);
      }
      if (empty) text += String(empty);
      ranks.push(text);
    }
    const hands = `${handText(position.handOf(PIECE_OWNER.SENTE), PIECE_OWNER.SENTE)}${handText(position.handOf(PIECE_OWNER.GOTE), PIECE_OWNER.GOTE)}` || "-";
    const turn = position.sideToMove === PIECE_OWNER.SENTE ? "b" : "w";
    return `${ranks.join("/")} ${turn} ${hands} ${position.moveNumber + 1}`;
  }

  moveToUsi(move) {
    const destination = `${move.destination.file}${rankLetter(move.destination.rank)}`;
    if (move.drop) return `${USI_PIECE[move.pieceType]}*${destination}`;
    if (!move.source) throw new TypeError("USI Move変換には移動元Squareが必要です。");
    return `${move.source.file}${rankLetter(move.source.rank)}${destination}${move.promote ? "+" : ""}`;
  }
}
