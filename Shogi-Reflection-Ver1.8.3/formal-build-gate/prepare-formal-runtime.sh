#!/usr/bin/env bash
set -euo pipefail
APP_DIR="${1:?Shogi Reflection app directory required}"
GATE_DIR="$APP_DIR/formal-build-gate"
RUNTIME_DIR="$APP_DIR/minimal-real-usi/runtime"
ENGINE_DIR="$APP_DIR/engine/yaneuraou"
mkdir -p "$ENGINE_DIR" "$GATE_DIR/evidence"

for f in yaneuraou.material.js yaneuraou.material.wasm yaneuraou.material.worker.js; do
  test -s "$RUNTIME_DIR/$f"
  cp "$RUNTIME_DIR/$f" "$ENGINE_DIR/$f"
done
cp "$APP_DIR/YaneuraOuWasmWorkerBootstrap.js" "$ENGINE_DIR/YaneuraOuWasmWorkerBootstrap.js"

python3 - "$APP_DIR" "$GATE_DIR" "$ENGINE_DIR" <<'PY'
from pathlib import Path
import hashlib, json, sys
app=Path(sys.argv[1]); gate=Path(sys.argv[2]); engine=Path(sys.argv[3])
build=json.loads((gate/'FORMAL_BUILD_METADATA.json').read_text(encoding='utf-8'))
sha=lambda n: hashlib.sha256((engine/n).read_bytes()).hexdigest()
m={
  "schemaVersion":4,
  "available":True,
  "status":"RUN30_FORMAL_BUILD_PROFILE_CANDIDATE",
  "engineName":"YaneuraOu",
  "engineVersion":"V9.00",
  "release":"V9.00",
  "commitHash":build["commit"],
  "sourceRepository":build["repository"],
  "evaluationModel":"MATERIAL",
  "evaluationModelVersion":"MATERIAL_LEVEL=1",
  "materialLevel":1,
  "emscriptenVersion":"3.1.43",
  "emsdkVersion":"3.1.43",
  "buildId":"RUN30_FORMAL_BUILD_PROFILE_CANDIDATE",
  "workerUrl":"./engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js",
  "jsUrl":"./engine/yaneuraou/yaneuraou.material.js",
  "wasmUrl":"./engine/yaneuraou/yaneuraou.material.wasm",
  "pthreadWorkerUrl":"./engine/yaneuraou/yaneuraou.material.worker.js",
  "jsSha256":sha("yaneuraou.material.js"),
  "wasmSha256":sha("yaneuraou.material.wasm"),
  "workerSha256":sha("yaneuraou.material.worker.js"),
  "workerBootstrapSha256":sha("YaneuraOuWasmWorkerBootstrap.js"),
  "requiresThreads":True,
  "requiresCrossOriginIsolation":True,
  "pthreadPoolSize":build.get("pthreadPoolSize"),
  "initialMemory":build.get("initialMemory"),
  "maximumMemory":build.get("maximumMemory"),
  "memoryGrowth":build.get("memoryGrowth"),
  "stackSize":build.get("stackSize"),
  "sourceModified":True,
  "sourcePatches":build["sourcePatches"],
  "modifiedSourceFiles":build["modifiedSourceFiles"],
  "wasmUsiCommandExport":True,
  "diagnosticBuild":False,
  "formalBuildCandidate":True,
  "formalCompletion":False,
  "publicDistributionReady":False,
  "commercialDistributionReady":False,
  "legalReviewRequiredBeforePublicDistribution":True,
  "note":"Run #30 non-diagnostic Formal Build Profile candidate. Final Formal ZIP not issued."
}
(engine/'engine-manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(gate/'evidence'/'engine-manifest-run30.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
PY

sha256sum   "$ENGINE_DIR/yaneuraou.material.js"   "$ENGINE_DIR/yaneuraou.material.wasm"   "$ENGINE_DIR/yaneuraou.material.worker.js"   "$ENGINE_DIR/YaneuraOuWasmWorkerBootstrap.js"   > "$GATE_DIR/evidence/production-runtime-sha256.txt"
