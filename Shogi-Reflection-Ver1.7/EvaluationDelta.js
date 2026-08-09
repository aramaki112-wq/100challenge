import { ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";

export const EVALUATION_TRANSITION = Object.freeze({
  CP_CHANGE: "CP_CHANGE",
  MATE_GAINED: "MATE_GAINED",
  MATE_LOST: "MATE_LOST",
  MATED_CREATED: "MATED_CREATED",
  MATED_ESCAPED: "MATED_ESCAPED",
  MATE_DISTANCE_CHANGED: "MATE_DISTANCE_CHANGED",
  UNKNOWN: "UNKNOWN"
});

export function calculateEvaluationDelta(before, after) {
  if (before?.type === ENGINE_EVALUATION_TYPE.CP && after?.type === ENGINE_EVALUATION_TYPE.CP) {
    const centipawns = after.centipawns - before.centipawns;
    return Object.freeze({ kind: EVALUATION_TRANSITION.CP_CHANGE, centipawns, direction: Math.sign(centipawns) });
  }

  if (before?.type === ENGINE_EVALUATION_TYPE.CP && after?.type === ENGINE_EVALUATION_TYPE.MATE) {
    if (after.mateIn > 0) return Object.freeze({ kind: EVALUATION_TRANSITION.MATE_GAINED, mateIn: after.mateIn, direction: 1 });
    return Object.freeze({ kind: EVALUATION_TRANSITION.MATED_CREATED, mateIn: after.mateIn, direction: -1 });
  }

  if (before?.type === ENGINE_EVALUATION_TYPE.MATE && after?.type === ENGINE_EVALUATION_TYPE.CP) {
    if (before.mateIn > 0) return Object.freeze({ kind: EVALUATION_TRANSITION.MATE_LOST, mateIn: before.mateIn, direction: -1 });
    return Object.freeze({ kind: EVALUATION_TRANSITION.MATED_ESCAPED, mateIn: before.mateIn, direction: 1 });
  }

  if (before?.type === ENGINE_EVALUATION_TYPE.MATE && after?.type === ENGINE_EVALUATION_TYPE.MATE) {
    if (Math.sign(before.mateIn) !== Math.sign(after.mateIn)) {
      return Object.freeze({
        kind: after.mateIn > 0 ? EVALUATION_TRANSITION.MATE_GAINED : EVALUATION_TRANSITION.MATED_CREATED,
        beforeMateIn: before.mateIn,
        afterMateIn: after.mateIn,
        direction: after.mateIn > 0 ? 1 : -1
      });
    }
    const beneficial = before.mateIn > 0
      ? Math.abs(before.mateIn) - Math.abs(after.mateIn)
      : Math.abs(after.mateIn) - Math.abs(before.mateIn);
    return Object.freeze({
      kind: EVALUATION_TRANSITION.MATE_DISTANCE_CHANGED,
      beforeMateIn: before.mateIn,
      afterMateIn: after.mateIn,
      direction: Math.sign(beneficial)
    });
  }

  return Object.freeze({ kind: EVALUATION_TRANSITION.UNKNOWN, direction: 0 });
}
