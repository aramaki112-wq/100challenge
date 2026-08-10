import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
console.warn(
  "DEPRECATED: finalize-yaneuraou-manifest.mjs no longer enables a Real engine from filenames alone. " +
  "Use the Ver.1.8.3 Build Bridge so actual outputs, measured toolchain metadata, and hashes are generated together."
);
execFileSync(process.execPath, [path.join(root, "scripts", "real-yaneuraou-artifact-gate.mjs")], {
  cwd: root,
  stdio: "inherit"
});
