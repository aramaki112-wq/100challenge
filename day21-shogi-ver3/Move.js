import { ApplicationError, ERROR_CODES } from "./errors.js";
import { Position } from "./Position.js";

export const PLAYERS = Object.freeze({
SENTE: "sente",
GOTE: "gote"
});

export class Move {
constructor({
moveNumber,
player,
piece,
from,
to,
promote = false,
drop = false,
notation = ""
}) {
validateMoveNumber(moveNumber);
validatePlayer(player);
validatePiece(piece);
validateBoolean({ name: "promote", value: promote });
validateBoolean({ name: "drop", value: drop });

const normalizedFrom = normalizeFrom({ from, drop });
const normalizedTo = normalizeTo(to);

validateNotation(notation);

this.moveNumber = moveNumber;
this.player = player;
this.piece = piece.trim();
this.from = normalizedFrom;
this.to = normalizedTo;
this.promote = promote;
this.drop = drop;
this.notation = notation;

Object.freeze(this);

}

static from(value) {
if (value instanceof Move) {
return value.clone();
}

if (
  value === null ||
  typeof value !== "object" ||
  Array.isArray(value)
) {
  throw createMoveError({
    message: "Moveへ変換できない値です。",
    details: { value }
  });
}

return new Move({
  moveNumber: value.moveNumber,
  player: value.player,
  piece: value.piece,
  from: value.from,
  to: value.to,
  promote: value.promote ?? false,
  drop: value.drop ?? false,
  notation: value.notation ?? ""
});

}

toJSON() {
return {
moveNumber: this.moveNumber,
player: this.player,
piece: this.piece,
from: this.from ? this.from.toJSON() : null,
to: this.to.toJSON(),
promote: this.promote,
drop: this.drop,
notation: this.notation
};
}

clone() {
return new Move({
moveNumber: this.moveNumber,
player: this.player,
piece: this.piece,
from: this.from ? this.from.clone() : null,
to: this.to.clone(),
promote: this.promote,
drop: this.drop,
notation: this.notation
});
}
}

function validateMoveNumber(moveNumber) {
if (!Number.isInteger(moveNumber) || moveNumber < 1) {
throw createMoveError({
message: "moveNumberは1以上の整数である必要があります。",
details: { moveNumber }
});
}
}

function validatePlayer(player) {
const validPlayers = [PLAYERS.SENTE, PLAYERS.GOTE];

if (!validPlayers.includes(player)) {
throw createMoveError({
message: "playerはsenteまたはgoteである必要があります。",
details: { player }
});
}
}

function validatePiece(piece) {
if (typeof piece !== "string" || piece.trim() === "") {
throw createMoveError({
message: "pieceは空ではない文字列である必要があります。",
details: { piece }
});
}
}

function validateBoolean({ name, value }) {
if (typeof value !== "boolean") {
throw createMoveError({
message: `${name}はbooleanである必要があります。`,
details: { name, value }
});
}
}

function normalizeFrom({ from, drop }) {
if (drop) {
if (from !== null && from !== undefined) {
throw createMoveError({
message: "駒打ちではfromをnullにする必要があります。",
details: { from, drop }
});
}
return null;
}

if (from === null || from === undefined) {
throw createMoveError({
message: "通常移動ではfromが必要です。",
details: { from, drop }
});
}

try {
return Position.from(from);
} catch (error) {
throw createMoveError({
message: "Moveの移動元Positionが不正です。",
cause: error,
details: { from }
});
}
}

function normalizeTo(to) {
if (to === null || to === undefined) {
throw createMoveError({
message: "Moveには移動先toが必要です。",
details: { to }
});
}

try {
return Position.from(to);
} catch (error) {
throw createMoveError({
message: "Moveの移動先Positionが不正です。",
cause: error,
details: { to }
});
}
}

function validateNotation(notation) {
if (typeof notation !== "string") {
throw createMoveError({
message: "notationは文字列である必要があります。",
details: { notation }
});
}
}

function createMoveError({ message, cause = null, details = null }) {
return new ApplicationError({
code: ERROR_CODES.INVALID_MOVE,
message,
cause,
details
});
}