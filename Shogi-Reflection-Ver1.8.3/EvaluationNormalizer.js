import { ENGINE_EVALUATION_PERSPECTIVE, ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";
import { PIECE_OWNER } from "./ShogiPiece.js";

function signForPerspective({ perspective, sideToMove }) {
  if (perspective === ENGINE_EVALUATION_PERSPECTIVE.SENTE) return 1;
  if (perspective === ENGINE_EVALUATION_PERSPECTIVE.SIDE_TO_MOVE) {
    return sideToMove === PIECE_OWNER.SENTE ? 1 : -1;
  }
  throw new TypeError("評価値の視点が不明です。");
}

export function normalizeEvaluation(rawEvaluation, {
  sideToMove,
  viewerSide = PIECE_OWNER.SENTE
} = {}) {
  if (!rawEvaluation) return Object.freeze({ type: ENGINE_EVALUATION_TYPE.UNKNOWN });
  if (!Object.values(PIECE_OWNER).includes(sideToMove)) throw new TypeError("sideToMoveが不正です。");
  if (!Object.values(PIECE_OWNER).includes(viewerSide)) throw new TypeError("viewerSideが不正です。");

  const toSente = signForPerspective({ perspective: rawEvaluation.perspective, sideToMove });
  const senteToViewer = viewerSide === PIECE_OWNER.SENTE ? 1 : -1;
  const factor = toSente * senteToViewer;

  if (rawEvaluation.type === ENGINE_EVALUATION_TYPE.CP) {
    const centipawns = Number(rawEvaluation.centipawns);
    if (!Number.isFinite(centipawns)) throw new TypeError("Centipawn評価値が不正です。");
    return Object.freeze({
      type: ENGINE_EVALUATION_TYPE.CP,
      centipawns: Math.trunc(centipawns * factor),
      perspective: "VIEWER"
    });
  }

  if (rawEvaluation.type === ENGINE_EVALUATION_TYPE.MATE) {
    const mateIn = Number(rawEvaluation.mateIn);
    if (!Number.isInteger(mateIn) || mateIn === 0) throw new TypeError("Mate評価は0以外の整数で指定してください。");
    return Object.freeze({
      type: ENGINE_EVALUATION_TYPE.MATE,
      mateIn: mateIn * factor,
      perspective: "VIEWER"
    });
  }

  return Object.freeze({ type: ENGINE_EVALUATION_TYPE.UNKNOWN });
}
