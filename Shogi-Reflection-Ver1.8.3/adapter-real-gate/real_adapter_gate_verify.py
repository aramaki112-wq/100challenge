from __future__ import annotations

import json
import shutil
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

APP_ROOT = Path(__file__).resolve().parent.parent
GATE_ROOT = Path(__file__).resolve().parent
OUT_JSON = GATE_ROOT / "REAL_ADAPTER_INTEGRATION_RESULT.json"
OUT_TXT = GATE_ROOT / "REAL_ADAPTER_INTEGRATION_RESULT.txt"


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


def main() -> int:
    server = ThreadingHTTPServer(
        ("127.0.0.1", 0),
        lambda *args, **kwargs: Handler(*args, directory=str(APP_ROOT), **kwargs),
    )
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    result = {
        "schemaVersion": 1,
        "gate": "YANEURAOU_REAL_ADAPTER_INTEGRATION",
        "passed": False,
        "status": "NOT_RUN",
        "console": [],
        "pageErrors": [],
    }

    try:
        with sync_playwright() as playwright:
            launch_kwargs = {"headless": True}
            system_chromium = shutil.which("chromium") or shutil.which("chromium-browser")
            if system_chromium:
                launch_kwargs["executable_path"] = system_chromium
            browser = playwright.chromium.launch(**launch_kwargs)
            page = browser.new_page(viewport={"width": 390, "height": 844})
            page.on(
                "console",
                lambda message: result["console"].append(
                    {
                        "type": message.type,
                        "text": message.text,
                        "location": message.location,
                    }
                ),
            )
            page.on("pageerror", lambda error: result["pageErrors"].append(str(error)))
            page.goto(base + "/adapter-real-gate/index.html", wait_until="load")
            page.wait_for_function(
                "window.realAdapterGate && window.realAdapterGate.done === true",
                timeout=45000,
            )
            state = page.evaluate("window.realAdapterGate")
            result.update(state)
            if result.get("pageErrors"):
                result["passed"] = False
                result["status"] = "PAGE_ERROR"
            browser.close()
    except Exception as exc:
        result["passed"] = False
        result["status"] = "PROBE_EXCEPTION"
        result["error"] = {"message": repr(exc)}
    finally:
        server.shutdown()
        server.server_close()

    OUT_JSON.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    analysis = result.get("result") or {}
    candidates = analysis.get("candidateMoves") or []
    lines = [
        "YaneuraOu Real Adapter Integration Gate",
        "=========================================",
        f"Status: {result.get('status')}",
        f"Passed: {result.get('passed')}",
        f"Adapter: {result.get('adapterClass')}",
        f"Transport: {result.get('transportClass')}",
        f"Port asserted: {result.get('portAsserted')}",
        f"crossOriginIsolated: {result.get('crossOriginIsolated')}",
        f"SharedArrayBuffer: {result.get('sharedArrayBuffer')}",
        f"Evaluation: {json.dumps(analysis.get('evaluation'), ensure_ascii=False)}",
        f"Best move: {analysis.get('bestMove')}",
        f"Depth: {analysis.get('depth')}",
        f"Nodes: {analysis.get('nodes')}",
        f"Time: {analysis.get('time')}",
        f"MultiPV: {analysis.get('multiPv')}",
        f"Candidate count: {len(candidates)}",
        "",
        "Candidates:",
        *[json.dumps(item, ensure_ascii=False) for item in candidates],
        "",
        "Page errors:",
        *(result.get("pageErrors") or ["(none)"]),
        "",
        "Error:",
        json.dumps(result.get("error"), ensure_ascii=False),
    ]
    OUT_TXT.write_text("\n".join(map(str, lines)) + "\n", encoding="utf-8")
    return 0 if result.get("passed") else 1


if __name__ == "__main__":
    raise SystemExit(main())
