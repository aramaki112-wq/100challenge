#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
node scripts/real-yaneuraou-artifact-gate.mjs
node - <<'NODE'
const fs=require('fs'), crypto=require('crypto'), path=require('path');
const m=JSON.parse(fs.readFileSync('ENGINE_BUILD_METADATA.json','utf8'));
const expected='b412b6307e541b93dd93f01b61181e15c17302ec';
if(m.status!=='BUILT_AWAITING_REAL_BROWSER_USI_E2E_AND_LICENSE_FORMAL_GATE') throw new Error('metadata build status is not BUILT');
if(m.emsdkVersion!=='4.0.15'||m.expectedEmscriptenReleaseCommit!==expected) throw new Error('Emscripten pin mismatch');
if(m.pthreadWorkerPackaging!=='MAIN_JS_SELF_WORKER'||m.generatedPthreadWorkerCount!==0) throw new Error('unexpected pthread worker packaging for Emscripten 4.0.15');
if(m.workerFile!==null||m.workerSha256!==null) throw new Error('separate pthread worker metadata must remain null for Emscripten 4.0.15');
for(const [file,hash] of [[m.jsFile,m.jsSha256],[m.wasmFile,m.wasmSha256],[m.workerBootstrapFile,m.workerBootstrapSha256]]){
  if(!file||!hash) throw new Error('runtime asset metadata missing');
  const p = file===m.workerBootstrapFile ? path.join(file) : path.join('engine','yaneuraou',file);
  if(!fs.existsSync(p)) throw new Error(`missing ${p}`);
  const actual=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); if(actual!==hash) throw new Error(`${file} hash mismatch`);
}
console.log('PASS: build metadata, main-JS pthread packaging, and runtime asset hashes match.');
NODE
