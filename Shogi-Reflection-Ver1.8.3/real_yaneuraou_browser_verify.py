from __future__ import annotations

import hashlib
import json
import os
import re
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / "engine" / "yaneuraou" / "engine-manifest.json"
METADATA_PATH = ROOT / "ENGINE_BUILD_METADATA.json"
RESULT_JSON = ROOT / "REAL_YANEURAOU_E2E_RESULT.json"
RESULT_TXT = ROOT / "REAL_YANEURAOU_BROWSER_E2E_RESULT.txt"
ENGINE_RESULT_TXT = ROOT / "ENGINE_REAL_E2E_RESULT.txt"
PERFORMANCE_JSON = ROOT / "ENGINE_REAL_PERFORMANCE_RESULT.json"

APP_CHECKS = [
    "realEngineMetadata", "sampleKif", "fullPly", "evaluationGraph", "goodCandidate", "badCandidate",
    "bestEvaluation", "actualEvaluation", "difference", "pv", "candidateJump", "boardScroll", "keyPosition",
    "graphMarker", "graphToStep4", "fact", "interpretation", "hypothesis", "cancel", "reanalysis",
]
AUXILIARY_CHECKS = ["crossOriginIsolated", "sharedArrayBuffer", "shortKif", "normalKif", "longKif"]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_not_run(reason: str) -> None:
    checks = {k: False for k in APP_CHECKS + AUXILIARY_CHECKS}
    data = {
        "schemaVersion": 2,
        "verifier": "real_yaneuraou_browser_verify.py",
        "passed": False,
        "status": "NOT_RUN_REAL_WASM_ASSET_UNAVAILABLE",
        "wasmSha256": None,
        "checks": checks,
        "reason": reason,
        "performance": {},
    }
    RESULT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    text = (
        "Shogi Reflection Ver.1.8.3 Real YaneuraOu Browser E2E\n"
        "=====================================================\n"
        "Status: NOT RUN\n"
        f"Reason: {reason}\n"
        "Mock/ReflectionLocal evidence is intentionally not accepted here.\n"
    )
    RESULT_TXT.write_text(text, encoding="utf-8")
    ENGINE_RESULT_TXT.write_text(text, encoding="utf-8")
    PERFORMANCE_JSON.write_text(json.dumps({
        "schemaVersion": 1,
        "status": "NOT_MEASURED_REAL_WASM_ASSET_UNAVAILABLE",
        "wasmSha256": None,
        "measurements": {},
        "reason": reason,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
engine_dir = MANIFEST_PATH.parent
actual = {"js": metadata.get("jsFile"), "wasm": metadata.get("wasmFile"), "worker": metadata.get("workerFile"), "workerBootstrap": metadata.get("workerBootstrapFile")}

if manifest.get("available") is not True or metadata.get("measured") is not True:
    reason = (
        f"manifest.available={manifest.get('available')}; metadata.measured={metadata.get('measured')}. "
        "Run the official-source Build Bridge and integrate its measured artifact first."
    )
    write_not_run(reason)
    print(reason)
    raise SystemExit(2)

if metadata.get("pthreadWorkerPackaging") != "SEPARATE_PTHREAD_WORKER" or metadata.get("generatedPthreadWorkerCount") != 1:
    reason = (
        f"Unexpected pthread packaging for pinned upstream-compatible Emscripten 3.1.43: "
        f"packaging={metadata.get('pthreadWorkerPackaging')}, count={metadata.get('generatedPthreadWorkerCount')}."
    )
    write_not_run(reason)
    print(reason)
    raise SystemExit(2)
if not metadata.get("workerFile") or not metadata.get("workerSha256") or not manifest.get("pthreadWorkerUrl"):
    reason = "The official Emscripten 3.1.43 material build requires one measured separate pthread worker asset."
    write_not_run(reason)
    print(reason)
    raise SystemExit(2)

def asset_path(kind: str, name: str) -> Path:
    return (ROOT / name) if kind == "workerBootstrap" else (engine_dir / name)

missing = [name for kind, name in actual.items() if not name or not asset_path(kind, name).is_file()]
if missing:
    reason = f"Measured build metadata does not resolve all real assets: {missing}"
    write_not_run(reason)
    print(reason)
    raise SystemExit(2)

for kind, field in [("js", "jsSha256"), ("wasm", "wasmSha256"), ("worker", "workerSha256"), ("workerBootstrap", "workerBootstrapSha256")]:
    name = actual[kind]
    actual_hash = sha256(asset_path(kind, name))
    if actual_hash != metadata.get(field) or actual_hash != manifest.get(field):
        reason = f"{name} SHA-256 mismatch before browser execution."
        write_not_run(reason)
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
checks: dict[str, bool] = {k: False for k in APP_CHECKS + AUXILIARY_CHECKS}
rows: list[str] = []
performance: dict[str, object] = {
    "assetSizeBytes": {
        "js": (engine_dir / actual["js"]).stat().st_size,
        "wasm": (engine_dir / actual["wasm"]).stat().st_size,
        "pthreadWorker": (engine_dir / actual["worker"]).stat().st_size,
        "workerBootstrap": (ROOT / actual["workerBootstrap"]).stat().st_size,
    }
}


def check(name: str, ok: bool, detail: str = "") -> None:
    checks[name] = bool(ok)
    rows.append(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" | {detail}" if detail else ""))
    if not ok:
        raise AssertionError(f"{name}: {detail}")


def import_kif(page, text: str):
    page.select_option("#step-menu", "1")
    page.fill("#kif-paste-text", text)
    page.click("#preview-kif-paste")
    page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
    page.click("#apply-kif-import")
    page.select_option("#step-menu", "3")
    page.wait_for_function("document.querySelectorAll('.replay-square').length===81")


def analyze_current(page, *, timeout=180000, label="analysis"):
    started = time.perf_counter()
    page.click("#analyze-game")
    page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='COMPLETED'", timeout=timeout)
    elapsed_ms = round((time.perf_counter() - started) * 1000, 1)
    metadata_text = page.locator("#engine-analysis-metadata").inner_text()
    check("realEngineMetadata", "YaneuraOu" in metadata_text and "簡易Engine" not in metadata_text and "Mock" not in metadata_text, metadata_text)
    performance[f"{label}Ms"] = elapsed_ms
    return elapsed_ms


failure = None
try:
    with sync_playwright() as p:
        launch_kwargs = {"headless": True}
        executable = os.environ.get("PLAYWRIGHT_EXECUTABLE_PATH")
        if executable:
            launch_kwargs["executable_path"] = executable
            launch_kwargs["args"] = ["--no-sandbox"]
        browser = p.chromium.launch(**launch_kwargs)
        performance["browserVersion"] = browser.version
        performance["deploymentNetworkDownload"] = "NOT_MEASURED_LOOPBACK_VERIFICATION_ONLY"
        page = browser.new_page(viewport={"width": 390, "height": 844})
        navigation_started = time.perf_counter()
        page.goto(base_url + "/index.html", wait_until="load")
        performance["pageLoadMs"] = round((time.perf_counter() - navigation_started) * 1000, 1)
        check("crossOriginIsolated", page.evaluate("crossOriginIsolated === true"))
        check("sharedArrayBuffer", page.evaluate("typeof SharedArrayBuffer === 'function'"))

        # Mandatory Sample KIF end-to-end path.
        page.click("#load-sample-kif")
        page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        page.click("#apply-kif-import")
        page.select_option("#step-menu", "3")
        analyze_current(page, timeout=240000, label="sampleKifAnalysis")
        checks["sampleKif"] = True

        progress_text = page.locator("#engine-analysis-progress-text").inner_text()
        match = re.search(r"(\d+)\s*/\s*(\d+)\s*局面（解析完了）", progress_text)
        check("fullPly", bool(match and match.group(1) == match.group(2)), progress_text)
        check("evaluationGraph", page.locator("#engine-evaluation-graph svg").count() == 1)

        good_cards = page.locator('[data-engine-candidate-group="GOOD"] .engine-candidate-card')
        bad_cards = page.locator('[data-engine-candidate-group="BAD"] .engine-candidate-card')
        check("goodCandidate", 1 <= good_cards.count() <= 5, f"count={good_cards.count()}")
        check("badCandidate", 1 <= bad_cards.count() <= 5, f"count={bad_cards.count()}")

        panel_text = page.locator("#engine-analysis-panel").inner_text()
        check("bestEvaluation", "推奨手評価" in panel_text)
        check("actualEvaluation", "実戦後評価" in panel_text)
        check("difference", "実戦手との差" in panel_text)
        check("pv", "読み筋" in panel_text and "Engine推奨" in panel_text)

        # Prefer a Bad Candidate because its UI contains the full actual-vs-best comparison.
        candidate = bad_cards.first
        ply = int(candidate.get_attribute("data-engine-candidate"))
        replay_button = candidate.locator("[data-engine-replay-ply]")
        add_button = candidate.locator("[data-engine-add-key-position]")
        before = page.evaluate("scrollY")
        replay_button.click()
        page.wait_for_function("p => document.querySelector('#replay-jump-number').value===String(p)", arg=ply)
        page.wait_for_timeout(400)
        check("candidateJump", True, f"ply={ply}")
        after_jump = page.evaluate("scrollY")
        check("boardScroll", abs(after_jump - before) > 1, f"before={before}, after={after_jump}")

        add_button.click()
        page.wait_for_function("p => [...document.querySelectorAll('[data-field=moveNumber]')].some(x=>x.value===String(p))", arg=ply)
        check("keyPosition", True, f"ply={ply}")
        marker = page.locator(f'[data-engine-graph-key-position-ply="{ply}"]')
        check("graphMarker", marker.count() > 0)
        marker.first.click()
        page.wait_for_function("document.activeElement?.dataset?.field==='fact'")
        check("graphToStep4", page.locator("#step-menu").input_value() == "4" and page.evaluate("document.activeElement?.dataset?.field==='fact'"))

        # Resolve the exact card by moveNumber with JavaScript to avoid :has() portability assumptions.
        card_index = page.evaluate("""p => [...document.querySelectorAll('[data-key-position]')].findIndex(c => c.querySelector('[data-field=moveNumber]')?.value === String(p))""", ply)
        if card_index < 0:
            raise AssertionError("Exact STEP4 KeyPosition card was not found after graph navigation")
        card = page.locator("[data-key-position]").nth(card_index)
        fact = card.locator('[data-field="fact"]')
        interpretation = card.locator('[data-field="interpretation"]')
        hypothesis = card.locator('[data-field="hypothesis"]')
        check("fact", fact.input_value() == "", "Engine must not auto-fill FACT")
        check("interpretation", interpretation.input_value() == "", "Engine must not auto-fill INTERPRETATION")
        check("hypothesis", hypothesis.input_value() == "", "Engine must not auto-fill HYPOTHESIS")
        fact.fill("Real Engine E2E FACT input")
        interpretation.fill("Real Engine E2E INTERPRETATION input")
        hypothesis.fill("Real Engine E2E HYPOTHESIS input")
        if fact.input_value() != "Real Engine E2E FACT input" or interpretation.input_value() != "Real Engine E2E INTERPRETATION input" or hypothesis.input_value() != "Real Engine E2E HYPOTHESIS input":
            raise AssertionError("STEP4 reflection fields were not editable after Real Engine navigation")

        # Auxiliary performance coverage. Long KIF may intentionally truncate at the preset safety cap.
        for name, fixture, timeout in [
            ("shortKif", "fixtures/replay-basic.kif", 120000),
            ("normalKif", "fixtures/normal-resign-utf8.kifu", 240000),
            ("longKif", "fixtures/replay-long-300.kif", 420000),
        ]:
            import_kif(page, (ROOT / fixture).read_text(encoding="utf-8"))
            analyze_current(page, timeout=timeout, label=name)
            checks[name] = True

        # Cancel -> Worker stop/terminate through the existing application boundary, then re-analysis.
        import_kif(page, (ROOT / "fixtures/replay-long-300.kif").read_text(encoding="utf-8"))
        cancel_started = time.perf_counter()
        page.click("#analyze-game")
        page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='ANALYZING'", timeout=15000)
        page.click("#cancel-analysis")
        page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='CANCELLED'", timeout=30000)
        performance["cancelResponseMs"] = round((time.perf_counter() - cancel_started) * 1000, 1)
        checks["cancel"] = True
        page.click("#analyze-game")
        page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='COMPLETED'", timeout=420000)
        checks["reanalysis"] = True

        # Browser-visible memory is intentionally best-effort; null is not converted into a claim.
        performance["observableJsHeapBytes"] = page.evaluate("performance.memory ? performance.memory.usedJSHeapSize : null")
        browser.close()
except Exception as error:
    failure = repr(error)
finally:
    server.shutdown()
    server.server_close()

passed = failure is None and all(checks.get(k) is True for k in APP_CHECKS)
status = "PASS" if passed else "FAILED_REAL_APPLICATION_E2E"
data = {
    "schemaVersion": 2,
    "verifier": "real_yaneuraou_browser_verify.py",
    "passed": passed,
    "status": status,
    "wasmSha256": manifest.get("wasmSha256"),
    "checks": {k: checks.get(k, False) for k in APP_CHECKS + AUXILIARY_CHECKS},
    "failure": failure,
    "performance": performance,
}
RESULT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PERFORMANCE_JSON.write_text(json.dumps({
    "schemaVersion": 1,
    "status": "MEASURED_REAL_BROWSER_E2E" if passed else "PARTIAL_OR_FAILED_REAL_BROWSER_MEASUREMENT",
    "wasmSha256": manifest.get("wasmSha256"),
    "measurements": performance,
    "battery": "NOT_MEASURED_BY_BROWSER_E2E",
    "thermal": "NOT_MEASURED_BY_BROWSER_E2E",
    "physicalIPhone": False,
}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
text_result = "\n".join([
    "Shogi Reflection Ver.1.8.3 Real YaneuraOu Browser E2E",
    "=====================================================",
    f"WASM SHA-256: {manifest.get('wasmSha256')}",
    f"Passed: {passed}",
    f"Status: {status}",
    f"Failure: {failure or 'none'}",
    "",
    *rows,
    "",
    "Performance:",
    json.dumps(performance, ensure_ascii=False, indent=2),
]) + "\n"
RESULT_TXT.write_text(text_result, encoding="utf-8")
ENGINE_RESULT_TXT.write_text(text_result, encoding="utf-8")
print(text_result)
raise SystemExit(0 if passed else 1)
