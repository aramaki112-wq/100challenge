import { ENGINE_CANDIDATE_GROUP } from "./EngineCandidateSelector.js";
import { ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";
import { EngineEvaluationGraphModel, ENGINE_GRAPH_POINT_KIND } from "./EngineEvaluationGraphModel.js";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}

function evaluationLabel(evaluation) {
  if (evaluation?.type === ENGINE_EVALUATION_TYPE.CP) {
    const sign = evaluation.centipawns > 0 ? "+" : "";
    return `${sign}${evaluation.centipawns} cp`;
  }
  if (evaluation?.type === ENGINE_EVALUATION_TYPE.MATE) {
    return evaluation.mateIn > 0 ? `Mate Found +${evaluation.mateIn}` : `Mate Against ${evaluation.mateIn}`;
  }
  return "Unknown";
}

function xFor(ply, maxPly, left, width) {
  if (maxPly <= 0) return left;
  return left + (ply / maxPly) * width;
}

function yFor(point, clamp, top, height) {
  if (point.kind === ENGINE_GRAPH_POINT_KIND.MATE_FOR) return top + 8;
  if (point.kind === ENGINE_GRAPH_POINT_KIND.MATE_AGAINST) return top + height - 8;
  if (point.kind !== ENGINE_GRAPH_POINT_KIND.CP) return top + height / 2;
  const ratio = (clamp - point.plotCp) / (clamp * 2);
  return top + ratio * height;
}

function markerClass(point) {
  const classes = ["engine-graph-point"];
  if (point.candidateGroup === ENGINE_CANDIDATE_GROUP.GOOD) classes.push("is-good");
  if (point.candidateGroup === ENGINE_CANDIDATE_GROUP.BAD) classes.push("is-bad");
  if (point.keyPosition) classes.push("is-key-position");
  if (point.isMate) classes.push("is-mate");
  if (point.kind === ENGINE_GRAPH_POINT_KIND.UNKNOWN) classes.push("is-unknown");
  return classes.join(" ");
}

function pointTitle(point) {
  const parts = [`${point.ply}手目`, evaluationLabel(point.evaluation)];
  if (point.candidateGroup === ENGINE_CANDIDATE_GROUP.GOOD) parts.push("Good Candidate");
  if (point.candidateGroup === ENGINE_CANDIDATE_GROUP.BAD) parts.push("Bad Candidate");
  if (point.keyPosition) parts.push(`重要局面 ${point.keyPosition.keyPositionId}`);
  return parts.join(" · ");
}

export class EngineEvaluationGraphView {
  constructor({ model = new EngineEvaluationGraphModel() } = {}) {
    this.model = model;
  }

  render({ evaluationTimeline = [], goodCandidates = [], badCandidates = [], keyPositions = [] } = {}) {
    const graph = this.model.create({ evaluationTimeline, goodCandidates, badCandidates, keyPositions });
    if (!graph.points.length) {
      return '<p class="empty-state">評価値グラフを表示できる解析Pointがありません。</p>';
    }

    const viewWidth = 720;
    const viewHeight = 260;
    const left = 42;
    const right = 14;
    const top = 18;
    const bottom = 34;
    const plotWidth = viewWidth - left - right;
    const plotHeight = viewHeight - top - bottom;
    const zeroY = yFor({ kind: ENGINE_GRAPH_POINT_KIND.CP, plotCp: 0 }, graph.cpClamp, top, plotHeight);
    // Do not visually bridge across Mate/Unknown. Each consecutive CP run is a
    // separate line segment so a dedicated state remains a real discontinuity.
    const cpRuns = [];
    let currentRun = [];
    for (const point of graph.points) {
      if (point.kind === ENGINE_GRAPH_POINT_KIND.CP) {
        currentRun.push(point);
      } else if (currentRun.length) {
        cpRuns.push(currentRun);
        currentRun = [];
      }
    }
    if (currentRun.length) cpRuns.push(currentRun);
    const polylines = cpRuns
      .filter((run) => run.length >= 2)
      .map((run) => `<polyline class="engine-graph-line" points="${run.map((point) => `${xFor(point.ply, graph.maxPly, left, plotWidth).toFixed(1)},${yFor(point, graph.cpClamp, top, plotHeight).toFixed(1)}`).join(" ")}" fill="none"></polyline>`)
      .join("");

    const marks = graph.points.map((point) => {
      const x = xFor(point.ply, graph.maxPly, left, plotWidth);
      const y = yFor(point, graph.cpClamp, top, plotHeight);
      const clickable = Boolean(point.candidateGroup || point.keyPosition);
      const radius = point.keyPosition ? 7 : (point.isMate ? 6 : (point.candidateGroup ? 5.5 : 2.5));
      const markerData = point.keyPosition
        ? `data-engine-graph-key-position-ply="${point.ply}" data-key-position-index="${point.keyPosition.index}"`
        : (point.candidateGroup ? `data-engine-graph-replay-ply="${point.ply}"` : "");
      return `<g class="${markerClass(point)}" data-engine-graph-ply="${point.ply}" ${markerData} ${clickable ? 'tabindex="0" role="button"' : ''} aria-label="${escapeHtml(pointTitle(point))}">
        <title>${escapeHtml(pointTitle(point))}</title>
        ${point.keyPosition ? `<rect class="engine-graph-key-halo" x="${(x - 8).toFixed(1)}" y="${(y - 8).toFixed(1)}" width="16" height="16" rx="3"></rect>` : ""}
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}"></circle>
      </g>`;
    }).join("");

    const xLabels = [0, Math.round(graph.maxPly / 2), graph.maxPly]
      .filter((value, index, values) => values.indexOf(value) === index)
      .map((ply) => `<text class="engine-graph-axis-label" x="${xFor(ply, graph.maxPly, left, plotWidth).toFixed(1)}" y="${viewHeight - 10}" text-anchor="middle">${ply}</text>`)
      .join("");

    return `<div class="engine-evaluation-graph-shell">
      <div class="engine-graph-heading-row"><div><h4>評価値グラフ</h4><p>+は本人に有利、−は本人に不利。候補MarkerはReplayへ、重要局面MarkerはSTEP4の該当Cardへ移動します。</p></div><span class="engine-graph-perspective">本人視点</span></div>
      <div class="engine-graph-scroll" tabindex="0" aria-label="評価値グラフ。横軸は手数、縦軸は本人視点評価値。">
        <svg class="engine-evaluation-graph" viewBox="0 0 ${viewWidth} ${viewHeight}" role="img" aria-label="0手目から${graph.maxPly}手目までの評価値グラフ">
          <line class="engine-graph-grid zero" x1="${left}" x2="${viewWidth - right}" y1="${zeroY.toFixed(1)}" y2="${zeroY.toFixed(1)}"></line>
          <line class="engine-graph-axis" x1="${left}" x2="${left}" y1="${top}" y2="${top + plotHeight}"></line>
          <line class="engine-graph-axis" x1="${left}" x2="${viewWidth - right}" y1="${top + plotHeight}" y2="${top + plotHeight}"></line>
          <text class="engine-graph-axis-label" x="5" y="${top + 10}">+${graph.cpClamp}</text>
          <text class="engine-graph-axis-label" x="12" y="${zeroY - 4}">0</text>
          <text class="engine-graph-axis-label" x="5" y="${top + plotHeight - 4}">-${graph.cpClamp}</text>
          ${polylines}
          ${marks}
          ${xLabels}
        </svg>
      </div>
      <div class="engine-graph-legend" aria-label="評価値グラフ凡例"><span><i class="legend-dot good"></i>Good Candidate</span><span><i class="legend-dot bad"></i>Bad Candidate</span><span><i class="legend-dot key"></i>重要局面</span><span><i class="legend-dot mate"></i>Mate</span></div>
      <p class="engine-graph-note">表示範囲はCPを±${graph.cpClamp}へClampしますが、元の評価値は変換せず保持します。Mateは巨大CPへ変換せず専用Markerです。</p>
    </div>`;
  }
}
