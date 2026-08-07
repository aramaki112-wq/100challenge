import {
ApplicationError,
ERROR_CODES
} from "./errors.js";

import {
DEFAULT_GAME_METADATA
} from "./Game.js";

import {
Move,
PLAYERS
} from "./Move.js";

/**

KIF ParserのVersion。


将来、解析Ruleを変更した場合に
Versionを上げる。
*/
export const KIF_PARSER_VERSION = 1;

/**

KIF形式の棋譜を、
Application内部で扱うGame Candidateへ変換するAdapter。


DAY21で対応する主な形式：


1 ７六歩(77)
2 ３四歩(33)
3 ２六歩(27)


DAY21では次を未対応とする。


・同
・成
・不成
・打
・持ち駒

・複雑な変則初期局面
*/
export class KifGameParser {
constructor({
parserVersion =
KIF_PARSER_VERSION
} = {}) {
if (
!Number.isInteger(
parserVersion
) ||
parserVersion < 1
) {
throw new ApplicationError({
code:
ERROR_CODES
.APPLICATION_INITIALIZATION_FAILED,

 message:
   "parserVersionは1以上の整数である必要があります。",

 details: {
   parserVersion
 }

});
}

this.parserVersion =
parserVersion;
}

/**

Raw KIFを解析する。


@param {string} rawKif
@returns {{
metadata: object,
moves: Move[],
source: object
}}
*/
parse(
rawKif
) {
const normalizedRawKif =
normalizeRawKif(
rawKif
);
const lines =
  normalizedRawKif
    .split("\n");

const metadata =
  parseMetadata(
    lines
  );

const moves =
  parseMoves(
    lines
  );

if (
  moves.length === 0
) {
  throw createParseError({
    message:
      "KIFから指し手を読み取れませんでした。",

    details: {
      lineCount:
        lines.length
    }
  });
}

return {
  metadata,

  moves,

  source: {
    format:
      "kif",

    rawKif:
      normalizedRawKif,

    parserVersion:
      this.parserVersion
  }
};

}
}

/**

Raw KIFを標準化する。
*/
function normalizeRawKif(
rawKif
) {
if (
typeof rawKif !==
"string"
) {
throw new ApplicationError({
code:
ERROR_CODES
.INVALID_KIF_INPUT,

message:
"KIFは文字列で入力してください。",

details: {
receivedType:
typeof rawKif
}
});
}

const normalized =
rawKif
.replace(/\r\n/g, "\n")
.replace(/\r/g, "\n")
.trim();

if (
normalized === ""
) {
throw new ApplicationError({
code:
ERROR_CODES
.INVALID_KIF_INPUT,

  message:
    "KIFが入力されていません。"
});

}

return normalized;
}

/**

KIF HeaderからMetadataを取得する。
*/
function parseMetadata(
lines
) {
const headerValues = {
title:
null,

eventName:
null,

senteName:
null,

goteName:
null,

playedAt:
null
};

for (
const line of lines
) {
const trimmedLine =
line.trim();

if (
  trimmedLine === ""
) {
  continue;
}

const header =
  parseHeaderLine(
    trimmedLine
  );

if (!header) {
  continue;
}

const {
  key,
  value
} = header;

if (
  TITLE_HEADER_KEYS.includes(
    key
  )
) {
  headerValues.title =
    headerValues.title ??
    value;

  continue;
}

if (
  EVENT_HEADER_KEYS.includes(
    key
  )
) {
  headerValues.eventName =
    headerValues.eventName ??
    value;

  continue;
}

if (
  SENTE_HEADER_KEYS.includes(
    key
  )
) {
  headerValues.senteName =
    value;

  continue;
}

if (
  GOTE_HEADER_KEYS.includes(
    key
  )
) {
  headerValues.goteName =
    value;

  continue;
}

if (
  DATE_HEADER_KEYS.includes(
    key
  )
) {
  headerValues.playedAt =
    headerValues.playedAt ??
    value;
}

}

return {
title:
normalizeMetadataText({
value:
headerValues.title ??
headerValues.eventName,

    defaultValue:
      DEFAULT_GAME_METADATA
        .title
  }),

senteName:
  normalizeMetadataText({
    value:
      headerValues.senteName,

    defaultValue:
      DEFAULT_GAME_METADATA
        .senteName
  }),

goteName:
  normalizeMetadataText({
    value:
      headerValues.goteName,

    defaultValue:
      DEFAULT_GAME_METADATA
        .goteName
  }),

playedAt:
  normalizeNullableMetadataText(
    headerValues.playedAt
  )

};
}

/**

「Key：Value」形式のHeaderを解析する。
*/
function parseHeaderLine(
line
) {
const match =
line.match(
/^([^：:]+)：:$/
);

if (!match) {
return null;
}

const key =
match[1].trim();

const value =
match[2].trim();

if (
key === "" ||
value === ""
) {
return null;
}

return {
key,
value
};
}

/**

KIF本文からMove一覧を作る。
*/
function parseMoves(
lines
) {
const moves = [];

for (
let lineIndex = 0;
lineIndex < lines.length;
lineIndex += 1
) {
const originalLine =
lines[lineIndex];

const trimmedLine =
  originalLine.trim();

if (
  trimmedLine === "" ||
  trimmedLine.startsWith("#") ||
  trimmedLine.startsWith("*")
) {
  continue;
}

if (
  isMoveTableHeader(
    trimmedLine
  )
) {
  continue;
}

const moveLine =
  extractMoveLine(
    trimmedLine
  );

if (!moveLine) {
  continue;
}

const {
  moveNumber,
  notation
} = moveLine;

if (
  isGameResultNotation(
    notation
  )
) {
  break;
}

const expectedMoveNumber =
  moves.length + 1;

if (
  moveNumber !==
  expectedMoveNumber
) {
  throw createParseError({
    message:
      `${expectedMoveNumber}手目として読む行の手数が一致しません。`,

    details: {
      lineNumber:
        lineIndex + 1,

      expectedMoveNumber,

      receivedMoveNumber:
        moveNumber,

      line:
        originalLine
    }
  });
}

try {
  moves.push(
    parseMoveNotation({
      moveNumber,
      notation
    })
  );
} catch (error) {
  if (
    error instanceof
      ApplicationError
  ) {
    throw new ApplicationError({
      code:
        ERROR_CODES
          .KIF_PARSE_FAILED,

      message:
        `${moveNumber}手目を解析できませんでした。${error.message}`,

      cause:
        error,

      details: {
        lineNumber:
          lineIndex + 1,

        moveNumber,

        notation,

        line:
          originalLine
      }
    });
  }

  throw createParseError({
    message:
      `${moveNumber}手目の解析中に予期しないErrorが発生しました。`,

    cause:
      error,

    details: {
      lineNumber:
        lineIndex + 1,

      moveNumber,

      notation,

      line:
        originalLine
    }
  });
}

}

return moves;
}

/**

KIFの手数行を抽出する。


例：


1 ７六歩(77)


1 ７六歩(77) ( 0:00/00:00:00)
*/
function extractMoveLine(
line
) {
const match =
line.match(
/^(\d+)\s+(.+)$/
);

if (!match) {
return null;
}

const moveNumber =
Number(
match[1]
);

let notation =
match[2].trim();

/**

消費時間部分を除く。


例：


７六歩(77) ( 0:00/00:00:00)


↓


７六歩(77)
/
notation =
notation.replace(
/\s+(\s\d+:\d+/.*$/,
""
);

notation =
notation.trim();

return {
moveNumber,
notation
};
}

/**

一つのKIF表記をMoveへ変換する。
*/
function parseMoveNotation({
moveNumber,
notation
}) {
const normalizedNotation =
removePlayerSymbol(
notation
);

assertSupportedNotation(
normalizedNotation
);

/**

例：


７六歩(77)


７
移動先の筋


六
移動先の段


歩
駒


77
移動元
*/
const match =
normalizedNotation.match(
/^([１２３４５６７８９1-9])([一二三四五六七八九])(.+?)(([１２３４５６７８９1-9])([１２３４５６７８９1-9]))$/
);

if (!match) {
throw createParseError({
message:
"DAY21で対応している通常のKIF指し手形式ではありません。",

  details: {
    notation:
      normalizedNotation,

    expectedExample:
      "７六歩(77)"
  }
});

}

const destinationFile =
convertNumericCharacter(
match[1]
);

const destinationRank =
convertKanjiNumber(
match[2]
);

const piece =
normalizePieceName(
match[3]
);

const sourceFile =
convertNumericCharacter(
match[4]
);

const sourceRank =
convertNumericCharacter(
match[5]
);

return new Move({
moveNumber,

player:
  moveNumber % 2 === 1
    ? PLAYERS.SENTE
    : PLAYERS.GOTE,

piece,

from: {
  file:
    sourceFile,

  rank:
    sourceRank
},

to: {
  file:
    destinationFile,

  rank:
    destinationRank
},

promote:
  false,

drop:
  false,

notation:
  normalizedNotation

});
}

/**

▲・△が付いた表記にも対応する。


手番自体はmoveNumberの奇数・偶数で決定する。
/
function removePlayerSymbol(
notation
) {
return notation
.replace(
/^[▲△☗☖]\s/,
""
)
.trim();
}

/**

DAY21で未対応の表記を検出する。
*/
function assertSupportedNotation(
notation
) {
if (
notation.startsWith("同")
) {
throw createParseError({
message:
"「同」を使った指し手は現在未対応です。",

details: {
notation
}
});
}

if (
notation.includes("不成")
) {
throw createParseError({
message:
"「不成」を使った指し手は現在未対応です。",

  details: {
    notation
  }
});

}

if (
notation.includes("成")
) {
throw createParseError({
message:
"成る指し手・成駒の指し手は現在未対応です。",

  details: {
    notation
  }
});

}

if (
notation.includes("打")
) {
throw createParseError({
message:
"持ち駒を打つ指し手は現在未対応です。",

  details: {
    notation
  }
});

}
}

/**

駒名を標準化する。
*/
function normalizePieceName(
pieceText
) {
const normalized =
pieceText.trim();

const pieceAliases = {
王:
"玉",

玉:
  "玉",

飛:
  "飛",

角:
  "角",

金:
  "金",

銀:
  "銀",

桂:
  "桂",

香:
  "香",

歩:
  "歩"

};

const piece =
pieceAliases[
normalized
];

if (!piece) {
throw createParseError({
message:
`駒名「${normalized}」は現在未対応です。`,

  details: {
    piece:
      normalized
  }
});

}

return piece;
}

/**

全角数字・半角数字をNumberへ変換する。
*/
function convertNumericCharacter(
character
) {
const fullWidthNumbers = {
"１": 1,
"２": 2,
"３": 3,
"４": 4,
"５": 5,
"６": 6,
"７": 7,
"８": 8,
"９": 9
};

if (
Object.prototype
.hasOwnProperty.call(
fullWidthNumbers,
character
)
) {
return fullWidthNumbers[
character
];
}

const number =
Number(character);

if (
!Number.isInteger(number) ||
number < 1 ||
number > 9
) {
throw createParseError({
message:
"盤面座標を数字へ変換できませんでした。",

  details: {
    character
  }
});

}

return number;
}

/**

漢数字をNumberへ変換する。
*/
function convertKanjiNumber(
character
) {
const kanjiNumbers = {
一: 1,
二: 2,
三: 3,
四: 4,
五: 5,
六: 6,
七: 7,
八: 8,
九: 9
};

const number =
kanjiNumbers[
character
];

if (!number) {
throw createParseError({
message:
"段を表す漢数字を変換できませんでした。",

  details: {
    character
  }
});

}

return number;
}

/**

指し手表のHeaderか確認する。
*/
function isMoveTableHeader(
line
) {
return (
line.includes("手数") &&
line.includes("指手")
);
}

/**

対局終了を表す行か確認する。
*/
function isGameResultNotation(
notation
) {
return GAME_RESULT_WORDS.some(
(word) =>
notation.startsWith(
word
)
);
}

/**

Metadataの文字列を標準化する。
*/
function normalizeMetadataText({
value,
defaultValue
}) {
if (
typeof value !==
"string"
) {
return defaultValue;
}

const normalized =
value.trim();

return (
normalized === ""
? defaultValue
: normalized
);
}

/**

nullを許容するMetadataを標準化する。
*/
function normalizeNullableMetadataText(
value
) {
if (
typeof value !==
"string"
) {
return null;
}

const normalized =
value.trim();

return (
normalized === ""
? null
: normalized
);
}

/**

KIF Parse Errorを生成する。
*/
function createParseError({
message,
cause = null,
details = null
}) {
return new ApplicationError({
code:
ERROR_CODES
.KIF_PARSE_FAILED,

message,

cause,

details
});
}

const TITLE_HEADER_KEYS =
Object.freeze([
"表題",
"対局名"
]);

const EVENT_HEADER_KEYS =
Object.freeze([
"棋戦",
"棋戦名"
]);

const SENTE_HEADER_KEYS =
Object.freeze([
"先手",
"下手"
]);

const GOTE_HEADER_KEYS =
Object.freeze([
"後手",
"上手"
]);

const DATE_HEADER_KEYS =
Object.freeze([
"開始日時",
"対局日",
"日付"
]);

const GAME_RESULT_WORDS =
Object.freeze([
"投了",
"中断",
"千日手",
"持将棋",
"詰み",
"切れ負け",
"時間切れ",
"反則勝ち",
"反則負け",
"入玉勝ち",
"不戦勝",
"不戦敗"
]);
}