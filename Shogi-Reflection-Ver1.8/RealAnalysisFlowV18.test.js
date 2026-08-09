import test from "node:test";
import assert from "node:assert/strict";
import { AnalyzeGame } from "./AnalyzeGame.js";
import { ReflectionLocalEngineAdapter } from "./ReflectionLocalEngineAdapter.js";
import { NodeWebWorkerTestShim } from "./NodeWebWorkerTestShim.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { PIECE_OWNER } from "./ShogiPiece.js";

function history(name="replay-basic.kif") { return new PositionHistoryBuilder().build(new KifParser().parse({text:replayFixture(name)})); }

test("KIF→Position History→Real Evaluation→Normalization→Candidate Rankingを通す", async()=>{
  const engine=new ReflectionLocalEngineAdapter({WorkerClass:NodeWebWorkerTestShim});
  const progress=[];
  const result=await new AnalyzeGame({engine}).execute({gameId:"REAL-E2E-SHORT",history:history(),playerSide:PIECE_OWNER.SENTE,settings:"FAST",onProgress:(p)=>progress.push(p)});
  assert.equal(result.status,"COMPLETED");
  assert.ok(result.positionsAnalyzed>1);
  assert.equal(progress.at(-1).completed,result.positionsAnalyzed);
  assert.ok(result.rows.every((row)=>row.evaluationBefore?.perspective==="VIEWER"));
  assert.ok(result.primaryCandidates.length<=5);
  assert.equal(result.engine.localAnalysis,true);
  await engine.dispose();
});

test("短い棋譜で合理的候補が3件未満なら水増ししない", async()=>{
  const engine=new ReflectionLocalEngineAdapter({WorkerClass:NodeWebWorkerTestShim});
  const result=await new AnalyzeGame({engine}).execute({gameId:"REAL-E2E-SHORT2",history:history(),playerSide:PIECE_OWNER.SENTE,settings:"FAST"});
  assert.ok(result.primaryCandidates.length<=Math.min(5,result.totalCandidates));
  await engine.dispose();
});
