import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEvaluation } from "./EvaluationNormalizer.js";
import { calculateEvaluationDelta, EVALUATION_TRANSITION } from "./EvaluationDelta.js";
import { ENGINE_EVALUATION_PERSPECTIVE, ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";
import { PIECE_OWNER } from "./ShogiPiece.js";

const cp = (value, perspective = ENGINE_EVALUATION_PERSPECTIVE.SIDE_TO_MOVE) => ({ type: ENGINE_EVALUATION_TYPE.CP, centipawns: value, perspective });
const mate = (value, perspective = ENGINE_EVALUATION_PERSPECTIVE.SIDE_TO_MOVE) => ({ type: ENGINE_EVALUATION_TYPE.MATE, mateIn: value, perspective });

test("先手手番のSIDE_TO_MOVE評価を先手本人視点へ維持", () => assert.equal(normalizeEvaluation(cp(350), { sideToMove: PIECE_OWNER.SENTE, viewerSide: PIECE_OWNER.SENTE }).centipawns, 350));
test("後手手番のSIDE_TO_MOVE評価を先手本人視点へ反転", () => assert.equal(normalizeEvaluation(cp(350), { sideToMove: PIECE_OWNER.GOTE, viewerSide: PIECE_OWNER.SENTE }).centipawns, -350));
test("先手視点評価を後手本人視点へ反転", () => assert.equal(normalizeEvaluation(cp(-120, ENGINE_EVALUATION_PERSPECTIVE.SENTE), { sideToMove: PIECE_OWNER.SENTE, viewerSide: PIECE_OWNER.GOTE }).centipawns, 120));
test("負評価を正しくNormalizeする", () => assert.equal(normalizeEvaluation(cp(-470), { sideToMove: PIECE_OWNER.SENTE, viewerSide: PIECE_OWNER.SENTE }).centipawns, -470));
test("Mate評価も視点反転する", () => assert.equal(normalizeEvaluation(mate(7), { sideToMove: PIECE_OWNER.GOTE, viewerSide: PIECE_OWNER.SENTE }).mateIn, -7));
test("CP改善Delta", () => assert.equal(calculateEvaluationDelta({type:"CP",centipawns:-100},{type:"CP",centipawns:40}).centipawns, 140));
test("CP悪化Delta", () => assert.equal(calculateEvaluationDelta({type:"CP",centipawns:350},{type:"CP",centipawns:-120}).centipawns, -470));
test("変化なしDelta", () => assert.equal(calculateEvaluationDelta({type:"CP",centipawns:0},{type:"CP",centipawns:0}).direction, 0));
test("Mate transitionは巨大CPへ変換しない", () => { const d = calculateEvaluationDelta({type:"CP",centipawns:200},{type:"MATE",mateIn:-5}); assert.equal(d.kind, EVALUATION_TRANSITION.MATED_CREATED); assert.equal("centipawns" in d, false); });
test("詰み逃れを別Transitionとして扱う", () => assert.equal(calculateEvaluationDelta({type:"MATE",mateIn:-7},{type:"CP",centipawns:-300}).kind, EVALUATION_TRANSITION.MATED_ESCAPED));
