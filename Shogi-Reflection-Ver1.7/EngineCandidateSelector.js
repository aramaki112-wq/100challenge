import { ENGINE_CANDIDATE_TYPE, ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";
import { EVALUATION_TRANSITION } from "./EvaluationDelta.js";

function shapeBand(evaluation) {
  if (evaluation?.type !== ENGINE_EVALUATION_TYPE.CP) return "MATE";
  const cp = evaluation.centipawns;
  if (cp >= 500) return "CLEAR_ADVANTAGE";
  if (cp >= 150) return "ADVANTAGE";
  if (cp > -150) return "EVEN";
  if (cp > -500) return "DISADVANTAGE";
  return "CLEAR_DISADVANTAGE";
}

function candidateFromRow(row, thresholds) {
  const delta = row.evaluationDelta;
  let type = null;
  let score = 0;
  const reasons = [];

  if (delta.kind === EVALUATION_TRANSITION.MATED_CREATED || delta.kind === EVALUATION_TRANSITION.MATE_LOST) {
    type = ENGINE_CANDIDATE_TYPE.MAJOR_DROPOFF;
    score = 100000;
    reasons.push(delta.kind === EVALUATION_TRANSITION.MATED_CREATED ? "詰みが生じた可能性" : "詰み筋を逃した可能性");
  } else if (delta.kind === EVALUATION_TRANSITION.MATE_GAINED || delta.kind === EVALUATION_TRANSITION.MATED_ESCAPED) {
    type = ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE;
    score = 90000;
    reasons.push(delta.kind === EVALUATION_TRANSITION.MATE_GAINED ? "詰み筋が生じた可能性" : "詰みを逃れた可能性");
  } else if (delta.kind === EVALUATION_TRANSITION.CP_CHANGE) {
    const d = delta.centipawns;
    const beforeBand = shapeBand(row.evaluationBefore);
    const afterBand = shapeBand(row.evaluationAfter);
    if (d <= thresholds.majorDropCp) {
      type = ENGINE_CANDIDATE_TYPE.MAJOR_DROPOFF;
      score = Math.abs(d) + (beforeBand !== afterBand ? 120 : 0);
      reasons.push("本人の一手後に評価が大きく低下");
    } else if (d <= thresholds.reviewDropCp || (d < -thresholds.goodToleranceCp && !row.bestMoveMatched)) {
      type = ENGINE_CANDIDATE_TYPE.REVIEW_CANDIDATE;
      score = Math.abs(d) + (beforeBand !== afterBand ? 80 : 0) + (!row.bestMoveMatched ? 25 : 0);
      reasons.push("判断を確認したい評価変化");
    } else if (row.bestMoveMatched && d >= -thresholds.goodToleranceCp) {
      type = ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE;
      score = 80 + Math.max(0, d) + (beforeBand !== afterBand && d > 0 ? 60 : 0);
      reasons.push("Engine最善候補と一致し、形勢を大きく損ねていない");
    } else if (d >= thresholds.goodSwingCp) {
      type = ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE;
      score = 60 + d;
      reasons.push("本人の一手後に評価が好転");
    }
  }

  if (!type) return null;
  return Object.freeze({
    ...row,
    candidateType: type,
    rankingScore: score,
    reasons: Object.freeze(reasons),
    shapeBefore: shapeBand(row.evaluationBefore),
    shapeAfter: shapeBand(row.evaluationAfter)
  });
}

function suppressNearby(candidates, distance) {
  const kept = [];
  for (const candidate of [...candidates].sort((a, b) => b.rankingScore - a.rankingScore || a.ply - b.ply)) {
    const duplicate = kept.some((item) => item.candidateType === candidate.candidateType && Math.abs(item.ply - candidate.ply) <= distance);
    if (!duplicate) kept.push(candidate);
  }
  return kept;
}

export class EngineCandidateSelector {
  constructor({
    majorDropCp = -250,
    reviewDropCp = -120,
    goodToleranceCp = 60,
    goodSwingCp = 120,
    duplicateDistancePly = 3,
    limit = 5
  } = {}) {
    this.thresholds = Object.freeze({ majorDropCp, reviewDropCp, goodToleranceCp, goodSwingCp });
    this.duplicateDistancePly = duplicateDistancePly;
    this.limit = Math.min(5, Math.max(3, limit));
  }

  select(rows = []) {
    const all = suppressNearby(rows.map((row) => candidateFromRow(row, this.thresholds)).filter(Boolean), this.duplicateDistancePly);
    const negative = all.filter((item) => item.candidateType !== ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE).sort((a, b) => b.rankingScore - a.rankingScore);
    const good = all.filter((item) => item.candidateType === ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE).sort((a, b) => b.rankingScore - a.rankingScore);
    const selected = negative.slice(0, this.limit);
    if (good.length && selected.length < this.limit) selected.push(good[0]);
    if (selected.length < 3) {
      for (const candidate of [...negative, ...good]) {
        if (selected.includes(candidate)) continue;
        selected.push(candidate);
        if (selected.length >= Math.min(3, all.length)) break;
      }
    }
    selected.sort((a, b) => b.rankingScore - a.rankingScore || a.ply - b.ply);
    const selectedSet = new Set(selected);
    return Object.freeze({
      primaryCandidates: Object.freeze(selected.slice(0, this.limit)),
      otherCandidates: Object.freeze(all.filter((candidate) => !selectedSet.has(candidate)).sort((a, b) => b.rankingScore - a.rankingScore)),
      totalCandidates: all.length
    });
  }
}
