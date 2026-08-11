#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node "$ROOT/scripts/real-yaneuraou-artifact-gate.mjs"
node - <<'NODE'
const fs=require('fs');
const m=JSON.parse(fs.readFileSync('ENGINE_BUILD_METADATA.json','utf8'));
const expected='bf3c159888633d232c0507f4c76cc156a43c32dc';
if(m.emsdkVersion!=='3.1.43'||m.expectedEmscriptenReleaseCommit!==expected) throw new Error('Emscripten pin mismatch');
if(m.pthreadWorkerPackaging!=='SEPARATE_PTHREAD_WORKER'||m.generatedPthreadWorkerCount!==1) throw new Error('unexpected pthread worker packaging for Emscripten 3.1.43');
if(!m.workerFile||!m.workerSha256) throw new Error('separate pthread worker metadata is mandatory for Emscripten 3.1.43 official build');
if(m.buildCommand!=='node script/wasm_build.js material') throw new Error('official material build command mismatch');
NODE
