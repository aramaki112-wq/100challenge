export class EngineAnalysisRepository {
  constructor() { this.records = new Map(); }
  save(result) {
    if (!result?.gameId || !result?.analysisId) throw new TypeError("解析結果にgameIdとanalysisIdが必要です。");
    const history = this.records.get(result.gameId) ?? [];
    this.records.set(result.gameId, Object.freeze([...history, result]));
    return result;
  }
  findByGameId(gameId) { return Object.freeze([...(this.records.get(gameId) ?? [])]); }
  findLatestByGameId(gameId) { return this.records.get(gameId)?.at(-1) ?? null; }
  findAll() { return Object.freeze([...this.records.values()].flat()); }
  replaceAll(records = []) { this.records.clear(); for (const record of records) this.save(record); }
  clear() { this.records.clear(); }
}
