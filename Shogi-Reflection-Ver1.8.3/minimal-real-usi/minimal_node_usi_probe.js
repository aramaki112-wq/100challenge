#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const RUNTIME = path.join(ROOT, 'runtime');
const JS_PATH = path.join(RUNTIME, 'yaneuraou.material.js');
const WASM_PATH = path.join(RUNTIME, 'yaneuraou.material.wasm');
const RESULT_PATH = path.join(ROOT, 'MINIMAL_NODE_USI_RESULT.json');
const TEXT_PATH = path.join(ROOT, 'MINIMAL_NODE_USI_RESULT.txt');

const startedAt = Date.now();
const lines = [];
const errors = [];
let instance = null;
let finished = false;
let timer = null;
let usiokAt = null;
let readyokAt = null;

function writeResult(status, passed, reason) {
  const result = {
    schemaVersion: 1,
    harness: 'YaneuraOu Minimal Real USI / Node',
    status,
    passed,
    reason,
    elapsedMs: Date.now() - startedAt,
    usiok: Boolean(usiokAt),
    readyok: Boolean(readyokAt),
    usiToUsiokMs: usiokAt ? usiokAt - startedAt : null,
    errors,
    tail: lines.slice(-100),
    node: process.version,
  };
  fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2) + '\n');
  fs.writeFileSync(TEXT_PATH, [
    'YaneuraOu Minimal Real USI Harness — Node',
    '=========================================',
    `Status: ${status}`,
    `Passed usi->usiok: ${passed}`,
    `ReadyOK observed: ${Boolean(readyokAt)}`,
    `Elapsed ms: ${result.elapsedMs}`,
    `Reason: ${reason}`,
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
  try { if (instance && typeof instance.terminate === 'function') instance.terminate(); } catch (e) {}
  writeResult(status, passed, reason);
  setTimeout(() => process.exit(exitCode), 50);
}

process.on('uncaughtException', (err) => {
  errors.push(String(err && err.stack ? err.stack : err));
  finish('NODE_RUNTIME_ERROR', false, 'Uncaught runtime error before a stable USI handshake.', 1);
});
process.on('unhandledRejection', (err) => {
  errors.push(String(err && err.stack ? err.stack : err));
  finish('NODE_RUNTIME_ERROR', false, 'Unhandled rejection before a stable USI handshake.', 1);
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
      instance.postMessage('isready');
    } else if (text === 'readyok' && !readyokAt) {
      readyokAt = Date.now();
      finish('PASS_USIOK_READYOK', true, 'Real Node harness observed usiok and readyok.', 0);
    }
  });
  instance.postMessage('usi');
  timer = setTimeout(() => {
    if (usiokAt) finish('PASS_USIOK_READYOK_TIMEOUT', true, 'usiok was observed; readyok timed out.', 0);
    else finish('USIOK_TIMEOUT', false, 'No usiok was observed before timeout.', 1);
  }, 30000);
})().catch((err) => {
  errors.push(String(err && err.stack ? err.stack : err));
  finish('MODULE_INIT_FAILED', false, 'Emscripten module initialization failed.', 1);
});
