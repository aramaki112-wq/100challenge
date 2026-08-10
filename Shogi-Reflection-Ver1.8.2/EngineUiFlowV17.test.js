import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("./main.js", import.meta.url), "utf8");
const view = fs.readFileSync(new URL("./BrowserEngineAnalysisView.js", import.meta.url), "utf8");

function stepChunk(stepNumber, nextStepNumber) {
  const start = html.indexOf(`data-step-panel="${stepNumber}"`);
  const end = nextStepNumber ? html.indexOf(`data-step-panel="${nextStepNumber}"`, start) : html.length;
  return html.slice(start, end);
}

test("Ver.1.7は7 STEPを維持しEngine PanelをSTEP3へ置く", () => {
  assert.equal((html.match(/data-step-panel=/g) ?? []).length, 7);
  const step3 = stepChunk(3, 4);
  const step4 = stepChunk(4, 5);
  assert.match(step3, /id="engine-analysis-panel"/);
  assert.match(step3, /棋譜を解析する/);
  assert.match(step3, /振り返り候補/);
  assert.doesNotMatch(step4, /id="engine-analysis-panel"/);
});

test("Engine UIは解析状態・進捗・中止・Candidate操作を持つ", () => {
  for (const id of ["engine-analysis-status", "engine-analysis-progress", "cancel-analysis", "engine-analysis-candidates"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(view, /data-engine-replay-ply/);
  assert.match(view, /data-engine-add-key-position/);
  assert.match(view, /考え直したい手/);
  assert.match(view, /良かった手/);
  assert.match(view, /Engine推奨/);
  assert.match(view, /読み筋/);
});

test("Candidate Jumpだけは既存Replayへjumpした後にBoard scrollを要求する", () => {
  const start = main.indexOf('const replayButton = event.target.closest("[data-engine-replay-ply]")');
  const end = main.indexOf('const addButton = event.target.closest("[data-engine-add-key-position]")', start);
  const block = main.slice(start, end);
  assert.match(block, /replayController\.jump/);
  assert.match(block, /scrollIntoView/);
  assert.match(block, /ENGINE_CANDIDATE_JUMP/);
  assert.doesNotMatch(block, /navigateToStep/);
});

test("Candidate追加は既存KeyPosition追加Flowへ合流する", () => {
  const start = main.indexOf('const addButton = event.target.closest("[data-engine-add-key-position]")');
  const end = main.indexOf('// Saved Game Viewer', start);
  const block = main.slice(start, end);
  assert.match(block, /replayController\.jump/);
  assert.match(block, /addCurrentReplayPositionToKeyPosition/);
  assert.doesNotMatch(block, /new KeyPosition|EngineKeyPosition/);
});

test("Engineなしでも手動Flowが説明される", () => {
  assert.match(html, /Engine未設定でもReplay・手動重要局面登録・振り返りは利用できます/);
  assert.match(html, /id="add-current-position"/);
});
