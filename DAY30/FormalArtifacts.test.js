import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const rootFiles = ["README.md", "CHANGELOG.md", "LICENSE", "challenge.md", "Design-Decisions.md"];
const obsidianFiles = ["Explanation.md", "Thought Process.md", "Design Novel.md", "Design Handbook.md", "Design Rules.md", "Review Checklist.md", "Learning Roadmap.md"];

test("GitHub正式Fileが存在し空ではない", async () => {
  for (const name of rootFiles) {
    const info = await stat(path.join(root, name));
    assert.ok(info.size > 100, `${name} should contain formal content`);
  }
});

test("Obsidian正式成果物7点が存在し空ではない", async () => {
  for (const name of obsidianFiles) {
    const info = await stat(path.join(root, "Obsidian", name));
    assert.ok(info.size > 300, `${name} should contain formal content`);
  }
});

test("READMEはDAY30の四つの診断StatusとResult Validityを説明する", async () => {
  const text = await readFile(path.join(root, "README.md"), "utf8");
  for (const word of ["FEASIBLE", "PARTIALLY_FEASIBLE", "INFEASIBLE", "UNKNOWN", "CURRENT", "STALE", "INVALID"]) {
    assert.match(text, new RegExp(word));
  }
});

test("Design Handbookは正式STEP順を含む", async () => {
  const text = await readFile(path.join(root, "Obsidian", "Design Handbook.md"), "utf8");
  const order = ["### 目的", "### 理由", "### コード", "### 設計者のひとこと", "### チェックポイント", "### 次へ進む条件"];
  let cursor = -1;
  for (const heading of order) {
    const next = text.indexOf(heading, cursor + 1);
    assert.ok(next > cursor, `${heading} should appear in formal order`);
    cursor = next;
  }
});

test("Design Rulesは継承監査で決めたDAY30候補番号形式を使う", async () => {
  const text = await readFile(path.join(root, "Obsidian", "Design Rules.md"), "utf8");
  assert.match(text, /DAY30-Rule-A/);
  assert.match(text, /DAY30-Rule-AJ/);
});

test("正式文書に未確定Placeholderを残さない", async () => {
  const targets = [...rootFiles.filter((name) => name !== "LICENSE"), ...obsidianFiles.map((name) => path.join("Obsidian", name))];
  for (const name of targets) {
    const text = await readFile(path.join(root, name), "utf8");
    assert.doesNotMatch(text, /\b(?:TBD|TODO|FIXME)\b/i, name);
  }
});
