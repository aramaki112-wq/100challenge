#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const RUNTIME = path.join(ROOT, 'runtime');
const JS_PATH = path.join(RUNTIME, 'yaneuraou.material.cjs');
const WASM_PATH = path.join(RUNTIME, 'yaneuraou.material.wasm');
const RESULT_PATH = path.join(ROOT, 'MINIMAL_NODE_SEARCH_RESULT.json');
const TEXT_PATH = path.join(ROOT, 'MINIMAL_NODE_SEARCH_RESULT.txt');

const startedAt = Date.now();
const lines = [];
const errors = [];
const infoLines = [];
let instance = null;
let finished = false;
let timer = null;
let usiokAt = null;
let readyokAt = null;
let searchStartedAt = null;
let bestmoveAt = null;
let bestmove = '';
let ponder = '';

function parseInfo(line) {
  const result = {line};
  let m;
  if ((m = line.match(/\bdepth\s+(\d+)/))) result.depth = Number(m[1]);
  if ((m = line.match(/\bnodes\s+(\d+)/))) result.nodes = Number(m[1]);
  if ((m = line.match(/\btime\s+(\d+)/))) result.timeMs = Number(m[1]);
  if ((m = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/))) {
    result.scoreType = m[1];
    result.score = Number(m[2]);
  }
  if ((m = line.match(/\bpv\s+(.+)$/))) result.pv = m[1].trim();
  return result;
}

function chooseEvidence() {
  const parsed = infoLines.map(parseInfo);
  const complete = parsed.filter(x =>
    Number.isFinite(x.depth) &&
    Number.isFinite(x.nodes) &&
    Number.isFinite(x.timeMs) &&
    (x.scoreType === 'cp' || x.scoreType === 'mate') &&
    typeof x.pv === 'string' && x.pv.length > 0
  );
  return complete.at(-1) || parsed.at(-1) || null;
}

function writeResult(status, passed, reason) {
  const evidence = chooseEvidence();
  const result = {
    schemaVersion: 1,
    harness: 'YaneuraOu Minimal Real Search / Node',
    status,
    passed,
    reason,
    elapsedMs: Date.now() - startedAt,
    command: 'go nodes 5000',
    usiok: Boolean(usiokAt),
    readyok: Boolean(readyokAt),
    searchStarted: Boolean(searchStartedAt),
    infoCount: infoLines.length,
    scoreObserved: Boolean(evidence && (evidence.scoreType === 'cp' || evidence.scoreType === 'mate')),
    depthObserved: Boolean(evidence && Number.isFinite(evidence.depth)),
    nodesObserved: Boolean(evidence && Number.isFinite(evidence.nodes)),
    timeObserved: Boolean(evidence && Number.isFinite(evidence.timeMs)),
    pvObserved: Boolean(evidence && typeof evidence.pv === 'string' && evidence.pv.length > 0),
    bestmoveObserved: Boolean(bestmove),
    bestmove,
    ponder,
    infoEvidence: evidence,
    usiToUsiokMs: usiokAt ? usiokAt - startedAt : null,
    readyToBestmoveMs: bestmoveAt && readyokAt ? bestmoveAt - readyokAt : null,
    searchMs: bestmoveAt && searchStartedAt ? bestmoveAt - searchStartedAt : null,
    errors,
    tail: lines.slice(-120),
    node: process.version,
  };
  fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2) + '\n');
  fs.writeFileSync(TEXT_PATH, [
    'YaneuraOu Minimal Real Search Harness — Node',
    '=============================================',
    `Status: ${status}`,
    `Passed: ${passed}`,
    `Reason: ${reason}`,
    `usiok: ${result.usiok}`,
    `readyok: ${result.readyok}`,
    `infoCount: ${result.infoCount}`,
    `scoreObserved: ${result.scoreObserved}`,
    `depthObserved: ${result.depthObserved}`,
    `nodesObserved: ${result.nodesObserved}`,
    `timeObserved: ${result.timeObserved}`,
    `pvObserved: ${result.pvObserved}`,
    `bestmove: ${result.bestmove || '(none)'}`,
    `ponder: ${result.ponder || '(none)'}`,
    `searchMs: ${result.searchMs ?? '(unknown)'}`,
    '',
    'Info evidence:',
    JSON.stringify(result.infoEvidence, null, 2),
    '',
    'Errors:',
    ...(errors.length ? errors : ['(none)']),
    '',
    'Tail:',
    ...result.tail,
    '',
  ].join('\n'));
}

function finish(status, passed, reason, exitCode) {
  if (finished) return;
  finished = true;
  if (timer) clearTimeout(timer);
  try { if (instance && typeof instance.postMessage === 'function') instance.postMessage('quit'); } catch (_) {}
  setTimeout(() => {
    try { if (instance && typeof instance.terminate === 'function') instance.terminate(); } catch (_) {}
    writeResult(status, passed, reason);
    process.exit(exitCode);
  }, 50);
}

function hasCompleteEvidence() {
  const e = chooseEvidence();
  return Boolean(
    usiokAt && readyokAt && bestmove &&
    e &&
    (e.scoreType === 'cp' || e.scoreType === 'mate') &&
    Number.isFinite(e.depth) && e.depth > 0 &&
    Number.isFinite(e.nodes) && e.nodes > 0 &&
    Number.isFinite(e.timeMs) && e.timeMs >= 0 &&
    typeof e.pv === 'string' && e.pv.length > 0
  );
}

process.on('uncaughtException', (err) => {
  errors.push(String(err && err.stack ? err.stack : err));
  finish('NODE_RUNTIME_ERROR', false, 'Uncaught runtime error during minimal search.', 1);
});
process.on('unhandledRejection', (err) => {
  errors.push(String(err && err.stack ? err.stack : err));
  finish('NODE_RUNTIME_ERROR', false, 'Unhandled rejection during minimal search.', 1);
});

(async () => {
  if (!fs.existsSync(JS_PATH) || !fs.existsSync(WASM_PATH)) {
    return finish('ASSET_MISSING', false, 'Minimal runtime JS/WASM asset is missing.', 2);
  }

  const YaneuraOu = require(JS_PATH);
  const wasmBinary = fs.readFileSync(WASM_PATH);
  instance = await YaneuraOu({
    wasmBinary,
    printErr: (line) => errors.push(`printErr: ${String(line)}`),
  });

  if (typeof instance.addMessageListener !== 'function' || typeof instance.postMessage !== 'function') {
    return finish('BRIDGE_MISSING', false, 'wasm_pre.js message bridge is unavailable.', 3);
  }

  instance.addMessageListener((line) => {
    const text = String(line);
    lines.push(text);

    if (text === 'usiok' && !usiokAt) {
      usiokAt = Date.now();
      instance.postMessage('setoption name Threads value 1');
      instance.postMessage('setoption name USI_Hash value 64');
      instance.postMessage('setoption name USI_OwnBook value false');
      instance.postMessage('isready');
      return;
    }

    if (text === 'readyok' && !readyokAt) {
      readyokAt = Date.now();
      instance.postMessage('usinewgame');
      instance.postMessage('position startpos');
      searchStartedAt = Date.now();
      instance.postMessage('go nodes 5000');
      return;
    }

    if (text.startsWith('info ')) {
      infoLines.push(text);
      return;
    }

    if (text.startsWith('bestmove ') && !bestmoveAt) {
      bestmoveAt = Date.now();
      const parts = text.trim().split(/\s+/);
      bestmove = parts[1] || '';
      const ponderIndex = parts.indexOf('ponder');
      if (ponderIndex >= 0 && parts[ponderIndex + 1]) ponder = parts[ponderIndex + 1];
      if (hasCompleteEvidence()) {
        finish('PASS_MINIMAL_SEARCH', true, 'Real Node harness observed info metrics, PV and bestmove.', 0);
      } else {
        finish('INCOMPLETE_SEARCH_EVIDENCE', false, 'bestmove arrived without complete info/score/depth/nodes/time/pv evidence.', 1);
      }
    }
  });

  instance.postMessage('usi');
  timer = setTimeout(() => {
    try { if (searchStartedAt) instance.postMessage('stop'); } catch (_) {}
    finish('SEARCH_TIMEOUT', false, 'Minimal Real Search did not produce complete evidence before timeout.', 1);
  }, 30000);
})().catch((err) => {
  errors.push(String(err && err.stack ? err.stack : err));
  finish('MODULE_INIT_FAILED', false, 'Emscripten module initialization failed.', 1);
});
