import test from "node:test";
import assert from "node:assert/strict";
import { ReflectionLocalEngineAdapter } from "./ReflectionLocalEngineAdapter.js";
import { BrowserWorkerUsiTransport } from "./BrowserWorkerUsiTransport.js";
import { NodeWebWorkerTestShim } from "./NodeWebWorkerTestShim.js";
import { initialPosition } from "./ReplayTestHelpers.js";
import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";

function settings(overrides = {}) {
  return { maxDepth: 2, maxNodes: 900, maxTimeMs: 80, multiPv: 3, threads: 1, hashMB: 16, ...overrides };
}

test("Real Local EngineをinitializeしてREADY相当のUSI metadataを取得できる", async () => {
  const engine = new ReflectionLocalEngineAdapter({ WorkerClass: NodeWebWorkerTestShim });
  const info = await engine.initialize();
  assert.match(info.engineName, /Shogi Reflection Local Engine/);
  assert.equal(info.engineVersion, "1.0.0");
  assert.equal(info.localAnalysis, true);
  await engine.dispose();
});

test("Real Local EngineへPositionを渡し評価値・bestmove・MultiPVを受信する", async () => {
  const engine = new ReflectionLocalEngineAdapter({ WorkerClass: NodeWebWorkerTestShim });
  const result = await engine.analyzePosition({ position: initialPosition(), settings: settings() });
  assert.equal(result.evaluation.type, "CP");
  assert.equal(result.evaluation.perspective, "SIDE_TO_MOVE");
  assert.match(result.bestMove, /^(?:[1-9][a-i]){2}\+?$|^[RBGSLNP]\*[1-9][a-i]$/);
  assert.ok(result.candidateMoves.length >= 1 && result.candidateMoves.length <= 3);
  assert.ok(result.analysisTime >= 0);
  await engine.dispose();
});

test("Real Local EngineのstopはWorker内Searchへ伝播しbestmoveで終了する", async () => {
  const transport = new BrowserWorkerUsiTransport({ workerUrl: "./ReflectionLocalEngineWorker.js", WorkerClass: NodeWebWorkerTestShim });
  await transport.start();
  transport.send("usi"); await transport.waitFor((line) => line === "usiok", { timeoutMs: 2000 });
  transport.send("isready"); await transport.waitFor((line) => line === "readyok", { timeoutMs: 2000 });
  transport.send("position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1");
  transport.send("go movetime 800 nodes 10000");
  await new Promise((resolve) => setTimeout(resolve, 10));
  transport.send("stop");
  const lines = await transport.waitFor((line) => line.startsWith("bestmove "), { timeoutMs: 2000 });
  assert.ok(lines.some((line) => line.startsWith("bestmove ")));
  await transport.dispose();
});

test("Real Local Engine Workerが存在しない場合はEngine crashとして失敗する", async () => {
  const engine = new ReflectionLocalEngineAdapter({ workerUrl: "./missing-real-engine-worker.js", WorkerClass: NodeWebWorkerTestShim, timeoutMs: 1000 });
  await assert.rejects(() => engine.initialize(), (error) => error instanceof EngineAnalysisError && [ENGINE_ERROR_CODES.ENGINE_CRASH, ENGINE_ERROR_CODES.ENGINE_INITIALIZATION_FAILED].includes(error.code));
  await engine.dispose().catch(() => {});
});
