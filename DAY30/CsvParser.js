import {
  ERROR_CODES,
  createImportError
} from "./DiagnosisErrors.js";

function freezeRecord(record) {
  return Object.freeze({
    rowNumber: record.rowNumber,
    values: Object.freeze([...record.values])
  });
}

function assertCsvText(csvText) {
  if (typeof csvText !== "string") {
    throw createImportError(
      ERROR_CODES.INVALID_CSV_TEXT,
      "csvText must be a string.",
      { csvText }
    );
  }

  return csvText.startsWith("\uFEFF")
    ? csvText.slice(1)
    : csvText;
}

function assertDelimiter(delimiter) {
  if (
    typeof delimiter !== "string" ||
    delimiter.length !== 1 ||
    delimiter === '"' ||
    delimiter === "\r" ||
    delimiter === "\n"
  ) {
    throw createImportError(
      ERROR_CODES.INVALID_ARGUMENT,
      "delimiter must be one non-quote, non-line-break character.",
      { delimiter }
    );
  }

  return delimiter;
}

function parseError(message, details) {
  return createImportError(
    ERROR_CODES.CSV_PARSE_ERROR,
    message,
    details
  );
}

/**
 * RFC 4180に近い最小CSV Parser。
 * Quoted comma・escaped quote・quoted line break・CRLFを扱う。
 */
export function parseCsv(csvText, {
  delimiter = ",",
  skipEmptyRecords = true
} = {}) {
  const text = assertCsvText(csvText);
  const separator = assertDelimiter(delimiter);

  if (typeof skipEmptyRecords !== "boolean") {
    throw createImportError(
      ERROR_CODES.INVALID_BOOLEAN,
      "skipEmptyRecords must be a boolean.",
      { skipEmptyRecords }
    );
  }

  const records = [];
  let values = [];
  let field = "";
  let inQuotes = false;
  let quoteClosed = false;
  let lineNumber = 1;
  let recordStartLine = 1;

  const appendRecord = () => {
    const completeValues = [...values, field];
    const empty = completeValues.every((value) => value === "");

    if (!(skipEmptyRecords && empty)) {
      records.push(freezeRecord({
        rowNumber: recordStartLine,
        values: completeValues
      }));
    }

    values = [];
    field = "";
    quoteClosed = false;
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          quoteClosed = true;
        }
        continue;
      }

      if (character === "\r") {
        if (text[index + 1] === "\n") {
          index += 1;
        }
        field += "\n";
        lineNumber += 1;
        continue;
      }

      if (character === "\n") {
        field += "\n";
        lineNumber += 1;
        continue;
      }

      field += character;
      continue;
    }

    if (quoteClosed) {
      if (character === separator) {
        values.push(field);
        field = "";
        quoteClosed = false;
        continue;
      }

      if (character === "\r" || character === "\n") {
        appendRecord();
        if (character === "\r" && text[index + 1] === "\n") {
          index += 1;
        }
        lineNumber += 1;
        recordStartLine = lineNumber;
        continue;
      }

      throw parseError(
        "A quoted field must be followed by a delimiter or line break.",
        {
          lineNumber,
          columnNumber: index + 1,
          character
        }
      );
    }

    if (character === '"') {
      if (field !== "") {
        throw parseError(
          "A quote may only start at the beginning of a field.",
          {
            lineNumber,
            columnNumber: index + 1
          }
        );
      }
      inQuotes = true;
      continue;
    }

    if (character === separator) {
      values.push(field);
      field = "";
      continue;
    }

    if (character === "\r" || character === "\n") {
      appendRecord();
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      lineNumber += 1;
      recordStartLine = lineNumber;
      continue;
    }

    field += character;
  }

  if (inQuotes) {
    throw parseError(
      "The CSV contains an unterminated quoted field.",
      { lineNumber, recordStartLine }
    );
  }

  const endedWithLineBreak = /(?:\r\n|\r|\n)$/.test(text);
  if (!endedWithLineBreak || values.length > 0 || field !== "" || quoteClosed) {
    appendRecord();
  }

  if (records.length === 0) {
    return Object.freeze({
      headers: Object.freeze([]),
      records: Object.freeze([])
    });
  }

  const [headerRecord, ...dataRecords] = records;
  return Object.freeze({
    headers: Object.freeze([...headerRecord.values]),
    headerRowNumber: headerRecord.rowNumber,
    records: Object.freeze([...dataRecords])
  });
}
