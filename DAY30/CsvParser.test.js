import test from "node:test";
import assert from "node:assert/strict";

import { parseCsv } from "./CsvParser.js";
import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

test("基本CSVをHeaderとRecordへ分ける", () => {
  const document = parseCsv("id,name\n1,A\n2,B");

  assert.deepEqual(document.headers, ["id", "name"]);
  assert.deepEqual(document.records, [
    { rowNumber: 2, values: ["1", "A"] },
    { rowNumber: 3, values: ["2", "B"] }
  ]);
});

test("Quoted comma・escaped quote・quoted line breakを扱う", () => {
  const document = parseCsv(
    'id,note\n1,"A,B"\n2,"He said ""OK"""\n3,"line1\nline2"'
  );

  assert.deepEqual(document.records.map((row) => row.values), [
    ["1", "A,B"],
    ["2", 'He said "OK"'],
    ["3", "line1\nline2"]
  ]);
  assert.equal(document.records[2].rowNumber, 4);
});

test("UTF-8 BOMとCRLFを扱う", () => {
  const document = parseCsv("\uFEFFid,name\r\n1,A\r\n");
  assert.deepEqual(document.headers, ["id", "name"]);
  assert.deepEqual(document.records[0].values, ["1", "A"]);
});

test("空行は既定でRecordから除外する", () => {
  const document = parseCsv("id,name\n\n1,A\n,\n");
  assert.equal(document.records.length, 1);
  assert.equal(document.records[0].rowNumber, 3);
});

test("閉じていないQuoteを拒否する", () => {
  assert.throws(
    () => parseCsv('id,note\n1,"broken'),
    (error) => hasErrorCode(error, ERROR_CODES.CSV_PARSE_ERROR)
  );
});

test("Quoted fieldの終了後に文字が続くCSVを拒否する", () => {
  assert.throws(
    () => parseCsv('id,note\n1,"A"x'),
    (error) => hasErrorCode(error, ERROR_CODES.CSV_PARSE_ERROR)
  );
});

test("Parser結果は外部から変更できない", () => {
  const document = parseCsv("id,name\n1,A");
  assert.equal(Object.isFrozen(document), true);
  assert.equal(Object.isFrozen(document.headers), true);
  assert.equal(Object.isFrozen(document.records[0].values), true);
  assert.throws(() => document.headers.push("x"), TypeError);
});
