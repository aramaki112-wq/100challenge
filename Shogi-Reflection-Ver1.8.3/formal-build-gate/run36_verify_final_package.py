#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, sys
from pathlib import Path

APP = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]

def load(p): return json.loads((APP/p).read_text(encoding='utf-8'))
def sha(p): return hashlib.sha256((APP/p).read_bytes()).hexdigest()
def req(c,m):
    if not c: raise SystemExit('RUN36 POSTZIP FAIL: '+m)

lock=load('RUN36_FORMAL_RELEASE_LOCK.json')
completion=load('FORMAL_COMPLETION_GATE_RESULT.json')
run36=load('formal-build-gate/RUN36_FINAL_FORMAL_COMPLETION_RESULT.json')
meta=load('ENGINE_BUILD_METADATA.json')
man=load('engine/yaneuraou/engine-manifest.json')
lic=load('ENGINE_LICENSE_GATE_RESULT.json')
release=load('RUN36_RELEASE_MANIFEST.json')

req(completion.get('passed') is True and completion.get('formalCompletion') is True,'completion gate not passed')
req(run36.get('verdict')=='FORMAL_TECHNICAL_RELEASE_PASSED','Run36 verdict mismatch')
req(meta.get('formalCompletion') is True and meta.get('diagnosticBuild') is False,'metadata not final/non-diagnostic')
req(man.get('formalCompletion') is True and man.get('available') is True,'manifest not final/available')
req(lic.get('formalRealEngineBundlingApprovedForTechnicalPersonalRelease') is True,'technical bundling approval missing')
req(lic.get('formalRealEngineBundlingApprovedForPublicDistribution') is False,'public distribution must remain fail-closed')
req(lic.get('formalRealEngineBundlingApprovedForCommercialDistribution') is False,'commercial distribution must remain fail-closed')
req(release.get('formalCompletion') is True,'release manifest not formal')

files={
 'js':'engine/yaneuraou/yaneuraou.material.js',
 'wasm':'engine/yaneuraou/yaneuraou.material.wasm',
 'pthreadWorker':'engine/yaneuraou/yaneuraou.material.worker.js',
 'productionWorkerBootstrap':'engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js',
}
for k,p in files.items():
    req((APP/p).is_file(),f'missing runtime {p}')
    h=sha(p)
    req(h==lock['runtimeHashes'][k],f'locked SHA mismatch {k}')
    req(h==release['runtimeHashes'][k],f'release manifest SHA mismatch {k}')

static=(APP/'STATIC_VERIFICATION_RESULT.txt').read_text(encoding='utf-8',errors='replace')
for token in ['Missing imports: 0','Unexpected deleted Baseline files: 0','Failed checks: 0']:
    req(token in static,'static evidence missing '+token)
status=(APP/'FORMAL_COMPLETION_STATUS.md').read_text(encoding='utf-8',errors='replace')
req('FORMAL TECHNICAL RELEASE PASSED' in status,'formal status text missing')
for p in ['THIRD_PARTY_NOTICES.md','DISTRIBUTION_LICENSE_CHECKLIST.md','ENGINE_SOURCE_DISTRIBUTION_PLAN.md']:
    text=(APP/p).read_text(encoding='utf-8',errors='replace')
    req('LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION' in text,p+' lacks distribution boundary')

print('PASS_RUN36_FINAL_EXTRACTED_PACKAGE')
print('PASS: exact locked runtime hashes match extracted bytes.')
print('PASS: technical Formal Completion is recorded; public/commercial distribution remains fail-closed.')
