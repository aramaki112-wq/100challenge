import { ApplicationError, ERROR_CODES } from "./errors.js";

/**

将棋盤の縦横の大きさ。
*/
export const BOARD_SIZE = 9;

/**

将棋盤上の一つの位置を表すValue Object。
*/
export class Position {
constructor({ file, rank }) {
validateCoordinate({ name: "file", value: file });
validateCoordinate({ name: "rank", value: rank });

this.file = file;
this.rank = rank;

Object.freeze(this);
}

static from(value) {
if (value instanceof Position) {
return new Position({
file: value.file,
rank: value.rank
});
}

if (
  value === null ||
  typeof value !== "object" ||
  Array.isArray(value)
) {
  throw createPositionError({
    message: "Positionへ変換できない値です。",
    details: { value }
  });
}

return new Position({
  file: value.file,
  rank: value.rank
});

}

toRowIndex() {
return this.rank - 1;
}

toColumnIndex() {
return BOARD_SIZE - this.file;
}

equals(other) {
if (!(other instanceof Position)) {
return false;
}

return this.file === other.file && this.rank === other.rank;

}

toJSON() {
return {
file: this.file,
rank: this.rank
};
}

clone() {
return new Position({
file: this.file,
rank: this.rank
});
}
}

function validateCoordinate({ name, value }) {
if (
!Number.isInteger(value) ||
value < 1 ||
value > BOARD_SIZE
) {
throw createPositionError({
message: ${name}は1〜${BOARD_SIZE}の整数である必要があります。,
details: { name, value }
});
}
}

function createPositionError({ message, details = null }) {
return new ApplicationError({
code: ERROR_CODES.INVALID_POSITION,
message,
details
});
}