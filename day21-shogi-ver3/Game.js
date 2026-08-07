import { ApplicationError, ERROR_CODES } from "./errors.js";
import { Move } from "./Move.js";

export const DEFAULT_GAME_METADATA = Object.freeze({
title: "名称未設定",
senteName: "先手未設定",
goteName: "後手未設定",
playedAt: null
});

export class Game {
constructor({
gameId,
metadata,
moves,
source,
importedAt,
savedAt
}) {
this.gameId = normalizeGameId(gameId);
this.metadata = normalizeMetadata(metadata);
this.moves = normalizeMoves(moves);
this.source = normalizeSource(source);
this.importedAt = normalizeDateTimeString({
name: "importedAt",
value: importedAt
});
this.savedAt = normalizeDateTimeString({
name: "savedAt",
value: savedAt
});

Object.freeze(this.metadata);
Object.freeze(this.source);
Object.freeze(this.moves);
Object.freeze(this);

}

static from(value) {
if (value instanceof Game) {
return value.clone();
}

if (
  value === null ||
  typeof value !== "object" ||
  Array.isArray(value)
) {
  throw createGameError({
    message: "Gameへ変換できない値です。",
    details: { value }
  });
}

return new Game({
  gameId: value.gameId,
  metadata: value.metadata,
  moves: value.moves,
  source: value.source,
  importedAt: value.importedAt,
  savedAt: value.savedAt
});

}

toJSON() {
return {
gameId: this.gameId,
metadata: { ...this.metadata },
moves: this.moves.map((m) => m.toJSON()),
source: { ...this.source },
importedAt: this.importedAt,
savedAt: this.savedAt
};
}

clone() {
return new Game(this.toJSON());
}
}

export function createGameSummary(gameValue) {
const game = Game.from(gameValue);

return {
gameId: game.gameId,
title: game.metadata.title,
senteName: game.metadata.senteName,
goteName: game.metadata.goteName,
playedAt: game.metadata.playedAt,
savedAt: game.savedAt,
moveCount: game.moves.length
};
}

function normalizeGameId(gameId) {
if (typeof gameId !== "string" || gameId.trim() === "") {
throw createGameError({
message: "gameIdは空ではない文字列である必要があります。",
details: { gameId }
});
}
return gameId.trim();
}

function normalizeMetadata(metadata) {
const source = isPlainObject(metadata) ? metadata : {};

return {
title: normalizeDisplayText({
value: source.title,
defaultValue: DEFAULT_GAME_METADATA.title
}),
senteName: normalizeDisplayText({
value: source.senteName,
defaultValue: DEFAULT_GAME_METADATA.senteName
}),
goteName: normalizeDisplayText({
value: source.goteName,
defaultValue: DEFAULT_GAME_METADATA.goteName
}),
playedAt: normalizeNullableDateTime(source.playedAt)
};
}

function normalizeDisplayText({ value, defaultValue }) {
if (typeof value !== "string") return defaultValue;
const normalized = value.trim();
return normalized === "" ? defaultValue : normalized;
}

function normalizeNullableDateTime(value) {
if (value === null || value === undefined || value === "") {
return null;
}
if (typeof value !== "string") {
throw createGameError({
message: `playedAtは文字列またはnullである必要があります。`,
details: { playedAt: value }
});
}
return value;
}

function normalizeMoves(moves) {
if (!Array.isArray(moves)) {
throw createGameError({
message: "movesは配列である必要があります。",
details: { moves }
});
}

if (moves.length === 0) {
throw createGameError({
message: "Gameには1手以上のMoveが必要です。",
details: { moves }
});
}

return moves.map((move) => {
try {
return Move.from(move);
} catch (error) {
throw createGameError({
message: "Game内に不正なMoveがあります。",
cause: error,
details: { move }
});
}
});
}

function normalizeSource(source) {
if (!isPlainObject(source)) {
throw createGameError({
message: "sourceはObjectである必要があります。",
details: { source }
});
}

const format = normalizeRequiredString({
name: "source.format",
value: source.format
});

const rawKif = normalizeRequiredString({
name: "source.rawKif",
value: source.rawKif
});

const parserVersion = source.parserVersion;

if (!Number.isInteger(parserVersion) || parserVersion < 1) {
throw createGameError({
message: "source.parserVersionは1以上の整数である必要があります。",
details: { parserVersion }
});
}

return { format, rawKif, parserVersion };
}

function normalizeRequiredString({ name, value }) {
if (typeof value !== "string" || value.trim() === "") {
throw createGameError({
message: `${name}は空ではない文字列である必要があります。`,
details: { name, value }
});
}
return value;
}

function normalizeDateTimeString({ name, value }) {
if (typeof value !== "string" || value.trim() === "") {
throw createGameError({
message: `${name}は空ではない文字列である必要があります。`,
details: { name, value }
});
}
return value;
}

function isPlainObject(value) {
return value !== null && typeof value === "object" && !Array.isArray(value);
}

function createGameError({ message, cause = null, details = null }) {
return new ApplicationError({
code: ERROR_CODES.INVALID_GAME,
message,
cause,
details
});
}