import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const getArg = (name, fallback) => { const i=args.indexOf(name); return i>=0 ? args[i+1] : fallback; };
const built = args.includes("--built");
const recordDir = path.resolve(getArg("--record-dir", path.join(root, "build-record")));
const engineDir = path.resolve(getArg("--engine-dir", path.join(root, "engine", "yaneuraou")));
const readMaybe = (file) => { try { return fs.readFileSync(path.join(recordDir,file),"utf8").trim(); } catch { return null; } };
const firstLine = (value) => value ? value.split(/\r?\n/)[0].trim() : null;
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const bootstrapRelative = path.join("engine", "yaneuraou", "YaneuraOuWasmWorkerBootstrap.js").replaceAll(path.sep,"/");
const bootstrapFile = path.join(root, bootstrapRelative);

const constants = {
  engineName: "YaneuraOu", engineVersion: "V9.00", release: "V9.00",
  repository: "https://github.com/yaneurao/YaneuraOu",
  commit: "a5ee2786c0030edc7d4a1cdfe94b04dffec55493",
  emsdkVersion: "3.1.43",
  expectedEmscriptenReleaseCommit: "bf3c159888633d232c0507f4c76cc156a43c32dc",
  compiler: "em++", engineType: "USI / WebAssembly", evaluationModel: "MATERIAL",
  materialLevel: 1, targetCpu: "WASM", threads: true, pthreadPoolSize: 32,
  initialMemory: 92274688, maximumMemory: 4294967296, memoryGrowth: true, stackSize: 67108864,
  sourceLicense: "GPL-3.0 project license statement in pinned upstream README; component-level notices still required",
  buildToolLicense: "Emscripten: MIT OR University of Illinois/NCSA"
};

let metadata = {
  schemaVersion: 3,
  status: built ? "BUILT_AWAITING_REAL_BROWSER_USI_E2E_AND_LICENSE_FORMAL_GATE" : "NOT_BUILT_IN_CURRENT_EXECUTION_ENVIRONMENT",
  ...constants,
  buildDate: built ? new Date().toISOString() : null,
  buildPlatform: built ? readMaybe("build-platform.txt") : null,
  githubActionsRunner: built ? {
    os: process.env.RUNNER_OS ?? null, arch: process.env.RUNNER_ARCH ?? null,
    imageOS: process.env.ImageOS ?? null, imageVersion: process.env.ImageVersion ?? null,
    runId: process.env.GITHUB_RUN_ID ?? null, runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    workflowSha: process.env.GITHUB_SHA ?? null
  } : null,
  emsdkRepositoryCommit: built ? readMaybe("emsdk-repository-commit.txt") : null,
  emscriptenDockerImage: built ? readMaybe("emscripten-docker-image.txt") : "emscripten/emsdk:3.1.43",
  emscriptenDockerImageId: built ? readMaybe("emscripten-docker-image-id.txt") : null,
  emscriptenDockerImageDigest: built ? readMaybe("emscripten-docker-image-digest.txt") : null,
  upstreamBuildCommand: built ? readMaybe("upstream-build-command.txt") : "node script/wasm_build.js material",
  bridgeAdaptation: built ? "split_clean_tournament_capture_make_exit_and_apply_documented_wasm_usi_bridge" : "planned_documented_v900_wasm_usi_bridge",
  sourceModified: built,
  sourcePatchFile: built ? readMaybe("source-patch-file.txt") : "patches/yaneuraou-v9.00-wasm-usi-bridge.patch",
  sourcePatchSha256: built ? readMaybe("source-patch-sha256.txt") : null,
  modifiedSourceFiles: built ? (readMaybe("source-modified-files.txt") ?? "").split(/\r?\n/).filter(Boolean) : [],
  wasmUsiCommandExport: built ? readMaybe("usi-command-export.txt") : null,
  emccVersion: built ? firstLine(readMaybe("emcc-version.txt")) : null,
  emppVersion: built ? firstLine(readMaybe("empp-version.txt")) : null,
  llvmVersion: built ? firstLine(readMaybe("llvm-version.txt")) : null,
  nodeVersion: built ? readMaybe("node-version.txt") : null,
  pythonVersion: built ? readMaybe("python-version.txt") : null,
  buildCommand: built ? readMaybe("build-command.txt") : "make clean && make -j2 tournament ... official material settings",
  jsFile: null,
  wasmFile: null,
  workerFile: null,
  jsSha256: null,
  wasmSha256: null,
  workerSha256: null,
  pthreadWorkerPackaging: built ? readMaybe("pthread-worker-packaging.txt") : "SEPARATE_PTHREAD_WORKER_EXPECTED_FOR_EMSCRIPTEN_3_1_43",
  generatedPthreadWorkerCount: built ? Number(readMaybe("generated-pthread-worker-count.txt")) : null,
  workerBootstrapFile: bootstrapRelative,
  workerBootstrapSha256: null,
  measured: built,
  notes: built ? [
    "Pinned YaneuraOu V9.00 source itself uses Emscripten 3.1.43 in its official WASM workflow.",
    "The pinned upstream workflow selects Docker image emscripten/emsdk:3.1.43; the measured image id and repo digest are recorded.",
    "Run #7 proved the pinned source + upstream-compatible toolchain can emit the MATERIAL JS/worker/WASM set with make exit 0.",
    "Run #7 artifact inspection also proved that the produced WASM lacks the usi_command export expected by upstream wasm_pre.js because the pinned source's legacy wrapper is disabled; Run #8 applies a documented minimal two-file source patch and records its hash/diff.",
    "The deterministic bridge emits JS, separate pthread worker.js, and WASM using the pinned source Makefile and material settings, then requires a measured usi_command WebAssembly export before accepting the artifact.",
    "The material profile fixes MATERIAL_LEVEL=1, EM_EXPORT_NAME=YaneuraOu_Material and EM_INITIAL_MEMORY_SIZE=92274688.",
    "Thread/memory values are upstream build settings, not smartphone optimization claims.",
    "Formal Completion requires separate Real Browser/USI/E2E and distribution/license evidence."
  ] : [
    "No compiler/build was executed in the current sandbox; measured build fields remain null.",
    "Pinned upstream WASM workflow selects Docker image emscripten/emsdk:3.1.43 and the official material profile expects a separate worker.js.",
    "Run #8 will record the pulled Docker image id/digest, apply the hash-bound minimal WASM USI bridge patch, build with the same official material settings, and reject any WASM that lacks usi_command.",
    "Run the GitHub Actions Build Bridge to replace this file with measured artifact metadata."
  ]
};

if (built) {
  const jsName=readMaybe("js-file.txt"), wasmName=readMaybe("wasm-file.txt"), workerName=readMaybe("worker-file.txt");
  if (!jsName || !wasmName || !workerName) throw new Error("build record must contain actual JS/WASM/worker filenames");
  const js=path.join(engineDir,jsName), wasm=path.join(engineDir,wasmName), worker=path.join(engineDir,workerName);
  const generatedWorkers=fs.readdirSync(engineDir).filter(x => /^yaneuraou\.material.*\.worker\.js$/.test(x)).sort();
  for (const f of [js,wasm,worker,bootstrapFile]) if (!fs.existsSync(f)) throw new Error(`built metadata asset missing: ${f}`);
  if (generatedWorkers.length !== 1 || generatedWorkers[0] !== workerName) throw new Error(`Emscripten 3.1.43 expected exactly one recorded pthread worker; found ${generatedWorkers.join(",")}`);
  if (readMaybe("yaneuraou-source-commit.txt") !== constants.commit) throw new Error("recorded source commit mismatch");
  if (metadata.sourceModified !== true) throw new Error("accepted Run #8 build must record the documented YaneuraOu source modification");
  if (metadata.sourcePatchFile !== "patches/yaneuraou-v9.00-wasm-usi-bridge.patch" || !metadata.sourcePatchSha256) throw new Error("source patch evidence is incomplete");
  if (JSON.stringify(metadata.modifiedSourceFiles) !== JSON.stringify(["source/engine/yaneuraou-engine/yaneuraou-search.cpp","source/usi.h"])) throw new Error(`unexpected modified source files: ${metadata.modifiedSourceFiles.join(",")}`);
  if (!metadata.wasmUsiCommandExport || !["usi_command","_usi_command"].includes(metadata.wasmUsiCommandExport)) throw new Error(`measured usi_command export missing: ${metadata.wasmUsiCommandExport}`);
  if (metadata.pthreadWorkerPackaging !== "SEPARATE_PTHREAD_WORKER") throw new Error(`unexpected pthread worker packaging: ${metadata.pthreadWorkerPackaging}`);
  if (metadata.generatedPthreadWorkerCount !== 1) throw new Error(`unexpected generated pthread worker count: ${metadata.generatedPthreadWorkerCount}`);
  metadata.jsFile=jsName;
  metadata.wasmFile=wasmName;
  metadata.workerFile=workerName;
  metadata.jsSha256=sha(js);
  metadata.wasmSha256=sha(wasm);
  metadata.workerSha256=sha(worker);
  metadata.workerBootstrapSha256=sha(bootstrapFile);
}
fs.writeFileSync(path.join(root,"ENGINE_BUILD_METADATA.json"), JSON.stringify(metadata,null,2)+"\n");

const manifestPath=path.join(engineDir,"engine-manifest.json");
const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
Object.assign(manifest, {
  schemaVersion: 3,
  available: built,
  status: built ? "BUILT_AWAITING_REAL_BROWSER_USI_E2E_AND_DISTRIBUTION_GATE" : "NOT_BUILT_IN_CURRENT_VERIFICATION_ENVIRONMENT",
  emscriptenVersion: built ? metadata.emppVersion : null,
  emsdkVersion: constants.emsdkVersion,
  expectedEmscriptenReleaseCommit: constants.expectedEmscriptenReleaseCommit,
  buildId: built ? `YaneuraOu-V9.00-MATERIAL1-${metadata.wasmSha256.slice(0,12)}` : null,
  jsFile: metadata.jsFile,
  wasmFile: metadata.wasmFile,
  workerFile: metadata.workerFile,
  jsUrl: built ? `./engine/yaneuraou/${metadata.jsFile}` : "./engine/yaneuraou/yaneuraou.material.js",
  wasmUrl: built ? `./engine/yaneuraou/${metadata.wasmFile}` : "./engine/yaneuraou/yaneuraou.material.wasm",
  pthreadWorkerPackaging: metadata.pthreadWorkerPackaging,
  pthreadWorkerUrl: built ? `./engine/yaneuraou/${metadata.workerFile}` : "./engine/yaneuraou/yaneuraou.material.worker.js",
  generatedPthreadWorkerCount: metadata.generatedPthreadWorkerCount,
  workerUrl: "./engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js",
  workerBootstrapSha256: metadata.workerBootstrapSha256,
  jsSha256: metadata.jsSha256,
  wasmSha256: metadata.wasmSha256,
  workerSha256: metadata.workerSha256,
  buildMetadataUrl: "./ENGINE_BUILD_METADATA.json",
  sourceModified: metadata.sourceModified,
  sourcePatchFile: metadata.sourcePatchFile,
  sourcePatchSha256: metadata.sourcePatchSha256,
  modifiedSourceFiles: metadata.modifiedSourceFiles,
  wasmUsiCommandExport: metadata.wasmUsiCommandExport,
  upstreamInitialMemoryBytesMaterialLevel1: constants.initialMemory,
  note: built ? "Official pinned-source material profile JS/worker.js/WASM build and hashes are present. Formal Completion and public distribution remain separate gates." : "Distribution-safe manifest. available=true only after the official-source Build Bridge generates and hashes real assets."
});
fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2)+"\n");
console.log(JSON.stringify({status:metadata.status, js:metadata.jsFile, worker:metadata.workerFile, wasm:metadata.wasmFile, pthreadWorkerPackaging:metadata.pthreadWorkerPackaging, workerBootstrap:metadata.workerBootstrapFile},null,2));
