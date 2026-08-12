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
OUT_JSON = GATE_ROOT / "REAL_REFLECTION_FLOW_RESULT.json"
OUT_TXT = GATE_ROOT / "REAL_REFLECTION_FLOW_RESULT.txt"
STEP3_SCREENSHOT = GATE_ROOT / "REAL_REFLECTION_FLOW_STEP3.png"
STEP4_SCREENSHOT = GATE_ROOT / "REAL_REFLECTION_FLOW_STEP4.png"


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


def board_geometry(page):
    return page.evaluate(
        """() => {
          const board = document.querySelector('.replay-board-shell')?.getBoundingClientRect();
          const nav = document.querySelector('.step-navigation')?.getBoundingClientRect();
          return board ? {
            top: board.top,
            bottom: board.bottom,
            height: board.height,
            viewport: innerHeight,
            stickyBottom: nav?.bottom ?? 0,
            scrollY
          } : null;
        }"""
    )


def main() -> int:
    server = ThreadingHTTPServer(
        ("127.0.0.1", 0),
        lambda *args, **kwargs: Handler(*args, directory=str(APP_ROOT), **kwargs),
    )
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    result = {
        "schemaVersion": 1,
        "gate": "YANEURAOU_REAL_REFLECTION_FLOW",
        "passed": False,
        "status": "NOT_RUN",
        "crossOriginIsolated": None,
        "sharedArrayBuffer": None,
        "samplePreview": False,
        "sampleMoves": 152,
        "playerSide": "GOTE",
        "step3Reached": False,
        "replaySquares": 0,
        "analysisStatus": None,
        "analysisMetadata": None,
        "analysisProgress": None,
        "realEngineVisible": False,
        "fallbackVisible": False,
        "mockVisible": False,
        "graphSvg": False,
        "graphReplayMarkers": 0,
        "goodCandidates": 0,
        "badCandidates": 0,
        "totalCandidates": 0,
        "badCandidateComparison": False,
        "graphToReplay": False,
        "graphReplayPly": None,
        "candidateToReplay": False,
        "candidatePly": None,
        "candidateGroup": None,
        "candidateBoardVisible": False,
        "candidateBoardPly": False,
        "candidateScrollChanged": False,
        "candidateAddKeepsScroll": False,
        "keyPositionAdded": False,
        "keyPositionMoveNumber": None,
        "graphKeyPositionMarker": False,
        "graphToStep4": False,
        "step4ExactCard": False,
        "factFocused": False,
        "factEmpty": False,
        "interpretationEmpty": False,
        "hypothesisEmpty": False,
        "engineDidNotAutofillReflection": False,
        "pageErrors": [],
        "console": [],
        "wallClockMs": None,
        "error": None,
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
                    {"type": message.type, "text": message.text, "location": message.location}
                ),
            )
            page.on("pageerror", lambda error: result["pageErrors"].append(str(error)))
            page.goto(base + "/index.html", wait_until="load", timeout=30_000)
            result["crossOriginIsolated"] = page.evaluate("globalThis.crossOriginIsolated === true")
            result["sharedArrayBuffer"] = page.evaluate("typeof globalThis.SharedArrayBuffer === 'function'")

            # Use the existing user-facing bundled sample path; do not bypass KIF Import.
            page.click("#load-sample-kif")
            page.wait_for_function("!document.querySelector('#kif-import-preview').hidden", timeout=15_000)
            preview_text = page.locator("#kif-import-preview").inner_text()
            result["samplePreview"] = "152" in preview_text and "Lv18" in preview_text
            page.select_option("#kif-my-side", "GOTE")
            page.click("#apply-kif-import")
            page.wait_for_function("document.querySelector('#step-menu').value === '2'", timeout=10_000)

            # Existing Step Navigation automatically builds Replay from the imported KIF.
            page.select_option("#step-menu", "3")
            page.dispatch_event("#step-menu", "change")
            page.wait_for_function("document.querySelectorAll('.replay-square').length === 81", timeout=15_000)
            result["step3Reached"] = "STEP 3 / 7" in page.locator("#step-current-status").inner_text()
            result["replaySquares"] = page.locator(".replay-square").count()

            # Real full-ply analysis through the production BrowserEngineProvider.
            page.evaluate("document.querySelector('#analyze-game').click()")
            page.wait_for_function(
                "['COMPLETED','FAILED','CANCELLED'].includes(document.querySelector('#engine-analysis-status')?.dataset.status)",
                timeout=1_200_000,
            )
            result["analysisStatus"] = page.locator("#engine-analysis-status").get_attribute("data-status")
            result["analysisMetadata"] = page.locator("#engine-analysis-metadata").inner_text()
            result["analysisProgress"] = page.locator("#engine-analysis-progress-text").inner_text()
            status_text = page.locator("#engine-analysis-status").inner_text()
            metadata_text = result["analysisMetadata"] or ""
            result["mockVisible"] = "Mock" in status_text or "Mock" in metadata_text
            result["fallbackVisible"] = "簡易Engine" in status_text or "簡易Engine" in metadata_text
            result["realEngineVisible"] = (
                result["analysisStatus"] == "COMPLETED"
                and "YaneuraOu" in metadata_text
                and "V9.00" in metadata_text
                and not result["mockVisible"]
                and not result["fallbackVisible"]
            )

            result["graphSvg"] = page.locator("#engine-evaluation-graph svg.engine-evaluation-graph").count() == 1
            result["graphReplayMarkers"] = page.locator("#engine-evaluation-graph [data-engine-graph-replay-ply]").count()
            result["goodCandidates"] = page.locator('[data-engine-candidate][data-candidate-group="GOOD"]').count()
            result["badCandidates"] = page.locator('[data-engine-candidate][data-candidate-group="BAD"]').count()
            result["totalCandidates"] = page.locator("[data-engine-candidate]").count()

            bad_card = page.locator('[data-engine-candidate][data-candidate-group="BAD"]').first
            bad_text = bad_card.inner_text() if result["badCandidates"] else ""
            result["badCandidateComparison"] = all(
                token in bad_text
                for token in ["実戦手", "実戦後評価", "Engine推奨", "推奨手評価", "実戦手との差", "読み筋"]
            )

            page.screenshot(path=str(STEP3_SCREENSHOT), full_page=True)

            # Graph Candidate -> Replay uses the production graph navigation handler.
            graph_marker = page.locator("#engine-evaluation-graph [data-engine-graph-replay-ply]").first
            if result["graphReplayMarkers"]:
                graph_ply = int(graph_marker.get_attribute("data-engine-graph-replay-ply"))
                result["graphReplayPly"] = graph_ply
                page.evaluate(
                    "ply => document.querySelector(`[data-engine-graph-replay-ply=\\\"${ply}\\\"]`)?.click()",
                    graph_ply,
                )
                page.wait_for_function(
                    "ply => document.querySelector('#replay-jump-number')?.value === String(ply)",
                    arg=graph_ply,
                    timeout=10_000,
                )
                result["graphToReplay"] = page.locator("#replay-jump-number").input_value() == str(graph_ply)

            # Use a Bad Candidate when available so Best/Actual/Difference/PV is proven in the same flow.
            candidate = bad_card if result["badCandidates"] else page.locator("[data-engine-candidate]").first
            if result["totalCandidates"]:
                candidate_ply = int(candidate.get_attribute("data-engine-candidate"))
                candidate_group = candidate.get_attribute("data-candidate-group")
                result["candidatePly"] = candidate_ply
                result["candidateGroup"] = candidate_group

                # Avoid Playwright auto-scrolling the off-screen button; exercise only app scroll behavior.
                page.evaluate("window.scrollTo(0, 0)")
                before_jump_y = page.evaluate("window.scrollY")
                page.evaluate(
                    "ply => document.querySelector(`[data-engine-candidate=\\\"${ply}\\\"] [data-engine-replay-ply]`)?.click()",
                    candidate_ply,
                )
                page.wait_for_function(
                    "ply => document.querySelector('#replay-jump-number')?.value === String(ply)",
                    arg=candidate_ply,
                    timeout=10_000,
                )
                page.wait_for_timeout(700)
                after_jump_y = page.evaluate("window.scrollY")
                result["candidateScrollChanged"] = abs(after_jump_y - before_jump_y) > 1
                result["candidateToReplay"] = page.locator("#replay-jump-number").input_value() == str(candidate_ply)
                geom = board_geometry(page)
                result["candidateBoardVisible"] = bool(
                    geom and geom["bottom"] > 0 and geom["top"] < geom["viewport"] and geom["top"] >= geom["stickyBottom"] - 2
                )
                board_label = page.locator("#shogi-board").get_attribute("aria-label") or ""
                result["candidateBoardPly"] = (
                    page.locator(".replay-square").count() == 81 and f"{candidate_ply}手目" in board_label
                )

                # Candidate -> KeyPosition must not move the viewport or auto-fill reflection text.
                before_add_y = page.evaluate("window.scrollY")
                page.evaluate(
                    "ply => document.querySelector(`[data-engine-candidate=\\\"${ply}\\\"] [data-engine-add-key-position]`)?.click()",
                    candidate_ply,
                )
                page.wait_for_timeout(400)
                after_add_y = page.evaluate("window.scrollY")
                result["candidateAddKeepsScroll"] = abs(after_add_y - before_add_y) <= 5
                move_numbers = page.evaluate(
                    "[...document.querySelectorAll('[data-field=moveNumber]')].map(x=>x.value).filter(Boolean)"
                )
                result["keyPositionAdded"] = str(candidate_ply) in move_numbers
                result["keyPositionMoveNumber"] = str(candidate_ply) if result["keyPositionAdded"] else None
                kp_selector = f'#engine-evaluation-graph [data-engine-graph-key-position-ply="{candidate_ply}"]'
                result["graphKeyPositionMarker"] = page.locator(kp_selector).count() == 1

                if result["graphKeyPositionMarker"]:
                    page.evaluate(
                        "ply => document.querySelector(`[data-engine-graph-key-position-ply=\\\"${ply}\\\"]`)?.click()",
                        candidate_ply,
                    )
                    page.wait_for_function("document.querySelector('#step-menu').value === '4'", timeout=10_000)
                    page.wait_for_function(
                        "document.activeElement?.getAttribute('data-field') === 'fact'",
                        timeout=10_000,
                    )
                    result["graphToStep4"] = "STEP 4 / 7" in page.locator("#step-current-status").inner_text()
                    result["factFocused"] = page.evaluate("document.activeElement?.getAttribute('data-field') === 'fact'")
                    result["step4ExactCard"] = page.evaluate(
                        "ply => document.activeElement?.closest('[data-key-position]')?.querySelector('[data-field=moveNumber]')?.value === String(ply)",
                        candidate_ply,
                    )
                    values = page.evaluate(
                        """ply => {
                          const card=[...document.querySelectorAll('[data-key-position]')].find(
                            c=>c.querySelector('[data-field=moveNumber]')?.value===String(ply)
                          );
                          return {
                            fact: card?.querySelector('[data-field=fact]')?.value ?? null,
                            interpretation: card?.querySelector('[data-field=interpretation]')?.value ?? null,
                            hypothesis: card?.querySelector('[data-field=hypothesis]')?.value ?? null
                          };
                        }""",
                        candidate_ply,
                    )
                    result["factEmpty"] = values.get("fact") == ""
                    result["interpretationEmpty"] = values.get("interpretation") == ""
                    result["hypothesisEmpty"] = values.get("hypothesis") == ""
                    result["engineDidNotAutofillReflection"] = all(
                        [result["factEmpty"], result["interpretationEmpty"], result["hypothesisEmpty"]]
                    )
                    page.screenshot(path=str(STEP4_SCREENSHOT), full_page=True)

            if result["pageErrors"]:
                result["status"] = "PAGE_ERROR"
            else:
                valid = all(
                    [
                        result["crossOriginIsolated"] is True,
                        result["sharedArrayBuffer"] is True,
                        result["samplePreview"] is True,
                        result["step3Reached"] is True,
                        result["replaySquares"] == 81,
                        result["analysisStatus"] == "COMPLETED",
                        result["realEngineVisible"] is True,
                        result["fallbackVisible"] is False,
                        result["mockVisible"] is False,
                        "153 / 153" in (result["analysisProgress"] or ""),
                        result["graphSvg"] is True,
                        result["graphReplayMarkers"] >= 1,
                        1 <= result["goodCandidates"] <= 5,
                        1 <= result["badCandidates"] <= 5,
                        2 <= result["totalCandidates"] <= 10,
                        result["badCandidateComparison"] is True,
                        result["graphToReplay"] is True,
                        result["candidateToReplay"] is True,
                        result["candidateGroup"] == "BAD",
                        result["candidateScrollChanged"] is True,
                        result["candidateBoardVisible"] is True,
                        result["candidateBoardPly"] is True,
                        result["candidateAddKeepsScroll"] is True,
                        result["keyPositionAdded"] is True,
                        result["graphKeyPositionMarker"] is True,
                        result["graphToStep4"] is True,
                        result["step4ExactCard"] is True,
                        result["factFocused"] is True,
                        result["engineDidNotAutofillReflection"] is True,
                    ]
                )
                result["passed"] = bool(valid)
                result["status"] = "PASS_REAL_REFLECTION_FLOW" if valid else "INVALID_REAL_REFLECTION_FLOW"
            browser.close()
    except Exception as exc:
        result["passed"] = False
        result["status"] = "PROBE_EXCEPTION"
        result["error"] = {"message": repr(exc)}
    finally:
        result["wallClockMs"] = round((time.monotonic() - started) * 1000)
        server.shutdown()
        server.server_close()

    OUT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "YaneuraOu Real Reflection Flow Gate",
        "=====================================",
        f"Status: {result.get('status')}",
        f"Passed: {result.get('passed')}",
        f"crossOriginIsolated: {result.get('crossOriginIsolated')}",
        f"SharedArrayBuffer: {result.get('sharedArrayBuffer')}",
        f"Sample Preview: {result.get('samplePreview')}",
        f"Step3 reached: {result.get('step3Reached')}",
        f"Replay squares: {result.get('replaySquares')}",
        f"Analysis status: {result.get('analysisStatus')}",
        f"Analysis metadata: {result.get('analysisMetadata')}",
        f"Analysis progress: {result.get('analysisProgress')}",
        f"Real Engine visible: {result.get('realEngineVisible')}",
        f"Fallback visible: {result.get('fallbackVisible')}",
        f"Mock visible: {result.get('mockVisible')}",
        f"Good candidates: {result.get('goodCandidates')}",
        f"Bad candidates: {result.get('badCandidates')}",
        f"Bad candidate Best/Actual/Difference/PV: {result.get('badCandidateComparison')}",
        f"Graph SVG: {result.get('graphSvg')}",
        f"Graph replay markers: {result.get('graphReplayMarkers')}",
        f"Graph -> Replay: {result.get('graphToReplay')} @ {result.get('graphReplayPly')}",
        f"Candidate -> Replay: {result.get('candidateToReplay')} @ {result.get('candidatePly')}",
        f"Candidate group: {result.get('candidateGroup')}",
        f"Candidate intentional Board scroll: {result.get('candidateScrollChanged')}",
        f"Candidate Board visible: {result.get('candidateBoardVisible')}",
        f"Candidate Board ply: {result.get('candidateBoardPly')}",
        f"Candidate add keeps scroll: {result.get('candidateAddKeepsScroll')}",
        f"KeyPosition added: {result.get('keyPositionAdded')} @ {result.get('keyPositionMoveNumber')}",
        f"Graph KeyPosition marker: {result.get('graphKeyPositionMarker')}",
        f"Graph -> STEP4: {result.get('graphToStep4')}",
        f"STEP4 exact card: {result.get('step4ExactCard')}",
        f"FACT focused: {result.get('factFocused')}",
        f"FACT empty: {result.get('factEmpty')}",
        f"INTERPRETATION empty: {result.get('interpretationEmpty')}",
        f"HYPOTHESIS empty: {result.get('hypothesisEmpty')}",
        f"Engine did not auto-fill reflection: {result.get('engineDidNotAutofillReflection')}",
        f"Wall clock ms: {result.get('wallClockMs')}",
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
