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

const POOL5_SHA = '8c1c829c9dcc7b3fdf82f93e8cdbefa3b93cbd4c0d987f43bf894589233acef1';
const STACK8_SHA = '5fcee573b4a0a898e747e303b6e003db8af99c901d63b15b88e88708057678d9';

test('A5-E6はPTHREAD_POOL_SIZEだけをA5-E5 baseline 4からcandidate 5へ変更する', () => {
  const poolPatch = path.join(HERE, 'ios-real-engine-pool5-stack8-gate/patches/yaneuraou-v9.00-pthread-pool-size-5.patch');
  const s = read(poolPatch);
  assert.equal(sha(poolPatch), POOL5_SHA);
  assert.match(s, /-\s*LDFLAGS \+= -s PTHREAD_POOL_SIZE=32/);
  assert.match(s, /\+\s*LDFLAGS \+= -s PTHREAD_POOL_SIZE=5/);
  const changed = s.split(/\r?\n/).filter(line => (/^[+-]/.test(line) && !/^(---|\+\+\+)/.test(line)));
  assert.equal(changed.length, 2);
  assert.ok(changed.every(line => line.includes('PTHREAD_POOL_SIZE')));
});

test('A5-E6はA5-E5と同じStack8 patchをそのまま保持する', () => {
  const stackPatch = path.join(HERE, 'ios-real-engine-stack8-gate/patches/yaneuraou-v9.00-stack-size-8m.patch');
  assert.equal(sha(stackPatch), STACK8_SHA);
  const s = read(stackPatch);
  assert.match(s, /\+\s*LDFLAGS \+= -s STACK_SIZE=8388608/);
});

test('A5-E6 workflowは別artifactを生成しFormal releaseを呼ばない', () => {
  const rootWorkflow = path.join(repoRoot, '.github/workflows/yaneuraou-ios-pool5-stack8-candidate.yml');
  const appWorkflow = path.join(HERE, '.github/workflows/yaneuraou-ios-pool5-stack8-candidate.yml');
  for (const p of [rootWorkflow, appWorkflow]) {
    const s = read(p);
    assert.match(s, /name: YaneuraOu iPhone Pool5 Stack8 Candidate/);
    assert.match(s, /Build iPhone Pool5 STACK_SIZE=8MiB candidate/);
    assert.match(s, /name: yaneuraou-ios-pool5-stack8-candidate/);
    assert.match(s, /IOS_POOL5_STACK8_CANDIDATE_METADATA\.json/);
    assert.match(s, /ios-real-engine-pool5-stack8-gate/);
    assert.doesNotMatch(s, /yaneuraou-final-formal-release/);
    assert.doesNotMatch(s, /RUN36_FORMAL_RELEASE_LOCK/);
  }
  assert.equal(read(rootWorkflow), read(appWorkflow));
});

test('A5-E6 build scriptはPool5だけを変更しStack8とInitial Memoryを固定する', () => {
  const s = read(path.join(HERE, 'ios-real-engine-pool5-stack8-gate/build-ios-pool5-stack8-candidate.sh'));
  assert.match(s, new RegExp(`EXPECTED_POOL_PATCH_SHA="${POOL5_SHA}"`));
  assert.match(s, new RegExp(`EXPECTED_STACK_PATCH_SHA="${STACK8_SHA}"`));
  assert.match(s, /PTHREAD_POOL_SIZE=5/);
  assert.match(s, /STACK_SIZE=8388608/);
  assert.match(s, /EM_INITIAL_MEMORY_SIZE=92274688/);
  assert.match(s, /INITIAL_MEMORY=92274688/);
  assert.match(s, /pthreadPoolSize!==5/);
  assert.match(s, /stackSize!==8388608/);
  assert.match(s, /app-engine-baseline-before\.json/);
  assert.match(s, /app-engine-baseline-after\.json/);
  assert.match(s, /cmp "\$EVIDENCE_DIR\/app-engine-baseline-before\.json" "\$EVIDENCE_DIR\/app-engine-baseline-after\.json"/);
  assert.doesNotMatch(s, /cp .*\$APP_DIR\/engine\/yaneuraou\/yaneuraou\.material/);
});

test('A5-E6 resultは一条件変更・NOT_FORMALを明示する', () => {
  const result = JSON.parse(read(path.join(HERE, 'PWA_RUN_A5_E6_RESULT.json')));
  assert.equal(result.controlledChange.setting, 'PTHREAD_POOL_SIZE');
  assert.equal(result.controlledChange.baseline, 4);
  assert.equal(result.controlledChange.candidate, 5);
  assert.equal(result.heldConstant.stackSizeBytes, 8388608);
  assert.equal(result.heldConstant.initialMemoryBytes, 92274688);
  assert.equal(result.heldConstant.smartphoneSafeThreads, 1);
  assert.equal(result.formalStatus, 'NOT_FORMAL');
  assert.equal(result.replacesRun36FormalRuntime, false);
});

test('SMARTPHONE_SAFEのUSI ThreadsはA5-E6でも1のまま', () => {
  const s = read(path.join(HERE, 'EngineAnalysisSettings.js'));
  assert.match(s, /SMARTPHONE_SAFE:[\s\S]*?multiPv: 1, threads: 1, hashMB: 16/);
});
