import { ENGINE_EVALUATION_PERSPECTIVE, ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";
import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";
import { ShogiEnginePort } from "./ShogiEnginePort.js";

function mockCp(moveNumber) {
  const values = [20, 30, 40, -320, -310, -300, -295, -290, 120, 130, 125, -240, -230, 280, 285, 290, -80, -70, 350, 360, 355, 360];
  return values[moveNumber % values.length];
}

export class MockShogiEngineAdapter extends ShogiEnginePort {
  constructor({ delayMs = 0 } = {}) { super(); this.delayMs = delayMs; this.cancelled = false; this.initialized = false; }
  async initialize() { this.initialized = true; this.cancelled = false; return this.getEngineInfo(); }
  async analyzePosition({ position, settings } = {}) {
    if (!this.initialized) await this.initialize();
    if (this.cancelled) throw new EngineAnalysisError(ENGINE_ERROR_CODES.ANALYSIS_CANCELLED);
    if (this.delayMs) await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    const cp = mockCp(position.moveNumber);
    const pseudo = position.moveNumber % 2 === 0 ? "7g7f" : "3c3d";
    return Object.freeze({
      evaluation: Object.freeze({ type: ENGINE_EVALUATION_TYPE.CP, centipawns: cp, perspective: ENGINE_EVALUATION_PERSPECTIVE.SENTE }),
      bestMove: pseudo,
      candidateMoves: Object.freeze(Array.from({ length: settings?.multiPv ?? 3 }, (_, index) => Object.freeze({ rank: index + 1, move: index === 0 ? pseudo : `${index + 1}a${index + 1}b`, evaluation: { type: ENGINE_EVALUATION_TYPE.CP, centipawns: cp - index * 25, perspective: ENGINE_EVALUATION_PERSPECTIVE.SENTE } }))),
      depth: settings?.maxDepth ?? 12,
      nodes: 1000 + position.moveNumber * 100,
      multiPv: settings?.multiPv ?? 3,
      analysisTime: this.delayMs
    });
  }
  async cancelAnalysis() { this.cancelled = true; }
  getEngineInfo() { return Object.freeze({ engineName: "Verification Mock Engine", engineVersion: "1.0", evaluationModel: "deterministic-test", evaluationModelVersion: "1.0", adapter: "MockShogiEngineAdapter", mock: true }); }
  async dispose() { this.initialized = false; }
}
