import { ENGINE_CANDIDATE_TYPE, ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";
import { EVALUATION_TRANSITION } from "./EvaluationDelta.js";

export const ENGINE_CANDIDATE_GROUP = Object.freeze({
  GOOD: "GOOD",
  BAD: "BAD"
});

function shapeBand(evaluation) {
  if (evaluation?.type === ENGINE_EVALUATION_TYPE.MATE) return "MATE";
  if (evaluation?.type !== ENGINE_EVALUATION_TYPE.CP) return "UNKNOWN";
  const cp = evaluation.centipawns;
  if (cp >= 500) return "CLEAR_ADVANTAGE";
  if (cp >= 150) return "ADVANTAGE";
  if (cp > -150) return "EVEN";
  if (cp > -500) return "DISADVANTAGE";
  return "CLEAR_DISADVANTAGE";
}

function bandImportance(beforeBand, afterBand) {
  if (beforeBand === afterBand) return 0;
  const highImpact = new Set([
    "CLEAR_ADVANTAGE:EVEN",
    "CLEAR_ADVANTAGE:DISADVANTAGE",
    "ADVANTAGE:DISADVANTAGE",
    "ADVANTAGE:CLEAR_DISADVANTAGE",
    "EVEN:CLEAR_DISADVANTAGE"
  ]);
  return highImpact.has(`${beforeBand}:${afterBand}`) ? 180 : 90;
}

function candidateFromRow(row, thresholds) {
  const delta = row.evaluationDelta;
  if (!delta) return null;

  let type = null;
  let group = null;
  let score = 0;
  const reasons = [];
  const beforeBand = shapeBand(row.evaluationBefore);
  const afterBand = shapeBand(row.evaluationAfter);

  if (delta.kind === EVALUATION_TRANSITION.MATED_CREATED || delta.kind === EVALUATION_TRANSITION.MATE_LOST) {
    type = ENGINE_CANDIDATE_TYPE.MAJOR_DROPOFF;
    group = ENGINE_CANDIDATE_GROUP.BAD;
    score = 100000;
    reasons.push(delta.kind === EVALUATION_TRANSITION.MATED_CREATED
      ? "実戦手後に詰まされる状態へ変化した可能性"
      : "Engineが見つけた詰み筋を逃した可能性");
  } else if (delta.kind === EVALUATION_TRANSITION.MATE_GAINED || delta.kind === EVALUATION_TRANSITION.MATED_ESCAPED) {
    type = ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE;
    group = ENGINE_CANDIDATE_GROUP.GOOD;
    score = 90000;
    reasons.push(delta.kind === EVALUATION_TRANSITION.MATE_GAINED
      ? "実戦手後に詰み筋が生じた可能性"
      : "詰まされる状態を逃れた可能性");
  } else if (delta.kind === EVALUATION_TRANSITION.CP_CHANGE) {
    const d = delta.centipawns;
    const transitionBonus = bandImportance(beforeBand, afterBand);
    const bestMoveDifference = Number.isFinite(row.bestMoveDifferenceCp)
      ? row.bestMoveDifferenceCp
      : d;

    // evaluationBefore is the best evaluation from the position before the actual move.
    // evaluationAfter is the evaluation of the position that actually resulted.
    // Therefore a sufficiently negative difference is a direct reason to revisit the move.
    if (bestMoveDifference <= thresholds.majorDropCp) {
      type = ENGINE_CANDIDATE_TYPE.MAJOR_DROPOFF;
      group = ENGINE_CANDIDATE_GROUP.BAD;
      score = Math.abs(bestMoveDifference) + transitionBonus + (!row.bestMoveMatched ? 40 : 0);
      reasons.push("Engine推奨手と比べて実戦手後の評価が大きく低下");
      if (beforeBand !== afterBand) reasons.push("形勢の評価帯が変化");
    } else if (
      bestMoveDifference <= thresholds.reviewDropCp ||
      (bestMoveDifference < -thresholds.goodToleranceCp && !row.bestMoveMatched)
    ) {
      type = ENGINE_CANDIDATE_TYPE.REVIEW_CANDIDATE;
      group = ENGINE_CANDIDATE_GROUP.BAD;
      score = Math.abs(bestMoveDifference) + transitionBonus + (!row.bestMoveMatched ? 30 : 0);
      reasons.push("Engine推奨手との差を確認したい局面");
      if (beforeBand !== afterBand) reasons.push("形勢の評価帯が変化");
    } else if (row.bestMoveMatched && bestMoveDifference >= -thresholds.goodToleranceCp) {
      type = ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE;
      group = ENGINE_CANDIDATE_GROUP.GOOD;
      score = 120 + Math.max(0, d) + (beforeBand !== afterBand && d > 0 ? 60 : 0);
      reasons.push("実戦手がEngineの最善候補と一致");
      if (bestMoveDifference >= -thresholds.goodToleranceCp) reasons.push("推奨評価を大きく損ねていない");
    } else if (d >= thresholds.goodSwingCp) {
      type = ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE;
      group = ENGINE_CANDIDATE_GROUP.GOOD;
      score = 80 + d + (beforeBand !== afterBand ? 60 : 0);
      reasons.push("実戦手後に本人視点の評価が大きく好転");
    }
  }

  if (!type || !group) return null;
  return Object.freeze({
    ...row,
    candidateType: type,
    candidateGroup: group,
    rankingScore: score,
    reasons: Object.freeze(reasons),
    shapeBefore: beforeBand,
    shapeAfter: afterBand
  });
}

function suppressNearby(candidates, distance) {
  const kept = [];
  const sorted = [...candidates].sort((a, b) => b.rankingScore - a.rankingScore || a.ply - b.ply);
  for (const candidate of sorted) {
    // A cluster is de-duplicated per Good/Bad group, not per fine-grained label. This avoids
    // surfacing several consecutive moves for the same swing just because one is MAJOR and
    // the next is REVIEW_CANDIDATE.
    const duplicate = kept.some((item) =>
      item.candidateGroup === candidate.candidateGroup &&
      Math.abs(item.ply - candidate.ply) <= distance
    );
    if (!duplicate) kept.push(candidate);
  }
  return kept;
}

function ranked(items) {
  return [...items].sort((a, b) => b.rankingScore - a.rankingScore || a.ply - b.ply);
}

export class EngineCandidateSelector {
  constructor({
    majorDropCp = -250,
    reviewDropCp = -120,
    goodToleranceCp = 60,
    goodSwingCp = 120,
    duplicateDistancePly = 3,
    limit = 5,
    limitPerGroup = limit
  } = {}) {
    this.thresholds = Object.freeze({ majorDropCp, reviewDropCp, goodToleranceCp, goodSwingCp });
    this.duplicateDistancePly = Math.max(0, Number(duplicateDistancePly) || 0);
    this.limitPerGroup = Math.min(5, Math.max(1, Number(limitPerGroup) || 5));
  }

  select(rows = []) {
    const all = suppressNearby(
      rows.map((row) => candidateFromRow(row, this.thresholds)).filter(Boolean),
      this.duplicateDistancePly
    );
    const badCandidates = Object.freeze(
      ranked(all.filter((item) => item.candidateGroup === ENGINE_CANDIDATE_GROUP.BAD)).slice(0, this.limitPerGroup)
    );
    const goodCandidates = Object.freeze(
      ranked(all.filter((item) => item.candidateGroup === ENGINE_CANDIDATE_GROUP.GOOD)).slice(0, this.limitPerGroup)
    );
    const selected = [...badCandidates, ...goodCandidates];
    const selectedSet = new Set(selected);

    return Object.freeze({
      // Backward-compatible aggregate for persisted readers. Ver.1.8 formal UI uses the two
      // explicit groups below and therefore may contain up to 10 items in this aggregate.
      primaryCandidates: Object.freeze(ranked(selected)),
      goodCandidates,
      badCandidates,
      otherCandidates: Object.freeze(ranked(all.filter((candidate) => !selectedSet.has(candidate)))),
      totalCandidates: all.length
    });
  }
}
