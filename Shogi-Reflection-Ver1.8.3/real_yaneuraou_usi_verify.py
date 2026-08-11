from __future__ import annotations

import hashlib
import json
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / "engine" / "yaneuraou" / "engine-manifest.json"
METADATA_PATH = ROOT / "ENGINE_BUILD_METADATA.json"
RESULT_JSON = ROOT / "REAL_YANEURAOU_USI_RESULT.json"
RESULT_TXT = ROOT / "ENGINE_REAL_USI_RESULT.txt"

PROTOCOL_CHECKS = [
    "usi", "usiok", "isready", "readyok", "usinewgame", "position", "go", "info",
    "cp", "mate", "pv", "multipv", "depth", "nodes", "time", "bestmove", "stop", "quit",
    "evaluationSanityInitial", "evaluationSanityMaterialGain", "evaluationSanityMaterialLoss",
    "evaluationSanityAdvantage", "evaluationSanityDisadvantage", "evaluationSanityMate",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_result(*, passed: bool, status: str, wasm_sha256: str | None, checks: dict[str, bool], reason: str, observations=None) -> None:
    payload = {
        "schemaVersion": 1,
        "verifier": "real_yaneuraou_usi_verify.py",
        "passed": bool(passed),
        "status": status,
        "wasmSha256": wasm_sha256,
        "checks": {name: bool(checks.get(name, False)) for name in PROTOCOL_CHECKS},
        "reason": reason,
        "observations": observations or {},
    }
    RESULT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "Shogi Reflection Ver.1.8.3 Real YaneuraOu USI Verification",
        "========================================================",
        f"Status: {status}",
        f"Passed: {str(bool(passed)).lower()}",
        f"WASM SHA-256: {wasm_sha256 or 'NOT AVAILABLE'}",
        f"Reason: {reason}",
        "",
    ]
    for name in PROTOCOL_CHECKS:
        lines.append(f"[{'PASS' if checks.get(name) else 'FAIL'}] {name}")
    if observations:
        lines.extend(["", "Observed values:", json.dumps(observations, ensure_ascii=False, indent=2)])
    RESULT_TXT.write_text("\n".join(lines) + "\n", encoding="utf-8")


manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
engine_dir = MANIFEST_PATH.parent
checks: dict[str, bool] = {name: False for name in PROTOCOL_CHECKS}

actual_names = {
    "js": metadata.get("jsFile"),
    "wasm": metadata.get("wasmFile"),
    "worker": metadata.get("workerFile"),
    "workerBootstrap": metadata.get("workerBootstrapFile"),
}

allow_diagnostic = os.environ.get("YANEURAOU_ALLOW_DIAGNOSTIC_ARTIFACT") == "1"
diagnostic_build = metadata.get("diagnosticBuild") is True
artifact_runtime_allowed = metadata.get("measured") is True or (allow_diagnostic and diagnostic_build)

if manifest.get("available") is not True or artifact_runtime_allowed is not True:
    reason = (
        f"manifest.available={manifest.get('available')}; metadata.measured={metadata.get('measured')}; "
        f"metadata.diagnosticBuild={diagnostic_build}; allowDiagnostic={allow_diagnostic}. "
        "A measured formal artifact, or an explicitly allowed diagnostic artifact, is required before Real USI evidence can be produced."
    )
    write_result(passed=False, status="NOT_RUN_REAL_WASM_ASSET_UNAVAILABLE", wasm_sha256=None, checks=checks, reason=reason)
    print(reason)
    raise SystemExit(2)

if metadata.get("pthreadWorkerPackaging") != "SEPARATE_PTHREAD_WORKER" or metadata.get("generatedPthreadWorkerCount") != 1:
    reason = (
        f"Unexpected pthread packaging for pinned upstream-compatible Emscripten 3.1.43: "
        f"packaging={metadata.get('pthreadWorkerPackaging')}, count={metadata.get('generatedPthreadWorkerCount')}."
    )
    write_result(passed=False, status="NOT_RUN_PTHREAD_PACKAGING_MISMATCH", wasm_sha256=metadata.get("wasmSha256"), checks=checks, reason=reason)
    print(reason)
    raise SystemExit(2)
if not metadata.get("workerFile") or not metadata.get("workerSha256") or not manifest.get("pthreadWorkerUrl"):
    reason = "The official Emscripten 3.1.43 material build requires one measured separate pthread worker asset."
    write_result(passed=False, status="NOT_RUN_PTHREAD_PACKAGING_MISMATCH", wasm_sha256=metadata.get("wasmSha256"), checks=checks, reason=reason)
    print(reason)
    raise SystemExit(2)

missing_names = [kind for kind, name in actual_names.items() if not name]
def asset_path(kind: str, name: str) -> Path:
    return (ROOT / name) if kind == "workerBootstrap" else (engine_dir / name)

missing_files = [str(name) for kind, name in actual_names.items() if name and not asset_path(kind, name).is_file()]
if missing_names or missing_files:
    reason = f"Build metadata/output mismatch. Missing names={missing_names}; missing files={missing_files}."
    write_result(passed=False, status="NOT_RUN_REAL_WASM_ASSET_UNAVAILABLE", wasm_sha256=None, checks=checks, reason=reason)
    print(reason)
    raise SystemExit(2)

for kind, field in [("js", "jsSha256"), ("wasm", "wasmSha256"), ("worker", "workerSha256"), ("workerBootstrap", "workerBootstrapSha256")]:
    name = actual_names[kind]
    actual = sha256(asset_path(kind, name))
    expected_metadata = metadata.get(field)
    expected_manifest = manifest.get(field)
    if not expected_metadata or not expected_manifest or actual != expected_metadata or actual != expected_manifest:
        reason = (
            f"{kind} SHA-256 mismatch for {name}: actual={actual}, "
            f"metadata={expected_metadata}, manifest={expected_manifest}."
        )
        write_result(passed=False, status="HASH_MISMATCH", wasm_sha256=metadata.get("wasmSha256"), checks=checks, reason=reason)
        print(reason)
        raise SystemExit(3)


class IsolatedHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


server = ThreadingHTTPServer(("127.0.0.1", 0), lambda *a, **k: IsolatedHandler(*a, directory=str(ROOT), **k))
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base_url = f"http://127.0.0.1:{server.server_port}"

# This is a known mate fixture published in the official YaneuraOu issue tracker.
# The verifier still fails unless this exact built artifact itself emits `score mate`.
MATE_SFEN = "l6nl/6k2/+P3p2p1/1B1p1Pp1p/1p7/7nP/3P1SP1L/2+p3GK1/L6+r1 b B2G2S5Prgs2np 0"

js_suite = r"""
async ({mateSfen, workerUrl}) => {
  const lines = [];
  const errors = [];
  const worker = new Worker(workerUrl, {type: 'classic'});

  const asLine = (data) => {
    if (data && typeof data === 'object' && data.type === 'engine-error') {
      errors.push(String(data.message || 'engine-error'));
      return null;
    }
    if (typeof data === 'string') return data;
    if (data && typeof data.line === 'string') return data.line;
    return null;
  };
  worker.addEventListener('message', (event) => {
    const line = asLine(event.data);
    if (line !== null) lines.push(line);
  });
  worker.addEventListener('error', (event) => errors.push(String(event.message || 'worker-error')));

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const waitFor = async (predicate, timeoutMs = 30000, fromIndex = 0) => {
    const started = performance.now();
    while (performance.now() - started < timeoutMs) {
      if (errors.length) throw new Error(errors.join(' | '));
      for (let i = fromIndex; i < lines.length; i++) {
        if (predicate(lines[i])) return {line: lines[i], index: i};
      }
      await sleep(10);
    }
    throw new Error(`timeout after ${timeoutMs}ms; tail=${lines.slice(-8).join(' || ')}`);
  };
  const sendAndWait = async (command, predicate, timeoutMs = 30000) => {
    const start = lines.length;
    worker.postMessage(command);
    const matched = await waitFor(predicate, timeoutMs, start);
    return {matched, output: lines.slice(start)};
  };
  const runPosition = async (position, goCommand = 'go depth 6', timeoutMs = 60000) => {
    const start = lines.length;
    worker.postMessage(position);
    worker.postMessage(goCommand);
    await waitFor(line => /^bestmove\s+/.test(line), timeoutMs, start);
    return lines.slice(start);
  };
  const cpFrom = output => {
    for (const line of output) {
      const m = line.match(/\bscore\s+cp\s+(-?\d+)/);
      if (m) return Number(m[1]);
    }
    return null;
  };
  const has = (output, re) => output.some(line => re.test(line));

  const result = {checks: {}, observations: {}, timingsMs: {}, errors};
  try {
    let t0 = performance.now();
    const usi = await sendAndWait('usi', line => line === 'usiok', 60000);
    result.timingsMs.usiToUsiok = Math.round((performance.now() - t0) * 10) / 10;
    result.checks.usi = true;
    result.checks.usiok = usi.matched.line === 'usiok';
    result.observations.usiHead = usi.output.slice(0, 30);
    const multiPvAdvertised = usi.output.some(line => /^option name MultiPV\b/i.test(line));
    result.observations.multiPvAdvertised = multiPvAdvertised;

    t0 = performance.now();
    const ready = await sendAndWait('isready', line => line === 'readyok', 60000);
    result.timingsMs.isreadyToReadyok = Math.round((performance.now() - t0) * 10) / 10;
    result.checks.isready = true;
    result.checks.readyok = ready.matched.line === 'readyok';

    worker.postMessage('usinewgame');
    result.checks.usinewgame = true;
    if (multiPvAdvertised) {
      worker.postMessage('setoption name MultiPV value 2');
      await sendAndWait('isready', line => line === 'readyok', 60000);
    }

    t0 = performance.now();
    const initial = await runPosition('position startpos', 'go depth 6', 60000);
    result.timingsMs.initialPositionGoDepth6 = Math.round((performance.now() - t0) * 10) / 10;
    result.checks.position = true;
    result.checks.go = true;
    result.checks.info = has(initial, /^info\b/);
    result.checks.cp = has(initial, /\bscore\s+cp\s+-?\d+/);
    result.checks.pv = has(initial, /\bpv\s+\S+/);
    result.checks.multipv = multiPvAdvertised && has(initial, /\bmultipv\s+2\b/);
    result.checks.depth = has(initial, /\bdepth\s+\d+/);
    result.checks.nodes = has(initial, /\bnodes\s+\d+/);
    result.checks.time = has(initial, /\btime\s+\d+/);
    result.checks.bestmove = has(initial, /^bestmove\s+\S+/);
    const initialCp = cpFrom(initial);
    result.observations.initialCp = initialCp;
    result.checks.evaluationSanityInitial = initialCp !== null && Math.abs(initialCp) < 5000;

    // Black to move. Remove White's rook / Black's rook, then larger imbalances.
    const gain = await runPosition('position sfen lnsgkgsnl/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1');
    const loss = await runPosition('position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B7/LNSGKGSNL b - 1');
    const advantage = await runPosition('position sfen lnsgkgsnl/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1');
    const disadvantage = await runPosition('position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/9/LNSGKGSNL b - 1');
    const gainCp = cpFrom(gain), lossCp = cpFrom(loss), advantageCp = cpFrom(advantage), disadvantageCp = cpFrom(disadvantage);
    Object.assign(result.observations, {gainCp, lossCp, advantageCp, disadvantageCp});
    result.checks.evaluationSanityMaterialGain = gainCp !== null && gainCp > 0;
    result.checks.evaluationSanityMaterialLoss = lossCp !== null && lossCp < 0;
    result.checks.evaluationSanityAdvantage = advantageCp !== null && advantageCp > 0;
    result.checks.evaluationSanityDisadvantage = disadvantageCp !== null && disadvantageCp < 0;

    const mateStart = lines.length;
    worker.postMessage(`position sfen ${mateSfen}`);
    worker.postMessage('go infinite');
    let mateLine = null;
    try {
      const foundMate = await waitFor(line => /\bscore\s+mate\s+(?:-?\d+|\+|-)/.test(line), 15000, mateStart);
      mateLine = foundMate.line;
    } finally {
      const stopStart = lines.length;
      worker.postMessage('stop');
      await waitFor(line => /^bestmove\s+/.test(line), 30000, stopStart);
      result.checks.stop = true;
    }
    result.observations.mateLine = mateLine;
    result.checks.mate = Boolean(mateLine);
    result.checks.evaluationSanityMate = Boolean(mateLine);

    // Independent stop path, so cancel evidence is not inferred solely from the mate fixture.
    const stopStart = lines.length;
    worker.postMessage('position startpos');
    worker.postMessage('go infinite');
    await waitFor(line => /^info\b/.test(line), 30000, stopStart);
    const stopCommandIndex = lines.length;
    worker.postMessage('stop');
    await waitFor(line => /^bestmove\s+/.test(line), 30000, stopCommandIndex);
    result.checks.stop = true;

    worker.postMessage('quit');
    await sleep(500);
    result.checks.quit = errors.length === 0;
  } catch (error) {
    result.failure = String(error && error.stack ? error.stack : error);
  } finally {
    worker.terminate();
  }
  result.errors = [...errors];
  result.tail = lines.slice(-50);
  return result;
}
"""

observations: dict = {}
try:
    with sync_playwright() as p:
        launch_kwargs = {"headless": True}
        executable = os.environ.get("PLAYWRIGHT_EXECUTABLE_PATH")
        if executable:
            launch_kwargs["executable_path"] = executable
            launch_kwargs["args"] = ["--no-sandbox"]
        browser = p.chromium.launch(**launch_kwargs)
        page = browser.new_page(viewport={"width": 390, "height": 844})
        browser_console = []
        page_errors = []
        page.on("console", lambda msg: browser_console.append({
            "type": msg.type,
            "text": msg.text,
            "location": msg.location,
        }))
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))
        page.goto(base_url + "/index.html", wait_until="load")
        if page.evaluate("crossOriginIsolated === true") is not True:
            raise RuntimeError("crossOriginIsolated is false under the verification server")
        if page.evaluate("typeof SharedArrayBuffer === 'function'") is not True:
            raise RuntimeError("SharedArrayBuffer is unavailable under the verification server")
        suite = page.evaluate(js_suite, {"mateSfen": MATE_SFEN, "workerUrl": manifest.get("workerUrl")})
        browser.close()
        checks.update({name: bool(value) for name, value in suite.get("checks", {}).items() if name in checks})
        observations = {
            "buildCommit": metadata.get("commit"),
            "emccVersion": metadata.get("emccVersion"),
            "emppVersion": metadata.get("emppVersion"),
            "llvmVersion": metadata.get("llvmVersion"),
            "mateFixture": MATE_SFEN,
            "suite": suite.get("observations", {}),
            "timingsMs": suite.get("timingsMs", {}),
            "browserVersion": browser.version,
            "engineErrors": suite.get("errors", []),
            "failure": suite.get("failure"),
            "tail": suite.get("tail", []),
            "diagnosticBuild": diagnostic_build,
            "diagnosticArtifactExplicitlyAllowed": allow_diagnostic,
            "browserConsole": browser_console[-200:],
            "pageErrors": page_errors[-100:],
        }
finally:
    server.shutdown()
    server.server_close()

passed = all(checks.get(name) is True for name in PROTOCOL_CHECKS)
reason = "All mandatory Real USI/protocol/evaluation checks passed." if passed else "One or more mandatory Real USI/protocol/evaluation checks did not pass."
write_result(
    passed=passed,
    status="PASS" if passed else "FAILED_REAL_USI_VERIFICATION",
    wasm_sha256=metadata.get("wasmSha256"),
    checks=checks,
    reason=reason,
    observations=observations,
)
print(RESULT_TXT.read_text(encoding="utf-8"))
raise SystemExit(0 if passed else 1)
