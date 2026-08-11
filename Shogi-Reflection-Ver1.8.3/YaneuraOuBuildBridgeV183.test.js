import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.dirname(fileURLToPath(import.meta.url));
const read=(f)=>fs.readFileSync(path.join(root,f),"utf8");
const json=(f)=>JSON.parse(read(f));

test("Ver.1.8.3 package is explicitly a NOT-FORMAL Build Bridge candidate",()=>{
  const p=json("package.json"); assert.equal(p.version,"1.8.3"); assert.match(p.description,/NOT-FORMAL Build Bridge/);
});

test("GitHub Actions pins official YaneuraOu V9.00 commit",()=>{
  const y=read(".github/workflows/build-yaneuraou-wasm.yml");
  assert.match(y,/a5ee2786c0030edc7d4a1cdfe94b04dffec55493/); assert.match(y,/YANEURAOU_VERSION: V9\.00/);
});

test("GitHub Actions pins upstream-compatible Emscripten 3.1.43 and verifies official release mapping",()=>{
  const y=read(".github/workflows/build-yaneuraou-wasm.yml");
  assert.match(y,/EMSDK_VERSION: 3\.1\.43/); assert.match(y,/bf3c159888633d232c0507f4c76cc156a43c32dc/); assert.match(y,/emscripten-releases-tags\.json/);
});

test("Run 8 keeps the same Emscripten Docker image proven by Run 7 and records immutable image evidence",()=>{
  const y=read(".github/workflows/build-yaneuraou-wasm.yml"), s=read("scripts/build-yaneuraou-wasm.sh");
  assert.match(y,/EMSDK_DOCKER_IMAGE: emscripten\/emsdk:3\.1\.43/);
  assert.match(s,/docker pull "\$EMSDK_DOCKER_IMAGE"/);
  assert.match(s,/emscripten-docker-image-id\.txt/);
  assert.match(s,/emscripten-docker-image-digest\.txt/);
});

test("Build Bridge records runner and compiler provenance",()=>{
  const y=read(".github/workflows/build-yaneuraou-wasm.yml"), s=read("scripts/build-yaneuraou-wasm.sh");
  for(const token of ["ImageOS","ImageVersion","/etc/os-release","node --version","python3 --version"]) assert.ok(y.includes(token));
  for(const token of ["emcc --version","em++ --version","em++ -v","llvm-version.txt"]) assert.ok(s.includes(token));
});

test("Build bridge preserves pinned official material settings while using deterministic split clean/build",()=>{
  const s=read("scripts/build-yaneuraou-wasm.sh");
  assert.match(s,/UPSTREAM_BUILD_COMMAND="node script\/wasm_build\.js material"/);
  assert.match(s,/BRIDGE_BUILD_COMMAND="make clean && make -j2 tournament/);
  assert.match(s,/YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL/);
  assert.match(s,/EM_EXPORT_NAME=YaneuraOu_Material/);
  assert.match(s,/MATERIAL_LEVEL=1 EM_INITIAL_MEMORY_SIZE=92274688/);
  assert.match(s,/EMSDK_DOCKER_IMAGE=.*emscripten\/emsdk:3\.1\.43/);
  assert.match(s,/yaneuraou-make-exit-code\.txt/);
});

test("Build refuses commit mismatch and requires pristine upstream before applying the reviewed patch",()=>{
  const s=read("scripts/build-yaneuraou-wasm.sh");
  assert.match(s,/commit mismatch/);
  assert.match(s,/local modifications before the documented bridge patch/);
  assert.match(s,/git -C "\$SOURCE_ROOT" apply --check "\$SOURCE_PATCH"/);
  assert.match(s,/unexpected YaneuraOu source modification set/);
  assert.match(s,/cmp -s "\$SOURCE_PATCH" "\$RECORD_DIR\/yaneuraou-source-modifications\.patch"/);
});

test("Build verifies official wasm_pre bridge instead of bypassing it",()=>{
  const s=read("scripts/build-yaneuraou-wasm.sh"); assert.match(s,/wasm_pre\.js/); assert.match(s,/postMessage/); assert.match(s,/usi_command/);
});

test("Pinned upstream Emscripten 3.1.43 records separate pthread worker packaging",()=>{
  const s=read("scripts/build-yaneuraou-wasm.sh");
  assert.match(s,/yaneuraou\.material\.worker\.js/);
  assert.match(s,/SEPARATE_PTHREAD_WORKER/);
  assert.match(s,/exactly one pthread worker/);
});

test("Actual JS WASM generated pthread Worker and application bootstrap each receive SHA-256",()=>{
  const s=read("scripts/hash-engine-assets.sh");
  assert.ok((s.match(/sha256sum/g)||[]).length>=4);
  assert.match(s,/yaneuraou\.material\.wasm/);
  assert.match(s,/YaneuraOuWasmWorkerBootstrap\.js/);
  assert.match(s,/Emscripten 3\.1\.43 official material build must have exactly one worker/);
});

test("Build Metadata contains requested traceability fields without pretending unmeasured values",()=>{
  const m=json("ENGINE_BUILD_METADATA.json");
  for(const k of ["engineName","engineVersion","release","repository","commit","buildDate","buildPlatform","emsdkVersion","emscriptenDockerImage","emscriptenDockerImageId","emscriptenDockerImageDigest","upstreamBuildCommand","bridgeAdaptation","sourceModified","sourcePatchFile","sourcePatchSha256","modifiedSourceFiles","wasmUsiCommandExport","emccVersion","emppVersion","llvmVersion","nodeVersion","pythonVersion","compiler","engineType","evaluationModel","materialLevel","targetCpu","threads","pthreadPoolSize","initialMemory","maximumMemory","memoryGrowth","stackSize","buildCommand","jsFile","wasmFile","workerFile","jsSha256","wasmSha256","workerSha256","pthreadWorkerPackaging","generatedPthreadWorkerCount","workerBootstrapFile","workerBootstrapSha256","sourceLicense","buildToolLicense"]) assert.ok(Object.hasOwn(m,k),k);
  if (m.measured === false) {
    assert.equal(m.jsSha256,null); assert.equal(m.wasmSha256,null); assert.equal(m.workerBootstrapSha256,null);
  } else {
    assert.equal(m.measured,true); assert.ok(m.jsSha256); assert.ok(m.wasmSha256); assert.ok(m.workerBootstrapSha256);
    assert.equal(m.pthreadWorkerPackaging,"SEPARATE_PTHREAD_WORKER"); assert.equal(m.generatedPthreadWorkerCount,1); assert.ok(m.workerFile); assert.ok(m.workerSha256);
    assert.ok(m.emccVersion); assert.ok(m.emppVersion); assert.ok(m.llvmVersion); assert.ok(m.emscriptenDockerImageId); assert.ok(m.emscriptenDockerImageDigest);
  }
});

test("Manifest is fail-closed before build and hash-bound after build",()=>{
  const m=json("engine/yaneuraou/engine-manifest.json"), meta=json("ENGINE_BUILD_METADATA.json");
  if (m.available === false) {
    assert.equal(meta.measured,false); assert.match(m.pthreadWorkerUrl,/yaneuraou\.material\.worker\.js$/); assert.equal(m.jsSha256,null); assert.equal(m.wasmSha256,null);
  } else {
    assert.equal(meta.measured,true); assert.ok(m.jsSha256); assert.ok(m.wasmSha256); assert.ok(m.workerBootstrapSha256);
    assert.ok(m.pthreadWorkerUrl); assert.ok(m.workerSha256);
    assert.equal(m.pthreadWorkerPackaging,"SEPARATE_PTHREAD_WORKER"); assert.equal(m.generatedPthreadWorkerCount,1); assert.ok(m.workerFile); assert.ok(m.workerSha256);
  }
});

test("Artifact gate requires measured metadata, separate pthread packaging, files and hashes",()=>{
  const s=read("scripts/real-yaneuraou-artifact-gate.mjs");
  assert.match(s,/metadata\.measured !== true/);
  assert.match(s,/Emscripten release commit mapping mismatch/);
  assert.match(s,/SEPARATE_PTHREAD_WORKER/);
  assert.match(s,/workerBootstrapFile/);
  assert.match(s,/workerFile/);
});

test("Artifact gate treats absent pre-build assets as fail-closed evidence instead of hashing directories",()=>{
  const s=read("scripts/real-yaneuraou-artifact-gate.mjs");
  assert.match(s,/isFile\(\)/);
  assert.match(s,/asset is missing or not a regular file/);
});

test("Formal gate requires Real protocol, analysis, candidate and navigation evidence",()=>{
  const s=read("scripts/formal-completion-gate.mjs");
  for(const k of ["usiok","readyok","cp","mate","multipv","bestmove","stop","quit","sampleKif","fullPly","goodCandidate","badCandidate","bestEvaluation","actualEvaluation","difference","candidateJump","boardScroll","keyPosition","graphMarker","graphToStep4","fact","interpretation","hypothesis","cancel","reanalysis"]) assert.ok(s.includes(`\"${k}\"`),k);
});

test("Corresponding Source packages pristine base, reviewed patch and deterministic modified-source snapshot",()=>{
  const y=read(".github/workflows/build-yaneuraou-wasm.yml");
  const s=read("scripts/package-yaneuraou-corresponding-source.sh");
  assert.match(y,/package-yaneuraou-corresponding-source\.sh/);
  assert.match(s,/YaneuraOu-\$\{PINNED_COMMIT\}\.tar\.gz/);
  assert.match(s,/ShogiReflection-WASM-USI-Bridge\.tar\.gz/);
  assert.match(s,/SOURCE_MODIFICATION_MANIFEST\.txt/);
  assert.match(s,/yaneuraou-v9\.00-wasm-usi-bridge\.patch/);
});

test("Build artifact integration verifies before claiming runtime readiness",()=>{
  const s=read("scripts/integrate-yaneuraou-build-artifact.sh"); assert.match(s,/real-yaneuraou-artifact-gate\.mjs/); assert.match(s,/Real Browser\/USI\/E2E still must be run/);
});

test("Existing application LICENSE is unchanged against Ver.1.8 integration baseline",async ()=>{
  const b=json("SOURCE_OF_TRUTH_V1_8_INTEGRATION_CANDIDATE_HASHES.json");
  const crypto=await import("node:crypto"); const actual=crypto.createHash("sha256").update(fs.readFileSync(path.join(root,"LICENSE"))).digest("hex"); assert.equal(actual,b.files.LICENSE);
});

test("Real USI and application E2E evidence are separate and hash-bound",()=>{
  const formal=read("scripts/formal-completion-gate.mjs");
  assert.match(formal,/REAL_YANEURAOU_USI_RESULT\.json/);
  assert.match(formal,/REAL_YANEURAOU_E2E_RESULT\.json/);
  assert.match(formal,/usi\.wasmSha256===wasmHash/);
  assert.match(formal,/e2e\.wasmSha256===wasmHash/);
});

test("Real USI verifier exercises handshake, cp/mate, MultiPV and stop",()=>{
  const s=read("real_yaneuraou_usi_verify.py");
  for(const token of ["'usi'", "'isready'", "'usinewgame'", "score\\s+cp", "score\\s+mate", "MultiPV", "'go infinite'", "'stop'", "'quit'"]) assert.ok(s.includes(token),token);
});

test("Real application E2E requires Sample KIF full-ply reflection flow",()=>{
  const s=read("real_yaneuraou_browser_verify.py");
  for(const token of ["sampleKif", "fullPly", "goodCandidate", "badCandidate", "bestEvaluation", "actualEvaluation", "candidateJump", "boardScroll", "graphMarker", "graphToStep4", "Engine must not auto-fill FACT", "cancel", "reanalysis"]) assert.ok(s.includes(token),token);
});

test("CI keeps Real evidence artifact even when a Real gate fails",()=>{
  const y=read(".github/workflows/build-yaneuraou-wasm.yml");
  assert.match(y,/continue-on-error: true/);
  assert.match(y,/Upload Build Bridge artifact[\s\S]*if: always\(\)/);
  assert.match(y,/Enforce Real runtime(?: and static)? gates after evidence upload/);
});

test("Legacy manifest finalizer cannot bypass measured Build Metadata",()=>{
  const s=read("scripts/finalize-yaneuraou-manifest.mjs");
  assert.match(s,/DEPRECATED/);
  assert.match(s,/real-yaneuraou-artifact-gate\.mjs/);
  assert.doesNotMatch(s,/available:\s*true/);
  assert.doesNotMatch(s,/yaneuraou\.worker\.js/);
});


test("Runtime bootstrap is co-located with generated JS/WASM so Emscripten Worker location resolves WASM correctly",()=>{
  const build=read("scripts/build-yaneuraou-wasm.sh");
  const meta=read("scripts/update-engine-build-metadata.mjs");
  const bootstrap=read("YaneuraOuWasmWorkerBootstrap.js");
  assert.match(build,/cp "\$ROOT\/YaneuraOuWasmWorkerBootstrap\.js" "\$OUT_DIR\/YaneuraOuWasmWorkerBootstrap\.js"/);
  assert.match(meta,/engine.*yaneuraou.*YaneuraOuWasmWorkerBootstrap\.js/s);
  assert.match(meta,/workerUrl: "\.\/engine\/yaneuraou\/YaneuraOuWasmWorkerBootstrap\.js"/);
  assert.match(bootstrap,/const GLUE_URL = "\.\/yaneuraou\.material\.js"/);
  assert.doesNotMatch(bootstrap,/locateFile\(/);
});

test("Real USI verifier launches the hash-bound manifest worker URL",()=>{
  const s=read("real_yaneuraou_usi_verify.py");
  assert.match(s,/workerUrl.*manifest\.get\("workerUrl"\)/s);
  assert.match(s,/new Worker\(workerUrl,/);
});


test("Run 6 missing-output incident is documented without claiming an unproven compiler cause",()=>{
  const d=read("ENGINE_BUILD_INCIDENT_006_UPSTREAM_WASM_PACKAGER_OUTPUT_MISSING.md");
  assert.match(d,/file not found/);
  assert.match(d,/lower-level.*not proven/i);
  assert.match(d,/make clean/i);
  assert.match(d,/not an engine-source modification/i);
});


test("Artifact gate distinguishes upstream packaging command from measured deterministic bridge command",()=>{
  const s=read("scripts/real-yaneuraou-artifact-gate.mjs");
  assert.match(s,/metadata\.upstreamBuildCommand !== "node script\/wasm_build\.js material"/);
  assert.match(s,/split_clean_tournament_capture_make_exit_and_apply_documented_wasm_usi_bridge/);
  assert.match(s,/startsWith\("make clean && make -j2 tournament "/);
});


test("Run 8 source patch is explicit minimal and Emscripten-only",()=>{
  const patch=read("patches/yaneuraou-v9.00-wasm-usi-bridge.patch");
  assert.match(patch,/source\/usi\.h/);
  assert.match(patch,/source\/engine\/yaneuraou-engine\/yaneuraou-search\.cpp/);
  assert.match(patch,/defined\(__EMSCRIPTEN__\)/);
  assert.match(patch,/wasm_usi_cmdexec/);
  assert.match(patch,/EMSCRIPTEN_KEEPALIVE extern "C" int usi_command/);
  assert.match(patch,/static YaneuraOuEngine engine/);
  assert.match(patch,/static USIEngine usi/);
  assert.doesNotMatch(patch,/evaluate\(|search<|MovePicker|EvaluationGraph|GameReview/);
});

test("Build rejects patched WASM unless usi_command is physically exported",()=>{
  const build=read("scripts/build-yaneuraou-wasm.sh");
  const gate=read("scripts/real-yaneuraou-artifact-gate.mjs");
  assert.match(build,/WebAssembly\.Module\.exports/);
  assert.match(build,/generated WASM does not export usi_command/);
  assert.match(build,/usi-command-export\.txt/);
  assert.match(gate,/Measured WASM export count/);
  assert.match(gate,/Generated WASM does not export usi_command/);
});

test("Run 7 disabled-export incident is documented and source modification is not hidden",()=>{
  const d=read("ENGINE_BUILD_INCIDENT_007_V900_WASM_USI_EXPORT_DISABLED.md");
  assert.match(d,/make exit code `0`/);
  assert.match(d,/no `usi_command` \/ `_usi_command` export/);
  assert.match(d,/#if 0/);
  assert.match(d,/unmodified upstream source build|sourceModified=true/i);
  assert.match(d,/LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION/);
});

test("Run 8 patch comparison canonicalizes Git abbreviated blob IDs without weakening exact diff review",()=>{
  const build=read("scripts/build-yaneuraou-wasm.sh");
  const incident=read("ENGINE_BUILD_INCIDENT_008_REVIEWED_PATCH_DIFF_ABBREVIATION.md");
  assert.match(build,/git -C "\$SOURCE_ROOT" diff --binary --abbrev=7/);
  assert.match(build,/cmp -s "\$SOURCE_PATCH" "\$RECORD_DIR\/yaneuraou-source-modifications\.patch"/);
  assert.match(incident,/e77eb04\.\.f3566d0/);
  assert.match(incident,/e77eb043\.\.f3566d02/);
  assert.match(incident,/formatting difference in Git's abbreviated object IDs/i);
});

test("Run 9 Corresponding Source packaging uses the same deterministic reviewed-patch diff representation",()=>{
  const pack=read("scripts/package-yaneuraou-corresponding-source.sh");
  const incident=read("ENGINE_BUILD_INCIDENT_009_CORRESPONDING_SOURCE_DIFF_ABBREVIATION.md");
  assert.match(pack,/git -C "\$SOURCE_ROOT" diff --binary --abbrev=7/);
  assert.match(pack,/cmp -s "\$PATCH_FILE" "\$OUT_DIR\/YaneuraOu-ShogiReflection-WASM-USI-Bridge\.patch"/);
  assert.match(incident,/Corresponding Source packaging/i);
  assert.match(incident,/byte-for-byte/i);
});
