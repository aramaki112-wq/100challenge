import { BrowserWorkerUsiTransport } from "./BrowserWorkerUsiTransport.js";
import { UsiEngineAdapter } from "./UsiEngineAdapter.js";

export const REFLECTION_LOCAL_ENGINE_VERSION = "1.0.0";
export const REFLECTION_LOCAL_EVALUATION_VERSION = "1.0.0";

export class ReflectionLocalEngineAdapter extends UsiEngineAdapter {
  constructor({ workerUrl = "./ReflectionLocalEngineWorker.js", WorkerClass = globalThis.Worker, timeoutMs = 15000, fallback = false, fallbackReason = "" } = {}) {
    super({
      transport: new BrowserWorkerUsiTransport({ workerUrl, WorkerClass }),
      timeoutMs,
      engineInfo: {
        engineName: "Shogi Reflection Local Engine",
        engineVersion: REFLECTION_LOCAL_ENGINE_VERSION,
        evaluationModel: "Material + mobility + king-safety heuristic",
        evaluationModelVersion: REFLECTION_LOCAL_EVALUATION_VERSION,
        adapter: "ReflectionLocalEngineAdapter",
        runtime: "Web Worker / JavaScript",
        localAnalysis: true,
        bundled: true,
        license: "MIT (same project source)",
        buildId: "reflection-local-engine-v1.0.0",
        fallback: Boolean(fallback),
        fallbackReason: String(fallbackReason ?? "")
      }
    });
  }
}
