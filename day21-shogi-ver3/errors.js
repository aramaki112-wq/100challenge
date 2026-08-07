/**

Application全体で使用するError Code。


Errorの種類を文字列で比較できるようにし、
Infrastructure・Application・Presentationの間で
Errorの意味を維持する。
*/
export const ERROR_CODES = Object.freeze({
UNKNOWN_APPLICATION_ERROR:
"UNKNOWN_APPLICATION_ERROR",

INVALID_POSITION:
"INVALID_POSITION",

INVALID_MOVE:
"INVALID_MOVE",

INVALID_GAME:
"INVALID_GAME",

INVALID_KIF_INPUT:
"INVALID_KIF_INPUT",

KIF_PARSE_FAILED:
"KIF_PARSE_FAILED",

KIF_IMPORT_FAILED:
"KIF_IMPORT_FAILED",

STORAGE_UNAVAILABLE:
"STORAGE_UNAVAILABLE",

STORAGE_READ_FAILED:
"STORAGE_READ_FAILED",

STORAGE_WRITE_FAILED:
"STORAGE_WRITE_FAILED",

STORAGE_QUOTA_EXCEEDED:
"STORAGE_QUOTA_EXCEEDED",

STORAGE_SERIALIZATION_FAILED:
"STORAGE_SERIALIZATION_FAILED",

CORRUPTED_STORAGE_DATA:
"CORRUPTED_STORAGE_DATA",

INVALID_STORAGE_VERSION:
"INVALID_STORAGE_VERSION",

GAME_MAPPING_FAILED:
"GAME_MAPPING_FAILED",

INVALID_GAME_ID:
"INVALID_GAME_ID",

GAME_NOT_FOUND:
"GAME_NOT_FOUND",

GAME_CANNOT_BE_LOADED:
"GAME_CANNOT_BE_LOADED",

APPLICATION_INITIALIZATION_FAILED:
"APPLICATION_INITIALIZATION_FAILED"
});

/**

Application内で使用する共通Error。


code:
ProgramがErrorの種類を判断するために使用する。


message:
開発者向けの説明。


cause:
元になったError。


details:
Errorが起きた行・Property・入力値などの補足情報。
*/
export class ApplicationError
extends Error {
constructor({
code =
ERROR_CODES
.UNKNOWN_APPLICATION_ERROR,
message =
  "ApplicationでErrorが発生しました。",

cause = null,

details = null

} = {}) {
super(message);

this.name =
  "ApplicationError";

this.code =
  code;

this.cause =
  cause;

this.details =
  details;

}
}

/**

渡された値がApplicationErrorか確認する。


instanceofだけでなく、
Error Codeを持っているかも確認することで、
Module境界を越えた場合にも判断しやすくする。
*/
export function isApplicationError(
error
) {
return (
error instanceof
ApplicationError ||
(
error !== null &&
typeof error ===
"object" &&
typeof error.code ===
"string"
)
);
}

/**

不明なErrorをApplicationErrorへ包む。


すでにApplicationErrorの場合は、

同じErrorをそのまま返す。
*/
export function toApplicationError(
error,
{
code =
ERROR_CODES
.UNKNOWN_APPLICATION_ERROR,

message =
"Applicationで予期しないErrorが発生しました。",

details = null
} = {}
) {
if (
isApplicationError(error)
) {
return error;
}

return new ApplicationError({
code,
message,
cause:
error,
details
});
}