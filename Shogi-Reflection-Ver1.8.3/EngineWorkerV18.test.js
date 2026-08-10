import test from "node:test";
import assert from "node:assert/strict";
import { BrowserWorkerUsiTransport } from "./BrowserWorkerUsiTransport.js";
import { NodeWebWorkerTestShim } from "./NodeWebWorkerTestShim.js";

async function handshake(transport) {
  await transport.start();
  transport.send("usi");
  const usi = await transport.waitFor((line) => line === "usiok", { timeoutMs: 2000 });
  transport.send("isready");
  await transport.waitFor((line) => line === "readyok", { timeoutMs: 2000 });
  return usi;
}

test("Worker start/message/result", async () => {
  const transport = new BrowserWorkerUsiTransport({ workerUrl: "./ReflectionLocalEngineWorker.js", WorkerClass: NodeWebWorkerTestShim });
  const lines = await handshake(transport);
  assert.ok(lines.some((line) => line.includes("id name Shogi Reflection Local Engine")));
  await transport.dispose();
});

test("Worker terminate後にrestartできる", async () => {
  const transport = new BrowserWorkerUsiTransport({ workerUrl: "./ReflectionLocalEngineWorker.js", WorkerClass: NodeWebWorkerTestShim });
  await handshake(transport);
  await transport.dispose();
  await handshake(transport);
  await transport.dispose();
});

test("Worker cancel/disposeは待機中Promiseをcancelする", async () => {
  const transport = new BrowserWorkerUsiTransport({ workerUrl: "./ReflectionLocalEngineWorker.js", WorkerClass: NodeWebWorkerTestShim });
  await transport.start();
  const waiting = transport.waitFor(() => false, { timeoutMs: 5000 });
  await transport.dispose();
  await assert.rejects(waiting, (error) => error.code === "ANALYSIS_CANCELLED");
});
