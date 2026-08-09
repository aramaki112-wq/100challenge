import { BrowserWorkerUsiTransport } from "./BrowserWorkerUsiTransport.js";
import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";
import { MockShogiEngineAdapter } from "./MockShogiEngineAdapter.js";
import { ReflectionLocalEngineAdapter } from "./ReflectionLocalEngineAdapter.js";
import { YaneuraOuEngineAdapter } from "./YaneuraOuEngineAdapter.js";

/**
 * Browser版のEngine解決。
 * Ver.1.8の正式Baselineは、第三者Binary/Weightを同梱しないfirst-party Local Worker Engine。
 * 外部USI Workerは明示設定時のみ利用し、Domain/Application層へEngine固有名を漏らさない。
 */
export async function resolveBrowserEngine(windowObject = window) {
  const external = windowObject.ShogiReflectionEngineProvider;
  if (external?.createEngine) return external.createEngine();

  const params = new URL(windowObject.location.href).searchParams;
  if (params.get("engine") === "mock" || windowObject.__SHOGI_REFLECTION_USE_MOCK_ENGINE__ === true) {
    return new MockShogiEngineAdapter({ delayMs: Number(windowObject.__SHOGI_REFLECTION_MOCK_DELAY_MS__ ?? 0) });
  }

  const workerUrl = String(windowObject.SHOGI_REFLECTION_ENGINE_WORKER_URL ?? "").trim();
  if (workerUrl) {
    const metadata = windowObject.SHOGI_REFLECTION_ENGINE_METADATA ?? {};
    return new YaneuraOuEngineAdapter({
      transport: new BrowserWorkerUsiTransport({ workerUrl }),
      engineVersion: metadata.engineVersion ?? "external",
      evaluationModel: metadata.evaluationModel ?? "external",
      evaluationModelVersion: metadata.evaluationModelVersion ?? "external"
    });
  }

  if (!windowObject.Worker) throw new EngineAnalysisError(ENGINE_ERROR_CODES.ENGINE_NOT_FOUND);
  const localWorkerUrl = String(windowObject.SHOGI_REFLECTION_LOCAL_ENGINE_WORKER_URL ?? "./ReflectionLocalEngineWorker.js");
  return new ReflectionLocalEngineAdapter({ workerUrl: localWorkerUrl, WorkerClass: windowObject.Worker });
}
