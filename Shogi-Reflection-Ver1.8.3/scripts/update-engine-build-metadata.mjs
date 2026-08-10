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
const bootstrapFile = path.join(root, "YaneuraOuWasmWorkerBootstrap.js");

const constants = {
  engineName: "YaneuraOu", engineVersion: "V9.00", release: "V9.00",
  repository: "https://github.com/yaneurao/YaneuraOu",
  commit: "a5ee2786c0030edc7d4a1cdfe94b04dffec55493",
  emsdkVersion: "4.0.15",
  expectedEmscriptenReleaseCommit: "b412b6307e541b93dd93f01b61181e15c17302ec",
  compiler: "em++", engineType: "USI / WebAssembly", evaluationModel: "MATERIAL",
  materialLevel: 1, targetCpu: "WASM", threads: true, pthreadPoolSize: 32,
  initialMemory: 138412032, maximumMemory: 4294967296, memoryGrowth: true, stackSize: 67108864,
  sourceLicense: "GPL-3.0 project license statement in pinned upstream README; component-level notices still required",
  buildToolLicense: "Emscripten: MIT OR University of Illinois/NCSA"
};

let metadata = {
  schemaVersion: 2,
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
  emccVersion: built ? firstLine(readMaybe("emcc-version.txt")) : null,
  emppVersion: built ? firstLine(readMaybe("empp-version.txt")) : null,
  llvmVersion: built ? firstLine(readMaybe("llvm-version.txt")) : null,
  nodeVersion: built ? readMaybe("node-version.txt") : null,
  pythonVersion: built ? readMaybe("python-version.txt") : null,
  buildCommand: built ? readMaybe("build-command.txt") : "make -j1 normal TARGET_CPU=WASM COMPILER=em++ YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL MATERIAL_LEVEL=1",
  jsFile: null,
  wasmFile: null,
  workerFile: null,
  jsSha256: null,
  wasmSha256: null,
  workerSha256: null,
  pthreadWorkerPackaging: built ? readMaybe("pthread-worker-packaging.txt") : "MAIN_JS_SELF_WORKER_EXPECTED_FOR_EMSCRIPTEN_4_0_15",
  generatedPthreadWorkerCount: built ? Number(readMaybe("generated-pthread-worker-count.txt")) : null,
  workerBootstrapFile: "YaneuraOuWasmWorkerBootstrap.js",
  workerBootstrapSha256: null,
  measured: built,
  notes: built ? [
    "Emscripten 4.0.15 does not emit a separate pthread .worker.js; pthread Workers reuse the generated main JavaScript as their Worker script.",
    "workerFile/workerSha256 are null by design because no separate generated pthread worker artifact exists.",
    "YaneuraOuWasmWorkerBootstrap.js is the application-level classic Worker boundary and is hashed separately.",
    "Thread/memory values are the pinned upstream WASM Makefile settings used for this build; they are not iPhone optimization claims.",
    "Formal Completion requires separate Real Browser/USI/E2E and distribution/license evidence."
  ] : [
    "No compiler/build was executed in the current sandbox; measured build fields remain null.",
    "For pinned Emscripten 4.0.15, no separate pthread .worker.js is expected.",
    "Run the GitHub Actions Build Bridge to replace this file with measured artifact metadata."
  ]
};

if (built) {
  const js=path.join(engineDir,"yaneuraou.js"), wasm=path.join(engineDir,"yaneuraou.wasm");
  const generatedWorkers=fs.readdirSync(engineDir).filter(x => /^yaneuraou.*\.worker\.js$/.test(x)).sort();
  if (!fs.existsSync(js) || !fs.existsSync(wasm)) throw new Error("built metadata requires JS and WASM");
  if (generatedWorkers.length !== 0) throw new Error(`Emscripten 4.0.15 expected zero separate pthread workers; found ${generatedWorkers.length}`);
  if (!fs.existsSync(bootstrapFile)) throw new Error("application Worker bootstrap is missing");
  if (readMaybe("yaneuraou-source-commit.txt") !== constants.commit) throw new Error("recorded source commit mismatch");
  if (metadata.pthreadWorkerPackaging !== "MAIN_JS_SELF_WORKER") throw new Error(`unexpected pthread worker packaging: ${metadata.pthreadWorkerPackaging}`);
  if (metadata.generatedPthreadWorkerCount !== 0) throw new Error(`unexpected generated pthread worker count: ${metadata.generatedPthreadWorkerCount}`);
  metadata.jsFile=path.basename(js);
  metadata.wasmFile=path.basename(wasm);
  metadata.jsSha256=sha(js);
  metadata.wasmSha256=sha(wasm);
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
  jsUrl: built ? `./engine/yaneuraou/${metadata.jsFile}` : "./engine/yaneuraou/yaneuraou.js",
  wasmUrl: built ? `./engine/yaneuraou/${metadata.wasmFile}` : "./engine/yaneuraou/yaneuraou.wasm",
  pthreadWorkerPackaging: metadata.pthreadWorkerPackaging,
  pthreadWorkerUrl: null,
  generatedPthreadWorkerCount: metadata.generatedPthreadWorkerCount,
  workerUrl: "./YaneuraOuWasmWorkerBootstrap.js",
  workerBootstrapSha256: metadata.workerBootstrapSha256,
  jsSha256: metadata.jsSha256,
  wasmSha256: metadata.wasmSha256,
  workerSha256: null,
  buildMetadataUrl: "./ENGINE_BUILD_METADATA.json",
  note: built ? "Official-source JS/WASM build/hash evidence is present. Emscripten 4.0.15 uses main-JS self-worker pthread packaging; no separate pthread .worker.js exists. Formal Completion and public distribution remain separate gates." : "Distribution-safe manifest. available=true only after the official-source Build Bridge generates and hashes real assets."
});
fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2)+"\n");
console.log(JSON.stringify({status:metadata.status, js:metadata.jsFile, wasm:metadata.wasmFile, pthreadWorkerPackaging:metadata.pthreadWorkerPackaging, workerBootstrap:metadata.workerBootstrapFile},null,2));
