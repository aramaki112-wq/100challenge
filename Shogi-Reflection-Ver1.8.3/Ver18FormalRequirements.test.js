import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { EngineCandidateSelector, ENGINE_CANDIDATE_GROUP } from "./EngineCandidateSelector.js";
import { ENGINE_CANDIDATE_TYPE } from "./EngineAnalysisConstants.js";
import { EVALUATION_TRANSITION } from "./EvaluationDelta.js";
import { KifFileReaderAdapter } from "./KifFileReaderAdapter.js";
import { KifParser } from "./KifParser.js";
import { resolveBrowserEngine } from "./BrowserEngineProvider.js";
import { ReflectionLocalEngineAdapter } from "./ReflectionLocalEngineAdapter.js";
import { YaneuraOuWasmAdapter, YANEURAOU_PINNED_COMMIT, YANEURAOU_PINNED_RELEASE } from "./YaneuraOuWasmAdapter.js";
import { FallbackShogiEngineAdapter } from "./FallbackShogiEngineAdapter.js";

const cp = (n) => Object.freeze({ type: "CP", centipawns: n, perspective: "VIEWER" });
function candidateRow(ply, { diff = -180, matched = false, delta = diff, actual = "7g7f", best = matched ? "7g7f" : "2g2f" } = {}) {
  return Object.freeze({
    gameId: "G",
    ply,
    moveNumber: ply,
    actualMove: actual,
    actualMoveText: "７六歩",
    bestMove: best,
    bestMoveMatched: matched,
    candidateMoves: Object.freeze([{ rank: 1, move: best, evaluation: cp(200), pv: Object.freeze([best, "3c3d", "2g2f"]) }]),
    evaluationBefore: cp(200),
    evaluationAfter: cp(200 + delta),
    bestEvaluation: cp(200),
    actualEvaluation: cp(200 + delta),
    bestMoveDifferenceCp: diff,
    bestMovePv: Object.freeze([best, "3c3d", "2g2f"]),
    evaluationDelta: Object.freeze({ kind: EVALUATION_TRANSITION.CP_CHANGE, centipawns: delta, direction: Math.sign(delta) })
  });
}

test("Ver.1.8 CandidateはGood最大5 + Bad最大5", () => {
  const rows = [];
  for (let i = 0; i < 7; i += 1) rows.push(candidateRow(i * 10 + 1, { matched: true, diff: 0, delta: 0 }));
  for (let i = 0; i < 7; i += 1) rows.push(candidateRow(i * 10 + 6, { diff: -300 - i * 10, delta: -300 - i * 10 }));
  const result = new EngineCandidateSelector({ duplicateDistancePly: 0 }).select(rows);
  assert.equal(result.goodCandidates.length, 5);
  assert.equal(result.badCandidates.length, 5);
  assert.ok(result.primaryCandidates.length <= 10);
  assert.ok(result.goodCandidates.every((x) => x.candidateGroup === ENGINE_CANDIDATE_GROUP.GOOD));
  assert.ok(result.badCandidates.every((x) => x.candidateGroup === ENGINE_CANDIDATE_GROUP.BAD));
});

test("合理的Candidateが不足する場合は5件へ水増ししない", () => {
  const result = new EngineCandidateSelector().select([
    candidateRow(10, { matched: true, diff: 0, delta: 0 }),
    candidateRow(30, { diff: -400, delta: -400 })
  ]);
  assert.equal(result.goodCandidates.length, 1);
  assert.equal(result.badCandidates.length, 1);
});

test("近接する同Group Candidateを重複抑制する", () => {
  const result = new EngineCandidateSelector({ duplicateDistancePly: 3 }).select([
    candidateRow(10, { diff: -500, delta: -500 }),
    candidateRow(12, { diff: -450, delta: -450 }),
    candidateRow(30, { diff: -300, delta: -300 })
  ]);
  assert.equal(result.badCandidates.length, 2);
  assert.ok(result.badCandidates.some((x) => x.ply === 10));
  assert.ok(!result.badCandidates.some((x) => x.ply === 12));
});

test("Mate lossはCP巨大値へ変換せずBad Candidateとして優先する", () => {
  const mate = { ...candidateRow(40), evaluationDelta: { kind: EVALUATION_TRANSITION.MATE_LOST, direction: -1 }, bestMoveDifferenceCp: null };
  const result = new EngineCandidateSelector().select([candidateRow(10, { diff: -900, delta: -900 }), mate]);
  assert.equal(result.badCandidates[0].ply, 40);
  assert.equal(result.badCandidates[0].candidateType, ENGINE_CANDIDATE_TYPE.MAJOR_DROPOFF);
});

test("Bad CandidateはBest/Actual/PV比較Dataを保持する", () => {
  const result = new EngineCandidateSelector().select([candidateRow(25, { diff: -420, delta: -420 })]);
  const item = result.badCandidates[0];
  assert.equal(item.bestMove, "2g2f");
  assert.equal(item.bestEvaluation.centipawns, 200);
  assert.equal(item.actualEvaluation.centipawns, -220);
  assert.equal(item.bestMoveDifferenceCp, -420);
  assert.deepEqual(item.bestMovePv, ["2g2f", "3c3d", "2g2f"]);
});

test("添付ぴよ将棋KIFを同梱SampleとしてShift_JIS読込・Parser登録できる", async () => {
  const bytes = fs.readFileSync(new URL("./samples/piyo_20260617_170236.kif", import.meta.url));
  const exact = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const file = { name: "piyo_20260617_170236.kif", size: bytes.byteLength, async arrayBuffer() { return exact; } };
  const read = await new KifFileReaderAdapter().read({ file });
  assert.equal(read.encoding, "shift_jis");
  const dto = new KifParser().parse({ text: read.text, sourceFileName: read.sourceFileName, byteLength: read.byteLength, encoding: read.encoding, readerWarnings: read.warnings });
  assert.equal(dto.playedAt, "2026-06-17T16:48:48");
  assert.equal(dto.senteName, "Lv18 ピヨ行(R1040)");
  assert.equal(dto.goteName, "プレイヤー(R711)");
  assert.equal(dto.moves.length, 152);
  assert.equal(dto.terminationReason, "投了");
});

test("YaneuraOu WASM Componentは公開Release/Commitを固定する", () => {
  assert.equal(YANEURAOU_PINNED_RELEASE, "V9.00");
  assert.equal(YANEURAOU_PINNED_COMMIT, "a5ee2786c0030edc7d4a1cdfe94b04dffec55493");
});

test("manifest unavailable時はReflectionLocalEngineを明示Fallbackとして解決する", async () => {
  class DummyWorker {}
  const engine = await resolveBrowserEngine({
    location: { href: "https://example.test/app/" },
    Worker: DummyWorker,
    async fetch() { return { ok: true, async json() { return { available: false }; } }; }
  });
  assert.ok(engine instanceof ReflectionLocalEngineAdapter);
  assert.equal(engine.getEngineInfo().fallback, true);
});

test("verified manifest時はYaneuraOuWasm primary + Local fallbackを構成する", async () => {
  class DummyWorker {}
  const engine = await resolveBrowserEngine({
    location: { href: "https://example.test/app/" },
    Worker: DummyWorker,
    crossOriginIsolated: true,
    SharedArrayBuffer: class SharedArrayBuffer {},
    async fetch() { return { ok: true, async json() { return { available: true, workerUrl: "./YaneuraOuWasmWorkerBootstrap.js", engineVersion: "V9.00", commitHash: "a5ee2786c0030edc7d4a1cdfe94b04dffec55493", emscriptenVersion: "em++ 3.1.43", jsSha256: "a".repeat(64), wasmSha256: "b".repeat(64), evaluationModel: "MATERIAL", materialLevel: 1, requiresThreads: true, requiresCrossOriginIsolation: true }; } }; }
  });
  assert.ok(engine instanceof FallbackShogiEngineAdapter);
  assert.ok(engine.primary instanceof YaneuraOuWasmAdapter);
  assert.ok(engine.fallback instanceof ReflectionLocalEngineAdapter);
});

test("Candidate JumpだけPage Scroll例外で通常Replay Scroll Policyは維持", () => {
  const main = fs.readFileSync(new URL("./main.js", import.meta.url), "utf8");
  const start = main.indexOf('const replayButton = event.target.closest("[data-engine-replay-ply]")');
  const end = main.indexOf('const addButton = event.target.closest("[data-engine-add-key-position]")', start);
  const block = main.slice(start, end);
  assert.match(block, /replayController\.jump/);
  assert.match(block, /replayView\.scrollIntoView/);
  assert.match(block, /ENGINE_CANDIDATE_JUMP/);
  const policy = fs.readFileSync(new URL("./ReplayScrollPolicy.js", import.meta.url), "utf8");
  assert.match(policy, /pageScroll:\s*"NONE"/);
  assert.match(policy, /pageScrollRequested:\s*false/);
});

test("390px前後のCandidate/Board Scroll用responsive ruleを保持する", () => {
  const css = fs.readFileSync(new URL("./style.css", import.meta.url), "utf8");
  assert.match(css, /max-width:\s*430px/);
  assert.match(css, /replay-board-shell/);
  assert.match(css, /scroll-margin-top:\s*170px/);
});

test("Thread必須manifestでもcross-origin isolationなしならReal WASMを選ばずLocal fallback", async () => {
  class DummyWorker {}
  const engine = await resolveBrowserEngine({
    location: { href: "https://example.test/app/" },
    Worker: DummyWorker,
    crossOriginIsolated: false,
    SharedArrayBuffer: class SharedArrayBuffer {},
    async fetch() { return { ok: true, async json() { return {
      available: true,
      workerUrl: "./YaneuraOuWasmWorkerBootstrap.js",
      engineVersion: "V9.00",
      commitHash: "a5ee2786c0030edc7d4a1cdfe94b04dffec55493",
      emscriptenVersion: "em++ 3.1.43",
      jsSha256: "a".repeat(64),
      wasmSha256: "b".repeat(64),
      requiresThreads: true,
      requiresCrossOriginIsolation: true
    }; } }; }
  });
  assert.ok(engine instanceof ReflectionLocalEngineAdapter);
  assert.match(engine.getEngineInfo().fallbackReason, /cross-origin isolation/);
});

test("available=trueでもBuild/Hash metadata不足ならReal WASMを選ばない", async () => {
  class DummyWorker {}
  const engine = await resolveBrowserEngine({
    location: { href: "https://example.test/app/" },
    Worker: DummyWorker,
    crossOriginIsolated: true,
    SharedArrayBuffer: class SharedArrayBuffer {},
    async fetch() { return { ok: true, async json() { return {
      available: true,
      workerUrl: "./YaneuraOuWasmWorkerBootstrap.js",
      engineVersion: "V9.00",
      commitHash: "a5ee2786c0030edc7d4a1cdfe94b04dffec55493"
    }; } }; }
  });
  assert.ok(engine instanceof ReflectionLocalEngineAdapter);
  assert.match(engine.getEngineInfo().fallbackReason, /Build\/Hash metadata/);
});
