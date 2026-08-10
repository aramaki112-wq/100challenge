import test from "node:test";
import assert from "node:assert/strict";
import { AnalyzeGame } from "./AnalyzeGame.js";
import { MockShogiEngineAdapter } from "./MockShogiEngineAdapter.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { PIECE_OWNER } from "./ShogiPiece.js";

function history() { return new PositionHistoryBuilder().build(new KifParser().parse({text:replayFixture("replay-basic.kif")})); }
test("初回解析でMetadata・Settings・AnalyzedAtを保持する", async () => { const result=await new AnalyzeGame({engine:new MockShogiEngineAdapter(),now:()=>new Date("2026-08-09T00:00:00Z")}).execute({gameId:"G1",history:history(),playerSide:PIECE_OWNER.SENTE,settings:"STANDARD"}); assert.equal(result.engine.engineName,"Verification Mock Engine"); assert.equal(result.engine.engineVersion,"1.0"); assert.equal(result.engine.evaluationModel,"deterministic-test"); assert.equal(result.analysisSettings.multiPv,3); assert.equal(result.analyzedAt,"2026-08-09T00:00:00.000Z"); });
test("本人が指した手だけをDelta対象にする", async () => { const result=await new AnalyzeGame({engine:new MockShogiEngineAdapter()}).execute({gameId:"G2",history:history(),playerSide:PIECE_OWNER.SENTE,settings:"FAST"}); assert.deepEqual(result.rows.map(x=>x.ply),[1,3,5]); });
test("Candidate Ranking結果は5件以下", async () => { const result=await new AnalyzeGame({engine:new MockShogiEngineAdapter()}).execute({gameId:"G3",history:history(),playerSide:PIECE_OWNER.SENTE}); assert.ok(result.primaryCandidates.length<=5); assert.ok(result.primaryCandidates.length>0); });
test("CancelはEngineへ伝播する", async () => { const engine=new MockShogiEngineAdapter(); const service=new AnalyzeGame({engine}); await engine.initialize(); await service.cancel(); assert.equal(engine.cancelled,true); });
