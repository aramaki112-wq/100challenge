import { KifImportDto } from "./KifImportDto.js";
import {
  createKifImportWarning,
  KIF_IMPORT_ERROR_CODES,
  KIF_IMPORT_WARNING_CODES,
  KifImportError
} from "./KifImportErrors.js";

const HEADER_PROPERTY_BY_NAME = Object.freeze({
  "対局日": "playedAtRaw",
  "開始日時": "startedAtRaw",
  "終了日時": "endedAtRaw",
  "先手": "senteName",
  "後手": "goteName",
  "下手": "senteName",
  "上手": "goteName",
  "棋戦": "eventName",
  "場所": "place",
  "表題": "title",
  "戦型": "openingName",
  "手合割": "handicap",
  "持ち時間": "timeControl",
  "消費時間": "consumedTime",
  "結果": "resultHeader"
});

const RECOGNIZED_HEADER_NAMES = Object.freeze(Object.keys(HEADER_PROPERTY_BY_NAME));
const SUPPORTED_HANDICAPS = new Set(["平手"]);
const DRAW_TERMINATIONS = new Set(["千日手", "持将棋", "中断"]);
const LOSING_SIDE_TERMINATIONS = new Set([
  "投了",
  "詰み",
  "切れ負け",
  "時間切れ",
  "反則負け",
  "不戦敗"
]);
const WINNING_SIDE_TERMINATIONS = new Set([
  "反則勝ち",
  "入玉勝ち",
  "不戦勝"
]);
const ALL_TERMINATIONS = new Set([
  ...DRAW_TERMINATIONS,
  ...LOSING_SIDE_TERMINATIONS,
  ...WINNING_SIDE_TERMINATIONS
]);

const FULL_WIDTH_DIGITS = "０１２３４５６７８９";
const PIECE_PATTERN = "成香|成桂|成銀|龍|竜|馬|玉|王|飛|角|金|銀|桂|香|歩|と";
const MOVE_NOTATION_PATTERN = new RegExp(
  `^(?:[１２３４５６７８９1-9][一二三四五六七八九]|同(?:　| )*)(?:${PIECE_PATTERN})(?:(?:右|左|直|寄|引|上|行|入|成|不成|打))*?(?:\\([１２３４５６７８９1-9][１２３４５６７８９1-9]\\))?$`
);
const MOVE_LINE_PATTERN = /^\s*([０-９0-9]+)\s+(.+?)\s*$/;
const TIME_SUFFIX_PATTERN = /\(\s*(\d{1,3}:\d{2})\s*\/\s*(\d{1,3}:\d{2}:\d{2})\s*\)\s*$/;

function normalizeLineEndings(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");
}

function toHalfWidthDigits(value) {
  return String(value).replace(/[０-９]/g, (character) =>
    String(FULL_WIDTH_DIGITS.indexOf(character))
  );
}

function parseDateTime(rawValue) {
  if (!rawValue) return null;
  const normalized = toHalfWidthDigits(rawValue)
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/年/g, "/")
    .replace(/月/g, "/")
    .replace(/日/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const match = normalized.match(
    /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!match) return null;

  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  const parts = [
    Number(year), Number(month), Number(day),
    Number(hour), Number(minute), Number(second)
  ];
  const [y, m, d, h, min, s] = parts;
  const candidate = new Date(Date.UTC(y, m - 1, d, h, min, s));
  if (
    candidate.getUTCFullYear() !== y ||
    candidate.getUTCMonth() !== m - 1 ||
    candidate.getUTCDate() !== d ||
    h > 23 || min > 59 || s > 59
  ) {
    return null;
  }

  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseMoveLine(line, lineNumber) {
  const match = line.match(MOVE_LINE_PATTERN);
  if (!match) return null;

  const moveNumber = Number(toHalfWidthDigits(match[1]));
  let notation = match[2].trim();
  let elapsed = null;
  let totalElapsed = null;
  const timeMatch = notation.match(TIME_SUFFIX_PATTERN);
  if (timeMatch) {
    elapsed = timeMatch[1];
    totalElapsed = timeMatch[2];
    notation = notation.slice(0, timeMatch.index).trim();
  }

  return {
    moveNumber,
    notation,
    elapsed,
    totalElapsed,
    lineNumber,
    rawLine: line
  };
}

function sideForMoveNumber(moveNumber) {
  return moveNumber % 2 === 1 ? "SENTE" : "GOTE";
}

function oppositeSide(side) {
  return side === "SENTE" ? "GOTE" : side === "GOTE" ? "SENTE" : null;
}

function winnerFromTermination(terminationReason, terminationMoveNumber) {
  if (!terminationReason || !Number.isInteger(terminationMoveNumber)) return null;
  const actingSide = sideForMoveNumber(terminationMoveNumber);
  if (LOSING_SIDE_TERMINATIONS.has(terminationReason)) return oppositeSide(actingSide);
  if (WINNING_SIDE_TERMINATIONS.has(terminationReason)) return actingSide;
  return null;
}

function parseFooter(line) {
  let match = line.match(/^まで\s*([０-９0-9]+)手で(先手|下手)の勝ち$/);
  if (match) {
    return {
      totalMoves: Number(toHalfWidthDigits(match[1])),
      winner: "SENTE",
      terminationReason: null,
      resultText: line
    };
  }

  match = line.match(/^まで\s*([０-９0-9]+)手で(後手|上手)の勝ち$/);
  if (match) {
    return {
      totalMoves: Number(toHalfWidthDigits(match[1])),
      winner: "GOTE",
      terminationReason: null,
      resultText: line
    };
  }

  match = line.match(/^まで\s*([０-９0-9]+)手で(千日手|持将棋|中断)$/);
  if (match) {
    return {
      totalMoves: Number(toHalfWidthDigits(match[1])),
      winner: null,
      terminationReason: match[2],
      resultText: line
    };
  }

  return null;
}

function winnerFromResultHeader(rawValue) {
  if (!rawValue) return null;
  const value = String(rawValue).trim();
  if (/(先手|下手).*(勝|勝ち)/.test(value)) return "SENTE";
  if (/(後手|上手).*(勝|勝ち)/.test(value)) return "GOTE";
  if (/(千日手|持将棋|引き分け|中断)/.test(value)) return null;
  return undefined;
}

function isIgnorableNonMoveLine(line) {
  if (line === "") return true;
  if (/^[#*&$]/.test(line)) return true;
  if (/^手数[-ー]+指手/.test(line)) return true;
  if (/^[+\-|vV歩香桂銀金角飛玉王と成馬龍竜\s　]+$/.test(line)) return true;
  if (/^(先手|後手|下手|上手)の持駒[：:].*$/.test(line)) return true;
  return false;
}

export class KifParser {
  parse({
    text,
    sourceFileName = "",
    byteLength = null,
    encoding = null,
    readerWarnings = []
  } = {}) {
    const rawKifText = String(text ?? "").replace(/^\uFEFF/, "");
    const normalizedKifText = normalizeLineEndings(rawKifText);
    if (normalizedKifText.trim() === "") {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_FILE_EMPTY,
        "KIF Textが空です。"
      );
    }

    const lines = normalizedKifText.split("\n");
    const headerValues = {};
    const unmappedHeaders = {};
    const warnings = [...readerWarnings];
    const moves = [];
    let moveHeaderFound = false;
    let firstMoveLineIndex = -1;
    let terminationReason = null;
    let terminationMoveNumber = null;
    let footer = null;
    let expectedMoveNumber = 1;
    let sawRecognizedHeader = false;

    for (let index = 0; index < lines.length; index += 1) {
      const originalLine = lines[index];
      const line = originalLine.trim();
      if (line === "" || /^[#*&$]/.test(line)) continue;

      if (/^手数[-ー]+指手/.test(line)) {
        moveHeaderFound = true;
        continue;
      }

      const moveCandidate = parseMoveLine(originalLine, index + 1);
      if (moveCandidate) {
        firstMoveLineIndex = firstMoveLineIndex < 0 ? index : firstMoveLineIndex;
        continue;
      }

      if (firstMoveLineIndex >= 0) continue;

      for (const headerName of RECOGNIZED_HEADER_NAMES) {
        if (
          line.startsWith(headerName) &&
          !new RegExp(`^${headerName}[：:]`).test(line)
        ) {
          throw new KifImportError(
            KIF_IMPORT_ERROR_CODES.KIF_HEADER_INVALID,
            `「${headerName}」Headerの区切りが不正です。`,
            { lineNumber: index + 1, line: originalLine }
          );
        }
      }

      const headerMatch = line.match(/^([^：:]+)[：:]\s*(.*)$/);
      if (!headerMatch) continue;

      const headerName = headerMatch[1].trim();
      const headerValue = headerMatch[2].trim();
      const propertyName = HEADER_PROPERTY_BY_NAME[headerName];
      if (propertyName) {
        sawRecognizedHeader = true;
        headerValues[propertyName] = headerValue || null;
      } else {
        unmappedHeaders[headerName] = headerValue;
        warnings.push(createKifImportWarning(
          KIF_IMPORT_WARNING_CODES.HEADER_UNMAPPED,
          `未対応Header「${headerName}」を元Dataのまま保持しました。`,
          { headerName, lineNumber: index + 1 }
        ));
      }
    }

    for (let index = 0; index < lines.length; index += 1) {
      const originalLine = lines[index];
      const line = originalLine.trim();
      if (line === "") continue;

      const footerCandidate = parseFooter(line);
      if (footerCandidate) {
        if (footer) {
          throw new KifImportError(
            KIF_IMPORT_ERROR_CODES.KIF_TERMINATION_INVALID,
            "終局行が複数あります。",
            { lineNumber: index + 1, line: originalLine }
          );
        }
        footer = { ...footerCandidate, lineNumber: index + 1 };
        continue;
      }

      const parsedMove = parseMoveLine(originalLine, index + 1);
      if (!parsedMove) {
        if (isIgnorableNonMoveLine(line)) continue;
        if (index < firstMoveLineIndex || firstMoveLineIndex < 0) continue;
        throw new KifImportError(
          KIF_IMPORT_ERROR_CODES.KIF_MOVE_INVALID,
          "不正な指し手行があります。",
          { lineNumber: index + 1, line: originalLine }
        );
      }

      if (!Number.isInteger(parsedMove.moveNumber) || parsedMove.moveNumber < 1) {
        throw new KifImportError(
          KIF_IMPORT_ERROR_CODES.KIF_MOVE_INVALID,
          "手数は1以上の整数である必要があります。",
          { lineNumber: index + 1, moveNumber: parsedMove.moveNumber }
        );
      }
      if (parsedMove.moveNumber < expectedMoveNumber) {
        throw new KifImportError(
          KIF_IMPORT_ERROR_CODES.KIF_MOVE_NUMBER_DUPLICATE,
          "同じ手数が重複しています。",
          { lineNumber: index + 1, moveNumber: parsedMove.moveNumber }
        );
      }
      if (parsedMove.moveNumber > expectedMoveNumber) {
        throw new KifImportError(
          KIF_IMPORT_ERROR_CODES.KIF_MOVE_NUMBER_GAP,
          "手数が飛んでいます。",
          {
            lineNumber: index + 1,
            expectedMoveNumber,
            actualMoveNumber: parsedMove.moveNumber
          }
        );
      }

      if (ALL_TERMINATIONS.has(parsedMove.notation)) {
        if (terminationReason !== null) {
          throw new KifImportError(
            KIF_IMPORT_ERROR_CODES.KIF_TERMINATION_INVALID,
            "終局表記が複数あります。",
            { lineNumber: index + 1, line: originalLine }
          );
        }
        terminationReason = parsedMove.notation;
        terminationMoveNumber = parsedMove.moveNumber;
        expectedMoveNumber += 1;
        continue;
      }

      if (terminationReason !== null) {
        throw new KifImportError(
          KIF_IMPORT_ERROR_CODES.KIF_TERMINATION_INVALID,
          "終局表記の後に指し手があります。",
          { lineNumber: index + 1, line: originalLine }
        );
      }

      if (!MOVE_NOTATION_PATTERN.test(parsedMove.notation)) {
        throw new KifImportError(
          KIF_IMPORT_ERROR_CODES.KIF_MOVE_INVALID,
          "対応できない、または不正な指し手表記があります。",
          {
            lineNumber: index + 1,
            moveNumber: parsedMove.moveNumber,
            notation: parsedMove.notation
          }
        );
      }

      moves.push(Object.freeze(parsedMove));
      expectedMoveNumber += 1;
    }

    if (!sawRecognizedHeader && moves.length === 0) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.INVALID_KIF_FORMAT,
        "KIFのHeaderと指し手を確認できませんでした。"
      );
    }
    if (moves.length === 0) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_MOVES_NOT_FOUND,
        "有効な指し手が1手もありません。"
      );
    }

    if (!moveHeaderFound) {
      warnings.push(createKifImportWarning(
        KIF_IMPORT_WARNING_CODES.MOVE_HEADER_OMITTED,
        "指し手一覧Headerがありませんが、KIF仕様上省略可能なため指し手行から解析しました。"
      ));
    }

    if (footer && footer.totalMoves !== moves.length) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_CONTENT_CONFLICT,
        "終局行の総手数と解析した指し手数が一致しません。",
        { footerMoves: footer.totalMoves, parsedMoves: moves.length }
      );
    }

    const winnerFromTerminationLine = winnerFromTermination(
      terminationReason,
      terminationMoveNumber
    );
    if (
      footer?.winner &&
      winnerFromTerminationLine &&
      footer.winner !== winnerFromTerminationLine
    ) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_CONTENT_CONFLICT,
        "終局表記から導かれる勝者と終局行の勝者が一致しません。",
        {
          terminationWinner: winnerFromTerminationLine,
          footerWinner: footer.winner
        }
      );
    }

    if (
      footer?.terminationReason &&
      terminationReason &&
      footer.terminationReason !== terminationReason
    ) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_CONTENT_CONFLICT,
        "指し手欄と終局行の終局理由が一致しません。",
        {
          moveTerminationReason: terminationReason,
          footerTerminationReason: footer.terminationReason
        }
      );
    }

    const resultHeaderWinner = winnerFromResultHeader(headerValues.resultHeader);
    const resolvedWinner = footer?.winner ?? winnerFromTerminationLine ?? null;
    if (
      resultHeaderWinner !== undefined &&
      resultHeaderWinner !== null &&
      resolvedWinner !== null &&
      resultHeaderWinner !== resolvedWinner
    ) {
      throw new KifImportError(
        KIF_IMPORT_ERROR_CODES.KIF_CONTENT_CONFLICT,
        "Headerの結果と棋譜内容から導かれる勝者が一致しません。",
        {
          resultHeader: headerValues.resultHeader,
          resolvedWinner
        }
      );
    }

    const resolvedTerminationReason = terminationReason ?? footer?.terminationReason ?? null;
    if (!resolvedTerminationReason) {
      warnings.push(createKifImportWarning(
        KIF_IMPORT_WARNING_CODES.TERMINATION_NOT_FOUND,
        "終局理由を取得できませんでした。"
      ));
    }
    if (!resolvedWinner && !DRAW_TERMINATIONS.has(resolvedTerminationReason)) {
      warnings.push(createKifImportWarning(
        KIF_IMPORT_WARNING_CODES.RESULT_UNKNOWN,
        "勝敗を確定できませんでした。"
      ));
    }

    const startedAt = parseDateTime(headerValues.startedAtRaw);
    const explicitPlayedAt = parseDateTime(headerValues.playedAtRaw);
    const endedAt = parseDateTime(headerValues.endedAtRaw);
    const dateFields = [
      ["playedAt", headerValues.playedAtRaw, explicitPlayedAt],
      ["startedAt", headerValues.startedAtRaw, startedAt],
      ["endedAt", headerValues.endedAtRaw, endedAt]
    ];
    for (const [fieldName, rawValue, parsedValue] of dateFields) {
      if (rawValue && !parsedValue) {
        warnings.push(createKifImportWarning(
          KIF_IMPORT_WARNING_CODES.VALUE_INVALID,
          `${fieldName}をApplication形式へ変換できませんでした。元の値はKIF Textに保持されています。`,
          { fieldName, rawValue }
        ));
      }
    }

    if (!headerValues.senteName) {
      warnings.push(createKifImportWarning(
        KIF_IMPORT_WARNING_CODES.HEADER_MISSING,
        "先手名がKIFにありません。",
        { fieldName: "senteName" }
      ));
    }
    if (!headerValues.goteName) {
      warnings.push(createKifImportWarning(
        KIF_IMPORT_WARNING_CODES.HEADER_MISSING,
        "後手名がKIFにありません。",
        { fieldName: "goteName" }
      ));
    }
    if (
      headerValues.handicap &&
      !SUPPORTED_HANDICAPS.has(headerValues.handicap)
    ) {
      warnings.push(createKifImportWarning(
        KIF_IMPORT_WARNING_CODES.UNSUPPORTED_HANDICAP,
        `手合割「${headerValues.handicap}」はVer.1.1の盤面処理対象外です。KIF Textと基本情報としてはImportできます。`,
        { handicap: headerValues.handicap }
      ));
    }

    return new KifImportDto({
      sourceFileName,
      byteLength,
      encoding,
      playedAt: explicitPlayedAt ?? startedAt,
      startedAt,
      endedAt,
      senteName: headerValues.senteName ?? null,
      goteName: headerValues.goteName ?? null,
      eventName: headerValues.eventName ?? null,
      place: headerValues.place ?? null,
      title: headerValues.title ?? null,
      openingName: headerValues.openingName ?? null,
      handicap: headerValues.handicap ?? null,
      timeControl: headerValues.timeControl ?? null,
      consumedTime: headerValues.consumedTime ?? null,
      winner: resolvedWinner,
      resultText: footer?.resultText ?? headerValues.resultHeader ?? resolvedTerminationReason,
      terminationReason: resolvedTerminationReason,
      totalMoves: moves.length,
      moves,
      rawKifText,
      warnings,
      unmappedHeaders
    });
  }
}
