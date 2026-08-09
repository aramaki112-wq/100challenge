import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";
import { ShogiEnginePort } from "./ShogiEnginePort.js";
import { parseUsiInfoLine } from "./UsiInfoParser.js";
import { UsiPositionMapper } from "./UsiPositionMapper.js";

function goCommand(settings) {
  const parts = ["go"];
  if (settings.maxDepth) parts.push("depth", String(settings.maxDepth));
  if (settings.maxNodes) parts.push("nodes", String(settings.maxNodes));
  if (settings.maxTimeMs) parts.push("movetime", String(settings.maxTimeMs));
  if (parts.length === 1) parts.push("depth", "12");
  return parts.join(" ");
}

function selectLatestByMultiPv(lines) {
  const map = new Map();
  for (const line of lines) {
    const parsed = parseUsiInfoLine(line);
    if (!parsed?.evaluation || !parsed.bestMove) continue;
    map.set(parsed.multiPv, parsed);
  }
  return [...map.values()].sort((a, b) => a.multiPv - b.multiPv);
}

export class UsiEngineAdapter extends ShogiEnginePort {
  constructor({ transport, engineInfo = {}, positionMapper = new UsiPositionMapper(), timeoutMs = 30000 } = {}) {
    super();
    if (!transport || typeof transport.start !== "function" || typeof transport.send !== "function" || typeof transport.waitFor !== "function") {
      throw new TypeError("USI Adapterにはstart/send/waitForを持つTransportが必要です。");
    }
    this.transport = transport;
    this.positionMapper = positionMapper;
    this.timeoutMs = timeoutMs;
    this.initialized = false;
    this.info = Object.freeze({
      engineName: String(engineInfo.engineName ?? "USI Engine"),
      engineVersion: String(engineInfo.engineVersion ?? "unknown"),
      evaluationModel: String(engineInfo.evaluationModel ?? "unknown"),
      evaluationModelVersion: String(engineInfo.evaluationModelVersion ?? "unknown"),
      adapter: String(engineInfo.adapter ?? "UsiEngineAdapter")
    });
  }

  async initialize() {
    if (this.initialized) return this.info;
    try {
      await this.transport.start();
      this.transport.send("usi");
      const usiLines = await this.transport.waitFor((line) => String(line).trim() === "usiok", { timeoutMs: this.timeoutMs });
      const identity = {};
      for (const line of usiLines ?? []) {
        const text = String(line).trim();
        if (text.startsWith("id name ")) identity.engineName = text.slice(8).trim();
      }
      this.transport.send("isready");
      await this.transport.waitFor((line) => String(line).trim() === "readyok", { timeoutMs: this.timeoutMs });
      this.info = Object.freeze({ ...this.info, ...identity });
      this.initialized = true;
      return this.info;
    } catch (error) {
      if (error instanceof EngineAnalysisError) throw error;
      throw new EngineAnalysisError(ENGINE_ERROR_CODES.ENGINE_INITIALIZATION_FAILED, "", { cause: error });
    }
  }

  async analyzePosition({ position, settings, signal = null } = {}) {
    if (!this.initialized) await this.initialize();
    if (signal?.aborted) throw new EngineAnalysisError(ENGINE_ERROR_CODES.ANALYSIS_CANCELLED);
    try {
      this.transport.send(`setoption name MultiPV value ${settings.multiPv}`);
      this.transport.send(`position sfen ${this.positionMapper.toSfen(position)}`);
      const startedAt = Date.now();
      this.transport.send(goCommand(settings));
      const lines = await this.transport.waitFor((line) => String(line).trim().startsWith("bestmove "), {
        timeoutMs: Math.max(this.timeoutMs, Number(settings.maxTimeMs ?? 0) + 5000), signal
      });
      const candidates = selectLatestByMultiPv(lines ?? []);
      const bestmoveLine = [...(lines ?? [])].reverse().find((line) => String(line).trim().startsWith("bestmove "));
      const bestMove = bestmoveLine ? String(bestmoveLine).trim().split(/\s+/)[1] : candidates[0]?.bestMove ?? null;
      if (!candidates.length || !candidates[0].evaluation) throw new EngineAnalysisError(ENGINE_ERROR_CODES.INVALID_RESPONSE);
      return Object.freeze({
        evaluation: candidates[0].evaluation,
        bestMove,
        candidateMoves: Object.freeze(candidates.map((item) => Object.freeze({
          rank: item.multiPv,
          move: item.bestMove,
          evaluation: item.evaluation,
          depth: item.depth,
          nodes: item.nodes,
          pv: item.pv
        }))),
        depth: candidates[0].depth,
        nodes: candidates[0].nodes,
        multiPv: settings.multiPv,
        analysisTime: Date.now() - startedAt
      });
    } catch (error) {
      if (signal?.aborted || error?.code === ENGINE_ERROR_CODES.ANALYSIS_CANCELLED) throw new EngineAnalysisError(ENGINE_ERROR_CODES.ANALYSIS_CANCELLED);
      if (error instanceof EngineAnalysisError) throw error;
      throw new EngineAnalysisError(ENGINE_ERROR_CODES.INVALID_RESPONSE, "", { cause: error });
    }
  }

  async cancelAnalysis() {
    if (this.initialized) this.transport.send("stop");
  }

  getEngineInfo() { return this.info; }

  async dispose() {
    try {
      if (this.initialized) this.transport.send("quit");
      await this.transport.dispose?.();
    } finally {
      this.initialized = false;
    }
  }
}
