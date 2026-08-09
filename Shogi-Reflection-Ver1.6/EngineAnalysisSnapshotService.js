import { ENGINE_ANALYSIS_SCHEMA_VERSION } from "./EngineAnalysisConstants.js";
export class EngineAnalysisSnapshotService {
  constructor({ repository } = {}) { this.repository = repository; }
  createSnapshot() { return Object.freeze({ applicationId: "SHOGI_REFLECTION_ENGINE_ANALYSIS", schemaVersion: ENGINE_ANALYSIS_SCHEMA_VERSION, exportedAt: new Date().toISOString(), records: this.repository.findAll() }); }
  restoreSnapshot(snapshot) {
    if (!snapshot || snapshot.applicationId !== "SHOGI_REFLECTION_ENGINE_ANALYSIS" || snapshot.schemaVersion !== ENGINE_ANALYSIS_SCHEMA_VERSION || !Array.isArray(snapshot.records)) throw new TypeError("Engine解析Snapshotが不正です。");
    this.repository.replaceAll(snapshot.records);
    return this.repository.findAll();
  }
}
