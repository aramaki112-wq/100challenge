#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:?YaneuraOu source directory required}"
APP_DIR="${2:?Shogi Reflection app directory required}"
HARNESS_DIR="$APP_DIR/minimal-real-usi"
OUT_DIR="$SOURCE_DIR/minimal-real-usi-build"
IMAGE="emscripten/emsdk:3.1.43"
UPSTREAM_PATCH="$APP_DIR/patches/yaneuraou-v9.00-wasm-usi-bridge.patch"
THREAD_PATCH="$HARNESS_DIR/patches/yaneuraou-v9.00-emscripten-thread-worker-init.patch"

EXPECTED_UPSTREAM_PATCH_SHA="bb79c5297f6b3e06e4dd67187aafb4f8ab18657e837f087ae7cbab15fdc27f07"
EXPECTED_THREAD_PATCH_SHA="e6993e913e012da43f4414379333f086a24990af2743ec9660101a308e8a8cfe"

mkdir -p "$HARNESS_DIR/runtime" "$HARNESS_DIR/evidence"
rm -f "$HARNESS_DIR/runtime"/*

actual_upstream="$(sha256sum "$UPSTREAM_PATCH" | awk '{print $1}')"
actual_thread="$(sha256sum "$THREAD_PATCH" | awk '{print $1}')"
test "$actual_upstream" = "$EXPECTED_UPSTREAM_PATCH_SHA"
test "$actual_thread" = "$EXPECTED_THREAD_PATCH_SHA"

git -C "$SOURCE_DIR" apply --check "$UPSTREAM_PATCH"
git -C "$SOURCE_DIR" apply "$UPSTREAM_PATCH"
git -C "$SOURCE_DIR" apply --check "$THREAD_PATCH"
git -C "$SOURCE_DIR" apply "$THREAD_PATCH"
git -C "$SOURCE_DIR" diff --check
git -C "$SOURCE_DIR" diff --binary --abbrev=7 > "$HARNESS_DIR/evidence/applied-source.patch"
git -C "$SOURCE_DIR" status --short > "$HARNESS_DIR/evidence/source-status.txt"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

docker run --rm \
  -v "$SOURCE_DIR:/src" \
  -w /src \
  "$IMAGE" \
  bash -lc '
    set -euo pipefail
    export EMCC_CFLAGS="-sASSERTIONS=2 -g3 -Wcast-function-type"
    emcc --version | tee minimal-real-usi-build/emcc-version.txt
    node --version | tee minimal-real-usi-build/node-version.txt
    cd source
    make clean
    make -j2 tournament \
      COMPILER=em++ \
      TARGET_CPU=WASM \
      YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL \
      TARGET=../minimal-real-usi-build/yaneuraou.material.js \
      EM_EXPORT_NAME=YaneuraOu_Material \
      MATERIAL_LEVEL=1 \
      EM_INITIAL_MEMORY_SIZE=92274688 \
      2>&1 | tee ../minimal-real-usi-build/make.log
  '

for f in yaneuraou.material.js yaneuraou.material.wasm yaneuraou.material.worker.js; do
  test -s "$OUT_DIR/$f"
  cp "$OUT_DIR/$f" "$HARNESS_DIR/runtime/$f"
done
# Node runs inside the application package, whose package.json uses "type": "module".
# Keep the browser .js asset unchanged, but provide a byte-identical .cjs copy
# so the Node-only probe can load the Emscripten CommonJS export explicitly.
cp "$HARNESS_DIR/runtime/yaneuraou.material.js" "$HARNESS_DIR/runtime/yaneuraou.material.cjs"
cp "$HARNESS_DIR/worker-bootstrap.js" "$HARNESS_DIR/runtime/worker-bootstrap.js"
sha256sum "$HARNESS_DIR/runtime/"* | tee "$HARNESS_DIR/evidence/runtime-sha256.txt"
cp "$OUT_DIR/emcc-version.txt" "$HARNESS_DIR/evidence/emcc-version.txt"
cp "$OUT_DIR/node-version.txt" "$HARNESS_DIR/evidence/build-node-version.txt"
cp "$OUT_DIR/make.log" "$HARNESS_DIR/evidence/make.log"

node - "$HARNESS_DIR/runtime/yaneuraou.material.wasm" <<'NODE' > "$HARNESS_DIR/evidence/wasm-exports.txt"
const fs = require('fs');
(async()=>{
  const bytes=fs.readFileSync(process.argv[2]);
  const mod=await WebAssembly.compile(bytes);
  const exports=WebAssembly.Module.exports(mod).map(x=>x.name).sort();
  console.log(exports.join('\n'));
  if (!exports.includes('usi_command')) process.exit(3);
})().catch(e=>{console.error(e);process.exit(2)});
NODE

node - "$SOURCE_DIR" "$HARNESS_DIR" "$actual_upstream" "$actual_thread" <<'NODE'
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const [src,harness,usiPatchSha,threadPatchSha]=process.argv.slice(2);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const runtime=path.join(harness,'runtime');
const metadata={
  schemaVersion:1,
  status:'MINIMAL_USI_CANDIDATE_NOT_FORMAL',
  engineName:'YaneuraOu',
  engineVersion:'V9.00',
  commit:'a5ee2786c0030edc7d4a1cdfe94b04dffec55493',
  evaluationModel:'MATERIAL',
  materialLevel:1,
  emscripten:'3.1.43',
  diagnosticFlags:'-sASSERTIONS=2 -g3 -Wcast-function-type',
  existingUsiBridgePatchSha256:usiPatchSha,
  candidateThreadInitPatchSha256:threadPatchSha,
  jsSha256:sha(path.join(runtime,'yaneuraou.material.js')),
  wasmSha256:sha(path.join(runtime,'yaneuraou.material.wasm')),
  pthreadWorkerSha256:sha(path.join(runtime,'yaneuraou.material.worker.js')),
  outerWorkerBootstrapSha256:sha(path.join(runtime,'worker-bootstrap.js')),
  formalCompletion:false
};
fs.writeFileSync(path.join(harness,'MINIMAL_BUILD_METADATA.json'),JSON.stringify(metadata,null,2)+'\n');
NODE
