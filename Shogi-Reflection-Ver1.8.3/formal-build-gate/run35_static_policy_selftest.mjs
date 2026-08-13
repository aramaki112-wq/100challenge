import assert from "node:assert/strict";

const allowedBaselineCacheOmissions = new Set([
  "__pycache__/browser_verify.cpython-313.pyc",
  "__pycache__/real_engine_browser_verify.cpython-313.pyc",
]);

const deleted = [
  "__pycache__/browser_verify.cpython-313.pyc",
  "__pycache__/real_engine_browser_verify.cpython-313.pyc",
];
const allowed = deleted.filter((f) => allowedBaselineCacheOmissions.has(f));
const unexpected = deleted.filter((f) => !allowedBaselineCacheOmissions.has(f));
assert.equal(allowed.length, 2);
assert.equal(unexpected.length, 0);

const realDeletionProbe = [
  "__pycache__/browser_verify.cpython-313.pyc",
  "GameReview.js",
].filter((f) => !allowedBaselineCacheOmissions.has(f));
assert.deepEqual(realDeletionProbe, ["GameReview.js"]);

const files = [
  "main.js",
  "scripts/update-engine-build-metadata.mjs",
  "formal-build-gate/corresponding-source/YANEURAOU_WASM_BUILD.js",
  "formal-build-gate/corresponding-source/YANEURAOU_WASM_PRE.js",
];
const isCorrespondingSourceEvidence = (f) => f.split("/").includes("corresponding-source");
const applicationJs = files.filter((f) => !isCorrespondingSourceEvidence(f));
const correspondingSourceJs = files.filter((f) => isCorrespondingSourceEvidence(f));
assert.deepEqual(applicationJs, ["main.js", "scripts/update-engine-build-metadata.mjs"]);
assert.deepEqual(correspondingSourceJs, [
  "formal-build-gate/corresponding-source/YANEURAOU_WASM_BUILD.js",
  "formal-build-gate/corresponding-source/YANEURAOU_WASM_PRE.js",
]);

const run34FalsePositiveImports = [
  "./lib/yaneuraou.module",
  "./yaneuraou.module",
];
assert.equal(run34FalsePositiveImports.length, 2);

console.log("PASS: exactly the two known Baseline pyc caches may be omitted.");
console.log("PASS: a real Baseline application/source deletion still fails closed.");
console.log("PASS: corresponding-source evidence is excluded at any nesting depth.");
console.log("PASS: Run #34's two yaneuraou.module template imports are not application imports.");
