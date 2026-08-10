import test from "node:test";
import assert from "node:assert/strict";
import { UsiEngineAdapter } from "./UsiEngineAdapter.js";
import { parseUsiInfoLine } from "./UsiInfoParser.js";
import { initialPosition } from "./ReplayTestHelpers.js";
import { BrowserWorkerUsiTransport } from "./BrowserWorkerUsiTransport.js";
import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";

class OptionAwareTransport {
  constructor() { this.commands = []; this.waitCount = 0; }
  async start() { this.commands.push("<start>"); }
  send(command) { this.commands.push(command); }
  async waitFor(predicate) {
    this.waitCount += 1;
    const responses = [
      ["option name Threads type spin default 1 min 1 max 32", "option name USI_Hash type spin default 256 min 1 max 1048576", "option name MultiPV type spin default 1 min 1 max 500", "id name YaneuraOu Test", "usiok"],
      ["readyok"],
      ["readyok"],
      ["info nodes 900 score cp 120 time 35 multipv 1 depth 7 pv 7g7f 3c3d 2g2f", "info pv 2g2f 8c8d depth 6 score cp 80 multipv 2 time 34 nodes 850", "bestmove 7g7f"]
    ];
    const lines = responses[this.waitCount - 1] ?? [];
    assert.ok(lines.some(predicate), `predicate not satisfied at wait ${this.waitCount}: ${lines.join(" | ")}`);
    return lines;
  }
  async dispose() { this.commands.push("<dispose>"); }
}

test("USI formal handshake: usi/usiok/isready/readyok/usinewgame", async () => {
  const transport = new OptionAwareTransport();
  const engine = new UsiEngineAdapter({ transport });
  const info = await engine.initialize();
  assert.equal(info.engineName, "YaneuraOu Test");
  assert.deepEqual([...info.usiOptions].sort(), ["MultiPV", "Threads", "USI_Hash"].sort());
  const usiIndex = transport.commands.indexOf("usi");
  const readyIndex = transport.commands.indexOf("isready");
  const newGameIndex = transport.commands.indexOf("usinewgame");
  assert.ok(usiIndex >= 0 && readyIndex > usiIndex && newGameIndex > readyIndex);
});

test("USI setoptionはEngineがadvertiseしたThreads/Hash/MultiPVだけ適用する", async () => {
  const transport = new OptionAwareTransport();
  const engine = new UsiEngineAdapter({ transport });
  await engine.initialize();
  const result = await engine.analyzePosition({
    position: initialPosition(),
    settings: { threads: 1, hashMB: 16, multiPv: 2, maxDepth: 7, maxNodes: 900, maxTimeMs: 80 }
  });
  assert.ok(transport.commands.includes("setoption name Threads value 1"));
  assert.ok(transport.commands.includes("setoption name USI_Hash value 16"));
  assert.ok(transport.commands.includes("setoption name MultiPV value 2"));
  assert.ok(transport.commands.some((x) => x.startsWith("position sfen ")));
  assert.ok(transport.commands.includes("go depth 7 nodes 900 movetime 80"));
  assert.equal(result.bestMove, "7g7f");
  assert.equal(result.evaluation.centipawns, 120);
  assert.equal(result.depth, 7);
  assert.equal(result.nodes, 900);
  assert.equal(result.time, 35);
  assert.deepEqual(result.candidateMoves[0].pv.slice(0, 3), ["7g7f", "3c3d", "2g2f"]);
  assert.equal(result.candidateMoves.length, 2);
});

test("USI info parserはtoken順序へ過度依存せずcp/mate/pv/depth/nodes/timeを読む", () => {
  const cp = parseUsiInfoLine("info pv 7g7f 3c3d nodes 123 time 44 score cp -85 multipv 2 depth 9");
  assert.equal(cp.evaluation.type, "CP");
  assert.equal(cp.evaluation.centipawns, -85);
  assert.equal(cp.multiPv, 2);
  assert.equal(cp.depth, 9);
  assert.equal(cp.nodes, 123);
  assert.equal(cp.time, 44);
  assert.deepEqual(cp.pv, ["7g7f", "3c3d"]);
  const mate = parseUsiInfoLine("info nodes 55 score mate -3 depth 5 pv 5a5b");
  assert.equal(mate.evaluation.type, "MATE");
  assert.equal(mate.evaluation.mateIn, -3);
});

test("USI cancelはstop、disposeはquitを送る", async () => {
  const transport = new OptionAwareTransport();
  const engine = new UsiEngineAdapter({ transport });
  await engine.initialize();
  await engine.cancelAnalysis();
  await engine.dispose();
  assert.ok(transport.commands.includes("stop"));
  assert.ok(transport.commands.includes("quit"));
  assert.ok(transport.commands.includes("<dispose>"));
});

test("Worker transport timeoutはTIMEOUTとして返す", async () => {
  class SilentWorker {
    addEventListener() {}
    postMessage() {}
    terminate() {}
  }
  const transport = new BrowserWorkerUsiTransport({ workerUrl: "./silent.js", WorkerClass: SilentWorker });
  await transport.start();
  await assert.rejects(
    () => transport.waitFor(() => false, { timeoutMs: 5 }),
    (error) => error instanceof EngineAnalysisError && error.code === ENGINE_ERROR_CODES.TIMEOUT
  );
  await transport.dispose();
});

test("Worker structured engine-errorはENGINE_CRASHとして待機中USIをrejectする", async () => {
  class ErrorWorker {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, fn) { this.listeners.set(type, fn); }
    postMessage() { queueMicrotask(() => this.listeners.get("message")?.({ data: { type: "engine-error", message: "boom" } })); }
    terminate() {}
  }
  const transport = new BrowserWorkerUsiTransport({ workerUrl: "./error.js", WorkerClass: ErrorWorker });
  await transport.start();
  const waiting = transport.waitFor((line) => line === "usiok", { timeoutMs: 100 });
  transport.send("usi");
  await assert.rejects(waiting, (error) => error.code === ENGINE_ERROR_CODES.ENGINE_CRASH && /boom/.test(error.message));
  await transport.dispose();
});
