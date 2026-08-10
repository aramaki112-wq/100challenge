import { ShogiEnginePort, assertShogiEnginePort } from "./ShogiEnginePort.js";

/**
 * Primary Engineの初期化だけを安全にFallbackするPort decorator。
 * 解析途中で別Engineへ切り替えると同一棋譜内の評価基準が混ざるため、
 * analyzePosition()失敗時には自動で混在させない。
 */
export class FallbackShogiEngineAdapter extends ShogiEnginePort {
  constructor({ primary, fallback, primaryLabel = "Primary Engine" } = {}) {
    super();
    this.primary = assertShogiEnginePort(primary);
    this.fallback = assertShogiEnginePort(fallback);
    this.primaryLabel = String(primaryLabel);
    this.active = null;
    this.info = null;
  }

  async initialize() {
    if (this.active) return this.info;
    try {
      const info = await this.primary.initialize();
      this.active = this.primary;
      this.info = Object.freeze({ ...info, fallback: false });
      return this.info;
    } catch (error) {
      try { await this.primary.dispose(); } catch { /* primary failure cleanup best effort */ }
      const info = await this.fallback.initialize();
      this.active = this.fallback;
      this.info = Object.freeze({
        ...info,
        fallback: true,
        fallbackFrom: this.primaryLabel,
        fallbackReason: String(error?.userMessage ?? error?.message ?? "Primary Engineを初期化できませんでした。"),
        fallbackErrorCode: error?.code ?? null
      });
      return this.info;
    }
  }

  async analyzePosition(args) {
    if (!this.active) await this.initialize();
    return this.active.analyzePosition(args);
  }

  async cancelAnalysis() {
    return this.active?.cancelAnalysis?.();
  }

  getEngineInfo() {
    return this.info ?? this.active?.getEngineInfo?.() ?? Object.freeze({
      engineName: "Engine fallback pending",
      engineVersion: "unknown",
      evaluationModel: "unknown",
      evaluationModelVersion: "unknown",
      adapter: "FallbackShogiEngineAdapter"
    });
  }

  async dispose() {
    const target = this.active;
    this.active = null;
    this.info = null;
    if (target) await target.dispose();
    else {
      try { await this.primary.dispose(); } catch { /* no-op */ }
      try { await this.fallback.dispose(); } catch { /* no-op */ }
    }
  }
}
