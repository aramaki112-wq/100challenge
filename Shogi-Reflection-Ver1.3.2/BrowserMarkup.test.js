import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");

test("Phase5 Browser画面に入力Form・Library・Markdown出力Panelがある", () => {
  for (const fragment of [
    'id="game-review-form"', 'name="kifuText"', 'name="observationTheme"',
    'id="key-position-list"', 'id="add-key-position"', 'src="./main.js"',
    'id="saved-review-library"', 'id="saved-review-list"', 'id="saved-review-detail"',
    'id="markdown-export-panel"', 'id="markdown-preview"',
    'id="copy-markdown"', 'id="download-markdown"'
  ]) assert.equal(html.includes(fragment), true, fragment);
});

test("FACT・INTERPRETATION・HYPOTHESISの案内を分離表示する", () => {
  assert.match(html, /FACT/);
  assert.match(html, /INTERPRETATION/);
  assert.match(html, /HYPOTHESIS/);
});

test("Backup・Restore・Browser削除の操作境界を持つ", () => {
  assert.match(html, /id="download-backup"/);
  assert.match(html, /id="restore-backup"/);
  assert.match(html, /id="delete-browser"/);
});

test("保存済み対局から詳細・編集・削除へ進む説明がある", () => {
  assert.match(html, /詳細確認・再編集・削除/);
  assert.match(html, /一覧の「編集する」/);
});


test("Obsidianと次局用Observation Cardの成果物案内がある", () => {
  assert.match(html, /OBSIDIAN OUTPUT/);
  assert.match(html, /次局用Observation Card/);
  assert.match(html, /Obsidianへの登録/);
});
