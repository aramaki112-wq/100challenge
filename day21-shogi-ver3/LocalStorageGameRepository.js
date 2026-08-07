import {
ApplicationError,
ERROR_CODES,
isApplicationError,
toApplicationError
} from "./errors.js";

export const DEFAULT_STORAGE_KEY =
"shogi-replay-games";

export const STORAGE_VERSION = 2;

export class LocalStorageGameRepository {
constructor({
storage,
mapper,
storageKey =
DEFAULT_STORAGE_KEY,
storageVersion =
STORAGE_VERSION
} = {}) {
assertStorage(
storage
);

assertMapper(
  mapper
);

if (
  typeof storageKey !==
    "string" ||
  storageKey.trim() === ""
) {
  throw new ApplicationError({
    code:
      ERROR_CODES
        .APPLICATION_INITIALIZATION_FAILED,
    message:
      "storageKeyは空ではない文字列である必要があります。",
    details: {
      storageKey
    }
  });
}

if (
  !Number.isInteger(
    storageVersion
  ) ||
  storageVersion < 1
) {
  throw new ApplicationError({
    code:
      ERROR_CODES
        .APPLICATION_INITIALIZATION_FAILED,
    message:
      "storageVersionは1以上の整数である必要があります。",
    details: {
      storageVersion
    }
  });
}

this.storage =
  storage;

this.mapper =
  mapper;

this.storageKey =
  storageKey.trim();

this.storageVersion =
  storageVersion;

}

async save(
game
) {
try {
const storedGame =
this.mapper
.toStoredGame(
game
);

  const collection =
    this.readCollection();

  const existingIndex =
    collection.games
      .findIndex(
        (currentGame) =>
          currentGame.gameId ===
          storedGame.gameId
      );

  const nextGames = [
    ...collection.games
  ];

  if (
    existingIndex >= 0
  ) {
    nextGames[
      existingIndex
    ] = storedGame;
  } else {
    nextGames.push(
      storedGame
    );
  }

  const nextCollection = {
    storageVersion:
      this.storageVersion,
    games:
      nextGames
  };

  this.writeCollection(
    nextCollection
  );

  return {
    gameId:
      storedGame.gameId,
    savedAt:
      storedGame.savedAt
  };
} catch (error) {
  if (
    isApplicationError(
      error
    )
  ) {
    throw error;
  }

  throw toApplicationError(
    error,
    {
      code:
        ERROR_CODES
          .STORAGE_WRITE_FAILED,
      message:
        "GameをLocalStorageへ保存できませんでした。"
    }
  );
}

}

async findById(
gameId
) {
const normalizedGameId =
normalizeGameId(
gameId
);

try {
  const collection =
    this.readCollection();

  const storedGame =
    collection.games.find(
      (currentGame) =>
        currentGame.gameId ===
        normalizedGameId
    );

  if (!storedGame) {
    return null;
  }

  return this.mapper.toGame(
    storedGame
  );
} catch (error) {
  if (
    isApplicationError(
      error
    )
  ) {
    throw error;
  }

  throw toApplicationError(
    error,
    {
      code:
        ERROR_CODES
          .STORAGE_READ_FAILED,
      message:
        "LocalStorageからGameを取得できませんでした。",
      details: {
        gameId:
          normalizedGameId
      }
    }
  );
}

}

async findAllSummaries() {
try {
const collection =
this.readCollection();

  return collection.games.map(
    (storedGame) =>
      this.mapper
        .toGameSummary(
          storedGame
        )
  );
} catch (error) {
  if (
    isApplicationError(
      error
    )
  ) {
    throw error;
  }

  throw toApplicationError(
    error,
    {
      code:
        ERROR_CODES
          .STORAGE_READ_FAILED,
      message:
        "保存済みGame一覧を取得できませんでした。"
    }
  );
}

}

readCollection() {
let serializedCollection;

try {
  serializedCollection =
    this.storage.getItem(
      this.storageKey
    );
} catch (error) {
  throw createStorageReadError(
    error
  );
}

if (
  serializedCollection ===
    null
) {
  return this
    .createEmptyCollection();
}

let parsedCollection;

try {
  parsedCollection =
    JSON.parse(
      serializedCollection
    );
} catch (error) {
  throw new ApplicationError({
    code:
      ERROR_CODES
        .CORRUPTED_STORAGE_DATA,
    message:
      "保存DataをJSONとして読み取れませんでした。",
    cause:
      error,
    details: {
      storageKey:
        this.storageKey
    }
  });
}

this.validateCollection(
  parsedCollection
);

return parsedCollection;

}

writeCollection(
collection
) {
this.validateCollection(
collection
);

let serializedCollection;

try {
  serializedCollection =
    JSON.stringify(
      collection
    );
} catch (error) {
  throw new ApplicationError({
    code:
      ERROR_CODES
        .STORAGE_SERIALIZATION_FAILED,
    message:
      "保存DataをJSON文字列へ変換できませんでした。",
    cause:
      error,
    details: {
      storageKey:
        this.storageKey
    }
  });
}

try {
  this.storage.setItem(
    this.storageKey,
    serializedCollection
  );
} catch (error) {
  throw createStorageWriteError(
    error
  );
}

}

createEmptyCollection() {
return {
storageVersion:
this.storageVersion,
games: []
};
}

validateCollection(
collection
) {
if (
collection === null ||
typeof collection !==
"object" ||
Array.isArray(collection)
) {
throw new ApplicationError({
code:
ERROR_CODES
.CORRUPTED_STORAGE_DATA,
message:
"保存Data全体がObjectではありません。",
details: {
storageKey:
this.storageKey,
receivedType:
Array.isArray(
collection
)
? "array"
: typeof collection
}
});
}

if (
  collection.storageVersion !==
    this.storageVersion
) {
  throw new ApplicationError({
    code:
      ERROR_CODES
        .INVALID_STORAGE_VERSION,
    message:
      "保存DataのVersionが現在のApplicationに対応していません。",
    details: {
      storageKey:
        this.storageKey,
      expectedVersion:
        this.storageVersion,
      receivedVersion:
        collection
          .storageVersion
    }
  });
}

if (
  !Array.isArray(
    collection.games
  )
) {
  throw new ApplicationError({
    code:
      ERROR_CODES
        .CORRUPTED_STORAGE_DATA,
    message:
      "保存Dataのgamesが配列ではありません。",
    details: {
      storageKey:
        this.storageKey,
      receivedType:
        typeof collection.games
    }
  });
}

collection.games.forEach(
  (
    storedGame,
    index
  ) => {
    try {
      this.mapper.toGame(
        storedGame
      );
    } catch (error) {
      throw new ApplicationError({
        code:
          ERROR_CODES
            .CORRUPTED_STORAGE_DATA,
        message:
          "保存済みGameに復元できないDataがあります。",
        cause:
          error,
        details: {
          storageKey:
            this.storageKey,
          gameIndex:
            index,
          gameId:
            storedGame &&
            typeof storedGame ===
              "object"
              ? storedGame.gameId ??
                null
              : null
        }
      });
    }
  }
);

}
}

function assertStorage(
storage
) {
if (
storage === null ||
typeof storage !==
"object"
) {
throw new ApplicationError({
code:
ERROR_CODES
.APPLICATION_INITIALIZATION_FAILED,
message:
"Storage Objectが指定されていません。",
details: {
storage
}
});
}

const requiredMethods = [
"getItem",
"setItem"
];

const missingMethods =
requiredMethods.filter(
(methodName) =>
typeof storage[
methodName
] !== "function"
);

if (
missingMethods.length > 0
) {
throw new ApplicationError({
code:
ERROR_CODES
.APPLICATION_INITIALIZATION_FAILED,
message:
"Storage Objectに必要なMethodが不足しています。",
details: {
requiredMethods,
missingMethods
}
});
}
}

function assertMapper(
mapper
) {
if (
mapper === null ||
typeof mapper !==
"object"
) {
throw new ApplicationError({
code:
ERROR_CODES
.APPLICATION_INITIALIZATION_FAILED,
message:
"GameMapperが指定されていません。",
details: {
mapper
}
});
}

const requiredMethods = [
"toStoredGame",
"toGame",
"toGameSummary"
];

const missingMethods =
requiredMethods.filter(
(methodName) =>
typeof mapper[
methodName
] !== "function"
);

if (
missingMethods.length > 0
) {
throw new ApplicationError({
code:
ERROR_CODES
.APPLICATION_INITIALIZATION_FAILED,
message:
"GameMapperに必要なMethodが不足しています。",
details: {
requiredMethods,
missingMethods
}
});
}
}

function normalizeGameId(
gameId
) {
if (
typeof gameId !==
"string" ||
gameId.trim() === ""
) {
throw new ApplicationError({
code:
ERROR_CODES
.INVALID_GAME_ID,
message:
"gameIdは空ではない文字列である必要があります。",
details: {
gameId
}
});
}

return gameId.trim();
}

function createStorageReadError(
error
) {
if (
isStorageUnavailableError(
error
)
) {
return new ApplicationError({
code:
ERROR_CODES
.STORAGE_UNAVAILABLE,
message:
"LocalStorageへ接続できませんでした。",
cause:
error
});
}

return new ApplicationError({
code:
ERROR_CODES
.STORAGE_READ_FAILED,
message:
"LocalStorageからDataを読み取れませんでした。",
cause:
error
});
}

function createStorageWriteError(
error
) {
if (
isQuotaExceededError(
error
)
) {
return new ApplicationError({
code:
ERROR_CODES
.STORAGE_QUOTA_EXCEEDED,
message:
"LocalStorageの保存容量を超えました。",
cause:
error
});
}

if (
isStorageUnavailableError(
error
)
) {
return new ApplicationError({
code:
ERROR_CODES
.STORAGE_UNAVAILABLE,
message:
"LocalStorageへ接続できませんでした。",
cause:
error
});
}

return new ApplicationError({
code:
ERROR_CODES
.STORAGE_WRITE_FAILED,
message:
"LocalStorageへDataを書き込めませんでした。",
cause:
error
});
}

function isQuotaExceededError(
error
) {
return Boolean(
error &&
(
error.name ===
"QuotaExceededError" ||
error.name ===
"NS_ERROR_DOM_QUOTA_REACHED" ||
error.code ===
22 ||
error.code ===
1014
)
);
}

function isStorageUnavailableError(
error
) {
return Boolean(
error &&
(
error.name ===
"SecurityError" ||
error.name ===
"InvalidStateError"
)
);
}