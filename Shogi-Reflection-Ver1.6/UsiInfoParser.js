import { ENGINE_EVALUATION_PERSPECTIVE, ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";

function numberAfter(tokens, key) {
  const index = tokens.indexOf(key);
  if (index < 0 || index + 1 >= tokens.length) return null;
  const value = Number(tokens[index + 1]);
  return Number.isFinite(value) ? value : null;
}

export function parseUsiInfoLine(line) {
  const text = String(line ?? "").trim();
  if (!text.startsWith("info ")) return null;
  const tokens = text.split(/\s+/);
  const scoreIndex = tokens.indexOf("score");
  let evaluation = null;
  if (scoreIndex >= 0) {
    const type = tokens[scoreIndex + 1];
    const value = Number(tokens[scoreIndex + 2]);
    if (type === "cp" && Number.isFinite(value)) {
      evaluation = Object.freeze({ type: ENGINE_EVALUATION_TYPE.CP, centipawns: Math.trunc(value), perspective: ENGINE_EVALUATION_PERSPECTIVE.SIDE_TO_MOVE });
    } else if (type === "mate" && Number.isInteger(value) && value !== 0) {
      evaluation = Object.freeze({ type: ENGINE_EVALUATION_TYPE.MATE, mateIn: value, perspective: ENGINE_EVALUATION_PERSPECTIVE.SIDE_TO_MOVE });
    }
  }
  const pvIndex = tokens.indexOf("pv");
  const pv = pvIndex >= 0 ? tokens.slice(pvIndex + 1) : [];
  return Object.freeze({
    depth: numberAfter(tokens, "depth"),
    nodes: numberAfter(tokens, "nodes"),
    multiPv: numberAfter(tokens, "multipv") ?? 1,
    evaluation,
    pv: Object.freeze(pv),
    bestMove: pv[0] ?? null,
    rawLine: text
  });
}
