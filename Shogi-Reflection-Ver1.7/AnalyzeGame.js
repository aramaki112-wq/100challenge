import { ENGINE_ANALYSIS_SCHEMA_VERSION } from "./EngineAnalysisConstants.js";
import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";
import { engineAnalysisSettings } from "./EngineAnalysisSettings.js";
import { normalizeEvaluation } from "./EvaluationNormalizer.js";
import { calculateEvaluationDelta } from "./EvaluationDelta.js";
import { EngineCandidateSelector } from "./EngineCandidateSelector.js";
import { assertShogiEnginePort } from "./ShogiEnginePort.js";
import { PIECE_OWNER } from "./ShogiPiece.js";
import { UsiPositionMapper } from "./UsiPositionMapper.js";

export class AnalyzeGame {
  constructor({ engine, candidateSelector = new EngineCandidateSelector(), positionMapper = new UsiPositionMapper(), now = () => new Date() } = {}) {
    this.engine = assertShogiEnginePort(engine);
    this.candidateSelector = candidateSelector;
    this.positionMapper = positionMapper;
    this.now = now;
    this.cancelled = false;
  }

  async execute({ gameId, history, playerSide, settings, onProgress = () => {}, signal = null } = {}) {
    if (!gameId) throw new TypeError("gameIdが必要です。");
    if (!history?.positions?.length) throw new TypeError("Position Historyが必要です。");
    if (!Object.values(PIECE_OWNER).includes(playerSide)) throw new TypeError("playerSideが不正です。");
    const appliedSettings = engineAnalysisSettings(settings);
    this.cancelled = false;
    await this.engine.initialize();
    const engineInfo = this.engine.getEngineInfo();
    const analyses = [];

    for (let ply = 0; ply <= history.maxMoveNumber; ply += 1) {
      if (this.cancelled || signal?.aborted) throw new EngineAnalysisError(ENGINE_ERROR_CODES.ANALYSIS_CANCELLED);
      const position = history.at(ply);
      const raw = await this.engine.analyzePosition({ position, settings: appliedSettings, signal });
      analyses.push(Object.freeze({
        ply,
        positionSideToMove: position.sideToMove,
        raw,
        evaluation: normalizeEvaluation(raw.evaluation, { sideToMove: position.sideToMove, viewerSide: playerSide })
      }));
      onProgress(Object.freeze({ completed: ply + 1, total: history.maxMoveNumber + 1, ply }));
    }

    const rows = [];
    for (let ply = 1; ply <= history.maxMoveNumber; ply += 1) {
      const move = history.moves[ply - 1];
      if (move.owner !== playerSide) continue;
      const before = analyses[ply - 1];
      const after = analyses[ply];
      let actualMove = null;
      try { actualMove = this.positionMapper.moveToUsi(move); } catch { actualMove = null; }
      const candidates = (before.raw.candidateMoves ?? []).map((candidate) => Object.freeze({ ...candidate }));
      const bestMove = before.raw.bestMove ?? candidates[0]?.move ?? null;
      rows.push(Object.freeze({
        gameId,
        ply,
        moveNumber: move.moveNumber,
        sideToMove: move.owner,
        actualMove,
        actualMoveText: move.notation,
        bestMove,
        bestMoveMatched: Boolean(bestMove && actualMove && actualMove === bestMove),
        candidateMoves: Object.freeze(candidates),
        evaluationBefore: before.evaluation,
        evaluationAfter: after.evaluation,
        evaluationDelta: calculateEvaluationDelta(before.evaluation, after.evaluation),
        depth: before.raw.depth ?? null,
        nodes: before.raw.nodes ?? null,
        analysisTime: before.raw.analysisTime ?? null
      }));
    }

    const selection = this.candidateSelector.select(rows);
    return Object.freeze({
      analysisId: `${gameId}-${this.now().toISOString()}`,
      gameId,
      status: "ANALYZED",
      schemaVersion: ENGINE_ANALYSIS_SCHEMA_VERSION,
      engine: Object.freeze({ ...engineInfo }),
      analysisSettings: Object.freeze({ ...appliedSettings }),
      analyzedAt: this.now().toISOString(),
      positionsAnalyzed: analyses.length,
      rows: Object.freeze(rows),
      primaryCandidates: selection.primaryCandidates,
      otherCandidates: selection.otherCandidates,
      totalCandidates: selection.totalCandidates
    });
  }

  async cancel() {
    this.cancelled = true;
    await this.engine.cancelAnalysis();
  }
}
