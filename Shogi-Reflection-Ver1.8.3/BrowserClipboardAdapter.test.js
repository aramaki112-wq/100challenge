import test from "node:test";
import assert from "node:assert/strict";
import { BrowserClipboardAdapter } from "./BrowserClipboardAdapter.js";
import { MARKDOWN_EXPORT_ERROR_CODES, MarkdownExportError } from "./MarkdownExportErrors.js";

test("Markdown文字列をClipboardへCopyする", async () => {
  let copied = "";
  const adapter = new BrowserClipboardAdapter({ clipboard: { writeText: async (text) => { copied = text; } } });
  const result = await adapter.writeText("# Card");
  assert.equal(copied, "# Card");
  assert.equal(result.status, "COPIED");
});

test("Clipboard APIがない場合は理由付きErrorを返す", async () => {
  const adapter = new BrowserClipboardAdapter({ clipboard: null });
  await assert.rejects(
    adapter.writeText("text"),
    (error) => error instanceof MarkdownExportError && error.code === MARKDOWN_EXPORT_ERROR_CODES.CLIPBOARD_UNAVAILABLE
  );
});

test("Clipboard書込失敗を専用Errorへ変換する", async () => {
  const adapter = new BrowserClipboardAdapter({ clipboard: { writeText: async () => { throw new Error("denied"); } } });
  await assert.rejects(
    adapter.writeText("text"),
    (error) => error instanceof MarkdownExportError && error.code === MARKDOWN_EXPORT_ERROR_CODES.CLIPBOARD_WRITE_FAILED
  );
});
