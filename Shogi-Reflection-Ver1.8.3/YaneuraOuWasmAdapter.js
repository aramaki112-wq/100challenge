import { BrowserWorkerUsiTransport } from "./BrowserWorkerUsiTransport.js";
import { YaneuraOuEngineAdapter } from "./YaneuraOuEngineAdapter.js";

export const YANEURAOU_PINNED_RELEASE = "V9.00";
export const YANEURAOU_PINNED_COMMIT = "a5ee2786c0030edc7d4a1cdfe94b04dffec55493";

/**
 * Browser Worker内のofficial-source YaneuraOu WASMをUSI Portへ接続するAdapter。
 * Domain/Application層はYaneuraOu/WASM/MATERIALを参照しない。
 */
export class YaneuraOuWasmAdapter extends YaneuraOuEngineAdapter {
  constructor({
    workerUrl = "./YaneuraOuWasmWorkerBootstrap.js",
    WorkerClass = globalThis.Worker,
    manifest = {},
    timeoutMs = 30000
  } = {}) {
    super({
      transport: new BrowserWorkerUsiTransport({ workerUrl, WorkerClass }),
      engineVersion: manifest.engineVersion ?? YANEURAOU_PINNED_RELEASE,
      evaluationModel: manifest.evaluationModel ?? "MATERIAL",
      evaluationModelVersion: manifest.evaluationModelVersion ?? `MATERIAL_LEVEL=${manifest.materialLevel ?? 1}`,
      timeoutMs,
      engineInfo: {
        adapter: "YaneuraOuWasmAdapter",
        runtime: "Web Worker / WebAssembly",
        sourceRepository: manifest.sourceRepository ?? "https://github.com/yaneurao/YaneuraOu",
        sourceCommit: manifest.commitHash ?? YANEURAOU_PINNED_COMMIT,
        sourceRelease: manifest.release ?? YANEURAOU_PINNED_RELEASE,
        materialLevel: manifest.materialLevel ?? 1,
        localAnalysis: true,
        bundled: true,
        license: "GPL-3.0 (YaneuraOu source; distribution obligations apply)",
        buildId: manifest.buildId ?? null,
        wasmSha256: manifest.wasmSha256 ?? null,
        jsSha256: manifest.jsSha256 ?? null,
        workerSha256: manifest.workerSha256 ?? null,
        emscriptenVersion: manifest.emscriptenVersion ?? null
      }
    });
  }
}
