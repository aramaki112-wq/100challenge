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

test('A5-E2はA5-E1 Pool1を維持しSTACK_SIZEだけ64MiBから8MiBへ変更する', () => {
  const poolPatch = path.join(HERE, 'ios-real-engine-gate/patches/yaneuraou-v9.00-pthread-pool-size-1.patch');
  assert.equal(sha(poolPatch), '4e1963c62afaed2e023304d11cb7c2736aca1c43db2c5bd585fb4477ee70d8f4');
  const stackPatch = path.join(HERE, 'ios-real-engine-stack8-gate/patches/yaneuraou-v9.00-stack-size-8m.patch');
  const s = read(stackPatch);
  assert.equal(sha(stackPatch), '5fcee573b4a0a898e747e303b6e003db8af99c901d63b15b88e88708057678d9');
  assert.match(s, /-\s*LDFLAGS \+= -s STACK_SIZE=67108864/);
  assert.match(s, /\+\s*LDFLAGS \+= -s STACK_SIZE=8388608/);
  const changed = s.split(/\r?\n/).filter(line => (/^[+-]/.test(line) && !/^(---|\+\+\+)/.test(line)));
  assert.equal(changed.length, 2);
  assert.ok(changed.every(line => line.includes('STACK_SIZE')));
});

test('A5-E2 workflowは別artifactを生成しFormal releaseを呼ばない', () => {
  const rootWorkflow = path.join(repoRoot, '.github/workflows/yaneuraou-ios-pool1-stack8-candidate.yml');
  const appWorkflow = path.join(HERE, '.github/workflows/yaneuraou-ios-pool1-stack8-candidate.yml');
  for (const p of [rootWorkflow, appWorkflow]) {
    const s = read(p);
    assert.match(s, /name: YaneuraOu iPhone Pool1 Stack8 Candidate/);
    assert.match(s, /STACK_SIZE=8MiB candidate/);
    assert.match(s, /name: yaneuraou-ios-pool1-stack8-candidate/);
    assert.match(s, /IOS_POOL1_STACK8_CANDIDATE_METADATA\.json/);
    assert.match(s, /rm -rf "\$TARGET"/);
    assert.match(s, /mkdir -p "\$TARGET"/);
    assert.doesNotMatch(s, /yaneuraou-final-formal-release/);
    assert.doesNotMatch(s, /RUN36_FORMAL_RELEASE_LOCK/);
  }
  assert.equal(read(rootWorkflow), read(appWorkflow));
});

test('A5-E2 build scriptはPool1とInitial Memoryを固定しStack8だけを要求する', () => {
  const s = read(path.join(HERE, 'ios-real-engine-stack8-gate/build-ios-pool1-stack8-candidate.sh'));
  assert.match(s, /EXPECTED_POOL_PATCH_SHA="4e1963c62afaed2e023304d11cb7c2736aca1c43db2c5bd585fb4477ee70d8f4"/);
  assert.match(s, /EXPECTED_STACK_PATCH_SHA="5fcee573b4a0a898e747e303b6e003db8af99c901d63b15b88e88708057678d9"/);
  assert.match(s, /EM_INITIAL_MEMORY_SIZE=92274688/);
  assert.match(s, /PTHREAD_POOL_SIZE=1/);
  assert.match(s, /INITIAL_MEMORY=92274688/);
  assert.match(s, /STACK_SIZE=8388608/);
  assert.match(s, /app-engine-baseline-before\.json/);
  assert.match(s, /app-engine-baseline-after\.json/);
  assert.match(s, /cmp "\$EVIDENCE_DIR\/app-engine-baseline-before\.json" "\$EVIDENCE_DIR\/app-engine-baseline-after\.json"/);
  assert.doesNotMatch(s, /cp .*\$APP_DIR\/engine\/yaneuraou\/yaneuraou\.material/);
});

test('A5-E2 resultは一条件変更・NOT_FORMALを明示する', () => {
  const result = JSON.parse(read(path.join(HERE, 'PWA_RUN_A5_E2_RESULT.json')));
  assert.equal(result.controlledChange.setting, 'STACK_SIZE');
  assert.equal(result.controlledChange.baselineBytes, 67108864);
  assert.equal(result.controlledChange.candidateBytes, 8388608);
  assert.equal(result.heldConstant.pthreadPoolSize, 1);
  assert.equal(result.heldConstant.initialMemoryBytes, 92274688);
  assert.equal(result.heldConstant.smartphoneSafeThreads, 1);
  assert.equal(result.formalStatus, 'NOT_FORMAL');
  assert.equal(result.replacesRun36FormalRuntime, false);
});

test('SMARTPHONE_SAFEはA5-E2でもThreads=1のまま', () => {
  const s = read(path.join(HERE, 'EngineAnalysisSettings.js'));
  assert.match(s, /SMARTPHONE_SAFE:[\s\S]*?multiPv: 1, threads: 1, hashMB: 16/);
});
