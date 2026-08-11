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
if(m.upstreamBuildCommand!=='node script/wasm_build.js material') throw new Error('upstream material packaging command mismatch');
if(m.bridgeAdaptation!=='split_clean_tournament_capture_make_exit_and_apply_documented_wasm_usi_bridge') throw new Error('unexpected deterministic bridge adaptation');
if(m.sourceModified!==true||m.sourcePatchFile!=='patches/yaneuraou-v9.00-wasm-usi-bridge.patch'||!m.sourcePatchSha256) throw new Error('documented source patch evidence missing');
if(JSON.stringify(m.modifiedSourceFiles)!==JSON.stringify(['source/engine/yaneuraou-engine/yaneuraou-search.cpp','source/usi.h'])) throw new Error('unexpected modified YaneuraOu source files');
if(!['usi_command','_usi_command'].includes(m.wasmUsiCommandExport)) throw new Error('measured WASM usi_command export missing');
if(typeof m.buildCommand!=='string'||!m.buildCommand.startsWith('make clean && make -j2 tournament ')) throw new Error('deterministic bridge build command mismatch');
NODE
