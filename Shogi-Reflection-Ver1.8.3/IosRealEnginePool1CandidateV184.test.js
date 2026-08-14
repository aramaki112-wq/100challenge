import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(HERE, '..');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read = (p) => fs.readFileSync(p, 'utf8');

test('A5-E1はcheckoutのEngine状態に依存せず別candidateとして隔離する', () => {
  const manifest = JSON.parse(read(path.join(HERE, 'engine/yaneuraou/engine-manifest.json')));
  assert.equal(manifest.engineName, 'YaneuraOu');
  assert.equal(manifest.engineVersion, 'V9.00');
  assert.equal(manifest.commitHash, 'a5ee2786c0030edc7d4a1cdfe94b04dffec55493');
  const baselinePool = manifest.pthreadPoolSize ?? manifest.upstreamPthreadPoolSize;
  assert.equal(baselinePool, 32);

  // Repository checkout is allowed to carry the distribution-safe NOT_BUILT manifest;
  // a packaged Formal runtime may instead carry the measured Formal manifest.
  // The candidate build must work in either case and must never write into engine/yaneuraou.
  assert.ok(
    manifest.status === 'NOT_BUILT_IN_CURRENT_VERIFICATION_ENVIRONMENT' ||
    manifest.status === 'VER_1_8_3_FORMAL_TECHNICAL_RELEASE'
  );
  if (manifest.available === true) {
    assert.equal(sha(path.join(HERE, 'engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js')), manifest.workerBootstrapSha256);
    assert.equal(sha(path.join(HERE, 'engine/yaneuraou/yaneuraou.material.js')), manifest.jsSha256);
    assert.equal(sha(path.join(HERE, 'engine/yaneuraou/yaneuraou.material.wasm')), manifest.wasmSha256);
    assert.equal(sha(path.join(HERE, 'engine/yaneuraou/yaneuraou.material.worker.js')), manifest.workerSha256);
  }
});

test('A5-E1 source patchはPTHREAD_POOL_SIZE 32から1だけを変更する', () => {
  const p = path.join(HERE, 'ios-real-engine-gate/patches/yaneuraou-v9.00-pthread-pool-size-1.patch');
  const s = read(p);
  assert.equal(sha(p), '4e1963c62afaed2e023304d11cb7c2736aca1c43db2c5bd585fb4477ee70d8f4');
  assert.match(s, /-\s*LDFLAGS \+= -s PTHREAD_POOL_SIZE=32/);
  assert.match(s, /\+\s*LDFLAGS \+= -s PTHREAD_POOL_SIZE=1/);
  const changed = s.split(/\r?\n/).filter(line => (/^[+-]/.test(line) && !/^(---|\+\+\+)/.test(line)));
  assert.equal(changed.length, 2);
  assert.ok(changed.every(line => line.includes('PTHREAD_POOL_SIZE')));
});

test('A5-E1 workflowは別artifactを生成しFormal release workflowを呼ばない', () => {
  const rootWorkflow = path.join(repoRoot, '.github/workflows/yaneuraou-ios-pool1-candidate.yml');
  const appWorkflow = path.join(HERE, '.github/workflows/yaneuraou-ios-pool1-candidate.yml');
  for (const p of [rootWorkflow, appWorkflow]) {
    const s = read(p);
    assert.match(s, /name: YaneuraOu iPhone Pool1 Candidate/);
    assert.match(s, /PTHREAD_POOL_SIZE=1 candidate/);
    assert.match(s, /name: yaneuraou-ios-pool1-candidate/);
    assert.match(s, /IOS_POOL1_CANDIDATE_METADATA\.json/);
    assert.match(s, /TARGET="\$APP_DIR\/minimal-real-usi\/runtime"/);
    assert.match(s, /rm -rf "\$TARGET"/);
    assert.match(s, /mkdir -p "\$TARGET"/);
    assert.doesNotMatch(s, /yaneuraou-final-formal-release/);
    assert.doesNotMatch(s, /RUN36_FORMAL_RELEASE_LOCK/);
  }
  assert.equal(read(rootWorkflow), read(appWorkflow));
});

test('A5-E1 build scriptはpool1以外の主要resource設定を固定しFormal engine directoryへ書かない', () => {
  const s = read(path.join(HERE, 'ios-real-engine-gate/build-ios-pool1-candidate.sh'));
  assert.match(s, /EXPECTED_POOL_PATCH_SHA="4e1963c62afaed2e023304d11cb7c2736aca1c43db2c5bd585fb4477ee70d8f4"/);
  assert.match(s, /EM_INITIAL_MEMORY_SIZE=92274688/);
  assert.match(s, /INITIAL_MEMORY=92274688/);
  assert.match(s, /STACK_SIZE=67108864/);
  assert.match(s, /runtime-candidate/);
  assert.match(s, /app-engine-baseline-before\.json/);
  assert.match(s, /app-engine-baseline-after\.json/);
  assert.match(s, /cmp \"\$EVIDENCE_DIR\/app-engine-baseline-before\.json\" \"\$EVIDENCE_DIR\/app-engine-baseline-after\.json\"/);
  assert.doesNotMatch(s, /cp .*\$APP_DIR\/engine\/yaneuraou\/yaneuraou\.material/);
});

test('SMARTPHONE_SAFEは引き続きThreads=1でA5-E1と一致する', () => {
  const s = read(path.join(HERE, 'EngineAnalysisSettings.js'));
  assert.match(s, /SMARTPHONE_SAFE:[\s\S]*?multiPv: 1, threads: 1, hashMB: 16/);
  const result = JSON.parse(read(path.join(HERE, 'PWA_RUN_A5_E1_RESULT.json')));
  assert.equal(result.controlledChange.baseline, 32);
  assert.equal(result.controlledChange.candidate, 1);
  assert.equal(result.unchanged.smartphoneSafeThreads, 1);
  assert.equal(result.formalStatus, 'NOT_FORMAL');
});
