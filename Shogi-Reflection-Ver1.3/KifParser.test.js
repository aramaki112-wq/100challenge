import test from "node:test";
import assert from "node:assert/strict";
import { KifParser } from "./KifParser.js";
import {
  KIF_IMPORT_ERROR_CODES,
  KIF_IMPORT_WARNING_CODES
} from "./KifImportErrors.js";
import { fixtureText } from "./KifTestHelpers.js";

function parse(fileName, overrides = {}) {
  return new KifParser().parse({
    text: fixtureText(fileName),
    sourceFileName: fileName,
    encoding: "utf-8",
    ...overrides
  });
}

function assertError(fileName, code) {
  assert.throws(
    () => parse(fileName),
    (error) => error.code === code
  );
}

test("正常なKIFを解析できる", () => {
  assert.equal(parse("normal-resign-utf8.kifu").sourceFormat, "KIF");
});

test("Headerから先手・後手を取得できる", () => {
  const dto = parse("normal-resign-utf8.kifu");
  assert.equal(dto.senteName, "勇太");
  assert.equal(dto.goteName, "ぴよ帝");
});

test("日本語曜日を含む開始日時を変換できる", () => {
  assert.equal(parse("normal-resign-utf8.kifu").playedAt, "2026-08-02T10:15:30");
});

test("棋戦・場所・手合割・持ち時間・消費時間を取得できる", () => {
  const dto = parse("normal-resign-utf8.kifu");
  assert.equal(dto.eventName, "練習対局");
  assert.equal(dto.place, "自宅");
  assert.equal(dto.handicap, "平手");
  assert.equal(dto.timeControl, "10分切れ負け");
  assert.match(dto.consumedTime, /00:04:10/);
});

test("投了から結果と終局理由を取得できる", () => {
  const dto = parse("normal-resign-utf8.kifu");
  assert.equal(dto.winner, "SENTE");
  assert.equal(dto.terminationReason, "投了");
});

test("総手数は終局表記を除く指し手数として取得する", () => {
  assert.equal(parse("normal-resign-utf8.kifu").totalMoves, 7);
});

test("指し手一覧と消費時間を取得できる", () => {
  const dto = parse("normal-resign-utf8.kifu");
  assert.equal(dto.moves[0].notation, "７六歩(77)");
  assert.equal(dto.moves[0].elapsed, "0:01");
  assert.equal(dto.moves[0].totalElapsed, "00:00:01");
});

test("元のKIF Textを改行を含めて保持する", () => {
  const raw = "開始日時：2026/08/02 10:00:00\r\n先手：A\r\n後手：B\r\n1 ７六歩(77)\r\n2 ３四歩(33)\r\n";
  const dto = new KifParser().parse({ text: raw });
  assert.equal(dto.rawKifText, raw);
});

test("指し手一覧Headerが省略されたKIFを解析できる", () => {
  const dto = parse("no-move-header.kifu");
  assert.equal(dto.totalMoves, 3);
  assert.ok(dto.warnings.some((item) => item.code === KIF_IMPORT_WARNING_CODES.MOVE_HEADER_OMITTED));
});

test("時間切れ終局を解析できる", () => {
  const dto = parse("timeout.kifu");
  assert.equal(dto.terminationReason, "切れ負け");
  assert.equal(dto.winner, "SENTE");
});

test("Headerが少ないKIFをWarning付きで解析できる", () => {
  const dto = parse("minimal-warning.kifu");
  assert.equal(dto.totalMoves, 2);
  assert.ok(dto.warnings.length >= 4);
});

test("未対応手合割をWarningとして保持する", () => {
  const dto = parse("handicap-warning.kifu");
  assert.ok(dto.warnings.some((item) => item.code === KIF_IMPORT_WARNING_CODES.UNSUPPORTED_HANDICAP));
});

test("未対応Headerを推測せずWarningと元値で保持する", () => {
  const dto = parse("unmapped-header-warning.kifu");
  assert.equal(dto.unmappedHeaders["大会管理番号"], "ABC-123");
  assert.ok(dto.warnings.some((item) => item.code === KIF_IMPORT_WARNING_CODES.HEADER_UNMAPPED));
});

test("ぴよ将棋の評価Commentを指し手一覧へ混ぜない", () => {
  assert.equal(parse("piyo-resign-utf8.kif").moves.length, 7);
});

test("公開されているぴよ将棋Sample構造を解析できる", () => {
  const dto = parse("piyo-official-published-sample.kifu");
  assert.equal(dto.totalMoves, 4);
  assert.equal(dto.senteName, "Lv2 ピヨ太");
  assert.equal(dto.goteName, "Lv3 ひよな");
});

test("KIF Import DTOは変更不能である", () => {
  const dto = parse("normal-resign-utf8.kifu");
  assert.throws(() => { dto.senteName = "変更"; }, TypeError);
  assert.throws(() => { dto.moves[0].notation = "変更"; }, TypeError);
});

test("空Textを拒否する", () => {
  assert.throws(
    () => new KifParser().parse({ text: "   " }),
    (error) => error.code === KIF_IMPORT_ERROR_CODES.KIF_FILE_EMPTY
  );
});

test("壊れたHeaderを拒否する", () => {
  assertError("broken-header.kifu", KIF_IMPORT_ERROR_CODES.KIF_HEADER_INVALID);
});

test("棋譜なしを拒否する", () => {
  assertError("broken-no-moves.kifu", KIF_IMPORT_ERROR_CODES.KIF_MOVES_NOT_FOUND);
});

test("不正な指し手表記を拒否する", () => {
  assertError("broken-move.kifu", KIF_IMPORT_ERROR_CODES.KIF_MOVE_INVALID);
});

test("同じ手数の重複を拒否する", () => {
  assertError("broken-duplicate.kifu", KIF_IMPORT_ERROR_CODES.KIF_MOVE_NUMBER_DUPLICATE);
});

test("手数の飛びを拒否する", () => {
  assertError("broken-gap.kifu", KIF_IMPORT_ERROR_CODES.KIF_MOVE_NUMBER_GAP);
});

test("終局行の総手数矛盾を拒否する", () => {
  assertError("broken-footer-conflict.kifu", KIF_IMPORT_ERROR_CODES.KIF_CONTENT_CONFLICT);
});

test("終局側と勝者の矛盾を拒否する", () => {
  assertError("broken-winner-conflict.kifu", KIF_IMPORT_ERROR_CODES.KIF_CONTENT_CONFLICT);
});

test("終局表記の後に指し手があるKIFを拒否する", () => {
  assertError("broken-after-termination.kifu", KIF_IMPORT_ERROR_CODES.KIF_TERMINATION_INVALID);
});
