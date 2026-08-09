import { BrowserWorkerUsiTransport } from "./BrowserWorkerUsiTransport.js";
import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";
import { MockShogiEngineAdapter } from "./MockShogiEngineAdapter.js";
import { YaneuraOuEngineAdapter } from "./YaneuraOuEngineAdapter.js";

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

  throw new EngineAnalysisError(ENGINE_ERROR_CODES.ENGINE_NOT_FOUND);
}
