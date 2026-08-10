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
  emsdkVersion: "4.0.15",
  emscriptenReleaseCommit: "b412b6307e541b93dd93f01b61181e15c17302ec",
  evaluationModel: "MATERIAL",
  materialLevel: 1,
  pthreadWorkerPackaging: "MAIN_JS_SELF_WORKER"
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

if (metadata.pthreadWorkerPackaging !== expected.pthreadWorkerPackaging) fail(`Unexpected pthreadWorkerPackaging: ${metadata.pthreadWorkerPackaging}`);
if (metadata.generatedPthreadWorkerCount !== 0) fail(`Expected zero generated pthread .worker.js files for Emscripten 4.0.15; got ${metadata.generatedPthreadWorkerCount}`);
if (metadata.workerFile !== null || metadata.workerSha256 !== null) fail("workerFile/workerSha256 must be null because Emscripten 4.0.15 emits no separate pthread worker file.");
if (manifest.pthreadWorkerUrl !== null || manifest.workerSha256 !== null) fail("Manifest must not invent a separate pthread worker URL/hash for Emscripten 4.0.15.");

for (const key of ["jsFile", "wasmFile", "workerBootstrapFile"]) if (!metadata[key]) fail(`${key} is missing from Build Metadata.`);
const assets = [
  [path.join(engineDir, metadata.jsFile ?? ""), metadata.jsSha256, manifest.jsSha256, "JS"],
  [path.join(engineDir, metadata.wasmFile ?? ""), metadata.wasmSha256, manifest.wasmSha256, "WASM"],
  [path.join(root, metadata.workerBootstrapFile ?? ""), metadata.workerBootstrapSha256, manifest.workerBootstrapSha256, "Application Worker bootstrap"]
];
for (const [file, metadataHash, manifestHash, label] of assets) {
  if (!file || !fs.existsSync(file)) { fail(`${label} asset is missing: ${file}`); continue; }
  const actual = sha256(file);
  fact(`${path.relative(root,file)} sha256=${actual}`);
  if (!metadataHash || actual !== metadataHash) fail(`${path.basename(file)} does not match Build Metadata SHA-256.`);
  if (!manifestHash || actual !== manifestHash) fail(`${path.basename(file)} does not match manifest SHA-256.`);
}

const generatedWorkers = fs.existsSync(engineDir) ? fs.readdirSync(engineDir).filter((x)=>/^yaneuraou.*\.worker\.js$/.test(x)) : [];
if (generatedWorkers.length !== 0) fail(`Unexpected separate pthread worker assets present: ${generatedWorkers.join(", ")}`);
fact("Emscripten 4.0.15 pthread packaging uses the generated main JS as the pthread Worker script; separate .worker.js count=0.");

const result = { schemaVersion: 3, checkedAt: new Date().toISOString(), gate: "REAL_YANEURAOU_ARTIFACT", passed: failures.length === 0, facts, failures };
fs.writeFileSync(path.join(root, "REAL_YANEURAOU_ARTIFACT_GATE_RESULT.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
