#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Shogi Reflection app directory required}"
MINIMAL_RUNTIME="$APP_DIR/minimal-real-usi/runtime"
ENGINE_DIR="$APP_DIR/engine/yaneuraou"
GATE_DIR="$APP_DIR/real-reflection-flow-gate"
EVIDENCE_DIR="$GATE_DIR/evidence"

mkdir -p "$ENGINE_DIR" "$EVIDENCE_DIR"

if [[ -f "$ENGINE_DIR/engine-manifest.json" ]]; then
  cp "$ENGINE_DIR/engine-manifest.json" "$EVIDENCE_DIR/engine-manifest-before.json"
fi

for file in yaneuraou.material.js yaneuraou.material.wasm yaneuraou.material.worker.js; do
  test -s "$MINIMAL_RUNTIME/$file"
  cp "$MINIMAL_RUNTIME/$file" "$ENGINE_DIR/$file"
done

test -s "$APP_DIR/YaneuraOuWasmWorkerBootstrap.js"
cp "$APP_DIR/YaneuraOuWasmWorkerBootstrap.js" "$ENGINE_DIR/YaneuraOuWasmWorkerBootstrap.js"
cmp -s "$APP_DIR/YaneuraOuWasmWorkerBootstrap.js" "$ENGINE_DIR/YaneuraOuWasmWorkerBootstrap.js"

sha256sum \
  "$ENGINE_DIR/yaneuraou.material.js" \
  "$ENGINE_DIR/yaneuraou.material.wasm" \
  "$ENGINE_DIR/yaneuraou.material.worker.js" \
  "$ENGINE_DIR/YaneuraOuWasmWorkerBootstrap.js" \
  | tee "$EVIDENCE_DIR/real-reflection-runtime-sha256.txt"

python3 - "$ENGINE_DIR" <<'PY'
from pathlib import Path
import hashlib
import json
import sys

engine_dir = Path(sys.argv[1])

def sha(name: str) -> str:
    return hashlib.sha256((engine_dir / name).read_bytes()).hexdigest()

manifest = {
    "schemaVersion": 3,
    "available": True,
    "status": "RUN22_REAL_REFLECTION_FLOW_NOT_FORMAL",
    "engineName": "YaneuraOu",
    "engineVersion": "V9.00",
    "release": "V9.00",
    "commitHash": "a5ee2786c0030edc7d4a1cdfe94b04dffec55493",
    "sourceRepository": "https://github.com/yaneurao/YaneuraOu",
    "evaluationModel": "MATERIAL",
    "evaluationModelVersion": "MATERIAL_LEVEL=1",
    "materialLevel": 1,
    "emscriptenVersion": "3.1.43",
    "emsdkVersion": "3.1.43",
    "buildId": "RUN22_REAL_REFLECTION_FLOW_GATE",
    "workerUrl": "./engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js",
    "jsUrl": "./engine/yaneuraou/yaneuraou.material.js",
    "wasmUrl": "./engine/yaneuraou/yaneuraou.material.wasm",
    "pthreadWorkerUrl": "./engine/yaneuraou/yaneuraou.material.worker.js",
    "jsSha256": sha("yaneuraou.material.js"),
    "wasmSha256": sha("yaneuraou.material.wasm"),
    "workerSha256": sha("yaneuraou.material.worker.js"),
    "workerBootstrapSha256": sha("YaneuraOuWasmWorkerBootstrap.js"),
    "requiresThreads": True,
    "requiresCrossOriginIsolation": True,
    "upstreamPthreadPoolSize": 32,
    "upstreamInitialMemoryBytesMaterialLevel1": 92274688,
    "sourceModified": True,
    "sourcePatchFile": "patches/yaneuraou-v9.00-wasm-usi-bridge.patch",
    "sourcePatchSha256": "bb79c5297f6b3e06e4dd67187aafb4f8ab18657e837f087ae7cbab15fdc27f07",
    "sourcePatches": [
        {
            "file": "patches/yaneuraou-v9.00-wasm-usi-bridge.patch",
            "sha256": "bb79c5297f6b3e06e4dd67187aafb4f8ab18657e837f087ae7cbab15fdc27f07"
        },
        {
            "file": "minimal-real-usi/patches/yaneuraou-v9.00-emscripten-thread-worker-init.patch",
            "sha256": "e6993e913e012da43f4414379333f086a24990af2743ec9660101a308e8a8cfe"
        }
    ],
    "modifiedSourceFiles": [
        "source/usi.h",
        "source/engine/yaneuraou-engine/yaneuraou-search.cpp",
        "source/thread.cpp"
    ],
    "wasmUsiCommandExport": True,
    "formalCompletion": False,
    "note": "Run #22 Real Reflection Flow integration evidence. Not a public-distribution or Formal Completion manifest."
}
(engine_dir / "engine-manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8"
)
PY

cp "$ENGINE_DIR/engine-manifest.json" "$EVIDENCE_DIR/engine-manifest-run22.json"
printf '%s\n' \
  'index.html/main.js -> BrowserEngineProvider -> FallbackShogiEngineAdapter(primary Real YaneuraOu) -> YaneuraOuWasmAdapter -> BrowserWorkerUsiTransport -> production Worker Bootstrap -> Real YaneuraOu WASM -> AnalyzeGame -> BrowserEngineAnalysisView -> Replay -> KeyPosition -> Evaluation Graph -> STEP4' \
  > "$EVIDENCE_DIR/real-reflection-flow-chain.txt"
