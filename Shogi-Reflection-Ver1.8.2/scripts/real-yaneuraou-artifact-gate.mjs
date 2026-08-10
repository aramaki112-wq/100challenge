import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engineDir = path.join(root, "engine", "yaneuraou");
const manifestPath = path.join(engineDir, "engine-manifest.json");
const expectedCommit = "a5ee2786c0030edc7d4a1cdfe94b04dffec55493";
const expectedBuild = {
  engineVersion: "V9.00",
  evaluationModel: "MATERIAL",
  materialLevel: 1
};
const failures = [];
const facts = [];
const fail = (message) => failures.push(message);
const fact = (message) => facts.push(message);
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

if (!fs.existsSync(manifestPath)) {
  fail("engine/yaneuraou/engine-manifest.json is missing.");
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  fact(`manifest.available=${manifest.available}`);
  if (manifest.available !== true) fail("manifest.available is not true: Real YaneuraOu build is not enabled.");
  if (manifest.engineVersion !== expectedBuild.engineVersion) fail(`Unexpected engineVersion: ${manifest.engineVersion}`);
  if (manifest.commitHash !== expectedCommit) fail(`Unexpected commitHash: ${manifest.commitHash}`);
  if (manifest.evaluationModel !== expectedBuild.evaluationModel || manifest.materialLevel !== expectedBuild.materialLevel) {
    fail(`Expected MATERIAL_LEVEL=1, got ${manifest.evaluationModel}/${manifest.materialLevel}`);
  }
  if (!manifest.emscriptenVersion) fail("emscriptenVersion is missing.");
  if (!manifest.jsSha256 || !manifest.wasmSha256) fail("JS/WASM SHA-256 metadata is missing.");

  const assets = [
    ["yaneuraou.js", manifest.jsSha256],
    ["yaneuraou.wasm", manifest.wasmSha256]
  ];
  if (manifest.requiresThreads === true) assets.push(["yaneuraou.worker.js", manifest.workerSha256]);

  for (const [name, expectedHash] of assets) {
    const file = path.join(engineDir, name);
    if (!fs.existsSync(file)) {
      fail(`${name} is missing.`);
      continue;
    }
    const actual = sha256(file);
    fact(`${name} sha256=${actual}`);
    if (!expectedHash) fail(`${name} expected SHA-256 is missing from manifest.`);
    else if (actual !== expectedHash) fail(`${name} SHA-256 mismatch.`);
  }
}

const result = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  gate: "REAL_YANEURAOU_ARTIFACT",
  passed: failures.length === 0,
  facts,
  failures
};
fs.writeFileSync(path.join(root, "REAL_YANEURAOU_ARTIFACT_GATE_RESULT.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
