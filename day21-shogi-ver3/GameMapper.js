import {
ApplicationError,
ERROR_CODES
} from "./errors.js";

import {
Game,
createGameSummary
} from "./Game.js";

/**

Domain GameとStorage Dataの間を変換するMapper。


責任：


Domain Game
↓
Stored Game DTO


Stored Game DTO
↓
Domain Game


Stored Game DTO
↓
Game Summary
/
export class GameMapper {
/*
Domain Gameを、
LocalStorageへ保存できる
Plain Objectへ変換する。


@param {Game|object} gameValue

@returns {object}
*/
toStoredGame(
gameValue
) ;{
try {
const game =
Game.from(
gameValue
);

return game.toJSON();
} catch (error) {
throw createMappingError({
message:
"Gameを保存用Dataへ変換できませんでした。",

cause:
error,

details:
summarizeGameValue(
gameValue
)
});
}
}

/**

LocalStorageから取得した
Stored Game DTOを、
Domain Gameへ復元する。


外部から取得したDataなので、
Domain Gameを作る前に
保存Dataとしての形を確認する。


@param {object} storedGame

@returns {Game}
*/
toGame(
storedGame
) ;{
try {
validateStoredGameShape(
storedGame
);

return Game.from(
storedGame
);
} catch (error) {
throw createMappingError({
message:
"保存DataからGameを復元できませんでした。",

cause:
error,

details:
summarizeGameValue(
storedGame
)
});
}
}

/**

Stored Game DTOから、
保存済み一覧用Summaryを作る。


moves本体やRaw KIFは返さない。


@param {object} storedGame

@returns {object}
*/
toGameSummary(
storedGame
) ;{
try {
const game =
this.toGame(
storedGame
);

return createGameSummary(
game
);
} catch (error) {
throw createMappingError({
message:
"保存DataからGame Summaryを作成できませんでした。",

cause:
error,

details:
summarizeGameValue(
storedGame
)
});
}
}


/**

Stored Game DTO全体の形を確認する。


Domain Game側ではDefault値を補えるが、
Storageから戻ったDataは
破損している可能性があるため、

より厳しく確認する。
*/
function validateStoredGameShape(
storedGame
) {
assertPlainObject({
name:
"storedGame",

value:
storedGame
});

assertRequiredString({
name:
"storedGame.gameId",

value:
  storedGame.gameId

});

validateStoredMetadata(
storedGame.metadata
);

validateStoredMoves(
storedGame.moves
);

validateStoredSource(
storedGame.source
);

assertRequiredString({
name:
"storedGame.importedAt",

value:
  storedGame.importedAt

});

assertRequiredString({
name:
"storedGame.savedAt",

value:
  storedGame.savedAt

});
}

/**

保存されたMetadataを確認する。
*/
function validateStoredMetadata(
metadata
) {
assertPlainObject({
name:
"storedGame.metadata",

value:
metadata
});

assertString({
name:
"storedGame.metadata.title",

value:
  metadata.title

});

assertString({
name:
"storedGame.metadata.senteName",

value:
  metadata.senteName

});

assertString({
name:
"storedGame.metadata.goteName",

value:
  metadata.goteName

});

const playedAt =
metadata.playedAt;

if (
playedAt !== null &&
typeof playedAt !==
"string"
) {
throw createValidationError({
message:
"storedGame.metadata.playedAtは文字列またはnullである必要があります。",

  details: {
    playedAt
  }
});

}
}

/**

保存されたMove一覧を確認する。


各Moveの詳細Validationは、

Game.from()とMove.from()が担当する。
*/
function validateStoredMoves(
moves
) {
if (
!Array.isArray(moves)
) {
throw createValidationError({
message:
"storedGame.movesは配列である必要があります。",

details: {
receivedType:
typeof moves
}
});
}

if (
moves.length === 0
) {
throw createValidationError({
message:
"storedGame.movesには1手以上の指し手が必要です。",

  details: {
    moveCount:
      moves.length
  }
});

}
}

/**

保存されたSourceを確認する。
*/
function validateStoredSource(
source
) {
assertPlainObject({
name:
"storedGame.source",

value:
source
});

assertRequiredString({
name:
"storedGame.source.format",

value:
  source.format

});

assertRequiredString({
name:
"storedGame.source.rawKif",

value:
  source.rawKif

});

if (
!Number.isInteger(
source.parserVersion
) ||
source.parserVersion < 1
) {
throw createValidationError({
message:
"storedGame.source.parserVersionは1以上の整数である必要があります。",

  details: {
    parserVersion:
      source.parserVersion
  }
});

}
}

/**

Plain Objectか確認する。
*/
function assertPlainObject({
name,
value
}) {
if (
value === null ||
typeof value !==
"object" ||
Array.isArray(value)
) {
throw createValidationError({
message:
`${name}はObjectである必要があります。`,

details: {
name,
receivedType:
Array.isArray(value)
? "array"
: typeof value
}
});
}
}

/**

文字列か確認する。


MetadataのDefault文字列も許可するため、

空文字列かどうかまではここでは判定しない。
*/
function assertString({
name,
value
}) {
if (
typeof value !==
"string"
) {
throw createValidationError({
message:
`${name}は文字列である必要があります。`,

details: {
name,
value
}
});
}
}

/**

空ではない必須文字列を確認する。
*/
function assertRequiredString({
name,
value
}) {
if (
typeof value !==
"string" ||
value.trim() === ""
) {
throw createValidationError({
message:
`${name}は空ではない文字列である必要があります。`,

details: {
name,
value
}
});
}
}

/**

GameMapper内部のValidation Errorを生成する。
*/
function createValidationError({
message,
details = null
}) {
return new ApplicationError({
code:
ERROR_CODES
.GAME_MAPPING_FAILED,

message,

details
});
}

/**

Mapping Errorを生成する。
*/
function createMappingError({
message,
cause = null,
details = null
}) {
return new ApplicationError({
code:
ERROR_CODES
.GAME_MAPPING_FAILED,

message,

cause,

details
});
}

/**

Error detailsへ巨大なRaw KIF全体を

入れないための要約を作る。
*/
function summarizeGameValue(
value
) {
if (
value === null ||
typeof value !==
"object"
) {
return {
receivedType:
typeof value,

value
};
}

return {
gameId:
value.gameId ??
null,

hasMetadata:
  value.metadata !==
    null &&
  typeof value.metadata ===
    "object",

moveCount:
  Array.isArray(
    value.moves
  )
    ? value.moves.length
    : null,

sourceFormat:
  value.source &&
  typeof value.source ===
    "object"
    ? value.source.format ??
      null
    : null,

hasRawKif:
  Boolean(
    value.source &&
    typeof value.source ===
      "object" &&
    typeof value.source
      .rawKif ===
      "string"
  ),

importedAt:
  value.importedAt ??
  null,

savedAt:
  value.savedAt ??
  null

};
}