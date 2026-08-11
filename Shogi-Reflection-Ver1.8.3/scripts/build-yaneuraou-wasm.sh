#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_ROOT="${1:-}"
OUT_DIR="${2:-$ROOT/engine/yaneuraou}"
RECORD_DIR="${3:-$ROOT/build-record}"
PINNED_COMMIT="${YANEURAOU_COMMIT:-a5ee2786c0030edc7d4a1cdfe94b04dffec55493}"
EMSDK_VERSION_EXPECTED="${EMSDK_VERSION:-3.1.43}"
MATERIAL_LEVEL="${MATERIAL_LEVEL:-1}"
EMSDK_DOCKER_IMAGE="${EMSDK_DOCKER_IMAGE:-emscripten/emsdk:3.1.43}"
PTHREAD_WORKER_PACKAGING="SEPARATE_PTHREAD_WORKER"
UPSTREAM_BUILD_COMMAND="node script/wasm_build.js material"
# The pinned upstream packager runs `make -jN clean tournament` in one invocation and
# ignores the child make exit status before checking output files. Run #6 observed the
# target disappearing after link work. The bridge therefore preserves the exact upstream
# edition/target/flags but separates clean and build, captures the real make exit code,
# and runs inside the exact Docker toolchain named by the pinned upstream workflow.
BRIDGE_BUILD_COMMAND="make clean && make -j2 tournament COMPILER=em++ TARGET_CPU=WASM YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL TARGET=../build/wasm/material/lib/yaneuraou.material.js EM_EXPORT_NAME=YaneuraOu_Material MATERIAL_LEVEL=1 EM_INITIAL_MEMORY_SIZE=92274688"

fail(){ echo "ERROR: $*" >&2; exit 1; }
[[ -n "$SOURCE_ROOT" && -d "$SOURCE_ROOT/.git" ]] || fail "pass a local official YaneuraOu git checkout as argument 1"
command -v git >/dev/null || fail "git is required"
command -v docker >/dev/null || fail "docker is required for the pinned upstream Emscripten image"

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
grep -q 'make -j\${cpus} clean tournament' "$OFFICIAL_WASM_BUILD" || fail "upstream packager clean/build invocation changed; re-audit the bridge adaptation"
grep -q '_error, _stdout, _stderr.*resolve' "$OFFICIAL_WASM_BUILD" || fail "upstream child-process handling changed; re-audit the bridge adaptation"
grep -q 'postMessage' "$PREJS" || fail "official wasm_pre.js message bridge not found"
grep -q 'usi_command' "$PREJS" || fail "official wasm_pre.js USI command bridge not found"

# Pull exactly the image tag used by the pinned upstream workflow, then record the
# immutable local image id and repo digest observed by this CI run.
docker pull "$EMSDK_DOCKER_IMAGE" | tee "$RECORD_DIR/docker-pull.txt"
DOCKER_IMAGE_ID="$(docker image inspect --format '{{.Id}}' "$EMSDK_DOCKER_IMAGE")"
DOCKER_REPO_DIGEST="$(docker image inspect --format '{{if .RepoDigests}}{{index .RepoDigests 0}}{{end}}' "$EMSDK_DOCKER_IMAGE")"
printf '%s\n' "$EMSDK_DOCKER_IMAGE" > "$RECORD_DIR/emscripten-docker-image.txt"
printf '%s\n' "$DOCKER_IMAGE_ID" > "$RECORD_DIR/emscripten-docker-image-id.txt"
printf '%s\n' "$DOCKER_REPO_DIGEST" > "$RECORD_DIR/emscripten-docker-image-digest.txt"
[[ -n "$DOCKER_IMAGE_ID" ]] || fail "Docker image id was not measurable"
[[ -n "$DOCKER_REPO_DIGEST" ]] || fail "Docker repo digest was not measurable"

{
  echo "yaneuraouCommit=$ACTUAL_COMMIT"
  echo "emsdkVersionRequested=$EMSDK_VERSION_EXPECTED"
  echo "materialLevel=$MATERIAL_LEVEL"
  echo "upstreamBuildCommand=$UPSTREAM_BUILD_COMMAND"
  echo "bridgeBuildCommand=$BRIDGE_BUILD_COMMAND"
  echo "pthreadWorkerPackaging=$PTHREAD_WORKER_PACKAGING"
  echo "upstreamWorkflowToolchain=$EMSDK_DOCKER_IMAGE"
  echo "dockerImageId=$DOCKER_IMAGE_ID"
  echo "dockerRepoDigest=$DOCKER_REPO_DIGEST"
  echo "bridgeAdaptation=split_clean_and_tournament_and_capture_make_exit_status"
} | tee "$RECORD_DIR/build-request.txt"

# All compiler/runtime versions are measured inside the build container, not from the host.
docker run --rm "$EMSDK_DOCKER_IMAGE" emcc --version | tee "$RECORD_DIR/emcc-version.txt"
docker run --rm "$EMSDK_DOCKER_IMAGE" em++ --version | tee "$RECORD_DIR/empp-version.txt"
docker run --rm "$EMSDK_DOCKER_IMAGE" em++ -v 2>&1 | tee "$RECORD_DIR/empp-verbose.txt"
docker run --rm "$EMSDK_DOCKER_IMAGE" /emsdk/upstream/bin/clang --version | tee "$RECORD_DIR/llvm-version.txt"
docker run --rm "$EMSDK_DOCKER_IMAGE" node --version | tee "$RECORD_DIR/node-version.txt"
docker run --rm "$EMSDK_DOCKER_IMAGE" python3 --version 2>&1 | tee "$RECORD_DIR/python-version.txt" || true
{
  uname -a
  echo "--- container /etc/os-release ---"
  docker run --rm "$EMSDK_DOCKER_IMAGE" cat /etc/os-release
} | tee "$RECORD_DIR/build-platform.txt"
printf '%s\n' "$ACTUAL_COMMIT" > "$RECORD_DIR/yaneuraou-source-commit.txt"

LIB_DIR="$SOURCE_ROOT/build/wasm/material/lib"
rm -rf "$SOURCE_ROOT/build/wasm/material"
mkdir -p "$LIB_DIR"

# Deterministic bridge execution: same pinned source, same compiler image, same official
# edition/export/memory options, but clean and build are deliberately separate commands.
set +e
docker run --rm \
  -v "$SOURCE_ROOT:/src" \
  -w /src/source \
  "$EMSDK_DOCKER_IMAGE" \
  bash -lc "set -euo pipefail; make clean; make -j2 tournament COMPILER=em++ TARGET_CPU=WASM YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL TARGET=../build/wasm/material/lib/yaneuraou.material.js EM_EXPORT_NAME=YaneuraOu_Material MATERIAL_LEVEL=1 EM_INITIAL_MEMORY_SIZE=92274688" \
  2>&1 | tee "$RECORD_DIR/yaneuraou-make.log"
status=${PIPESTATUS[0]}
set -e
printf '%s\n' "$status" > "$RECORD_DIR/yaneuraou-make-exit-code.txt"
[[ $status -eq 0 ]] || fail "deterministic official-setting YaneuraOu make failed with exit=$status"

JS_SOURCE="$LIB_DIR/yaneuraou.material.js"
WORKER_SOURCE="$LIB_DIR/yaneuraou.material.worker.js"
WASM_SOURCE="$LIB_DIR/yaneuraou.material.wasm"
[[ -s "$JS_SOURCE" ]] || fail "official-setting material build did not produce $(basename "$JS_SOURCE")"
[[ -s "$WORKER_SOURCE" ]] || fail "official-setting material build did not produce $(basename "$WORKER_SOURCE")"
[[ -s "$WASM_SOURCE" ]] || fail "official-setting material build did not produce $(basename "$WASM_SOURCE")"

mapfile -t GENERATED_PTHREAD_WORKERS < <(find "$LIB_DIR" -maxdepth 1 -type f -name 'yaneuraou.material*.worker.js' -print | sort)
printf '%s\n' "${#GENERATED_PTHREAD_WORKERS[@]}" > "$RECORD_DIR/generated-pthread-worker-count.txt"
printf '%s\n' "$PTHREAD_WORKER_PACKAGING" > "$RECORD_DIR/pthread-worker-packaging.txt"
[[ ${#GENERATED_PTHREAD_WORKERS[@]} -eq 1 ]] || fail "Emscripten 3.1.43 material build must emit exactly one pthread worker; found ${#GENERATED_PTHREAD_WORKERS[@]}"

rm -f "$OUT_DIR"/yaneuraou*.js "$OUT_DIR"/yaneuraou*.wasm "$OUT_DIR"/YaneuraOuWasmWorkerBootstrap.js
cp "$JS_SOURCE" "$OUT_DIR/$(basename "$JS_SOURCE")"
cp "$WORKER_SOURCE" "$OUT_DIR/$(basename "$WORKER_SOURCE")"
cp "$WASM_SOURCE" "$OUT_DIR/$(basename "$WASM_SOURCE")"
cp "$ROOT/YaneuraOuWasmWorkerBootstrap.js" "$OUT_DIR/YaneuraOuWasmWorkerBootstrap.js"

printf '%s\n' "$(basename "$JS_SOURCE")" > "$RECORD_DIR/js-file.txt"
printf '%s\n' "$(basename "$WORKER_SOURCE")" > "$RECORD_DIR/worker-file.txt"
printf '%s\n' "$(basename "$WASM_SOURCE")" > "$RECORD_DIR/wasm-file.txt"
printf '%s\n' "engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js" > "$RECORD_DIR/runtime-worker-bootstrap-path.txt"
printf '%s\n' "$BRIDGE_BUILD_COMMAND" > "$RECORD_DIR/build-command.txt"
printf '%s\n' "$UPSTREAM_BUILD_COMMAND" > "$RECORD_DIR/upstream-build-command.txt"

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
Toolchain image: $EMSDK_DOCKER_IMAGE
Toolchain image id: $DOCKER_IMAGE_ID
Toolchain repo digest: $DOCKER_REPO_DIGEST
Upstream packaging command: $UPSTREAM_BUILD_COMMAND
Deterministic bridge command: $BRIDGE_BUILD_COMMAND
Bridge adaptation: split clean from tournament and capture the real make exit status
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
