import { BrowserWorkerUsiTransport } from "./BrowserWorkerUsiTransport.js";
import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";
import { FallbackShogiEngineAdapter } from "./FallbackShogiEngineAdapter.js";
import { MockShogiEngineAdapter } from "./MockShogiEngineAdapter.js";
import { ReflectionLocalEngineAdapter } from "./ReflectionLocalEngineAdapter.js";
import { YaneuraOuEngineAdapter } from "./YaneuraOuEngineAdapter.js";
import { YaneuraOuWasmAdapter } from "./YaneuraOuWasmAdapter.js";

async function readYaneuraOuManifest(windowObject) {
  const fetchFn = windowObject?.fetch;
  if (typeof fetchFn !== "function") return null;
  const manifestUrl = String(windowObject.SHOGI_REFLECTION_YANEURAOU_MANIFEST_URL ?? "./engine/yaneuraou/engine-manifest.json");
  try {
    const response = await fetchFn.call(windowObject, manifestUrl, { cache: "no-store" });
    if (!response?.ok) return null;
    const manifest = await response.json();
    if (!manifest || manifest.available !== true || !manifest.workerUrl) return null;
    return manifest;
  } catch {
    return null;
  }
}

function localFallback(windowObject, reason) {
  if (!windowObject.Worker) throw new EngineAnalysisError(ENGINE_ERROR_CODES.ENGINE_NOT_FOUND);
  const localWorkerUrl = String(windowObject.SHOGI_REFLECTION_LOCAL_ENGINE_WORKER_URL ?? "./ReflectionLocalEngineWorker.js");
  return new ReflectionLocalEngineAdapter({
    workerUrl: localWorkerUrl,
    WorkerClass: windowObject.Worker,
    fallback: true,
    fallbackReason: reason
  });
}

/**
 * Browser版Engine解決。
 * Priority:
 *   1. explicit application/provider override
 *   2. explicit mock/dev override
 *   3. explicit external USI Worker
 *   4. verified bundled YaneuraOu WASM manifest
 *   5. first-party ReflectionLocalEngine fallback
 *
 * Real YaneuraOu buildの存在判定はAdapter/Provider境界に閉じ込める。
 */
export async function resolveBrowserEngine(windowObject = window) {
  const external = windowObject.ShogiReflectionEngineProvider;
  if (external?.createEngine) return external.createEngine();

  const params = new URL(windowObject.location.href).searchParams;
  if (params.get("engine") === "mock" || windowObject.__SHOGI_REFLECTION_USE_MOCK_ENGINE__ === true) {
    return new MockShogiEngineAdapter({ delayMs: Number(windowObject.__SHOGI_REFLECTION_MOCK_DELAY_MS__ ?? 0) });
  }

  if (params.get("engine") === "local") {
    return localFallback(windowObject, "利用者がDevelopment用の簡易Engineを明示選択しました。");
  }

  const workerUrl = String(windowObject.SHOGI_REFLECTION_ENGINE_WORKER_URL ?? "").trim();
  if (workerUrl) {
    const metadata = windowObject.SHOGI_REFLECTION_ENGINE_METADATA ?? {};
    return new YaneuraOuEngineAdapter({
      transport: new BrowserWorkerUsiTransport({ workerUrl, WorkerClass: windowObject.Worker }),
      engineVersion: metadata.engineVersion ?? "external",
      evaluationModel: metadata.evaluationModel ?? "external",
      evaluationModelVersion: metadata.evaluationModelVersion ?? "external",
      engineInfo: metadata
    });
  }

  const manifest = await readYaneuraOuManifest(windowObject);
  if (manifest) {
    if (!windowObject.Worker) throw new EngineAnalysisError(ENGINE_ERROR_CODES.UNSUPPORTED_BROWSER);
    const primary = new YaneuraOuWasmAdapter({
      workerUrl: manifest.workerUrl,
      WorkerClass: windowObject.Worker,
      manifest
    });
    const fallback = new ReflectionLocalEngineAdapter({
      workerUrl: String(windowObject.SHOGI_REFLECTION_LOCAL_ENGINE_WORKER_URL ?? "./ReflectionLocalEngineWorker.js"),
      WorkerClass: windowObject.Worker
    });
    return new FallbackShogiEngineAdapter({ primary, fallback, primaryLabel: `YaneuraOu ${manifest.engineVersion ?? "WASM"}` });
  }

  return localFallback(windowObject, "検証済みYaneuraOu WASM buildをこの配布物で確認できませんでした。");
}
