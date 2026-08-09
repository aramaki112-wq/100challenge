import { Worker as NodeWorker } from "node:worker_threads";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Test-only adapter that gives BrowserWorkerUsiTransport a Web Worker-like API in Node. */
export class NodeWebWorkerTestShim {
  constructor(url) {
    const target = pathToFileURL(path.resolve(process.cwd(), String(url))).href;
    const bootstrap = `
      const { parentPort, workerData } = require("node:worker_threads");
      globalThis.self = globalThis;
      self.postMessage = (data) => parentPort.postMessage(data);
      self.addEventListener = (type, callback) => {
        if (type === "message") parentPort.on("message", (data) => callback({ data }));
      };
      self.close = () => process.exit(0);
      import(workerData.target);
    `;
    this.worker = new NodeWorker(bootstrap, { eval: true, workerData: { target } });
  }
  addEventListener(type, callback) {
    if (type === "message") this.worker.on("message", (data) => callback({ data }));
    if (type === "error") this.worker.on("error", (error) => callback({ message: error.message, error }));
  }
  postMessage(value) { this.worker.postMessage(value); }
  terminate() { return this.worker.terminate(); }
}
