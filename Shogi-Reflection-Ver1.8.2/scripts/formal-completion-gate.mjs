import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const checks = [];
const record = (name, ok, detail = "") => {
  checks.push({ name, ok, detail });
  if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
};

try {
  execFileSync(process.execPath, [path.join(root, "scripts", "real-yaneuraou-artifact-gate.mjs")], { cwd: root, stdio: "pipe" });
  record("Real YaneuraOu artifact gate", true);
} catch (error) {
  record("Real YaneuraOu artifact gate", false, error.stdout?.toString().trim().split("\n").slice(-1)[0] || "failed");
}

const manifestPath = path.join(root, "engine", "yaneuraou", "engine-manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
const wasmPath = path.join(root, "engine", "yaneuraou", "yaneuraou.wasm");
const wasmHash = fs.existsSync(wasmPath) ? crypto.createHash("sha256").update(fs.readFileSync(wasmPath)).digest("hex") : null;

const e2ePath = path.join(root, "REAL_YANEURAOU_E2E_RESULT.json");
if (fs.existsSync(e2ePath)) {
  const e2e = JSON.parse(fs.readFileSync(e2ePath, "utf8"));
  record("Real YaneuraOu E2E passed", e2e.passed === true, `passed=${e2e.passed}`);
  record("Real YaneuraOu E2E matches current WASM", Boolean(wasmHash && e2e.wasmSha256 === wasmHash), `e2e=${e2e.wasmSha256 ?? "null"}, current=${wasmHash ?? "null"}`);
  for (const required of ["usi", "usiok", "isready", "readyok", "position", "go", "cp", "mate", "pv", "depth", "nodes", "time", "bestmove", "stop", "quit", "sampleKif", "evaluationGraph", "badCandidate", "graphToStep4"]) {
    record(`Real E2E ${required}`, e2e.checks?.[required] === true, String(e2e.checks?.[required]));
  }
} else {
  record("Real YaneuraOu E2E evidence", false, "REAL_YANEURAOU_E2E_RESULT.json is missing");
}

const licensePath = path.join(root, "ENGINE_LICENSE_GATE_RESULT.json");
if (fs.existsSync(licensePath)) {
  const license = JSON.parse(fs.readFileSync(licensePath, "utf8"));
  record("License gate completed", license.completed === true, String(license.completed));
  record("No unknown-rights asset bundled", license.unknownRightsAssetBundled === false, String(license.unknownRightsAssetBundled));
  record("Personal-use bundling decision recorded", Boolean(license.personalUseReadiness), String(license.personalUseReadiness ?? ""));
} else {
  record("License gate evidence", false, "ENGINE_LICENSE_GATE_RESULT.json is missing");
}

record("Pinned release", manifest.engineVersion === "V9.00" && manifest.commitHash === "a5ee2786c0030edc7d4a1cdfe94b04dffec55493");
record("MATERIAL_LEVEL=1", manifest.evaluationModel === "MATERIAL" && manifest.materialLevel === 1);

const result = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  gate: "VER_1_8_FORMAL_COMPLETION",
  passed: failures.length === 0,
  checks,
  failures
};
fs.writeFileSync(path.join(root, "FORMAL_COMPLETION_GATE_RESULT.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
