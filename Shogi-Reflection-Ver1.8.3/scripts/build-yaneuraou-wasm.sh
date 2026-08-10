#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_ROOT="${1:-}"
OUT_DIR="${2:-$ROOT/engine/yaneuraou}"
RECORD_DIR="${3:-$ROOT/build-record}"
PINNED_COMMIT="${YANEURAOU_COMMIT:-a5ee2786c0030edc7d4a1cdfe94b04dffec55493}"
EMSDK_VERSION_EXPECTED="${EMSDK_VERSION:-4.0.15}"
MATERIAL_LEVEL="${MATERIAL_LEVEL:-1}"
BUILD_COMMAND="make -j1 normal TARGET_CPU=WASM COMPILER=em++ YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL MATERIAL_LEVEL=${MATERIAL_LEVEL}"

fail(){ echo "ERROR: $*" >&2; exit 1; }
[[ -n "$SOURCE_ROOT" && -d "$SOURCE_ROOT/.git" ]] || fail "pass a local official YaneuraOu git checkout as argument 1"
command -v git >/dev/null || fail "git is required"
command -v make >/dev/null || fail "make is required"
command -v emcc >/dev/null || fail "emcc is required; activate fixed emsdk first"
command -v em++ >/dev/null || fail "em++ is required; activate fixed emsdk first"
command -v node >/dev/null || fail "node is required for metadata generation"

mkdir -p "$OUT_DIR" "$RECORD_DIR"
ACTUAL_COMMIT="$(git -C "$SOURCE_ROOT" rev-parse HEAD)"
[[ "$ACTUAL_COMMIT" == "$PINNED_COMMIT" ]] || fail "YaneuraOu commit mismatch: $ACTUAL_COMMIT != $PINNED_COMMIT"
[[ -z "$(git -C "$SOURCE_ROOT" status --porcelain=v1)" ]] || fail "YaneuraOu source checkout has local modifications"

MAKEFILE="$SOURCE_ROOT/source/Makefile"
PREJS="$SOURCE_ROOT/source/wasm_pre.js"
[[ -f "$MAKEFILE" && -f "$PREJS" ]] || fail "pinned Makefile/wasm_pre.js missing"
grep -q 'YANEURAOU_ENGINE_MATERIAL' "$MAKEFILE" || fail "MATERIAL edition not found in Makefile"
grep -q 'TARGET_CPU.*WASM' "$MAKEFILE" || fail "WASM target not found in Makefile"
grep -q 'COMPILER.*em++' "$MAKEFILE" || fail "em++ compiler option not found in Makefile"
grep -q 'PTHREAD_POOL_SIZE' "$MAKEFILE" || fail "pthread pool setting not found in Makefile"
grep -q 'wasm_pre.js' "$MAKEFILE" || fail "wasm_pre.js integration not found in Makefile"
grep -q 'postMessage' "$PREJS" || fail "official wasm_pre.js message bridge not found"
grep -q 'usi_command' "$PREJS" || fail "official wasm_pre.js USI command bridge not found"

{
  echo "yaneuraouCommit=$ACTUAL_COMMIT"
  echo "emsdkVersionRequested=$EMSDK_VERSION_EXPECTED"
  echo "materialLevel=$MATERIAL_LEVEL"
  echo "buildCommand=$BUILD_COMMAND"
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

pushd "$SOURCE_ROOT/source" >/dev/null
rm -f yaneuraou.js yaneuraou.wasm yaneuraou.worker.js yaneuraou.*.worker.js
set +e
bash -o pipefail -c "$BUILD_COMMAND" 2>&1 | tee "$RECORD_DIR/yaneuraou-make.log"
status=${PIPESTATUS[0]}
set -e
popd >/dev/null
[[ $status -eq 0 ]] || fail "YaneuraOu make failed with exit=$status"

JS_SOURCE="$SOURCE_ROOT/source/yaneuraou.js"
WASM_SOURCE="$SOURCE_ROOT/source/yaneuraou.wasm"
[[ -s "$JS_SOURCE" ]] || fail "actual build did not produce yaneuraou.js"
[[ -s "$WASM_SOURCE" ]] || fail "actual build did not produce yaneuraou.wasm"
mapfile -t WORKERS < <(find "$SOURCE_ROOT/source" -maxdepth 1 -type f -name 'yaneuraou*.worker.js' -print | sort)
[[ ${#WORKERS[@]} -eq 1 ]] || fail "expected exactly one generated pthread worker; found ${#WORKERS[@]}"
WORKER_SOURCE="${WORKERS[0]}"

rm -f "$OUT_DIR"/yaneuraou.js "$OUT_DIR"/yaneuraou.wasm "$OUT_DIR"/yaneuraou*.worker.js
cp "$JS_SOURCE" "$OUT_DIR/$(basename "$JS_SOURCE")"
cp "$WASM_SOURCE" "$OUT_DIR/$(basename "$WASM_SOURCE")"
cp "$WORKER_SOURCE" "$OUT_DIR/$(basename "$WORKER_SOURCE")"
printf '%s\n' "$(basename "$WORKER_SOURCE")" > "$RECORD_DIR/generated-worker-file.txt"
printf '%s\n' "$BUILD_COMMAND" > "$RECORD_DIR/build-command.txt"

"$ROOT/scripts/hash-engine-assets.sh" "$OUT_DIR"
node "$ROOT/scripts/update-engine-build-metadata.mjs" --built --record-dir "$RECORD_DIR" --engine-dir "$OUT_DIR"

cat > "$ROOT/ENGINE_BUILD_RESULT.txt" <<EOF
Shogi Reflection Ver.1.8.3 YaneuraOu WASM Build Result
======================================================
Status: BUILD SUCCEEDED; REAL BROWSER/USI/E2E NOT YET IMPLIED
YaneuraOu: V9.00
Commit: $ACTUAL_COMMIT
Evaluation: MATERIAL_LEVEL=$MATERIAL_LEVEL
Target CPU: WASM
Compiler: em++
Build command: $BUILD_COMMAND
JS: $(basename "$JS_SOURCE")
WASM: $(basename "$WASM_SOURCE")
Worker: $(basename "$WORKER_SOURCE")
Metadata: ENGINE_BUILD_METADATA.json
Hashes: ENGINE_ASSET_SHA256SUMS.txt

This result proves the compiler/build artifact stage only. Formal Completion still requires Real Browser, Real USI, Real Analysis, Real E2E, license/source-distribution gates, and ZIP re-verification.
EOF

echo "Build bridge stage completed. Formal Completion is NOT asserted by this script."
