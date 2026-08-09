import test from "node:test";
import assert from "node:assert/strict";
import { BrowserWorkerUsiTransport } from "./BrowserWorkerUsiTransport.js";
import { NodeWebWorkerTestShim } from "./NodeWebWorkerTestShim.js";

const INITIAL_SFEN = "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";
const SENTE_ROOK_UP_BLACK_TO_MOVE = "4k4/9/9/9/9/9/9/9/K7R b - 1";
const SENTE_ROOK_UP_WHITE_TO_MOVE = "4k4/9/9/9/9/9/9/9/K7R w - 1";
// White king on 1a is checked by the rook on 1b. Gold on 2b protects 1b/2a;
// rook protects 2b. White has no legal escape, so this is a mate-against sanity fixture.
const WHITE_MATED_SFEN = "8k/7GR/9/9/9/9/9/9/K8 w - 1";

async function createTransport() {
  const transport = new BrowserWorkerUsiTransport({
    workerUrl: "./ReflectionLocalEngineWorker.js",
    WorkerClass: NodeWebWorkerTestShim
  });
  await transport.start();
  transport.send("usi");
  await transport.waitFor((line) => line === "usiok", { timeoutMs: 2000 });
  transport.send("isready");
  await transport.waitFor((line) => line === "readyok", { timeoutMs: 2000 });
  return transport;
}

async function analyzeRaw(transport, sfen) {
  transport.send(`position sfen ${sfen}`);
  transport.send("go movetime 80 nodes 900");
  return transport.waitFor((line) => line.startsWith("bestmove "), { timeoutMs: 3000 });
}

function primaryScoreLine(lines) {
  return lines.find((line) => /^info .*multipv 1 score /.test(line));
}

function cpValue(line) {
  const match = String(line).match(/ score cp (-?\d+)/);
  return match ? Number(match[1]) : null;
}

test("Real Engine Evaluation Sanity: 初期局面は有限CPとして返る", async () => {
  const transport = await createTransport();
  try {
    const lines = await analyzeRaw(transport, INITIAL_SFEN);
    const line = primaryScoreLine(lines);
    assert.match(line, / score cp -?\d+/);
    assert.ok(Number.isFinite(cpValue(line)));
  } finally {
    await transport.dispose();
  }
});

test("Real Engine Evaluation Sanity: 明確な駒得/駒損でside-to-move視点の符号が反転する", async () => {
  const transport = await createTransport();
  try {
    const blackLines = await analyzeRaw(transport, SENTE_ROOK_UP_BLACK_TO_MOVE);
    const whiteLines = await analyzeRaw(transport, SENTE_ROOK_UP_WHITE_TO_MOVE);
    const blackCp = cpValue(primaryScoreLine(blackLines));
    const whiteCp = cpValue(primaryScoreLine(whiteLines));
    assert.ok(blackCp > 0, `black-to-move CP should be positive, got ${blackCp}`);
    assert.ok(whiteCp < 0, `white-to-move CP should be negative, got ${whiteCp}`);
  } finally {
    await transport.dispose();
  }
});

test("Real Engine Evaluation Sanity: 詰み局面はCPへ潰さずmateとして返る", async () => {
  const transport = await createTransport();
  try {
    const lines = await analyzeRaw(transport, WHITE_MATED_SFEN);
    const line = primaryScoreLine(lines);
    assert.match(line, / score mate -1 /);
    assert.ok(lines.some((entry) => entry === "bestmove resign"));
  } finally {
    await transport.dispose();
  }
});
