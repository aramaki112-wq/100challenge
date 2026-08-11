#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_ROOT="${1:-}"
OUT_DIR="${2:-$ROOT/engine/yaneuraou}"
RECORD_DIR="${3:-$ROOT/build-record}"
PINNED_COMMIT="${YANEURAOU_COMMIT:-a5ee2786c0030edc7d4a1cdfe94b04dffec55493}"
EMSDK_VERSION_EXPECTED="${EMSDK_VERSION:-3.1.43}"
MATERIAL_LEVEL="${MATERIAL_LEVEL:-1}"
OFFICIAL_PROFILE="material"
BUILD_COMMAND="node script/wasm_build.js ${OFFICIAL_PROFILE}"
PTHREAD_WORKER_PACKAGING="SEPARATE_PTHREAD_WORKER"

fail(){ echo "ERROR: $*" >&2; exit 1; }
[[ -n "$SOURCE_ROOT" && -d "$SOURCE_ROOT/.git" ]] || fail "pass a local official YaneuraOu git checkout as argument 1"
command -v git >/dev/null || fail "git is required"
command -v make >/dev/null || fail "make is required"
command -v emcc >/dev/null || fail "emcc is required; activate fixed emsdk first"
command -v em++ >/dev/null || fail "em++ is required; activate fixed emsdk first"
command -v node >/dev/null || fail "node is required"

mkdir -p "$OUT_DIR" "$RECORD_DIR"
ACTUAL_COMMIT="$(git -C "$SOURCE_ROOT" rev-parse HEAD)"
[[ "$ACTUAL_COMMIT" == "$PINNED_COMMIT" ]] || fail "YaneuraOu commit mismatch: $ACTUAL_COMMIT != $PINNED_COMMIT"
[[ -z "$(git -C "$SOURCE_ROOT" status --porcelain=v1)" ]] || fail "YaneuraOu source checkout has local modifications"

MAKEFILE="$SOURCE_ROOT/source/Makefile"
PREJS="$SOURCE_ROOT/source/wasm_pre.js"
OFFICIAL_WASM_BUILD="$SOURCE_ROOT/script/wasm_build.js"
OFFICIAL_WASM_WORKFLOW="$SOURCE_ROOT/.github/workflows/make-wasm.yml"
[[ -f "$MAKEFILE" && -f "$PREJS" && -f "$OFFICIAL_WASM_BUILD" && -f "$OFFICIAL_WASM_WORKFLOW" ]] || fail "pinned official WASM build inputs are missing"
grep -q 'emscripten/emsdk:3.1.43' "$OFFICIAL_WASM_WORKFLOW" || fail "pinned upstream workflow no longer selects emscripten/emsdk:3.1.43"
grep -q 'name: "material"' "$OFFICIAL_WASM_BUILD" || fail "official material WASM package profile missing"
grep -q 'YANEURAOU_ENGINE_MATERIAL' "$OFFICIAL_WASM_BUILD" || fail "official material edition missing"
grep -q 'exportname: "YaneuraOu_Material"' "$OFFICIAL_WASM_BUILD" || fail "official material export name changed"
grep -q 'MATERIAL_LEVEL=1 EM_INITIAL_MEMORY_SIZE=92274688' "$OFFICIAL_WASM_BUILD" || fail "official material build options changed"
grep -q '\["js", "worker.js", "wasm"\]' "$OFFICIAL_WASM_BUILD" || fail "official expected WASM asset set changed"
grep -q 'postMessage' "$PREJS" || fail "official wasm_pre.js message bridge not found"
grep -q 'usi_command' "$PREJS" || fail "official wasm_pre.js USI command bridge not found"

{
  echo "yaneuraouCommit=$ACTUAL_COMMIT"
  echo "emsdkVersionRequested=$EMSDK_VERSION_EXPECTED"
  echo "materialLevel=$MATERIAL_LEVEL"
  echo "officialProfile=$OFFICIAL_PROFILE"
  echo "buildCommand=$BUILD_COMMAND"
  echo "pthreadWorkerPackaging=$PTHREAD_WORKER_PACKAGING"
  echo "upstreamWorkflowToolchain=emscripten/emsdk:3.1.43"
} | tee "$RECORD_DIR/build-request.txt"

emcc --version | tee "$RECORD_DIR/emcc-version.txt"
em++ --version | tee "$RECORD_DIR/empp-version.txt"
em++ -v 2>&1 | tee "$RECORD_DIR/empp-verbose.txt"
EMSDK_CLANG="$(cd "$(dirname "$(command -v em++)")/../bin" && pwd)/clang"
[[ -x "$EMSDK_CLANG" ]] || fail "emsdk LLVM clang was not found next to the activated em++ toolchain"
"$EMSDK_CLANG" --version | tee "$RECORD_DIR/llvm-version.txt"
node --version | tee "$RECORD_DIR/node-version.txt"
python3 --version 2>&1 | tee "$RECORD_DIR/python-version.txt" || true
uname -a | tee "$RECORD_DIR/build-platform.txt"
printf '%s\n' "$ACTUAL_COMMIT" > "$RECORD_DIR/yaneuraou-source-commit.txt"

# Execute the pinned source tree's own official WASM packaging profile.
rm -rf "$SOURCE_ROOT/build/wasm/material"
pushd "$SOURCE_ROOT" >/dev/null
set +e
bash -o pipefail -c "$BUILD_COMMAND" 2>&1 | tee "$RECORD_DIR/yaneuraou-make.log"
status=${PIPESTATUS[0]}
set -e
popd >/dev/null
[[ $status -eq 0 ]] || fail "official YaneuraOu wasm_build.js failed with exit=$status"

LIB_DIR="$SOURCE_ROOT/build/wasm/material/lib"
JS_SOURCE="$LIB_DIR/yaneuraou.material.js"
WORKER_SOURCE="$LIB_DIR/yaneuraou.material.worker.js"
WASM_SOURCE="$LIB_DIR/yaneuraou.material.wasm"
[[ -s "$JS_SOURCE" ]] || fail "official material build did not produce $(basename "$JS_SOURCE")"
[[ -s "$WORKER_SOURCE" ]] || fail "official material build did not produce $(basename "$WORKER_SOURCE")"
[[ -s "$WASM_SOURCE" ]] || fail "official material build did not produce $(basename "$WASM_SOURCE")"

mapfile -t GENERATED_PTHREAD_WORKERS < <(find "$LIB_DIR" -maxdepth 1 -type f -name 'yaneuraou.material*.worker.js' -print | sort)
printf '%s\n' "${#GENERATED_PTHREAD_WORKERS[@]}" > "$RECORD_DIR/generated-pthread-worker-count.txt"
printf '%s\n' "$PTHREAD_WORKER_PACKAGING" > "$RECORD_DIR/pthread-worker-packaging.txt"
[[ ${#GENERATED_PTHREAD_WORKERS[@]} -eq 1 ]] || fail "official Emscripten 3.1.43 material build must emit exactly one pthread worker; found ${#GENERATED_PTHREAD_WORKERS[@]}"

rm -f "$OUT_DIR"/yaneuraou*.js "$OUT_DIR"/yaneuraou*.wasm "$OUT_DIR"/YaneuraOuWasmWorkerBootstrap.js
cp "$JS_SOURCE" "$OUT_DIR/$(basename "$JS_SOURCE")"
cp "$WORKER_SOURCE" "$OUT_DIR/$(basename "$WORKER_SOURCE")"
cp "$WASM_SOURCE" "$OUT_DIR/$(basename "$WASM_SOURCE")"
cp "$ROOT/YaneuraOuWasmWorkerBootstrap.js" "$OUT_DIR/YaneuraOuWasmWorkerBootstrap.js"

printf '%s\n' "$(basename "$JS_SOURCE")" > "$RECORD_DIR/js-file.txt"
printf '%s\n' "$(basename "$WORKER_SOURCE")" > "$RECORD_DIR/worker-file.txt"
printf '%s\n' "$(basename "$WASM_SOURCE")" > "$RECORD_DIR/wasm-file.txt"
printf '%s\n' "engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js" > "$RECORD_DIR/runtime-worker-bootstrap-path.txt"
printf '%s\n' "$BUILD_COMMAND" > "$RECORD_DIR/build-command.txt"

bash "$ROOT/scripts/hash-engine-assets.sh" "$OUT_DIR"
node "$ROOT/scripts/update-engine-build-metadata.mjs" --built --record-dir "$RECORD_DIR" --engine-dir "$OUT_DIR"

cat > "$ROOT/ENGINE_BUILD_RESULT.txt" <<EOF2
Shogi Reflection Ver.1.8.3 YaneuraOu WASM Build Result
======================================================
Status: BUILD SUCCEEDED; REAL BROWSER/USI/E2E NOT YET IMPLIED
YaneuraOu: V9.00
Commit: $ACTUAL_COMMIT
Evaluation: MATERIAL_LEVEL=$MATERIAL_LEVEL
Target CPU: WASM
Compiler: em++
Toolchain: Emscripten $EMSDK_VERSION_EXPECTED (matches pinned upstream WASM workflow)
Official build command: $BUILD_COMMAND
JS: $(basename "$JS_SOURCE")
WASM: $(basename "$WASM_SOURCE")
Generated pthread worker: $(basename "$WORKER_SOURCE")
Pthread worker packaging: $PTHREAD_WORKER_PACKAGING
Application Worker bootstrap: engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js
Metadata: ENGINE_BUILD_METADATA.json
Hashes: ENGINE_ASSET_SHA256SUMS.txt

This result proves the compiler/build artifact stage only. Formal Completion still requires Real Browser, Real USI, Real Analysis, Real E2E, license/source-distribution gates, and ZIP re-verification.
EOF2

echo "Build bridge stage completed. Formal Completion is NOT asserted by this script."
