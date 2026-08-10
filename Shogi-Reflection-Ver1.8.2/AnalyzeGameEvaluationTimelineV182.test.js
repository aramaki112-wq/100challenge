import test from "node:test";
import assert from "node:assert/strict";
import { AnalyzeGame } from "./AnalyzeGame.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { PIECE_OWNER } from "./ShogiPiece.js";

class SequenceEngine {
  constructor() { this.initialized = false; }
  async initialize() { this.initialized = true; return this.getEngineInfo(); }
  async analyzePosition({ position }) {
    const cp = [100, 20, 50, -300, -250, -500][position.moveNumber] ?? 0;
    return Object.freeze({
      evaluation: Object.freeze({ type: "CP", centipawns: cp, perspective: "SENTE" }),
      bestMove: position.moveNumber % 2 === 0 ? "7g7f" : "3c3d",
      candidateMoves: Object.freeze([{ rank: 1, move: position.moveNumber % 2 === 0 ? "7g7f" : "3c3d", pv: Object.freeze(["7g7f", "3c3d", "2g2f"]) }]),
      depth: 6,
      nodes: 1234 + position.moveNumber,
      analysisTime: 5
    });
  }
  async cancelAnalysis() {}
  getEngineInfo() { return Object.freeze({ engineName: "Sequence", engineVersion: "1", evaluationModel: "test", evaluationModelVersion: "1" }); }
  async dispose() { this.initialized = false; }
}

function history() {
  return new PositionHistoryBuilder().build(new KifParser().parse({ text: replayFixture("replay-basic.kif") }));
}

test("AnalyzeGameは0手目を含む全解析plyの軽量Evaluation Timelineを返す", async () => {
  const h = history();
  const result = await new AnalyzeGame({ engine: new SequenceEngine() }).execute({
    gameId: "TIMELINE-V182",
    history: h,
    playerSide: PIECE_OWNER.SENTE,
    settings: { preset: "TEST", maxDepth: 6, maxNodes: 5000, maxTimeMs: 100, multiPv: 1, threads: 1, hashMB: 16, maxPlies: 200 }
  });
  assert.equal(result.evaluationTimeline.length, h.maxMoveNumber + 1);
  assert.deepEqual(result.evaluationTimeline.map((x) => x.ply), [0,1,2,3,4,5]);
  assert.ok(result.evaluationTimeline.every((x) => x.evaluation.perspective === "VIEWER"));
  assert.ok(result.evaluationTimeline.every((x) => !("searchTree" in x)));
});

test("Best EvaluationとActual Evaluationは同じ本人視点でDifferenceへ接続される", async () => {
  const result = await new AnalyzeGame({ engine: new SequenceEngine() }).execute({
    gameId: "BEST-ACTUAL-V182",
    history: history(),
    playerSide: PIECE_OWNER.SENTE,
    settings: "FAST"
  });
  const first = result.rows[0];
  assert.equal(first.bestEvaluation.centipawns, 100);
  assert.equal(first.actualEvaluation.centipawns, 20);
  assert.equal(first.bestMoveDifferenceCp, -80);
  assert.equal(first.evaluationDelta.centipawns, -80);
});
