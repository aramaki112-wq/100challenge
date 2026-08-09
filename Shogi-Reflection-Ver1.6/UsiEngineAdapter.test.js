import test from "node:test";
import assert from "node:assert/strict";
import { YaneuraOuEngineAdapter } from "./YaneuraOuEngineAdapter.js";
import { initialPosition } from "./ReplayTestHelpers.js";

class FakeTransport {
  constructor() { this.commands = []; this.phase = 0; }
  async start() {}
  send(c) { this.commands.push(c); }
  async waitFor(predicate) {
    this.phase += 1;
    const sets = this.phase === 1 ? ["id name Fake YaneuraOu V9", "usiok"] : this.phase === 2 ? ["readyok"] : ["info depth 12 nodes 1234 multipv 1 score cp 85 pv 7g7f 3c3d", "info depth 12 nodes 1200 multipv 2 score cp 60 pv 2g2f", "bestmove 7g7f ponder 3c3d"];
    assert.ok(sets.some(predicate)); return sets;
  }
  async dispose() {}
}

test("USI AdapterはProtocolをAdapter内で処理しEngine非依存Resultを返す", async () => {
  const transport = new FakeTransport();
  const adapter = new YaneuraOuEngineAdapter({ transport, engineVersion: "test", evaluationModel: "test" });
  await adapter.initialize();
  const result = await adapter.analyzePosition({ position: initialPosition(), settings: { multiPv: 2, maxDepth: 12, maxNodes: null, maxTimeMs: null } });
  assert.equal(result.bestMove, "7g7f"); assert.equal(result.evaluation.centipawns, 85); assert.equal(result.candidateMoves.length, 2);
  assert.ok(transport.commands.includes("usi")); assert.ok(transport.commands.some((c) => c.startsWith("position sfen "))); assert.ok(transport.commands.includes("go depth 12"));
});

test("CancelはUSI stopへ閉じ込める", async () => { const t = new FakeTransport(); const a = new YaneuraOuEngineAdapter({transport:t}); await a.initialize(); await a.cancelAnalysis(); assert.ok(t.commands.includes("stop")); });
