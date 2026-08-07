import {
ApplicationError,
ERROR_CODES
} from "./errors.js";

/**

GameParser Port


外部の棋譜形式を、
Application内部で扱えるDataへ変換する能力を表す。


DAY21では、
KifGameParserがこのContractを満たす。


必須Method：


parse(rawData)
*/

/**

GameParserとして必要な能力を
Objectが持っているか確認する。


JavaScriptにはInterface構文がないため、
Methodの存在を実行時に確認する。


@param {object} gameParser

@returns {object}
*/
export function assertGameParser(
gameParser
) {
if (
gameParser === null ||
typeof gameParser !==
"object"
) {
throw createPortError({
message:
"gameParserが指定されていません。",

details: {
gameParser
}
});
}

if (
typeof gameParser.parse !==
"function"
) {
throw createPortError({
message:
"gameParserにはparse(rawData) Methodが必要です。",

  details: {
    receivedMethods:
      getFunctionNames(
        gameParser
      )
  }
});

}

return gameParser;
}

/**

Objectが持つFunction名を取得する。


Error時の確認用であり、
Application Logicには使用しない。
*/
function getFunctionNames(
target
) {
const ownFunctionNames =
Object.keys(target).filter(
(key) =>
typeof target[key] ===
"function"
);

const prototype =
Object.getPrototypeOf(
target
);

const prototypeFunctionNames =
prototype
? Object
.getOwnPropertyNames(
prototype
)
.filter(
(key) =>
key !==
"constructor" &&
typeof target[key] ===
"function"
)
: [];

return [
...new Set([
...ownFunctionNames,
...prototypeFunctionNames
])
];
}

/**

Port確認用Errorを生成する。
*/
function createPortError({
message,
details = null
}) {
return new ApplicationError({
code:
ERROR_CODES
.APPLICATION_INITIALIZATION_FAILED,

message,

details
});
}