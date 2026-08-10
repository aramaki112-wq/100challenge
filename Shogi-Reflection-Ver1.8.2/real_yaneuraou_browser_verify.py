from __future__ import annotations

import hashlib
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / "engine" / "yaneuraou" / "engine-manifest.json"
RESULT_JSON = ROOT / "REAL_YANEURAOU_E2E_RESULT.json"
RESULT_TXT = ROOT / "REAL_YANEURAOU_BROWSER_E2E_RESULT.txt"

REQUIRED_ASSETS = ["yaneuraou.js", "yaneuraou.wasm", "yaneuraou.worker.js"]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_not_run(reason: str) -> None:
    data = {
        "schemaVersion": 1,
        "passed": False,
        "status": "NOT_RUN_REAL_WASM_ASSET_UNAVAILABLE",
        "wasmSha256": None,
        "checks": {k: False for k in [
            "usi", "usiok", "isready", "readyok", "position", "go", "cp", "mate", "pv",
            "depth", "nodes", "time", "bestmove", "stop", "quit", "shortKif", "normalKif",
            "longKif", "sampleKif", "evaluationGraph", "goodCandidate", "badCandidate",
            "candidateJump", "boardScroll", "keyPosition", "graphToStep4", "cancel", "reanalysis"
        ]},
        "reason": reason,
    }
    RESULT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    RESULT_TXT.write_text(
        "Shogi Reflection Ver.1.8.2 Real YaneuraOu Browser E2E\n"
        "=====================================================\n"
        "Status: NOT RUN\n"
        f"Reason: {reason}\n"
        "Mock/ReflectionLocal evidence is intentionally not accepted here.\n",
        encoding="utf-8",
    )


manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
engine_dir = MANIFEST_PATH.parent
missing = [name for name in REQUIRED_ASSETS if not (engine_dir / name).exists()]
if manifest.get("available") is not True or missing:
    reason = (
        f"manifest.available={manifest.get('available')}; missing assets={missing}. "
        "Build official YaneuraOu V9.00 MATERIAL_LEVEL=1 with Emscripten and finalize hashes first."
    )
    write_not_run(reason)
    print(reason)
    raise SystemExit(2)

# Fail closed on hash mismatch before executing third-party code.
for name, field in [
    ("yaneuraou.js", "jsSha256"),
    ("yaneuraou.wasm", "wasmSha256"),
    ("yaneuraou.worker.js", "workerSha256"),
]:
    expected = manifest.get(field)
    actual = sha256(engine_dir / name)
    if not expected or expected != actual:
        reason = f"{name} SHA-256 mismatch: expected={expected}, actual={actual}"
        write_not_run(reason)
        print(reason)
        raise SystemExit(3)


class IsolatedHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Required by the pinned upstream pthread WASM configuration.
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
checks: dict[str, bool] = {}
rows: list[str] = []


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


def analyze_current(page, timeout=120000):
    page.click("#analyze-game")
    page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='COMPLETED'", timeout=timeout)
    metadata = page.locator("#engine-analysis-metadata").inner_text()
    check("realEngineMetadata", "YaneuraOu" in metadata and "簡易Engine" not in metadata, metadata)


try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/chromium", headless=True, args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(base_url + "/index.html", wait_until="load")
        check("crossOriginIsolated", page.evaluate("crossOriginIsolated === true"))
        check("sharedArrayBuffer", page.evaluate("typeof SharedArrayBuffer === 'function'"))

        # Sample KIF is the mandatory full application smoke path.
        page.click("#load-sample-kif")
        page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        page.click("#apply-kif-import")
        page.select_option("#step-menu", "3")
        analyze_current(page)
        checks["sampleKif"] = True
        check("evaluationGraph", page.locator("#engine-evaluation-graph svg").count() == 1)
        check("goodCandidate", page.locator('[data-engine-candidate-group="GOOD"]').count() == 1)
        check("badCandidate", page.locator('[data-engine-candidate-group="BAD"]').count() == 1)

        if page.locator("[data-engine-replay-ply]").count():
            ply = int(page.locator("[data-engine-replay-ply]").first.get_attribute("data-engine-replay-ply"))
            before = page.evaluate("scrollY")
            page.locator("[data-engine-replay-ply]").first.click()
            page.wait_for_function("p => document.querySelector('#replay-jump-number').value===String(p)", arg=ply)
            page.wait_for_timeout(350)
            check("candidateJump", True)
            check("boardScroll", abs(page.evaluate("scrollY") - before) > 1)
            page.locator("[data-engine-add-key-position]").first.click()
            page.wait_for_function("p => [...document.querySelectorAll('[data-field=moveNumber]')].some(x=>x.value===String(p))", arg=ply)
            check("keyPosition", True)
            marker = page.locator(f'[data-engine-graph-key-position-ply="{ply}"]')
            check("graphToStep4", marker.count() > 0)
            marker.first.click()
            page.wait_for_function("document.activeElement?.dataset?.field==='fact'")

        # Representative short/normal/long fixture analysis.
        for name, fixture, timeout in [
            ("shortKif", "fixtures/replay-basic.kif", 60000),
            ("normalKif", "fixtures/normal-resign-utf8.kifu", 120000),
            ("longKif", "fixtures/replay-long-300.kif", 180000),
        ]:
            import_kif(page, (ROOT / fixture).read_text(encoding="utf-8"))
            analyze_current(page, timeout=timeout)
            checks[name] = True

        # Cancel and re-analysis with long fixture.
        import_kif(page, (ROOT / "fixtures/replay-long-300.kif").read_text(encoding="utf-8"))
        page.click("#analyze-game")
        page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='ANALYZING'", timeout=10000)
        page.click("#cancel-analysis")
        page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='CANCELLED'", timeout=10000)
        checks["cancel"] = True
        page.click("#analyze-game")
        page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='COMPLETED'", timeout=180000)
        checks["reanalysis"] = True

        # Protocol details are evidenced by UsiEngineAdapter output only after a real run.
        # The app result must include data originating from info/bestmove lines.
        result_text = page.locator("#engine-analysis-panel").inner_text()
        for key, token in [("pv", "読み筋"), ("bestmove", "Engine推奨")]:
            checks[key] = token in result_text
        # cp/mate/depth/nodes/time plus raw usi handshake are captured by the adapter-level
        # real smoke verifier when a real artifact exists. Keep fail-closed until that evidence is added.
        for key in ["usi", "usiok", "isready", "readyok", "position", "go", "cp", "mate", "depth", "nodes", "time", "stop", "quit"]:
            checks.setdefault(key, False)

        browser.close()
finally:
    server.shutdown()
    server.server_close()

required = [
    "usi", "usiok", "isready", "readyok", "position", "go", "cp", "mate", "pv", "depth", "nodes", "time", "bestmove", "stop", "quit",
    "shortKif", "normalKif", "longKif", "sampleKif", "evaluationGraph", "goodCandidate", "badCandidate", "candidateJump", "boardScroll",
    "keyPosition", "graphToStep4", "cancel", "reanalysis"
]
passed = all(checks.get(k) is True for k in required)
data = {
    "schemaVersion": 1,
    "passed": passed,
    "status": "PASS" if passed else "INCOMPLETE_REAL_PROTOCOL_EVIDENCE",
    "wasmSha256": manifest.get("wasmSha256"),
    "checks": {k: checks.get(k, False) for k in required},
}
RESULT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
RESULT_TXT.write_text("\n".join([
    "Shogi Reflection Ver.1.8.2 Real YaneuraOu Browser E2E",
    "=====================================================",
    f"WASM SHA-256: {manifest.get('wasmSha256')}",
    f"Passed: {passed}",
    "",
    *rows,
]) + "\n", encoding="utf-8")
print(RESULT_TXT.read_text(encoding="utf-8"))
raise SystemExit(0 if passed else 1)
