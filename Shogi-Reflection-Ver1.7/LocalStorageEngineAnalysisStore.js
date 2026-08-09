export const ENGINE_ANALYSIS_STORAGE_KEY = "shogi-reflection-interlude.engine-analyses.v1";
export class LocalStorageEngineAnalysisStore {
  constructor({ storage, key = ENGINE_ANALYSIS_STORAGE_KEY } = {}) { if (!storage) throw new TypeError("storageが必要です。"); this.storage = storage; this.key = key; }
  save(snapshot) { this.storage.setItem(this.key, JSON.stringify(snapshot)); }
  load() { const text = this.storage.getItem(this.key); return text ? JSON.parse(text) : null; }
  delete() { this.storage.removeItem(this.key); }
}
