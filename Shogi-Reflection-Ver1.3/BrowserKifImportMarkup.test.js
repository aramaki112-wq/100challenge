import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("./main.js", import.meta.url), "utf8");
const style = fs.readFileSync(new URL("./style.css", import.meta.url), "utf8");

test("Browser画面にKIF File選択がある", () => {
  assert.match(html, /id="kif-file-input"[^>]+accept="\.kif,\.kifu,text\/plain"/);
});

test("Browser画面にDrag & Drop領域がある", () => {
  assert.ok(html.includes('id="kif-drop-zone"'));
  assert.match(main, /kifDropZone\.addEventListener\("drop"/);
});

test("Import Previewに正式確認項目がある", () => {
  for (const name of [
    "preview-file", "preview-date", "preview-sente", "preview-gote",
    "preview-result", "preview-moves", "preview-summary",
    "preview-warning"
  ]) {
    assert.ok(html.includes(name.replace("preview-warning", "preview-warnings")));
  }
});

test("Import Previewに自分の手番選択がある", () => {
  assert.ok(html.includes('id="kif-my-side"'));
  assert.ok(html.includes('value="SENTE"'));
  assert.ok(html.includes('value="GOTE"'));
});

test("Import Previewに反映と中止Buttonがある", () => {
  assert.ok(html.includes('id="apply-kif-import"'));
  assert.ok(html.includes('id="cancel-kif-import"'));
});

test("File選択はImport Controllerへ接続される", () => {
  assert.match(main, /kif-file-input[\s\S]+previewKifFile/);
});

test("Import反映後に未保存であることを表示する", () => {
  assert.ok(main.includes("まだRepositoryやBrowserには保存されていません"));
});

test("Import失敗時にFormを変更する処理がない", () => {
  const previewFunction = main.slice(
    main.indexOf("async function previewKifFile"),
    main.indexOf("function applyPendingKifImport")
  );
  assert.ok(!previewFunction.includes("formView.loadInput"));
});

test("既存Markdown ExportとObservation Card操作を維持する", () => {
  assert.ok(html.includes('id="markdown-export-panel"'));
  assert.ok(main.includes("createObservationCardMarkdown"));
  assert.ok(main.includes("createGameReviewMarkdown"));
});

test("KIF Import UIはMobile表示へ対応する", () => {
  assert.match(style, /\.kif-import-controls/);
  assert.match(style, /@media \(max-width:800px\)[\s\S]+\.kif-import-controls/);
});
