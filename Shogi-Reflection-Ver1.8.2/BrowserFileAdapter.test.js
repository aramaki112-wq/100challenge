import test from "node:test";
import assert from "node:assert/strict";
import { BrowserFileAdapter } from "./BrowserFileAdapter.js";

test("TextをBrowser Download境界へ渡せる", () => {
  const calls = [];
  const anchor = { hidden: false, click() { calls.push("click"); }, remove() { calls.push("remove"); } };
  const documentObject = { createElement(name) { calls.push(name); return anchor; }, body: { append(value) { calls.push(value === anchor ? "append" : "other"); } } };
  const urlObject = { createObjectURL(blob) { calls.push(blob instanceof Blob ? "blob" : "not-blob"); return "blob:test"; }, revokeObjectURL(url) { calls.push(url); } };
  const result = new BrowserFileAdapter({ documentObject, urlObject }).downloadText({ fileName: "backup.json", text: "{}" });
  assert.equal(result.status, "DOWNLOADED");
  assert.equal(anchor.download, "backup.json");
  assert.deepEqual(calls, ["blob", "a", "append", "click", "remove", "blob:test"]);
});

test("Browser FileのTextを読める", async () => {
  assert.equal(await new BrowserFileAdapter().readText({ text: async () => "content" }), "content");
});
