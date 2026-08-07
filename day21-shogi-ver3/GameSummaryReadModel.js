import {
ApplicationError,
ERROR_CODES
} from "./errors.js";

/**

GameSummaryReadModel Port


保存済みGame一覧の表示に必要な、
軽量なSummaryを取得する能力を表す。


必須Method：


findAllSummaries()


DAY21では、
LocalStorageGameRepositoryが
このContractも満たす。
*/

/**

GameSummaryReadModelとして必要な能力を
Objectが持っているか確認する。


@param {object} gameSummaryReadModel
@returns {object}
*/
export function assertGameSummaryReadModel(
gameSummaryReadModel
) {
if (
gameSummaryReadModel === null ||
typeof gameSummaryReadModel !==
"object"
) {
throw createPortError({
message:
"gameSummaryReadModelが指定されていません。",
details: {
gameSummaryReadModel
}
});
}

if (
typeof gameSummaryReadModel
.findAllSummaries !==
"function"
) {
throw createPortError({
message:
"gameSummaryReadModelにはfindAllSummaries() Methodが必要です。",
details: {
receivedMethods:
getFunctionNames(
gameSummaryReadModel
)
}
});
}

return gameSummaryReadModel;
}

/**

Objectが持つFunction名を取得する。
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