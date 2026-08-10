import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "engine", "yaneuraou");
const manifestPath = path.join(dir, "engine-manifest.json");
const emscriptenVersion = process.argv.slice(2).join(" ").trim();
if (!emscriptenVersion) throw new Error("Pass the exact `em++ --version` first line.");
const sha = (name) => fs.existsSync(path.join(dir, name))
  ? crypto.createHash("sha256").update(fs.readFileSync(path.join(dir, name))).digest("hex")
  : null;
const jsSha256 = sha("yaneuraou.js");
const wasmSha256 = sha("yaneuraou.wasm");
const workerSha256 = sha("yaneuraou.worker.js");
if (!jsSha256 || !wasmSha256) throw new Error("yaneuraou.js and yaneuraou.wasm are required.");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
Object.assign(manifest, {
  available: true,
  status: "BUILT_AWAITING_BROWSER_RESOURCE_AND_DISTRIBUTION_GATE",
  emscriptenVersion,
  buildId: `YaneuraOu-V9.00-MATERIAL1-${wasmSha256.slice(0, 12)}`,
  jsSha256,
  wasmSha256,
  workerSha256,
  note: "Official-source build present. This flag enables runtime loading; distribution/public-release approval remains a separate documentation gate."
});
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ jsSha256, wasmSha256, workerSha256, emscriptenVersion }, null, 2));
