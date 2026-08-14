#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:?YaneuraOu source directory required}"
APP_DIR="${2:?Shogi Reflection app directory required}"
GATE_DIR="$APP_DIR/ios-real-engine-stack8-gate"
RUNTIME_DIR="$GATE_DIR/runtime-candidate"
OUT_DIR="$SOURCE_DIR/ios-pool1-stack8-build-output"
CORR_DIR="$GATE_DIR/corresponding-source-candidate"
EVIDENCE_DIR="$GATE_DIR/evidence"
IMAGE="emscripten/emsdk:3.1.43"
COMMIT="a5ee2786c0030edc7d4a1cdfe94b04dffec55493"
USI_PATCH="$APP_DIR/patches/yaneuraou-v9.00-wasm-usi-bridge.patch"
THREAD_PATCH="$APP_DIR/formal-build-gate/patches/yaneuraou-v9.00-emscripten-thread-worker-init-formal-candidate.patch"
POOL_PATCH="$APP_DIR/ios-real-engine-gate/patches/yaneuraou-v9.00-pthread-pool-size-1.patch"
STACK_PATCH="$GATE_DIR/patches/yaneuraou-v9.00-stack-size-8m.patch"
EXPECTED_USI_PATCH_SHA="bb79c5297f6b3e06e4dd67187aafb4f8ab18657e837f087ae7cbab15fdc27f07"
EXPECTED_THREAD_PATCH_SHA="de3b26e32d44502cf3d426d6c3fc43394228ebae2253c8cee7fa714af0a61c6d"
EXPECTED_POOL_PATCH_SHA="4e1963c62afaed2e023304d11cb7c2736aca1c43db2c5bd585fb4477ee70d8f4"
EXPECTED_STACK_PATCH_SHA="5fcee573b4a0a898e747e303b6e003db8af99c901d63b15b88e88708057678d9"

mkdir -p "$RUNTIME_DIR" "$CORR_DIR" "$EVIDENCE_DIR"
rm -f "$RUNTIME_DIR"/*

# A5-E2 is isolated from the checked-in / Formal engine area.  It retains the
# A5-E1 Pool1 change and changes only STACK_SIZE from 64 MiB to 8 MiB.
APP_ENGINE_DIR="$APP_DIR/engine/yaneuraou"
FORMAL_MANIFEST="$APP_ENGINE_DIR/engine-manifest.json"
test -s "$FORMAL_MANIFEST"
node - "$APP_DIR" <<'NODE' > "$EVIDENCE_DIR/app-engine-baseline-before.json"
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const app=process.argv[2];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const engine=path.join(app,'engine','yaneuraou');
const walk=(dir,base=dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  const p=path.join(dir,e.name);
  return e.isDirectory()?walk(p,base):[{file:path.relative(base,p).replaceAll('\\','/'),size:fs.statSync(p).size,sha256:sha(p)}];
}).sort((a,b)=>a.file.localeCompare(b.file));
const manifest=JSON.parse(fs.readFileSync(path.join(engine,'engine-manifest.json'),'utf8'));
const metadataPath=path.join(app,'ENGINE_BUILD_METADATA.json');
console.log(JSON.stringify({
  manifestStatus:manifest.status,
  manifestAvailable:manifest.available,
  manifestBuildId:manifest.buildId ?? null,
  engineFiles:walk(engine),
  rootBuildMetadata:fs.existsSync(metadataPath)?{size:fs.statSync(metadataPath).size,sha256:sha(metadataPath)}:null
},null,2));
NODE

# Exact pinned upstream source and exact reviewed source patches only.
test "$(git -C "$SOURCE_DIR" rev-parse HEAD)" = "$COMMIT"
test -z "$(git -C "$SOURCE_DIR" status --porcelain=v1)"
actual_usi="$(sha256sum "$USI_PATCH" | awk '{print $1}')"
actual_thread="$(sha256sum "$THREAD_PATCH" | awk '{print $1}')"
actual_pool="$(sha256sum "$POOL_PATCH" | awk '{print $1}')"
actual_stack="$(sha256sum "$STACK_PATCH" | awk '{print $1}')"
test "$actual_usi" = "$EXPECTED_USI_PATCH_SHA"
test "$actual_thread" = "$EXPECTED_THREAD_PATCH_SHA"
test "$actual_pool" = "$EXPECTED_POOL_PATCH_SHA"
test "$actual_stack" = "$EXPECTED_STACK_PATCH_SHA"

git apply --numstat "$USI_PATCH" | tee "$EVIDENCE_DIR/usi-patch-numstat.txt"
git apply --numstat "$THREAD_PATCH" | tee "$EVIDENCE_DIR/thread-patch-numstat.txt"
git apply --numstat "$POOL_PATCH" | tee "$EVIDENCE_DIR/pool1-patch-numstat.txt"
git apply --numstat "$STACK_PATCH" | tee "$EVIDENCE_DIR/stack8-patch-numstat.txt"

git -C "$SOURCE_DIR" archive --format=tar.gz -o "$CORR_DIR/YaneuraOu-${COMMIT}-PRISTINE.tar.gz" HEAD
sha256sum "$CORR_DIR/YaneuraOu-${COMMIT}-PRISTINE.tar.gz" > "$CORR_DIR/YaneuraOu-${COMMIT}-PRISTINE.tar.gz.sha256"

git -C "$SOURCE_DIR" apply --check "$USI_PATCH"
git -C "$SOURCE_DIR" apply "$USI_PATCH"
git -C "$SOURCE_DIR" apply --check "$THREAD_PATCH"
git -C "$SOURCE_DIR" apply "$THREAD_PATCH"
git -C "$SOURCE_DIR" apply --check "$POOL_PATCH"
git -C "$SOURCE_DIR" apply "$POOL_PATCH"
git -C "$SOURCE_DIR" apply --check "$STACK_PATCH"
git -C "$SOURCE_DIR" apply "$STACK_PATCH"
git -C "$SOURCE_DIR" diff --check

git -C "$SOURCE_DIR" diff --binary --abbrev=40 > "$CORR_DIR/YaneuraOu-ShogiReflection-IOS-POOL1-STACK8-CANDIDATE.patch"
sha256sum "$CORR_DIR/YaneuraOu-ShogiReflection-IOS-POOL1-STACK8-CANDIDATE.patch" > "$CORR_DIR/YaneuraOu-ShogiReflection-IOS-POOL1-STACK8-CANDIDATE.patch.sha256"
git -C "$SOURCE_DIR" status --short > "$CORR_DIR/SOURCE_MODIFICATION_STATUS.txt"
cp "$SOURCE_DIR/Copying.txt" "$CORR_DIR/YANEURAOU_COPYING_GPL3.txt"
cp "$SOURCE_DIR/README.md" "$CORR_DIR/YANEURAOU_README.md"
cp "$SOURCE_DIR/source/Makefile" "$CORR_DIR/YANEURAOU_SOURCE_MAKEFILE_POOL1_STACK8"
cp "$USI_PATCH" "$CORR_DIR/"
cp "$THREAD_PATCH" "$CORR_DIR/"
cp "$POOL_PATCH" "$CORR_DIR/"
cp "$STACK_PATCH" "$CORR_DIR/"

grep -q 'PTHREAD_POOL_SIZE=1' "$SOURCE_DIR/source/Makefile"
grep -q 'STACK_SIZE=8388608' "$SOURCE_DIR/source/Makefile"
if grep -q '^.*LDFLAGS += -s PTHREAD_POOL_SIZE=32' "$SOURCE_DIR/source/Makefile"; then
  echo 'FAIL: active PTHREAD_POOL_SIZE=32 remains after candidate patch.' >&2
  exit 31
fi
if grep -q '^.*LDFLAGS += -s STACK_SIZE=67108864' "$SOURCE_DIR/source/Makefile"; then
  echo 'FAIL: active STACK_SIZE=64MiB remains after candidate patch.' >&2
  exit 33
fi

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

docker run --rm \
  -v "$SOURCE_DIR:/src" \
  -w /src \
  "$IMAGE" \
  bash -lc '
    set -euo pipefail
    test -z "${EMCC_CFLAGS:-}"
    emcc --version | tee ios-pool1-stack8-build-output/emcc-version.txt
    em++ --version | tee ios-pool1-stack8-build-output/empp-version.txt
    /emsdk/upstream/bin/clang --version | tee ios-pool1-stack8-build-output/clang-version.txt
    node --version | tee ios-pool1-stack8-build-output/node-version.txt
    python3 --version | tee ios-pool1-stack8-build-output/python-version.txt
    cd source
    make clean
    make -j2 tournament \
      COMPILER=em++ \
      TARGET_CPU=WASM \
      YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL \
      TARGET=../ios-pool1-stack8-build-output/yaneuraou.material.js \
      EM_EXPORT_NAME=YaneuraOu_Material \
      MATERIAL_LEVEL=1 \
      EM_INITIAL_MEMORY_SIZE=92274688 \
      2>&1 | tee ../ios-pool1-stack8-build-output/make.log
  ' 2>&1 | tee "$EVIDENCE_DIR/docker-build.log"

for f in yaneuraou.material.js yaneuraou.material.wasm yaneuraou.material.worker.js; do
  test -s "$OUT_DIR/$f"
  cp "$OUT_DIR/$f" "$RUNTIME_DIR/$f"
done
cp "$APP_DIR/YaneuraOuWasmWorkerBootstrap.js" "$RUNTIME_DIR/YaneuraOuWasmWorkerBootstrap.js"
# Node-only compatibility copy for CI USI probes; deployment packaging excludes it.
cp "$RUNTIME_DIR/yaneuraou.material.js" "$RUNTIME_DIR/yaneuraou.material.cjs"
printf '{"type":"commonjs"}\n' > "$RUNTIME_DIR/package.json"
cp "$OUT_DIR/make.log" "$EVIDENCE_DIR/make.log"
cp "$OUT_DIR/"*-version.txt "$EVIDENCE_DIR/"

# A5-E2 control: Pool1 + Initial Memory stay fixed; only stack becomes 8 MiB.
grep -q 'PTHREAD_POOL_SIZE=1' "$EVIDENCE_DIR/make.log"
grep -q 'INITIAL_MEMORY=92274688' "$EVIDENCE_DIR/make.log"
grep -q 'STACK_SIZE=8388608' "$EVIDENCE_DIR/make.log"
if grep -q 'PTHREAD_POOL_SIZE=32' "$EVIDENCE_DIR/make.log"; then
  echo 'FAIL: candidate linker command still contains pool size 32.' >&2
  exit 32
fi
if grep -q 'STACK_SIZE=67108864' "$EVIDENCE_DIR/make.log"; then
  echo 'FAIL: candidate linker command still contains 64MiB stack.' >&2
  exit 34
fi

node - "$RUNTIME_DIR/yaneuraou.material.wasm" <<'NODE' > "$EVIDENCE_DIR/wasm-exports.txt"
const fs=require('fs');
(async()=>{
  const bytes=fs.readFileSync(process.argv[2]);
  const mod=await WebAssembly.compile(bytes);
  const names=WebAssembly.Module.exports(mod).map(x=>x.name).sort();
  console.log(names.join('\n'));
  if(!names.includes('usi_command')) process.exit(3);
})().catch(e=>{console.error(e);process.exit(2)});
NODE

node - "$APP_DIR" "$GATE_DIR" "$RUNTIME_DIR" "$actual_usi" "$actual_thread" "$actual_pool" "$actual_stack" <<'NODE'
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const [app,gate,runtime,usiSha,threadSha,poolSha,stackSha]=process.argv.slice(2);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const size=p=>fs.statSync(p).size;
const make=fs.readFileSync(path.join(gate,'evidence','make.log'),'utf8');
const take=re=>{const m=make.match(re); return m ? Number(m[1]) : null};
const formal=JSON.parse(fs.readFileSync(path.join(app,'engine','yaneuraou','engine-manifest.json'),'utf8'));
const metadata={
  schemaVersion:1,
  status:'IOS_POOL1_STACK8_CANDIDATE_NOT_FORMAL',
  purpose:'iPhone Safari/Home Screen real-engine resource isolation after A5-E1 Pool1 did not resolve reload',
  technicalTestOnly:true,
  formalCompletion:false,
  formalRuntimePreserved:true,
  replacesFormalRuntime:false,
  engineName:'YaneuraOu',
  engineVersion:'V9.00',
  repository:'https://github.com/yaneurao/YaneuraOu',
  commit:'a5ee2786c0030edc7d4a1cdfe94b04dffec55493',
  evaluationModel:'MATERIAL',
  materialLevel:1,
  targetCpu:'WASM',
  emscripten:'3.1.43',
  diagnosticBuild:false,
  experiment:{
    run:'A5-E2',
    changed:'STACK_SIZE',
    baseline:67108864,
    candidate:8388608,
    pthreadPoolSizeHeldAt:1,
    initialMemoryHeldAt:92274688,
    otherResourceSettingsIntentionallyUnchanged:true
  },
  threads:true,
  pthreadPoolSize:take(/PTHREAD_POOL_SIZE=(\d+)/),
  initialMemory:take(/INITIAL_MEMORY=(\d+)/),
  maximumMemory:take(/MAXIMUM_MEMORY=(\d+)/),
  stackSize:take(/STACK_SIZE=(\d+)/),
  memoryGrowth:/ALLOW_MEMORY_GROWTH=1/.test(make),
  sourceModified:true,
  sourcePatches:[
    {file:'patches/yaneuraou-v9.00-wasm-usi-bridge.patch',sha256:usiSha},
    {file:'formal-build-gate/patches/yaneuraou-v9.00-emscripten-thread-worker-init-formal-candidate.patch',sha256:threadSha},
    {file:'ios-real-engine-gate/patches/yaneuraou-v9.00-pthread-pool-size-1.patch',sha256:poolSha},
    {file:'ios-real-engine-stack8-gate/patches/yaneuraou-v9.00-stack-size-8m.patch',sha256:stackSha}
  ],
  modifiedSourceFiles:['source/usi.h','source/engine/yaneuraou-engine/yaneuraou-search.cpp','source/thread.cpp','source/Makefile'],
  wasmUsiCommandExport:fs.readFileSync(path.join(gate,'evidence','wasm-exports.txt'),'utf8').split(/\r?\n/).includes('usi_command'),
  files:{js:'yaneuraou.material.js',wasm:'yaneuraou.material.wasm',pthreadWorker:'yaneuraou.material.worker.js',productionWorkerBootstrap:'YaneuraOuWasmWorkerBootstrap.js'},
  hashes:{
    js:sha(path.join(runtime,'yaneuraou.material.js')),
    wasm:sha(path.join(runtime,'yaneuraou.material.wasm')),
    pthreadWorker:sha(path.join(runtime,'yaneuraou.material.worker.js')),
    productionWorkerBootstrap:sha(path.join(runtime,'YaneuraOuWasmWorkerBootstrap.js'))
  },
  sizes:{
    js:size(path.join(runtime,'yaneuraou.material.js')),
    wasm:size(path.join(runtime,'yaneuraou.material.wasm')),
    pthreadWorker:size(path.join(runtime,'yaneuraou.material.worker.js')),
    productionWorkerBootstrap:size(path.join(runtime,'YaneuraOuWasmWorkerBootstrap.js'))
  },
  checkoutBaseline:{
    status:formal.status,
    available:formal.available,
    buildId:formal.buildId ?? null,
    declaredPoolSize:formal.pthreadPoolSize ?? formal.upstreamPthreadPoolSize ?? null,
    note:'Candidate output is isolated under ios-real-engine-stack8-gate/runtime-candidate and never overwrites engine/yaneuraou.'
  },
  publicDistributionReady:false,
  commercialDistributionReady:false,
  legalReviewRequiredBeforePublicDistribution:true,
  note:'Run A5-E2 is a personal-device technical experiment only. Device success does not grant Formal or distribution status.'
};
if(metadata.pthreadPoolSize!==1) throw new Error(`expected pool1, got ${metadata.pthreadPoolSize}`);
if(metadata.initialMemory!==92274688) throw new Error('INITIAL_MEMORY changed unexpectedly');
if(metadata.stackSize!==8388608) throw new Error(`expected stack8MiB, got ${metadata.stackSize}`);
if(!metadata.wasmUsiCommandExport) throw new Error('usi_command export missing');
fs.writeFileSync(path.join(gate,'IOS_POOL1_STACK8_CANDIDATE_METADATA.json'),JSON.stringify(metadata,null,2)+'\n');
NODE

sha256sum "$RUNTIME_DIR/"* > "$GATE_DIR/IOS_POOL1_STACK8_CANDIDATE_SHA256SUMS.txt"

node - "$APP_DIR" <<'NODE' > "$EVIDENCE_DIR/app-engine-baseline-after.json"
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const app=process.argv[2];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const engine=path.join(app,'engine','yaneuraou');
const walk=(dir,base=dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  const p=path.join(dir,e.name);
  return e.isDirectory()?walk(p,base):[{file:path.relative(base,p).replaceAll('\\','/'),size:fs.statSync(p).size,sha256:sha(p)}];
}).sort((a,b)=>a.file.localeCompare(b.file));
const manifest=JSON.parse(fs.readFileSync(path.join(engine,'engine-manifest.json'),'utf8'));
const metadataPath=path.join(app,'ENGINE_BUILD_METADATA.json');
console.log(JSON.stringify({
  manifestStatus:manifest.status,
  manifestAvailable:manifest.available,
  manifestBuildId:manifest.buildId ?? null,
  engineFiles:walk(engine),
  rootBuildMetadata:fs.existsSync(metadataPath)?{size:fs.statSync(metadataPath).size,sha256:sha(metadataPath)}:null
},null,2));
NODE
cmp "$EVIDENCE_DIR/app-engine-baseline-before.json" "$EVIDENCE_DIR/app-engine-baseline-after.json"

echo 'PASS: A5-E2 candidate built with Pool1 + STACK_SIZE=8MiB; checked-in app Engine state remained untouched.'
