import test from "node:test";
import assert from "node:assert/strict";
import { EngineCandidateSelector, ENGINE_CANDIDATE_GROUP } from "./EngineCandidateSelector.js";
import { EVALUATION_TRANSITION } from "./EvaluationDelta.js";

const cp = (centipawns) => Object.freeze({ type: "CP", centipawns, perspective: "VIEWER" });
const mate = (mateIn) => Object.freeze({ type: "MATE", mateIn, perspective: "VIEWER" });

function row(ply, before, after, { matched = false, bestMoveDifferenceCp = after - before } = {}) {
  return Object.freeze({
    gameId: "BAD-V182",
    ply,
    moveNumber: ply,
    actualMove: "7g7f",
    actualMoveText: "７六歩",
    bestMove: matched ? "7g7f" : "2g2f",
    bestMoveMatched: matched,
    candidateMoves: Object.freeze([]),
    evaluationBefore: cp(before),
    evaluationAfter: cp(after),
    bestEvaluation: cp(before),
    actualEvaluation: cp(after),
    bestMoveDifferenceCp,
    bestMovePv: Object.freeze([matched ? "7g7f" : "2g2f", "3c3d", "2g2f"]),
    evaluationDelta: Object.freeze({ kind: EVALUATION_TRANSITION.CP_CHANGE, centipawns: after - before, direction: Math.sign(after - before) })
  });
}

function singleBad(r) {
  const result = new EngineCandidateSelector({ duplicateDistancePly: 0 }).select([r]);
  assert.equal(result.badCandidates.length, 1);
  assert.equal(result.badCandidates[0].candidateGroup, ENGINE_CANDIDATE_GROUP.BAD);
  return result.badCandidates[0];
}

test("clear blunder: Best +280 vs Actual -410をBad検出", () => {
  const item = singleBad(row(47, 280, -410));
  assert.equal(item.bestMoveDifferenceCp, -690);
  assert.equal(item.bestEvaluation.centipawns, 280);
  assert.equal(item.actualEvaluation.centipawns, -410);
});

test("quiet blunder: Material即時損がなくても探索評価差-160ならBad検出", () => {
  const item = singleBad(row(31, 80, -80));
  assert.equal(item.candidateType, "REVIEW_CANDIDATE");
});

test("tactical loss: 優勢から明確な劣勢への遷移を優先する", () => {
  const item = singleBad(row(55, 650, -520));
  assert.equal(item.shapeBefore, "CLEAR_ADVANTAGE");
  assert.equal(item.shapeAfter, "CLEAR_DISADVANTAGE");
  assert.ok(item.rankingScore > 1000);
});

test("mate miss: Mate FoundからCPへ落ちた場合は巨大CP化せずBad最優先級", () => {
  const mateMiss = Object.freeze({
    ...row(61, 0, 0),
    evaluationBefore: mate(5),
    bestEvaluation: mate(5),
    evaluationAfter: cp(700),
    actualEvaluation: cp(700),
    bestMoveDifferenceCp: null,
    evaluationDelta: Object.freeze({ kind: EVALUATION_TRANSITION.MATE_LOST, mateIn: 5, direction: -1 })
  });
  const item = singleBad(mateMiss);
  assert.equal(item.evaluationDelta.kind, EVALUATION_TRANSITION.MATE_LOST);
  assert.equal(item.rankingScore, 100000);
});

test("winning -> equalをBad検出", () => {
  const item = singleBad(row(71, 700, 80));
  assert.equal(item.shapeBefore, "CLEAR_ADVANTAGE");
  assert.equal(item.shapeAfter, "EVEN");
});

test("winning -> losingをBad検出", () => {
  const item = singleBad(row(73, 700, -700));
  assert.equal(item.shapeBefore, "CLEAR_ADVANTAGE");
  assert.equal(item.shapeAfter, "CLEAR_DISADVANTAGE");
});

test("Best vs Actual差をlegacy deltaより優先し、閾値の単純引下げに依存しない", () => {
  const r = row(81, 200, 160, { bestMoveDifferenceCp: -310 });
  const item = singleBad(r);
  assert.equal(item.bestMoveDifferenceCp, -310);
  assert.equal(item.evaluationDelta.centipawns, -40);
});

test("good: 劣勢でもEngine最善候補と一致し評価を維持した受けをGoodへ", () => {
  const result = new EngineCandidateSelector({ duplicateDistancePly: 0 }).select([
    row(91, -650, -680, { matched: true, bestMoveDifferenceCp: -30 })
  ]);
  assert.equal(result.goodCandidates.length, 1);
  assert.equal(result.goodCandidates[0].candidateGroup, ENGINE_CANDIDATE_GROUP.GOOD);
});

test("no false forced 5: 基準を満たすBadが2件なら2件だけ", () => {
  const result = new EngineCandidateSelector({ duplicateDistancePly: 0 }).select([
    row(101, 100, -100),
    row(111, 300, -50),
    row(121, 20, -20)
  ]);
  assert.equal(result.badCandidates.length, 2);
});
