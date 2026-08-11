#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node - <<'NODE'
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const metadata = JSON.parse(fs.readFileSync('ENGINE_BUILD_METADATA.json','utf8'));
const manifest = JSON.parse(fs.readFileSync('engine/yaneuraou/engine-manifest.json','utf8'));

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(metadata.diagnosticBuild === true, 'diagnosticBuild must be true');
assert(metadata.measured === false, 'diagnostic build must remain non-formal measured=false');
assert(manifest.available === true, 'diagnostic runtime manifest must expose the built artifact');
assert(manifest.diagnosticBuild === true, 'manifest must identify diagnosticBuild=true');
assert(metadata.diagnosticEmccCflags === '-sASSERTIONS=2 -g3 -Wcast-function-type', 'unexpected diagnostic compiler flags');
assert(['usi_command','_usi_command'].includes(metadata.wasmUsiCommandExport), 'usi_command export missing');

const items = [
  ['engine/yaneuraou/' + metadata.jsFile, metadata.jsSha256, manifest.jsSha256, 'js'],
  ['engine/yaneuraou/' + metadata.wasmFile, metadata.wasmSha256, manifest.wasmSha256, 'wasm'],
  ['engine/yaneuraou/' + metadata.workerFile, metadata.workerSha256, manifest.workerSha256, 'pthread worker'],
  [metadata.workerBootstrapFile, metadata.workerBootstrapSha256, manifest.workerBootstrapSha256, 'runtime bootstrap'],
];
for (const [file, metaHash, manifestHash, label] of items) {
  assert(file && fs.existsSync(file), `${label} missing: ${file}`);
  const actual = sha256(file);
  assert(actual === metaHash, `${label} metadata SHA mismatch`);
  assert(actual === manifestHash, `${label} manifest SHA mismatch`);
}
console.log('Diagnostic artifact structure/hash gate PASS.');
NODE

bash ./scripts/run-node-tests-with-evidence.sh
