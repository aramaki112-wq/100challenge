import test from "node:test";
import assert from "node:assert/strict";
import { KifPastedTextAdapter } from "./KifPastedTextAdapter.js";
import { KIF_IMPORT_ERROR_CODES } from "./KifImportErrors.js";

const adapter = new KifPastedTextAdapter();

test("貼り付けたKIF Textを既存File Readerへ渡せるFile-like Objectへ変換できる", async () => {
  const text = "先手：太郎\n後手：次郎\n手数----指手\n1 ７六歩(77)";
  const file = adapter.toFile({ text });
  assert.equal(file.name, "clipboard-paste.kifu");
  assert.equal(file.type, "text/plain;charset=utf-8");
  assert.equal(file.size, new TextEncoder().encode(text).byteLength);
  assert.equal(new TextDecoder().decode(await file.arrayBuffer()), text);
});

test("貼り付けSource名を指定できる", () => {
  const file = adapter.toFile({ text: "先手：太郎", sourceFileName: "piyo-clipboard.kifu" });
  assert.equal(file.name, "piyo-clipboard.kifu");
});

test("空の貼り付けTextを拒否する", () => {
  assert.throws(
    () => adapter.toFile({ text: "   \n" }),
    (error) => error.code === KIF_IMPORT_ERROR_CODES.KIF_FILE_EMPTY
  );
});

test("生成したFile-like Objectは外側からPropertyを書き換えられない", () => {
  const file = adapter.toFile({ text: "先手：太郎" });
  assert.equal(Object.isFrozen(file), true);
});
