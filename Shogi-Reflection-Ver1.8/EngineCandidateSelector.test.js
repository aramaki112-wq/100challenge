import test from "node:test";
import assert from "node:assert/strict";
import { EngineCandidateSelector } from "./EngineCandidateSelector.js";
import { ENGINE_CANDIDATE_TYPE } from "./EngineAnalysisConstants.js";
const row = (ply, d, matched=false) => ({ gameId:"G", ply, moveNumber:ply, actualMove:"7g7f", actualMoveText:"７六歩", bestMove:matched?"7g7f":"2g2f", bestMoveMatched:matched, candidateMoves:[], evaluationBefore:{type:"CP",centipawns:100}, evaluationAfter:{type:"CP",centipawns:100+d}, evaluationDelta:{kind:"CP_CHANGE",centipawns:d,direction:Math.sign(d)} });

test("最大悪化を上位候補へする", () => { const r=new EngineCandidateSelector().select([row(1,-130),row(9,-500)]); assert.equal(r.primaryCandidates[0].ply,9); });
test("近接局面重複を抑制する", () => { const r=new EngineCandidateSelector({duplicateDistancePly:3}).select([row(10,-400),row(12,-300),row(30,-250)]); assert.equal(r.primaryCandidates.some((x)=>x.ply===12),false); });
test("候補は最大5件", () => { const rows=Array.from({length:12},(_,i)=>row(i*5+1,-150-i*10)); assert.ok(new EngineCandidateSelector().select(rows).primaryCandidates.length<=5); });
test("Best Move一致かつ維持した局面を良かった可能性へ", () => { const r=new EngineCandidateSelector().select([row(7,-20,true)]); assert.equal(r.primaryCandidates[0].candidateType,ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE); });
test("大幅悪化はMAJOR_DROPOFF", () => { const r=new EngineCandidateSelector().select([row(7,-400)]); assert.equal(r.primaryCandidates[0].candidateType,ENGINE_CANDIDATE_TYPE.MAJOR_DROPOFF); });
test("Mate発生を最上位級に扱う", () => { const mateRow={...row(21,0),evaluationDelta:{kind:"MATED_CREATED",direction:-1}}; const r=new EngineCandidateSelector().select([row(1,-500),mateRow]); assert.equal(r.primaryCandidates[0].ply,21); });
