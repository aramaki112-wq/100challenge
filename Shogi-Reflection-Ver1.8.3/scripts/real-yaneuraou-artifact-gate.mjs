import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engineDir = path.join(root, "engine", "yaneuraou");
const manifestPath = path.join(engineDir, "engine-manifest.json");
const metadataPath = path.join(root, "ENGINE_BUILD_METADATA.json");
const expected = {
  commit: "a5ee2786c0030edc7d4a1cdfe94b04dffec55493",
  engineVersion: "V9.00",
  emsdkVersion: "3.1.43",
  emscriptenReleaseCommit: "bf3c159888633d232c0507f4c76cc156a43c32dc",
  evaluationModel: "MATERIAL",
  materialLevel: 1,
  pthreadWorkerPackaging: "SEPARATE_PTHREAD_WORKER",
  sourcePatchFile: "patches/yaneuraou-v9.00-wasm-usi-bridge.patch",
  modifiedSourceFiles: ["source/engine/yaneuraou-engine/yaneuraou-search.cpp", "source/usi.h"]
};
const failures = [], facts = [];
const fail = (x) => failures.push(x), fact = (x) => facts.push(x);
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

let manifest = {}, metadata = {};
if (!fs.existsSync(manifestPath)) fail("engine/yaneuraou/engine-manifest.json is missing.");
else manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (!fs.existsSync(metadataPath)) fail("ENGINE_BUILD_METADATA.json is missing.");
else metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

if (manifest.available !== true) fail("manifest.available is not true: a Real YaneuraOu build is not enabled.");
if (manifest.engineVersion !== expected.engineVersion) fail(`Unexpected engineVersion: ${manifest.engineVersion}`);
if (manifest.commitHash !== expected.commit) fail(`Unexpected commitHash: ${manifest.commitHash}`);
if (manifest.evaluationModel !== expected.evaluationModel || manifest.materialLevel !== expected.materialLevel) fail("Expected MATERIAL_LEVEL=1.");
if (metadata.status !== "BUILT_AWAITING_REAL_BROWSER_USI_E2E_AND_LICENSE_FORMAL_GATE" || metadata.measured !== true) fail(`Build metadata is not measured BUILT evidence: ${metadata.status}`);
if (metadata.commit !== expected.commit) fail(`Build metadata commit mismatch: ${metadata.commit}`);
if (metadata.emsdkVersion !== expected.emsdkVersion) fail(`emsdk version mismatch: ${metadata.emsdkVersion}`);
if (metadata.expectedEmscriptenReleaseCommit !== expected.emscriptenReleaseCommit) fail(`Emscripten release commit mapping mismatch: ${metadata.expectedEmscriptenReleaseCommit}`);
if (!metadata.emccVersion || !metadata.emppVersion || !metadata.llvmVersion) fail("Measured emcc/em++/LLVM version evidence is incomplete.");
if (!metadata.buildDate || !metadata.buildPlatform) fail("Measured build date/platform evidence is incomplete.");
if (metadata.threads !== true || metadata.targetCpu !== "WASM" || metadata.materialLevel !== 1) fail("Build profile metadata mismatch.");
if (metadata.initialMemory !== 92274688) fail(`Official material profile initialMemory mismatch: ${metadata.initialMemory}`);
if (metadata.upstreamBuildCommand !== "node script/wasm_build.js material") fail(`Upstream material packaging command mismatch: ${metadata.upstreamBuildCommand}`);
if (metadata.bridgeAdaptation !== "split_clean_tournament_capture_make_exit_and_apply_documented_wasm_usi_bridge") fail(`Unexpected deterministic bridge adaptation: ${metadata.bridgeAdaptation}`);
if (metadata.sourceModified !== true) fail("Run #8 accepted artifact must record sourceModified=true for the documented WASM USI bridge.");
if (metadata.sourcePatchFile !== expected.sourcePatchFile) fail(`Unexpected sourcePatchFile: ${metadata.sourcePatchFile}`);
if (JSON.stringify(metadata.modifiedSourceFiles) !== JSON.stringify(expected.modifiedSourceFiles)) fail(`Unexpected modified source files: ${JSON.stringify(metadata.modifiedSourceFiles)}`);
if (!["usi_command","_usi_command"].includes(metadata.wasmUsiCommandExport)) fail(`Measured wasmUsiCommandExport is missing/invalid: ${metadata.wasmUsiCommandExport}`);
const sourcePatchPath = path.join(root, expected.sourcePatchFile);
if (!fs.existsSync(sourcePatchPath)) fail(`Documented YaneuraOu source patch is missing: ${expected.sourcePatchFile}`);
else {
  const patchHash = sha256(sourcePatchPath);
  fact(`${expected.sourcePatchFile} sha256=${patchHash}`);
  if (!metadata.sourcePatchSha256 || metadata.sourcePatchSha256 !== patchHash) fail("Documented source patch does not match Build Metadata SHA-256.");
}
if (typeof metadata.buildCommand !== "string" || !metadata.buildCommand.startsWith("make clean && make -j2 tournament ")) fail(`Deterministic bridge build command mismatch: ${metadata.buildCommand}`);

if (metadata.pthreadWorkerPackaging !== expected.pthreadWorkerPackaging) fail(`Unexpected pthreadWorkerPackaging: ${metadata.pthreadWorkerPackaging}`);
if (metadata.generatedPthreadWorkerCount !== 1) fail(`Expected exactly one generated pthread .worker.js for Emscripten 3.1.43; got ${metadata.generatedPthreadWorkerCount}`);
if (!metadata.workerFile || !metadata.workerSha256) fail("workerFile/workerSha256 are required for the official Emscripten 3.1.43 material build.");
if (!manifest.pthreadWorkerUrl || !manifest.workerSha256) fail("Manifest must bind the generated pthread worker URL/hash.");

for (const key of ["jsFile", "wasmFile", "workerFile", "workerBootstrapFile"]) if (!metadata[key]) fail(`${key} is missing from Build Metadata.`);
const assets = [
  [path.join(engineDir, metadata.jsFile ?? ""), metadata.jsSha256, manifest.jsSha256, "JS"],
  [path.join(engineDir, metadata.wasmFile ?? ""), metadata.wasmSha256, manifest.wasmSha256, "WASM"],
  [path.join(engineDir, metadata.workerFile ?? ""), metadata.workerSha256, manifest.workerSha256, "Generated pthread Worker"],
  [path.join(root, metadata.workerBootstrapFile ?? ""), metadata.workerBootstrapSha256, manifest.workerBootstrapSha256, "Application Worker bootstrap"]
];
for (const [file, metadataHash, manifestHash, label] of assets) {
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) { fail(`${label} asset is missing or not a regular file: ${file}`); continue; }
  const actual = sha256(file);
  fact(`${path.relative(root,file)} sha256=${actual}`);
  if (!metadataHash || actual !== metadataHash) fail(`${path.basename(file)} does not match Build Metadata SHA-256.`);
  if (!manifestHash || actual !== manifestHash) fail(`${path.basename(file)} does not match manifest SHA-256.`);
}

const wasmPath = metadata.wasmFile ? path.join(engineDir, metadata.wasmFile) : null;
if (wasmPath && fs.existsSync(wasmPath) && fs.statSync(wasmPath).isFile()) {
  try {
    const module = new WebAssembly.Module(fs.readFileSync(wasmPath));
    const exportNames = WebAssembly.Module.exports(module).map((item) => item.name);
    const actualUsiExport = exportNames.find((name) => name === "usi_command" || name === "_usi_command") ?? null;
    fact(`Measured WASM export count=${exportNames.length}; usi_command=${actualUsiExport ?? "MISSING"}`);
    if (!actualUsiExport) fail("Generated WASM does not export usi_command required by pinned wasm_pre.js.");
    else if (metadata.wasmUsiCommandExport !== actualUsiExport) fail(`WASM usi_command export mismatch: metadata=${metadata.wasmUsiCommandExport}, actual=${actualUsiExport}`);
  } catch (error) {
    fail(`Unable to inspect generated WASM exports: ${error.message}`);
  }
}

const generatedWorkers = fs.existsSync(engineDir) ? fs.readdirSync(engineDir).filter((x)=>/^yaneuraou\.material.*\.worker\.js$/.test(x)) : [];
if (generatedWorkers.length !== 1 || generatedWorkers[0] !== metadata.workerFile) fail(`Expected one measured generated pthread worker; found: ${generatedWorkers.join(", ")}`);
fact("Pinned upstream WASM workflow uses Emscripten 3.1.43; official material packaging includes a separate generated pthread worker.js.");

const result = { schemaVersion: 4, checkedAt: new Date().toISOString(), gate: "REAL_YANEURAOU_ARTIFACT", passed: failures.length === 0, facts, failures };
fs.writeFileSync(path.join(root, "REAL_YANEURAOU_ARTIFACT_GATE_RESULT.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
