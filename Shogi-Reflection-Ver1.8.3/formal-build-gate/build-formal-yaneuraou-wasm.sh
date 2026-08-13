#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:?YaneuraOu source directory required}"
APP_DIR="${2:?Shogi Reflection app directory required}"
GATE_DIR="$APP_DIR/formal-build-gate"
RUNTIME_DIR="$APP_DIR/minimal-real-usi/runtime"
OUT_DIR="$SOURCE_DIR/formal-build-output"
CORR_DIR="$GATE_DIR/corresponding-source"
IMAGE="emscripten/emsdk:3.1.43"
USI_PATCH="$APP_DIR/patches/yaneuraou-v9.00-wasm-usi-bridge.patch"
THREAD_PATCH="$GATE_DIR/patches/yaneuraou-v9.00-emscripten-thread-worker-init-formal-candidate.patch"
EXPECTED_USI_PATCH_SHA="bb79c5297f6b3e06e4dd67187aafb4f8ab18657e837f087ae7cbab15fdc27f07"
EXPECTED_THREAD_PATCH_SHA="de3b26e32d44502cf3d426d6c3fc43394228ebae2253c8cee7fa714af0a61c6d"
COMMIT="a5ee2786c0030edc7d4a1cdfe94b04dffec55493"

mkdir -p "$GATE_DIR/evidence" "$CORR_DIR" "$RUNTIME_DIR"
rm -f "$RUNTIME_DIR"/*

test "$(git -C "$SOURCE_DIR" rev-parse HEAD)" = "$COMMIT"
test -z "$(git -C "$SOURCE_DIR" status --porcelain=v1)"

actual_usi="$(sha256sum "$USI_PATCH" | awk '{print $1}')"
actual_thread="$(sha256sum "$THREAD_PATCH" | awk '{print $1}')"
test "$actual_usi" = "$EXPECTED_USI_PATCH_SHA"
test "$actual_thread" = "$EXPECTED_THREAD_PATCH_SHA"

# Fail fast on malformed unified diffs before touching the pinned source.
# Run #30 exposed why this check is part of reproducible build evidence.
git apply --numstat "$USI_PATCH"   | tee "$GATE_DIR/evidence/usi-bridge-patch-numstat.txt"
git apply --numstat "$THREAD_PATCH"   | tee "$GATE_DIR/evidence/thread-compat-patch-numstat.txt"

# Pristine exact-commit source evidence.
git -C "$SOURCE_DIR" archive --format=tar.gz -o   "$CORR_DIR/YaneuraOu-${COMMIT}-PRISTINE.tar.gz" HEAD
sha256sum "$CORR_DIR/YaneuraOu-${COMMIT}-PRISTINE.tar.gz"   > "$CORR_DIR/YaneuraOu-${COMMIT}-PRISTINE.tar.gz.sha256"

git -C "$SOURCE_DIR" apply --check "$USI_PATCH"
git -C "$SOURCE_DIR" apply "$USI_PATCH"
git -C "$SOURCE_DIR" apply --check "$THREAD_PATCH"
git -C "$SOURCE_DIR" apply "$THREAD_PATCH"
git -C "$SOURCE_DIR" diff --check
git -C "$SOURCE_DIR" diff --binary --abbrev=40   > "$CORR_DIR/YaneuraOu-ShogiReflection-WASM-FORMAL-CANDIDATE.patch"
sha256sum "$CORR_DIR/YaneuraOu-ShogiReflection-WASM-FORMAL-CANDIDATE.patch"   > "$CORR_DIR/YaneuraOu-ShogiReflection-WASM-FORMAL-CANDIDATE.patch.sha256"
git -C "$SOURCE_DIR" status --short   > "$CORR_DIR/SOURCE_MODIFICATION_STATUS.txt"

# Deterministic modified-source snapshot. Build output is excluded.
tar --sort=name --mtime='UTC 1970-01-01' --owner=0 --group=0 --numeric-owner   --exclude='.git' --exclude='formal-build-output' --exclude='build'   -C "$SOURCE_DIR" -czf   "$CORR_DIR/YaneuraOu-${COMMIT}-ShogiReflection-WASM-FORMAL-CANDIDATE.tar.gz" .
sha256sum "$CORR_DIR/YaneuraOu-${COMMIT}-ShogiReflection-WASM-FORMAL-CANDIDATE.tar.gz"   > "$CORR_DIR/YaneuraOu-${COMMIT}-ShogiReflection-WASM-FORMAL-CANDIDATE.tar.gz.sha256"

cp "$SOURCE_DIR/Copying.txt" "$CORR_DIR/YANEURAOU_COPYING_GPL3.txt"
cp "$SOURCE_DIR/README.md" "$CORR_DIR/YANEURAOU_README.md"
cp "$SOURCE_DIR/source/Makefile" "$CORR_DIR/YANEURAOU_SOURCE_MAKEFILE"
cp "$SOURCE_DIR/source/wasm_pre.js" "$CORR_DIR/YANEURAOU_WASM_PRE.js"
cp "$SOURCE_DIR/script/wasm_build.js" "$CORR_DIR/YANEURAOU_WASM_BUILD.js"
cp "$SOURCE_DIR/.github/workflows/make-wasm.yml" "$CORR_DIR/YANEURAOU_UPSTREAM_MAKE_WASM.yml"
cp "$USI_PATCH" "$CORR_DIR/"
cp "$THREAD_PATCH" "$CORR_DIR/"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# IMPORTANT: no diagnostic EMCC_CFLAGS are set in this Formal Build Profile.
docker run --rm   -v "$SOURCE_DIR:/src"   -w /src   "$IMAGE"   bash -lc '
    set -euo pipefail
    test -z "${EMCC_CFLAGS:-}"
    printf "PATH=%s\n" "$PATH" | tee formal-build-output/toolchain-path.txt
    command -v emcc | tee formal-build-output/emcc-path.txt
    command -v em++ | tee formal-build-output/empp-path.txt
    command -v node | tee formal-build-output/node-path.txt
    command -v python3 | tee formal-build-output/python-path.txt
    test -x /emsdk/upstream/bin/clang
    emcc --version | tee formal-build-output/emcc-version.txt
    em++ --version | tee formal-build-output/empp-version.txt
    /emsdk/upstream/bin/clang --version | tee formal-build-output/clang-version.txt
    node --version | tee formal-build-output/node-version.txt
    python3 --version | tee formal-build-output/python-version.txt
    cd source
    make clean
    make -j2 tournament       COMPILER=em++       TARGET_CPU=WASM       YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL       TARGET=../formal-build-output/yaneuraou.material.js       EM_EXPORT_NAME=YaneuraOu_Material       MATERIAL_LEVEL=1       EM_INITIAL_MEMORY_SIZE=92274688       2>&1 | tee ../formal-build-output/make.log
  ' 2>&1 | tee "$GATE_DIR/evidence/formal-docker-build.log"

for f in yaneuraou.material.js yaneuraou.material.wasm yaneuraou.material.worker.js; do
  test -s "$OUT_DIR/$f"
  cp "$OUT_DIR/$f" "$RUNTIME_DIR/$f"
done

# Node-only compatibility copies used by the existing Real probes.
cp "$RUNTIME_DIR/yaneuraou.material.js" "$RUNTIME_DIR/yaneuraou.material.cjs"
cp "$APP_DIR/minimal-real-usi/worker-bootstrap.js" "$RUNTIME_DIR/worker-bootstrap.js"
cat > "$RUNTIME_DIR/package.json" <<'JSON'
{"type":"commonjs"}
JSON

sha256sum "$RUNTIME_DIR/"* > "$GATE_DIR/evidence/formal-runtime-sha256.txt"
cp "$OUT_DIR/"*-version.txt "$GATE_DIR/evidence/"
cp "$OUT_DIR/make.log" "$GATE_DIR/evidence/formal-make.log"

node - "$RUNTIME_DIR/yaneuraou.material.wasm" <<'NODE'   > "$GATE_DIR/evidence/formal-wasm-exports.txt"
const fs=require('fs');
(async()=>{
  const bytes=fs.readFileSync(process.argv[2]);
  const mod=await WebAssembly.compile(bytes);
  const exports=WebAssembly.Module.exports(mod).map(x=>x.name).sort();
  console.log(exports.join('\n'));
  if(!exports.includes('usi_command')) process.exit(3);
})().catch(e=>{console.error(e);process.exit(2)});
NODE

# Capture Emscripten license from the exact build image.
docker run --rm "$IMAGE" bash -lc   'cat /emsdk/upstream/emscripten/LICENSE'   > "$CORR_DIR/EMSCRIPTEN_LICENSE_3.1.43.txt"

node - "$APP_DIR" "$GATE_DIR" "$RUNTIME_DIR" "$actual_usi" "$actual_thread" <<'NODE'
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const [app,gate,runtime,usiPatchSha,threadPatchSha]=process.argv.slice(2);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const size=p=>fs.statSync(p).size;
const log=fs.readFileSync(path.join(gate,'evidence','formal-make.log'),'utf8');
const take=(re)=>{const m=log.match(re); return m ? Number(m[1]) : null;};
const metadata={
  schemaVersion:4,
  status:'RUN30_FORMAL_BUILD_PROFILE_CANDIDATE',
  measured:true,
  formalBuildCandidate:true,
  formalCompletion:false,
  engineName:'YaneuraOu',
  engineVersion:'V9.00',
  release:'V9.00',
  repository:'https://github.com/yaneurao/YaneuraOu',
  commit:'a5ee2786c0030edc7d4a1cdfe94b04dffec55493',
  evaluationModel:'MATERIAL',
  materialLevel:1,
  targetCpu:'WASM',
  compiler:'em++',
  emscripten:'3.1.43',
  diagnosticFlags:null,
  diagnosticBuild:false,
  buildProfile:'NON_DIAGNOSTIC_FORMAL_CANDIDATE',
  buildCommand:'make -j2 tournament COMPILER=em++ TARGET_CPU=WASM YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL TARGET=../formal-build-output/yaneuraou.material.js EM_EXPORT_NAME=YaneuraOu_Material MATERIAL_LEVEL=1 EM_INITIAL_MEMORY_SIZE=92274688',
  sourceModified:true,
  sourcePatches:[
    {file:'patches/yaneuraou-v9.00-wasm-usi-bridge.patch',sha256:usiPatchSha},
    {file:'formal-build-gate/patches/yaneuraou-v9.00-emscripten-thread-worker-init-formal-candidate.patch',sha256:threadPatchSha}
  ],
  modifiedSourceFiles:[
    'source/usi.h',
    'source/engine/yaneuraou-engine/yaneuraou-search.cpp',
    'source/thread.cpp'
  ],
  threads:true,
  pthreadPoolSize:take(/PTHREAD_POOL_SIZE=(\d+)/),
  initialMemory:take(/INITIAL_MEMORY=(\d+)/),
  maximumMemory:take(/MAXIMUM_MEMORY=(\d+)/),
  stackSize:take(/STACK_SIZE=(\d+)/),
  memoryGrowth:/ALLOW_MEMORY_GROWTH=1/.test(log),
  wasmUsiCommandExport:fs.readFileSync(path.join(gate,'evidence','formal-wasm-exports.txt'),'utf8').split(/\r?\n/).includes('usi_command'),
  files:{
    js:'yaneuraou.material.js',
    wasm:'yaneuraou.material.wasm',
    pthreadWorker:'yaneuraou.material.worker.js',
    productionWorkerBootstrap:'YaneuraOuWasmWorkerBootstrap.js'
  },
  hashes:{
    js:sha(path.join(runtime,'yaneuraou.material.js')),
    wasm:sha(path.join(runtime,'yaneuraou.material.wasm')),
    pthreadWorker:sha(path.join(runtime,'yaneuraou.material.worker.js')),
    productionWorkerBootstrap:sha(path.join(app,'YaneuraOuWasmWorkerBootstrap.js'))
  },
  sizes:{
    js:size(path.join(runtime,'yaneuraou.material.js')),
    wasm:size(path.join(runtime,'yaneuraou.material.wasm')),
    pthreadWorker:size(path.join(runtime,'yaneuraou.material.worker.js')),
    productionWorkerBootstrap:size(path.join(app,'YaneuraOuWasmWorkerBootstrap.js'))
  },
  sourceLicense:'GPL-3.0 (YaneuraOu Copying.txt)',
  buildToolLicense:'Emscripten MIT OR University of Illinois/NCSA',
  publicDistributionReady:false,
  commercialDistributionReady:false,
  legalReviewRequiredBeforePublicDistribution:true,
  note:'Non-diagnostic exact-hash Formal Build Profile candidate. Technical runtime/application gates and final ZIP gate still required.'
};
fs.writeFileSync(path.join(gate,'FORMAL_BUILD_METADATA.json'),JSON.stringify(metadata,null,2)+'\n');
fs.writeFileSync(path.join(app,'minimal-real-usi','MINIMAL_BUILD_METADATA.json'),JSON.stringify(metadata,null,2)+'\n');
NODE

test "$(node -e "const d=require('./$APP_DIR/formal-build-gate/FORMAL_BUILD_METADATA.json'); process.stdout.write(String(d.diagnosticBuild))")" = "false"
