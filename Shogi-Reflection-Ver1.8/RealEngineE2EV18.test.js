import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { AnalyzeGame } from "./AnalyzeGame.js";
import { ReflectionLocalEngineAdapter } from "./ReflectionLocalEngineAdapter.js";
import { NodeWebWorkerTestShim } from "./NodeWebWorkerTestShim.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { PIECE_OWNER } from "./ShogiPiece.js";

function buildHistory(fileName) {
  return new PositionHistoryBuilder().build(new KifParser().parse({ text: replayFixture(fileName) }));
}

async function analyzeFixture({ fileName, gameId, maxPlies }) {
  const engine = new ReflectionLocalEngineAdapter({ WorkerClass: NodeWebWorkerTestShim });
  const history = buildHistory(fileName);
  const startedAt = performance.now();
  try {
    const result = await new AnalyzeGame({ engine }).execute({
      gameId,
      history,
      playerSide: PIECE_OWNER.SENTE,
      settings: { preset: "E2E", maxDepth: 2, maxNodes: 500, maxTimeMs: 40, multiPv: 2, threads: 1, hashMB: 16, maxPlies }
    });
    return { history, result, elapsedMs: performance.now() - startedAt };
  } finally {
    await engine.dispose();
  }
}

test("Real Engine E2E / short KIF", async () => {
  const { history, result } = await analyzeFixture({ fileName: "replay-basic.kif", gameId: "E2E-SHORT", maxPlies: 20 });
  assert.equal(result.status, "COMPLETED");
  assert.equal(result.positionsAnalyzed, history.maxMoveNumber + 1);
  assert.equal(result.analysisTruncated, false);
  assert.ok(result.rows.length > 0);
  assert.ok(result.primaryCandidates.length <= 5);
});

test("Real Engine E2E / normal KIF", async () => {
  const { history, result } = await analyzeFixture({ fileName: "normal-resign-utf8.kifu", gameId: "E2E-NORMAL", maxPlies: 80 });
  assert.equal(result.status, "COMPLETED");
  assert.equal(result.positionsAnalyzed, history.maxMoveNumber + 1);
  assert.equal(result.analysisTruncated, false);
  assert.ok(result.rows.every((row) => row.evaluationBefore?.perspective === "VIEWER"));
  assert.ok(result.primaryCandidates.length <= 5);
});

test("Real Engine E2E / long KIF uses smartphone safety cap", async () => {
  const { history, result } = await analyzeFixture({ fileName: "replay-long-300.kif", gameId: "E2E-LONG", maxPlies: 24 });
  assert.equal(result.status, "COMPLETED");
  assert.ok(history.maxMoveNumber >= 300);
  assert.equal(result.positionsAnalyzed, 25);
  assert.equal(result.analysisTruncated, true);
  assert.equal(result.maxAnalyzedPly, 24);
  assert.ok(result.primaryCandidates.length <= 5);
});
