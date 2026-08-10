import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";

export class BrowserWorkerUsiTransport {
  constructor({ workerUrl, WorkerClass = globalThis.Worker } = {}) {
    this.workerUrl = workerUrl;
    this.WorkerClass = WorkerClass;
    this.worker = null;
    this.lines = [];
    this.waiters = new Set();
  }

  async start() {
    if (this.worker) return;
    if (!this.WorkerClass || !this.workerUrl) throw new EngineAnalysisError(ENGINE_ERROR_CODES.UNSUPPORTED_BROWSER);
    this.worker = new this.WorkerClass(this.workerUrl, { type: "classic" });
    this.worker.addEventListener("message", (event) => this.#accept(event.data));
    this.worker.addEventListener("error", (event) => {
      for (const waiter of this.waiters) waiter.reject(new EngineAnalysisError(ENGINE_ERROR_CODES.ENGINE_CRASH, event.message));
      this.waiters.clear();
    });
  }

  #accept(data) {
    const values = Array.isArray(data) ? data : [data];
    for (const value of values) {
      if (value && typeof value === "object" && value.type === "engine-error") {
        const error = new EngineAnalysisError(ENGINE_ERROR_CODES.ENGINE_CRASH, String(value.message ?? "Engine Worker error"));
        for (const waiter of this.waiters) waiter.reject(error);
        this.waiters.clear();
        continue;
      }
      const line = typeof value === "string" ? value : value?.line;
      if (typeof line !== "string") continue;
      this.lines.push(line);
      for (const waiter of [...this.waiters]) {
        waiter.collected.push(line);
        if (waiter.predicate(line)) {
          clearTimeout(waiter.timer);
          this.waiters.delete(waiter);
          waiter.resolve([...waiter.collected]);
        }
      }
    }
  }

  send(command) {
    if (!this.worker) throw new EngineAnalysisError(ENGINE_ERROR_CODES.ENGINE_INITIALIZATION_FAILED);
    this.worker.postMessage(String(command));
  }

  waitFor(predicate, { timeoutMs = 30000, signal = null } = {}) {
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, reject, collected: [] };
      waiter.timer = setTimeout(() => {
        this.waiters.delete(waiter);
        reject(new EngineAnalysisError(ENGINE_ERROR_CODES.TIMEOUT));
      }, timeoutMs);
      if (signal) {
        signal.addEventListener("abort", () => {
          clearTimeout(waiter.timer);
          this.waiters.delete(waiter);
          reject(new EngineAnalysisError(ENGINE_ERROR_CODES.ANALYSIS_CANCELLED));
        }, { once: true });
      }
      this.waiters.add(waiter);
    });
  }

  async dispose() {
    this.worker?.terminate();
    this.worker = null;
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      waiter.reject(new EngineAnalysisError(ENGINE_ERROR_CODES.ANALYSIS_CANCELLED));
    }
    this.waiters.clear();
  }
}
