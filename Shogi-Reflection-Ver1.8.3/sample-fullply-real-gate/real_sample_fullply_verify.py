from __future__ import annotations

import json
import shutil
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

APP_ROOT = Path(__file__).resolve().parent.parent
GATE_ROOT = Path(__file__).resolve().parent
OUT_JSON = GATE_ROOT / "REAL_SAMPLE_FULLPLY_RESULT.json"
OUT_TXT = GATE_ROOT / "REAL_SAMPLE_FULLPLY_RESULT.txt"


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
        "gate": "YANEURAOU_REAL_SAMPLE_FULLPLY",
        "passed": False,
        "status": "NOT_RUN",
        "console": [],
        "pageErrors": [],
        "wallClockMs": None,
    }
    started = time.monotonic()

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
            page.goto(base + "/sample-fullply-real-gate/index.html", wait_until="load")
            page.wait_for_function(
                "window.realSampleFullPlyGate && window.realSampleFullPlyGate.done === true",
                timeout=1_200_000,
            )
            state = page.evaluate("window.realSampleFullPlyGate")
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
        result["wallClockMs"] = round((time.monotonic() - started) * 1000)
        server.shutdown()
        server.server_close()

    OUT_JSON.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    graph = result.get("graph") or {}
    good = result.get("goodCandidates") or []
    bad = result.get("badCandidates") or []
    lines = [
        "YaneuraOu Real Sample Full-Ply Gate",
        "====================================",
        f"Status: {result.get('status')}",
        f"Passed: {result.get('passed')}",
        f"Adapter: {result.get('adapterClass')}",
        f"Transport: {result.get('transportClass')}",
        f"crossOriginIsolated: {result.get('crossOriginIsolated')}",
        f"SharedArrayBuffer: {result.get('sharedArrayBuffer')}",
        f"Sample encoding: {result.get('sampleEncoding')}",
        f"Sample moves: {result.get('sampleMoves')}",
        f"Player side: {result.get('playerSide')}",
        f"History status: {result.get('historyStatus')}",
        f"Max move number: {result.get('maxMoveNumber')}",
        f"Positions analyzed: {result.get('positionsAnalyzed')}",
        f"Timeline length: {result.get('timelineLength')}",
        f"Viewer perspective count: {result.get('viewerPerspectiveCount')}",
        f"Analysis truncated: {result.get('analysisTruncated')}",
        f"Player-side rows: {result.get('rowCount')}",
        f"Total candidates: {result.get('totalCandidates')}",
        f"Good candidates: {len(good)}",
        f"Bad candidates: {len(bad)}",
        f"Candidate PV present: {result.get('hasCandidatePv')}",
        f"Graph points: {graph.get('points')}",
        f"Graph has CP: {graph.get('hasCp')}",
        f"Graph has Mate: {graph.get('hasMate')}",
        f"Graph Good markers: {graph.get('goodMarkerCount')}",
        f"Graph Bad markers: {graph.get('badMarkerCount')}",
        f"Graph SVG rendered: {result.get('graphSvgRendered')}",
        f"Progress: {result.get('progressCompleted')} / {result.get('progressTotal')}",
        f"Parse ms: {result.get('parseMs')}",
        f"Analysis ms: {result.get('analysisMs')}",
        f"Graph ms: {result.get('graphMs')}",
        f"Wall clock ms: {result.get('wallClockMs')}",
        "",
        "Good candidates:",
        *[json.dumps(item, ensure_ascii=False) for item in good],
        "",
        "Bad candidates:",
        *[json.dumps(item, ensure_ascii=False) for item in bad],
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
