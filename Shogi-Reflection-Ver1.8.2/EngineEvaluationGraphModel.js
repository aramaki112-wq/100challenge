import { ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";
import { ENGINE_CANDIDATE_GROUP } from "./EngineCandidateSelector.js";

export const ENGINE_GRAPH_POINT_KIND = Object.freeze({
  CP: "CP",
  MATE_FOR: "MATE_FOR",
  MATE_AGAINST: "MATE_AGAINST",
  UNKNOWN: "UNKNOWN"
});

const DEFAULT_CP_CLAMP = 1200;

function normalizeKeyPositions(keyPositions = []) {
  return keyPositions
    .map((item, index) => ({
      index,
      keyPositionId: String(item?.keyPositionId ?? `KP-${index + 1}`),
      ply: Number(item?.moveNumber)
    }))
    .filter((item) => Number.isInteger(item.ply) && item.ply >= 0);
}

function pointKind(evaluation) {
  if (evaluation?.type === ENGINE_EVALUATION_TYPE.CP) return ENGINE_GRAPH_POINT_KIND.CP;
  if (evaluation?.type === ENGINE_EVALUATION_TYPE.MATE) {
    return evaluation.mateIn > 0 ? ENGINE_GRAPH_POINT_KIND.MATE_FOR : ENGINE_GRAPH_POINT_KIND.MATE_AGAINST;
  }
  return ENGINE_GRAPH_POINT_KIND.UNKNOWN;
}

function cpForPlot(evaluation, clamp) {
  if (evaluation?.type !== ENGINE_EVALUATION_TYPE.CP) return null;
  return Math.max(-clamp, Math.min(clamp, Number(evaluation.centipawns) || 0));
}

export class EngineEvaluationGraphModel {
  constructor({ cpClamp = DEFAULT_CP_CLAMP } = {}) {
    this.cpClamp = Math.max(200, Number(cpClamp) || DEFAULT_CP_CLAMP);
  }

  create({ evaluationTimeline = [], goodCandidates = [], badCandidates = [], keyPositions = [] } = {}) {
    const goodByPly = new Map(goodCandidates.map((item) => [Number(item.ply), item]));
    const badByPly = new Map(badCandidates.map((item) => [Number(item.ply), item]));
    const keyByPly = new Map(normalizeKeyPositions(keyPositions).map((item) => [item.ply, item]));
    const maxPly = Math.max(0, ...evaluationTimeline.map((item) => Number(item.ply) || 0));

    const points = evaluationTimeline.map((entry) => {
      const ply = Number(entry.ply) || 0;
      const evaluation = entry.evaluation ?? null;
      const kind = pointKind(evaluation);
      const good = goodByPly.get(ply) ?? null;
      const bad = badByPly.get(ply) ?? null;
      const keyPosition = keyByPly.get(ply) ?? null;
      const candidateGroup = bad
        ? ENGINE_CANDIDATE_GROUP.BAD
        : (good ? ENGINE_CANDIDATE_GROUP.GOOD : null);
      return Object.freeze({
        ply,
        evaluation,
        kind,
        plotCp: cpForPlot(evaluation, this.cpClamp),
        candidateGroup,
        candidate: bad ?? good,
        keyPosition,
        isMate: kind === ENGINE_GRAPH_POINT_KIND.MATE_FOR || kind === ENGINE_GRAPH_POINT_KIND.MATE_AGAINST,
        depth: entry.depth ?? null,
        nodes: entry.nodes ?? null,
        time: entry.time ?? entry.analysisTime ?? null,
        bestMove: entry.bestMove ?? null
      });
    });

    return Object.freeze({
      points: Object.freeze(points),
      maxPly,
      cpClamp: this.cpClamp,
      hasCp: points.some((point) => point.kind === ENGINE_GRAPH_POINT_KIND.CP),
      hasMate: points.some((point) => point.isMate),
      goodMarkerCount: points.filter((point) => point.candidateGroup === ENGINE_CANDIDATE_GROUP.GOOD).length,
      badMarkerCount: points.filter((point) => point.candidateGroup === ENGINE_CANDIDATE_GROUP.BAD).length,
      keyPositionMarkerCount: points.filter((point) => point.keyPosition).length
    });
  }
}
