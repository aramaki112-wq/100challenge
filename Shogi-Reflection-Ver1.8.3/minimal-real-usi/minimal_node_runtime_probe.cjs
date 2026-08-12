#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const RUNTIME = path.join(ROOT, 'runtime');
const JS_PATH = path.join(RUNTIME, 'yaneuraou.material.cjs');
const WASM_PATH = path.join(RUNTIME, 'yaneuraou.material.wasm');
const RESULT_PATH = path.join(ROOT, 'MINIMAL_NODE_RUNTIME_RESULT.json');
const TEXT_PATH = path.join(ROOT, 'MINIMAL_NODE_RUNTIME_RESULT.txt');

const MATE_SFEN = 'l6nl/6k2/+P3p2p1/1B1p1Pp1p/1p7/7nP/3P1SP1L/2+p3GK1/L6+r1 b B2G2S5Prgs2np 0';
const startedAt = Date.now();
const lines = [];
const errors = [];
let instance = null;
let timer = null;
let finished = false;
let phase = 'handshake';
let optionMultiPV = false;
let usiok = false;
let readyok = false;
let stopScheduled = false;
let stopSentAt = null;
let quitSent = false;

const evidence = {
  multipv: { infoCount:0, ids:new Set(), bestmove:'', ponder:'', score:false, depth:false, nodes:false, time:false, pv:false },
  stop: { infoCount:0, bestmove:'', responseMs:null },
  reanalysis: { infoCount:0, bestmove:'', score:false, depth:false, nodes:false, time:false, pv:false },
  mate: { infoCount:0, mateObserved:false, mateScore:null, bestmove:'', pv:'' },
};

function parseInfo(line) {
  const out = {line};
  let m;
  if ((m = line.match(/\bmultipv\s+(\d+)/))) out.multipv = Number(m[1]);
  if ((m = line.match(/\bdepth\s+(\d+)/))) out.depth = Number(m[1]);
  if ((m = line.match(/\bnodes\s+(\d+)/))) out.nodes = Number(m[1]);
  if ((m = line.match(/\btime\s+(\d+)/))) out.timeMs = Number(m[1]);
  if ((m = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/))) { out.scoreType=m[1]; out.score=Number(m[2]); }
  if ((m = line.match(/\bpv\s+(.+)$/))) out.pv = m[1].trim();
  return out;
}

function send(command) {
  if (!instance || typeof instance.postMessage !== 'function') throw new Error('USI bridge unavailable');
  lines.push(`> ${command}`);
  instance.postMessage(command);
}

function bestmoveFrom(line) {
  const parts = line.trim().split(/\s+/);
  const bestmove = parts[1] || '';
  const ponderIndex = parts.indexOf('ponder');
  return {bestmove, ponder: ponderIndex >= 0 ? (parts[ponderIndex + 1] || '') : ''};
}

function resultObject(status, passed, reason) {
  return {
    schemaVersion: 1,
    harness: 'YaneuraOu Minimal Runtime Gate / Node',
    status, passed, reason,
    elapsedMs: Date.now() - startedAt,
    optionMultiPV,
    usiok, readyok,
    multipv: {
      infoCount: evidence.multipv.infoCount,
      ids: [...evidence.multipv.ids].sort(),
      multipv1: evidence.multipv.ids.has(1),
      multipv2: evidence.multipv.ids.has(2),
      bestmove: evidence.multipv.bestmove,
      ponder: evidence.multipv.ponder,
      scoreObserved: evidence.multipv.score,
      depthObserved: evidence.multipv.depth,
      nodesObserved: evidence.multipv.nodes,
      timeObserved: evidence.multipv.time,
      pvObserved: evidence.multipv.pv,
    },
    stop: evidence.stop,
    reanalysis: evidence.reanalysis,
    mate: evidence.mate,
    quitSent,
    errors,
    tail: lines.slice(-180),
    node: process.version,
  };
}

function writeResult(status, passed, reason) {
  const r = resultObject(status, passed, reason);
  fs.writeFileSync(RESULT_PATH, JSON.stringify(r, null, 2) + '\n');
  fs.writeFileSync(TEXT_PATH, [
    'YaneuraOu Minimal Runtime Gate — Node',
    '======================================',
    `Status: ${status}`,
    `Passed: ${passed}`,
    `Reason: ${reason}`,
    `MultiPV option: ${r.optionMultiPV}`,
    `usiok: ${r.usiok}`,
    `readyok: ${r.readyok}`,
    `MultiPV ids: ${r.multipv.ids.join(',')}`,
    `MultiPV bestmove: ${r.multipv.bestmove || '(none)'}`,
    `stop bestmove: ${r.stop.bestmove || '(none)'}`,
    `stop response ms: ${r.stop.responseMs ?? '(unknown)'}`,
    `reanalysis bestmove: ${r.reanalysis.bestmove || '(none)'}`,
    `mate observed: ${r.mate.mateObserved}`,
    `mate score: ${r.mate.mateScore ?? '(none)'}`,
    `mate bestmove: ${r.mate.bestmove || '(none)'}`,
    `quit sent: ${r.quitSent}`,
    '', 'Errors:', ...(r.errors.length ? r.errors : ['(none)']),
    '', 'Tail:', ...r.tail, ''
  ].join('\n'));
}

function acceptance() {
  return Boolean(
    optionMultiPV && usiok && readyok &&
    evidence.multipv.ids.has(1) && evidence.multipv.ids.has(2) && evidence.multipv.bestmove &&
    evidence.multipv.score && evidence.multipv.depth && evidence.multipv.nodes && evidence.multipv.time && evidence.multipv.pv &&
    evidence.stop.infoCount > 0 && evidence.stop.bestmove && Number.isFinite(evidence.stop.responseMs) && evidence.stop.responseMs >= 0 &&
    evidence.reanalysis.infoCount > 0 && evidence.reanalysis.bestmove && evidence.reanalysis.score && evidence.reanalysis.depth && evidence.reanalysis.nodes && evidence.reanalysis.time && evidence.reanalysis.pv &&
    evidence.mate.infoCount > 0 && evidence.mate.mateObserved && evidence.mate.bestmove && evidence.mate.pv &&
    quitSent && errors.length === 0
  );
}

function finish(status, passed, reason, exitCode) {
  if (finished) return;
  finished = true;
  if (timer) clearTimeout(timer);
  try {
    if (!quitSent && instance) { quitSent = true; send('quit'); }
  } catch (e) { errors.push(`quit: ${e.stack || e}`); }
  setTimeout(() => {
    try { if (instance && typeof instance.terminate === 'function') instance.terminate(); } catch (_) {}
    writeResult(status, passed, reason);
    process.exit(exitCode);
  }, 120);
}

function failRuntime(err, reason='Runtime failure') {
  errors.push(String(err && err.stack ? err.stack : err));
  finish('RUNTIME_ERROR', false, reason, 1);
}
process.on('uncaughtException', (e) => failRuntime(e, 'Uncaught runtime error'));
process.on('unhandledRejection', (e) => failRuntime(e, 'Unhandled rejection'));

(async () => {
  if (!fs.existsSync(JS_PATH) || !fs.existsSync(WASM_PATH)) return finish('ASSET_MISSING', false, 'Runtime JS/WASM missing', 2);
  const YaneuraOu = require(JS_PATH);
  const wasmBinary = fs.readFileSync(WASM_PATH);
  instance = await YaneuraOu({ wasmBinary, printErr: (line) => errors.push(`printErr: ${String(line)}`) });
  if (typeof instance.addMessageListener !== 'function' || typeof instance.postMessage !== 'function') {
    return finish('BRIDGE_MISSING', false, 'wasm_pre.js bridge unavailable', 3);
  }

  instance.addMessageListener((raw) => {
    const line = String(raw);
    lines.push(line);
    if (line.startsWith('option name MultiPV ')) optionMultiPV = true;

    if (line === 'usiok' && !usiok) {
      usiok = true;
      send('setoption name Threads value 1');
      send('setoption name USI_Hash value 64');
      send('setoption name USI_OwnBook value false');
      send('setoption name MultiPV value 2');
      send('isready');
      return;
    }
    if (line === 'readyok' && !readyok) {
      readyok = true;
      send('usinewgame');
      phase = 'multipv';
      send('position startpos');
      send('go nodes 8000');
      return;
    }

    if (line.startsWith('info ')) {
      const info = parseInfo(line);
      if (phase === 'multipv') {
        evidence.multipv.infoCount++;
        if (Number.isFinite(info.multipv)) evidence.multipv.ids.add(info.multipv);
        if (info.scoreType) evidence.multipv.score = true;
        if (Number.isFinite(info.depth)) evidence.multipv.depth = true;
        if (Number.isFinite(info.nodes)) evidence.multipv.nodes = true;
        if (Number.isFinite(info.timeMs)) evidence.multipv.time = true;
        if (info.pv) evidence.multipv.pv = true;
      } else if (phase === 'stop') {
        evidence.stop.infoCount++;
        if (!stopScheduled) {
          stopScheduled = true;
          setTimeout(() => { stopSentAt = Date.now(); send('stop'); }, 80);
        }
      } else if (phase === 'reanalysis') {
        evidence.reanalysis.infoCount++;
        if (info.scoreType) evidence.reanalysis.score = true;
        if (Number.isFinite(info.depth)) evidence.reanalysis.depth = true;
        if (Number.isFinite(info.nodes)) evidence.reanalysis.nodes = true;
        if (Number.isFinite(info.timeMs)) evidence.reanalysis.time = true;
        if (info.pv) evidence.reanalysis.pv = true;
      } else if (phase === 'mate') {
        evidence.mate.infoCount++;
        if (info.scoreType === 'mate') {
          evidence.mate.mateObserved = true;
          evidence.mate.mateScore = info.score;
          if (info.pv) evidence.mate.pv = info.pv;
        }
      }
      return;
    }

    if (line.startsWith('bestmove ')) {
      const bm = bestmoveFrom(line);
      if (phase === 'multipv') {
        evidence.multipv.bestmove = bm.bestmove;
        evidence.multipv.ponder = bm.ponder;
        phase = 'stop';
        send('position startpos');
        send('go infinite');
        return;
      }
      if (phase === 'stop') {
        evidence.stop.bestmove = bm.bestmove;
        evidence.stop.responseMs = stopSentAt ? Date.now() - stopSentAt : null;
        phase = 'reanalysis';
        send('position startpos moves 7g7f 3c3d');
        send('go nodes 5000');
        return;
      }
      if (phase === 'reanalysis') {
        evidence.reanalysis.bestmove = bm.bestmove;
        phase = 'mate';
        send('setoption name MultiPV value 1');
        send(`position sfen ${MATE_SFEN}`);
        send('go nodes 200000');
        return;
      }
      if (phase === 'mate') {
        evidence.mate.bestmove = bm.bestmove;
        quitSent = true;
        send('quit');
        phase = 'quit';
        setTimeout(() => {
          const ok = acceptance();
          finish(ok ? 'PASS_MINIMAL_RUNTIME' : 'INCOMPLETE_RUNTIME_EVIDENCE', ok,
            ok ? 'MultiPV, stop, reanalysis, mate-score and quit evidence observed.' : 'Runtime phase completed without all required evidence.',
            ok ? 0 : 1);
        }, 120);
      }
    }
  });

  send('usi');
  timer = setTimeout(() => {
    try { if (phase === 'stop') send('stop'); } catch (_) {}
    finish('RUNTIME_TIMEOUT', false, `Minimal runtime gate timed out in phase ${phase}.`, 1);
  }, 30000);
})().catch((e) => failRuntime(e, 'Module initialization failed'));
