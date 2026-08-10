import { spawn } from "node:child_process";
import path from "node:path";
import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";

export class NodeChildProcessUsiTransport {
  constructor({ executablePath, cwd = null, spawnFunction = spawn } = {}) {
    const executable = String(executablePath ?? "").trim();
    if (!executable || !path.isAbsolute(executable)) throw new TypeError("Engine executablePathは絶対Pathで指定してください。");
    this.executablePath = executable;
    this.cwd = cwd ? path.resolve(cwd) : path.dirname(executable);
    this.spawnFunction = spawnFunction;
    this.process = null;
    this.waiters = new Set();
  }

  async start() {
    if (this.process) return;
    this.process = this.spawnFunction(this.executablePath, [], { cwd: this.cwd, shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let buffer = "";
    this.process.stdout.setEncoding("utf8");
    this.process.stdout.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) this.#accept(line);
    });
    this.process.on("error", (error) => this.#failAll(new EngineAnalysisError(ENGINE_ERROR_CODES.ENGINE_CRASH, "", { cause: error })));
    this.process.on("exit", (code) => {
      if (code !== 0 && this.waiters.size) this.#failAll(new EngineAnalysisError(ENGINE_ERROR_CODES.ENGINE_CRASH, `Engine exited with code ${code}`));
    });
  }

  #accept(line) {
    for (const waiter of [...this.waiters]) {
      waiter.collected.push(line);
      if (waiter.predicate(line)) {
        clearTimeout(waiter.timer);
        this.waiters.delete(waiter);
        waiter.resolve([...waiter.collected]);
      }
    }
  }

  #failAll(error) {
    for (const waiter of this.waiters) { clearTimeout(waiter.timer); waiter.reject(error); }
    this.waiters.clear();
  }

  send(command) {
    if (!this.process?.stdin?.writable) throw new EngineAnalysisError(ENGINE_ERROR_CODES.ENGINE_CRASH);
    this.process.stdin.write(`${String(command)}\n`);
  }

  waitFor(predicate, { timeoutMs = 30000, signal = null } = {}) {
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, reject, collected: [] };
      waiter.timer = setTimeout(() => {
        this.waiters.delete(waiter);
        reject(new EngineAnalysisError(ENGINE_ERROR_CODES.TIMEOUT));
      }, timeoutMs);
      if (signal) signal.addEventListener("abort", () => {
        clearTimeout(waiter.timer); this.waiters.delete(waiter); reject(new EngineAnalysisError(ENGINE_ERROR_CODES.ANALYSIS_CANCELLED));
      }, { once: true });
      this.waiters.add(waiter);
    });
  }

  async dispose() {
    if (!this.process) return;
    if (!this.process.killed) this.process.kill();
    this.process = null;
  }
}
