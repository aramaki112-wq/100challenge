const REQUIRED_METHODS = Object.freeze([
  "initialize",
  "analyzePosition",
  "cancelAnalysis",
  "getEngineInfo",
  "dispose"
]);

export function assertShogiEnginePort(adapter) {
  if (!adapter || typeof adapter !== "object") {
    throw new TypeError("ShogiEnginePortへEngine Adapterを指定してください。");
  }
  for (const method of REQUIRED_METHODS) {
    if (typeof adapter[method] !== "function") {
      throw new TypeError(`ShogiEnginePort Adapterに${method}()が必要です。`);
    }
  }
  return adapter;
}

export class ShogiEnginePort {
  async initialize() { throw new Error("initialize()を実装してください。"); }
  async analyzePosition() { throw new Error("analyzePosition()を実装してください。"); }
  async cancelAnalysis() { throw new Error("cancelAnalysis()を実装してください。"); }
  getEngineInfo() { throw new Error("getEngineInfo()を実装してください。"); }
  async dispose() { throw new Error("dispose()を実装してください。"); }
}
