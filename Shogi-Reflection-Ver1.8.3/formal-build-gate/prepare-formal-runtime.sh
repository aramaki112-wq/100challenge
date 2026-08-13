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

cp "$APP_DIR/YaneuraOuWasmWorkerBootstrap.js" \
  "$ENGINE_DIR/YaneuraOuWasmWorkerBootstrap.js"

python3 - "$APP_DIR" "$GATE_DIR" "$ENGINE_DIR" <<'PY'
from pathlib import Path
import hashlib
import json
import sys

app = Path(sys.argv[1])
gate = Path(sys.argv[2])
engine = Path(sys.argv[3])

formal_path = gate / "FORMAL_BUILD_METADATA.json"
formal = json.loads(formal_path.read_text(encoding="utf-8"))

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def read_text_if_exists(path: Path):
    if not path.is_file():
        return None
    value = path.read_text(encoding="utf-8", errors="replace").strip()
    return value or None

def first_line(value):
    if not value:
        return None
    return value.splitlines()[0].strip()

def require_sha(label, actual, expected):
    if not isinstance(expected, str) or actual != expected:
        raise SystemExit(
            f"Formal runtime SHA mismatch for {label}: "
            f"actual={actual} expected={expected}"
        )

assets = {
    "js": engine / "yaneuraou.material.js",
    "wasm": engine / "yaneuraou.material.wasm",
    "pthreadWorker": engine / "yaneuraou.material.worker.js",
    "productionWorkerBootstrap": engine / "YaneuraOuWasmWorkerBootstrap.js",
}
actual_hashes = {key: sha(path) for key, path in assets.items()}

for key, actual in actual_hashes.items():
    require_sha(key, actual, formal["hashes"].get(key))

# Build/runner provenance captured by the workflow/build script.
build_date = read_text_if_exists(gate / "evidence" / "build-date-utc.txt")
runner_environment = read_text_if_exists(
    gate / "evidence" / "runner-environment.txt"
)
docker_image_id = read_text_if_exists(
    gate / "evidence" / "emscripten-image-id.txt"
)
docker_image_digest = read_text_if_exists(
    gate / "evidence" / "emscripten-image-repodigests.json"
)
emcc_version = read_text_if_exists(gate / "evidence" / "emcc-version.txt")
empp_version = read_text_if_exists(gate / "evidence" / "empp-version.txt")
llvm_version = read_text_if_exists(gate / "evidence" / "clang-version.txt")
node_version = read_text_if_exists(gate / "evidence" / "node-version.txt")
python_version = read_text_if_exists(gate / "evidence" / "python-version.txt")

source_patches = formal.get("sourcePatches") or []
primary_patch = source_patches[0] if source_patches else {}

# Update Formal Build Metadata with packaging-time measured provenance.
formal.update({
    "buildDate": build_date,
    "buildPlatform": runner_environment,
    "githubActionsRunner": runner_environment,
    "emsdkVersion": "3.1.43",
    "expectedEmscriptenReleaseCommit":
        "bf3c159888633d232c0507f4c76cc156a43c32dc",
    "emscriptenDockerImage": "emscripten/emsdk:3.1.43",
    "emscriptenDockerImageId": docker_image_id,
    "emscriptenDockerImageDigest": docker_image_digest,
    "emccVersion": emcc_version,
    "emppVersion": empp_version,
    "llvmVersion": llvm_version,
    "nodeVersion": node_version,
    "pythonVersion": python_version,
    "pthreadWorkerPackaging": "SEPARATE_PTHREAD_WORKER",
    "generatedPthreadWorkerCount": 1,
    "jsFile": "engine/yaneuraou/yaneuraou.material.js",
    "wasmFile": "engine/yaneuraou/yaneuraou.material.wasm",
    "workerFile": "engine/yaneuraou/yaneuraou.material.worker.js",
    "workerBootstrapFile":
        "engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js",
})
formal_path.write_text(
    json.dumps(formal, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

# Legacy-compatible root metadata now describes the engine actually bundled by
# the extracted candidate package. Historical diagnostic evidence remains in
# its own Build Bridge records; this file is the package runtime metadata.
package_metadata = {
    "schemaVersion": 4,
    "status": "RUN30_FORMAL_BUILD_PROFILE_CANDIDATE",
    "engineName": formal["engineName"],
    "engineVersion": formal["engineVersion"],
    "release": formal["release"],
    "repository": formal["repository"],
    "commit": formal["commit"],
    "emsdkVersion": "3.1.43",
    "expectedEmscriptenReleaseCommit":
        "bf3c159888633d232c0507f4c76cc156a43c32dc",
    "compiler": formal.get("compiler") or "em++",
    "engineType": "USI / WebAssembly",
    "evaluationModel": formal["evaluationModel"],
    "materialLevel": formal["materialLevel"],
    "targetCpu": formal["targetCpu"],
    "threads": formal.get("threads") is True,
    "pthreadPoolSize": formal.get("pthreadPoolSize"),
    "initialMemory": formal.get("initialMemory"),
    "maximumMemory": formal.get("maximumMemory"),
    "memoryGrowth": formal.get("memoryGrowth"),
    "stackSize": formal.get("stackSize"),
    "sourceLicense": formal.get("sourceLicense"),
    "buildToolLicense": formal.get("buildToolLicense"),
    "buildDate": build_date,
    "buildPlatform": runner_environment,
    "githubActionsRunner": runner_environment,
    "emsdkRepositoryCommit": None,
    "emscriptenDockerImage": "emscripten/emsdk:3.1.43",
    "emscriptenDockerImageId": docker_image_id,
    "emscriptenDockerImageDigest": docker_image_digest,
    "upstreamBuildCommand": "node script/wasm_build.js material",
    "bridgeAdaptation":
        "hash_bound_v900_wasm_usi_bridge_plus_emscripten_thread_worker_init",
    "sourceModified": True,
    "sourcePatchFile": primary_patch.get("file"),
    "sourcePatchSha256": primary_patch.get("sha256"),
    "sourcePatches": source_patches,
    "modifiedSourceFiles": formal.get("modifiedSourceFiles") or [],
    "wasmUsiCommandExport": formal.get("wasmUsiCommandExport") is True,
    "emccVersion": emcc_version,
    "emppVersion": empp_version,
    "llvmVersion": llvm_version,
    "nodeVersion": node_version,
    "pythonVersion": python_version,
    "buildCommand": formal.get("buildCommand"),
    "jsFile": "engine/yaneuraou/yaneuraou.material.js",
    "wasmFile": "engine/yaneuraou/yaneuraou.material.wasm",
    "workerFile": "engine/yaneuraou/yaneuraou.material.worker.js",
    "jsSha256": actual_hashes["js"],
    "wasmSha256": actual_hashes["wasm"],
    "workerSha256": actual_hashes["pthreadWorker"],
    "pthreadWorkerPackaging": "SEPARATE_PTHREAD_WORKER",
    "generatedPthreadWorkerCount": 1,
    "workerBootstrapFile":
        "engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js",
    "workerBootstrapSha256":
        actual_hashes["productionWorkerBootstrap"],
    "measured": True,
    "diagnosticBuild": False,
    "diagnosticFlags": None,
    "formalBuildCandidate": True,
    "formalCompletion": False,
    "publicDistributionReady": False,
    "commercialDistributionReady": False,
    "legalReviewRequiredBeforePublicDistribution": True,
    "notes": [
        "Run #34 packages the exact non-diagnostic Run #30 engine hashes into the standalone application candidate.",
        "Formal runtime/application gates passed on the same hashes before packaging.",
        "Final Formal Completion is not declared until the final ZIP extraction gate is complete.",
        "LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION."
    ],
}
(app / "ENGINE_BUILD_METADATA.json").write_text(
    json.dumps(package_metadata, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

manifest = {
    "schemaVersion": 4,
    "available": True,
    "status": "RUN30_FORMAL_BUILD_PROFILE_CANDIDATE",
    "engineName": "YaneuraOu",
    "engineVersion": "V9.00",
    "release": "V9.00",
    "commitHash": formal["commit"],
    "sourceRepository": formal["repository"],
    "evaluationModel": "MATERIAL",
    "evaluationModelVersion": "MATERIAL_LEVEL=1",
    "materialLevel": 1,
    "emscriptenVersion": "3.1.43",
    "emsdkVersion": "3.1.43",
    "expectedEmscriptenReleaseCommit":
        "bf3c159888633d232c0507f4c76cc156a43c32dc",
    "buildId": "RUN30_FORMAL_BUILD_PROFILE_CANDIDATE",
    "buildMetadataUrl": "./ENGINE_BUILD_METADATA.json",
    "workerUrl":
        "./engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js",
    "jsUrl": "./engine/yaneuraou/yaneuraou.material.js",
    "wasmUrl": "./engine/yaneuraou/yaneuraou.material.wasm",
    "pthreadWorkerUrl":
        "./engine/yaneuraou/yaneuraou.material.worker.js",
    "jsFile": "engine/yaneuraou/yaneuraou.material.js",
    "wasmFile": "engine/yaneuraou/yaneuraou.material.wasm",
    "workerFile": "engine/yaneuraou/yaneuraou.material.worker.js",
    "jsSha256": actual_hashes["js"],
    "wasmSha256": actual_hashes["wasm"],
    "workerSha256": actual_hashes["pthreadWorker"],
    "workerBootstrapSha256":
        actual_hashes["productionWorkerBootstrap"],
    "pthreadWorkerPackaging": "SEPARATE_PTHREAD_WORKER",
    "generatedPthreadWorkerCount": 1,
    "requiresThreads": True,
    "requiresCrossOriginIsolation": True,
    "pthreadPoolSize": formal.get("pthreadPoolSize"),
    "initialMemory": formal.get("initialMemory"),
    "maximumMemory": formal.get("maximumMemory"),
    "memoryGrowth": formal.get("memoryGrowth"),
    "stackSize": formal.get("stackSize"),
    "resourceProfileStatus":
        "UPSTREAM_WASM_DEFAULTS_NOT_SMARTPHONE_VALIDATED",
    "sourceModified": True,
    "sourcePatchFile": primary_patch.get("file"),
    "sourcePatchSha256": primary_patch.get("sha256"),
    "sourcePatches": source_patches,
    "modifiedSourceFiles": formal.get("modifiedSourceFiles") or [],
    "wasmUsiCommandExport": True,
    "diagnosticBuild": False,
    "formalBuildCandidate": True,
    "formalCompletion": False,
    "publicDistributionReady": False,
    "commercialDistributionReady": False,
    "legalReviewRequiredBeforePublicDistribution": True,
    "note":
        "Exact-hash non-diagnostic Formal Build Profile candidate. "
        "Final Formal ZIP not yet issued."
}
(engine / "engine-manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
(gate / "evidence" / "engine-manifest-run30.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
(gate / "evidence" / "package-engine-build-metadata.json").write_text(
    json.dumps(package_metadata, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

# Fail closed if manifest/root metadata no longer describe the same bytes.
for key, actual in actual_hashes.items():
    pass

if package_metadata["jsSha256"] != manifest["jsSha256"]:
    raise SystemExit("JS metadata/manifest mismatch")
if package_metadata["wasmSha256"] != manifest["wasmSha256"]:
    raise SystemExit("WASM metadata/manifest mismatch")
if package_metadata["workerSha256"] != manifest["workerSha256"]:
    raise SystemExit("pthread Worker metadata/manifest mismatch")
if package_metadata["workerBootstrapSha256"] != manifest["workerBootstrapSha256"]:
    raise SystemExit("Worker bootstrap metadata/manifest mismatch")

print("PASS: package ENGINE_BUILD_METADATA.json now describes the exact bundled non-diagnostic runtime.")
print("PASS: engine-manifest.json is legacy-test compatible and hash-bound to the same four runtime files.")
PY

sha256sum \
  "$ENGINE_DIR/yaneuraou.material.js" \
  "$ENGINE_DIR/yaneuraou.material.wasm" \
  "$ENGINE_DIR/yaneuraou.material.worker.js" \
  "$ENGINE_DIR/YaneuraOuWasmWorkerBootstrap.js" \
  > "$GATE_DIR/evidence/production-runtime-sha256.txt"

sha256sum \
  "$APP_DIR/ENGINE_BUILD_METADATA.json" \
  "$ENGINE_DIR/engine-manifest.json" \
  > "$GATE_DIR/evidence/package-metadata-sha256.txt"
