export class EngineAnalysisPersistenceCoordinator {
  constructor({ snapshotService, store } = {}) { this.snapshotService = snapshotService; this.store = store; }
  saveToBrowser() { const snapshot = this.snapshotService.createSnapshot(); this.store.save(snapshot); return snapshot; }
  loadFromBrowser() { const snapshot = this.store.load(); if (!snapshot) return []; return this.snapshotService.restoreSnapshot(snapshot); }
  deleteBrowserData() { this.store.delete(); }
}
