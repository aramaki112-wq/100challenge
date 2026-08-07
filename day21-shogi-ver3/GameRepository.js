import {
ApplicationError,
ERROR_CODES
} from "./errors.js";

/**

GameRepository Port


Game Entityを保存し、
Game IDによって一局を取得する能力を表す。


必須Method：


save(game)


findById(gameId)


DAY21では、各MethodはPromiseを返す。
*/

/**

GameRepositoryとして必要な能力を
Objectが持っているか確認する。


@param {object} gameRepository
@returns {object}
*/
export function assertGameRepository(
gameRepository
) {
if (
gameRepository === null ||
typeof gameRepository !==
"object"
) {
throw createPortError({
message:
"gameRepositoryが指定されていません。",
details: {
gameRepository
}
});
}

const requiredMethods = [
"save",
"findById"
];

const missingMethods =
requiredMethods.filter(
(methodName) =>
typeof gameRepository[
methodName
] !== "function"
);

if (
missingMethods.length > 0
) {
throw createPortError({
message:
"gameRepositoryに必要なMethodが不足しています。",
details: {
requiredMethods,
missingMethods,
receivedMethods:
getFunctionNames(
gameRepository
)
}
});
}

return gameRepository;
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