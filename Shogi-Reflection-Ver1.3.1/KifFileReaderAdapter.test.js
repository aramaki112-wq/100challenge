import test from "node:test";
import assert from "node:assert/strict";
import { KifFileReaderAdapter } from "./KifFileReaderAdapter.js";
import {
  KIF_IMPORT_ERROR_CODES,
  KIF_IMPORT_WARNING_CODES
} from "./KifImportErrors.js";
import {
  createFileLike,
  fixtureBytes
} from "./KifTestHelpers.js";

test("File未選択を拒否する", async () => {
  await assert.rejects(
    () => new KifFileReaderAdapter().read(),
    (error) => error.code === KIF_IMPORT_ERROR_CODES.KIF_FILE_NOT_SELECTED
  );
});

test("空Fileを拒否する", async () => {
  await assert.rejects(
    () => new KifFileReaderAdapter().read({ file: createFileLike("empty.kif", Buffer.alloc(0)) }),
    (error) => error.code === KIF_IMPORT_ERROR_CODES.KIF_FILE_EMPTY
  );
});

test("KIFではない拡張子を拒否する", async () => {
  await assert.rejects(
    () => new KifFileReaderAdapter().read({ file: createFileLike("game.txt", "text") }),
    (error) => error.code === KIF_IMPORT_ERROR_CODES.KIF_FILE_EXTENSION_INVALID
  );
});

test("KIFではない内容を拒否する", async () => {
  await assert.rejects(
    () => new KifFileReaderAdapter().read({ file: createFileLike("game.kif", "ただの文章です") }),
    (error) => error.code === KIF_IMPORT_ERROR_CODES.INVALID_KIF_FORMAT
  );
});

test("極端に大きいFileを拒否する", async () => {
  const file = createFileLike("game.kif", "1234567890");
  await assert.rejects(
    () => new KifFileReaderAdapter({ maxBytes: 5 }).read({ file }),
    (error) => error.code === KIF_IMPORT_ERROR_CODES.KIF_FILE_TOO_LARGE
  );
});

test("File Reader Errorを専用Errorへ変換する", async () => {
  const file = {
    name: "game.kif",
    size: 10,
    async arrayBuffer() { throw new Error("disk error"); }
  };
  await assert.rejects(
    () => new KifFileReaderAdapter().read({ file }),
    (error) => error.code === KIF_IMPORT_ERROR_CODES.KIF_READ_FAILED
  );
});

test("UTF-8の.kifuを読み取れる", async () => {
  const result = await new KifFileReaderAdapter().read({
    file: createFileLike("normal.kifu", fixtureBytes("normal-resign-utf8.kifu"))
  });
  assert.equal(result.encoding, "utf-8");
  assert.match(result.text, /練習対局/);
});

test("Shift_JISの.kifを読み取れる", async () => {
  const result = await new KifFileReaderAdapter().read({
    file: createFileLike("piyo.kif", fixtureBytes("piyo-resign-shiftjis.kif"))
  });
  assert.equal(result.encoding, "shift_jis");
  assert.match(result.text, /ぴよ将棋/);
});

test("UTF-8内容の.kifはWarning付きで読み取る", async () => {
  const result = await new KifFileReaderAdapter().read({
    file: createFileLike("piyo.kif", fixtureBytes("piyo-resign-utf8.kif"))
  });
  assert.equal(result.encoding, "utf-8");
  assert.ok(result.warnings.some((item) => item.code === KIF_IMPORT_WARNING_CODES.ENCODING_EXTENSION_MISMATCH));
});

test("読めないEncodingを拒否する", async () => {
  const bytes = Buffer.from([0, 1, 2, 3, 4, 5, 6]);
  await assert.rejects(
    () => new KifFileReaderAdapter().read({ file: createFileLike("bad.kif", bytes) }),
    (error) => [
      KIF_IMPORT_ERROR_CODES.KIF_ENCODING_UNSUPPORTED,
      KIF_IMPORT_ERROR_CODES.INVALID_KIF_FORMAT
    ].includes(error.code)
  );
});
