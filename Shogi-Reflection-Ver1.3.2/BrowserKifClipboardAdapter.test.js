import test from "node:test";
import assert from "node:assert/strict";
import { BrowserKifClipboardAdapter } from "./BrowserKifClipboardAdapter.js";
import { KIF_IMPORT_ERROR_CODES } from "./KifImportErrors.js";

test("Browser ClipboardからKIF Textを読み取れる", async () => {
  const adapter = new BrowserKifClipboardAdapter({
    clipboard: { readText: async () => "先手：太郎" }
  });
  assert.equal(await adapter.readText(), "先手：太郎");
});

test("Clipboard APIがない場合は手動Pasteへ誘導するErrorを返す", async () => {
  const adapter = new BrowserKifClipboardAdapter({ clipboard: null });
  await assert.rejects(
    () => adapter.readText(),
    (error) => error.code === KIF_IMPORT_ERROR_CODES.KIF_CLIPBOARD_UNAVAILABLE && /長押し/.test(error.message)
  );
});

test("Clipboard権限拒否を低レベルErrorのまま返さない", async () => {
  const adapter = new BrowserKifClipboardAdapter({
    clipboard: { readText: async () => { throw new Error("NotAllowedError detail"); } }
  });
  await assert.rejects(
    () => adapter.readText(),
    (error) => error.code === KIF_IMPORT_ERROR_CODES.KIF_CLIPBOARD_READ_FAILED && !error.message.includes("NotAllowedError detail")
  );
});
