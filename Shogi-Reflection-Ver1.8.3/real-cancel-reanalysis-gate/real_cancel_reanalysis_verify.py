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
OUT_JSON = GATE_ROOT / "REAL_CANCEL_REANALYSIS_RESULT.json"
OUT_TXT = GATE_ROOT / "REAL_CANCEL_REANALYSIS_RESULT.txt"
CANCEL_SCREENSHOT = GATE_ROOT / "REAL_CANCELLED_STEP3.png"
REANALYSIS_SCREENSHOT = GATE_ROOT / "REAL_REANALYSIS_COMPLETED_STEP3.png"


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


def command_trace(page):
    return page.evaluate(
        """() => ({
          messages: [...(globalThis.__realCancelTrace?.messages ?? [])],
          terminateCount: globalThis.__realCancelTrace?.terminateCount ?? 0
        })"""
    )


def status_trace(page):
    return page.evaluate("() => [...(globalThis.__engineStatusTrace ?? [])]")


def count_exact(messages, expected):
    return sum(1 for item in messages if item.get("message") == expected)


def count_prefix(messages, prefix):
    return sum(1 for item in messages if str(item.get("message") or "").startswith(prefix))


def main() -> int:
    server = ThreadingHTTPServer(
        ("127.0.0.1", 0),
        lambda *args, **kwargs: Handler(*args, directory=str(APP_ROOT), **kwargs),
    )
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"

    result = {
        "schemaVersion": 1,
        "gate": "YANEURAOU_REAL_CANCEL_REANALYSIS",
        "passed": False,
        "status": "NOT_RUN",
        "crossOriginIsolated": None,
        "sharedArrayBuffer": None,
        "samplePreview": False,
        "step3Reached": False,
        "replaySquares": 0,
        "analysisStarted": False,
        "firstGoObserved": False,
        "progressBeforeCancel": None,
        "cancelImmediateStatus": None,
        "cancelStatus": None,
        "cancelResponseMs": None,
        "cancellingObserved": False,
        "cancelledObserved": False,
        "stopSent": False,
        "quitSentAfterCancel": False,
        "workerTerminatedAfterCancel": False,
        "stopCountAfterCancel": 0,
        "quitCountAfterCancel": 0,
        "terminateCountAfterCancel": 0,
        "cancelButtonDisabled": False,
        "reanalyzeButtonEnabled": False,
        "cancelDidNotPersistPartialResult": False,
        "replayUsableAfterCancel": False,
        "replayBefore": None,
        "replayAfter": None,
        "reanalysisStarted": False,
        "secondUsiObserved": False,
        "reanalysisStatus": None,
        "reanalysisProgress": None,
        "realEngineVisible": False,
        "fallbackVisible": False,
        "mockVisible": False,
        "graphSvg": False,
        "goodCandidates": 0,
        "badCandidates": 0,
        "reanalyzeButtonLabel": None,
        "finalUsiCount": 0,
        "finalGoCount": 0,
        "finalStopCount": 0,
        "finalQuitCount": 0,
        "finalTerminateCount": 0,
        "statusTransitions": [],
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

            # Observe commands sent by production BrowserWorkerUsiTransport and
            # terminate() calls on its top-level Worker. Emscripten pthread workers
            # are created inside that Worker and are intentionally not counted here.
            page.add_init_script(
                """() => {
                  const trace = { messages: [], terminateCount: 0 };
                  globalThis.__realCancelTrace = trace;
                  const proto = globalThis.Worker?.prototype;
                  if (!proto || proto.__realCancelGatePatched) return;
                  proto.__realCancelGatePatched = true;

                  const originalPostMessage = proto.postMessage;
                  proto.postMessage = function(message) {
                    let text;
                    try {
                      text = typeof message === "string" ? message : JSON.stringify(message);
                    } catch {
                      text = String(message);
                    }
                    trace.messages.push({ message: text, at: performance.now() });
                    return originalPostMessage.apply(this, arguments);
                  };

                  const originalTerminate = proto.terminate;
                  proto.terminate = function() {
                    trace.terminateCount += 1;
                    return originalTerminate.apply(this, arguments);
                  };
                }"""
            )

            page.on(
                "console",
                lambda message: result["console"].append(
                    {"type": message.type, "text": message.text, "location": message.location}
                ),
            )
            page.on("pageerror", lambda error: result["pageErrors"].append(str(error)))

            page.goto(base + "/index.html", wait_until="load", timeout=30_000)
            result["crossOriginIsolated"] = page.evaluate("globalThis.crossOriginIsolated === true")
            result["sharedArrayBuffer"] = page.evaluate(
                "typeof globalThis.SharedArrayBuffer === 'function'"
            )

            # Record every Engine UI state mutation. attributeOldValue lets us prove
            # a short-lived CANCELLING state even if CANCELLED follows immediately.
            page.evaluate(
                """() => {
                  const el = document.querySelector('#engine-analysis-status');
                  globalThis.__engineStatusTrace = [{
                    oldValue: null,
                    current: el?.dataset.status ?? null,
                    at: performance.now()
                  }];
                  const observer = new MutationObserver(records => {
                    for (const record of records) {
                      globalThis.__engineStatusTrace.push({
                        oldValue: record.oldValue,
                        current: el?.dataset.status ?? null,
                        at: performance.now()
                      });
                    }
                  });
                  observer.observe(el, {
                    attributes: true,
                    attributeFilter: ['data-status'],
                    attributeOldValue: true
                  });
                  globalThis.__engineStatusObserver = observer;
                }"""
            )

            # Existing user-facing Sample KIF path.
            page.click("#load-sample-kif")
            page.wait_for_function(
                "!document.querySelector('#kif-import-preview').hidden",
                timeout=15_000,
            )
            preview_text = page.locator("#kif-import-preview").inner_text()
            result["samplePreview"] = "152" in preview_text and "Lv18" in preview_text

            page.select_option("#kif-my-side", "GOTE")
            page.click("#apply-kif-import")
            page.wait_for_function(
                "document.querySelector('#step-menu').value === '2'",
                timeout=10_000,
            )
            page.select_option("#step-menu", "3")
            page.dispatch_event("#step-menu", "change")
            page.wait_for_function(
                "document.querySelectorAll('.replay-square').length === 81",
                timeout=15_000,
            )
            result["step3Reached"] = (
                "STEP 3 / 7" in page.locator("#step-current-status").inner_text()
            )
            result["replaySquares"] = page.locator(".replay-square").count()

            # Start real analysis and wait until the production transport has sent
            # a real `go` command. This avoids cancelling during initialization.
            page.evaluate("document.querySelector('#analyze-game').click()")
            page.wait_for_function(
                "document.querySelector('#engine-analysis-status')?.dataset.status === 'ANALYZING'",
                timeout=60_000,
            )
            result["analysisStarted"] = True
            page.wait_for_function(
                """() => (globalThis.__realCancelTrace?.messages ?? [])
                    .some(x => String(x.message || '').startsWith('go '))""",
                timeout=120_000,
            )
            result["firstGoObserved"] = True
            result["progressBeforeCancel"] = page.locator(
                "#engine-analysis-progress-text"
            ).inner_text()

            # Real Cancel path.
            cancel_started = time.monotonic()
            page.evaluate("document.querySelector('#cancel-analysis').click()")
            result["cancelImmediateStatus"] = page.locator(
                "#engine-analysis-status"
            ).get_attribute("data-status")

            page.wait_for_function(
                "document.querySelector('#engine-analysis-status')?.dataset.status === 'CANCELLED'",
                timeout=10_000,
            )
            result["cancelResponseMs"] = round((time.monotonic() - cancel_started) * 1000)
            result["cancelStatus"] = page.locator(
                "#engine-analysis-status"
            ).get_attribute("data-status")

            transitions = status_trace(page)
            result["statusTransitions"] = transitions
            result["cancellingObserved"] = (
                result["cancelImmediateStatus"] == "CANCELLING"
                or any(
                    item.get("oldValue") == "CANCELLING"
                    or item.get("current") == "CANCELLING"
                    for item in transitions
                )
            )
            result["cancelledObserved"] = result["cancelStatus"] == "CANCELLED"

            cancel_trace = command_trace(page)
            cancel_messages = cancel_trace["messages"]
            result["stopCountAfterCancel"] = count_exact(cancel_messages, "stop")
            result["quitCountAfterCancel"] = count_exact(cancel_messages, "quit")
            result["terminateCountAfterCancel"] = int(cancel_trace["terminateCount"])
            result["stopSent"] = result["stopCountAfterCancel"] >= 1
            result["quitSentAfterCancel"] = result["quitCountAfterCancel"] >= 1
            result["workerTerminatedAfterCancel"] = (
                result["terminateCountAfterCancel"] >= 1
            )

            result["cancelButtonDisabled"] = page.locator(
                "#cancel-analysis"
            ).is_disabled()
            result["reanalyzeButtonEnabled"] = not page.locator(
                "#analyze-game"
            ).is_disabled()

            # A cancelled partial analysis must not be rendered/persisted as a
            # completed result.
            result["cancelDidNotPersistPartialResult"] = (
                page.locator("#engine-evaluation-graph svg.engine-evaluation-graph").count()
                == 0
                and page.locator("[data-engine-candidate]").count() == 0
            )

            page.screenshot(path=str(CANCEL_SCREENSHOT), full_page=True)

            # Replay remains usable immediately after cancellation.
            result["replayBefore"] = page.locator("#replay-jump-number").input_value()
            page.click("#replay-next")
            page.wait_for_timeout(100)
            result["replayAfter"] = page.locator("#replay-jump-number").input_value()
            try:
                result["replayUsableAfterCancel"] = (
                    int(result["replayAfter"]) == int(result["replayBefore"]) + 1
                )
            except (TypeError, ValueError):
                result["replayUsableAfterCancel"] = False

            # Re-analysis must resolve a fresh Real YaneuraOu Worker and complete.
            usi_count_before = count_exact(cancel_messages, "usi")
            page.evaluate("document.querySelector('#analyze-game').click()")
            page.wait_for_function(
                "document.querySelector('#engine-analysis-status')?.dataset.status === 'ANALYZING'",
                timeout=60_000,
            )
            result["reanalysisStarted"] = True
            page.wait_for_function(
                """count => (globalThis.__realCancelTrace?.messages ?? [])
                    .filter(x => x.message === 'usi').length > count""",
                arg=usi_count_before,
                timeout=120_000,
            )
            result["secondUsiObserved"] = True

            page.wait_for_function(
                """['COMPLETED','FAILED','CANCELLED']
                    .includes(document.querySelector('#engine-analysis-status')?.dataset.status)""",
                timeout=1_200_000,
            )
            result["reanalysisStatus"] = page.locator(
                "#engine-analysis-status"
            ).get_attribute("data-status")
            result["reanalysisProgress"] = page.locator(
                "#engine-analysis-progress-text"
            ).inner_text()

            status_text = page.locator("#engine-analysis-status").inner_text()
            metadata_text = page.locator("#engine-analysis-metadata").inner_text()
            result["mockVisible"] = "Mock" in status_text or "Mock" in metadata_text
            result["fallbackVisible"] = (
                "簡易Engine" in status_text or "簡易Engine" in metadata_text
            )
            result["realEngineVisible"] = (
                result["reanalysisStatus"] == "COMPLETED"
                and "YaneuraOu" in metadata_text
                and "V9.00" in metadata_text
                and not result["mockVisible"]
                and not result["fallbackVisible"]
            )

            result["graphSvg"] = (
                page.locator(
                    "#engine-evaluation-graph svg.engine-evaluation-graph"
                ).count()
                == 1
            )
            result["goodCandidates"] = page.locator(
                '[data-engine-candidate][data-candidate-group="GOOD"]'
            ).count()
            result["badCandidates"] = page.locator(
                '[data-engine-candidate][data-candidate-group="BAD"]'
            ).count()
            result["reanalyzeButtonLabel"] = page.locator(
                "#analyze-game"
            ).inner_text()

            # The normal completion finally block disposes the second engine.
            page.wait_for_timeout(250)
            final_trace = command_trace(page)
            final_messages = final_trace["messages"]
            result["finalUsiCount"] = count_exact(final_messages, "usi")
            result["finalGoCount"] = count_prefix(final_messages, "go ")
            result["finalStopCount"] = count_exact(final_messages, "stop")
            result["finalQuitCount"] = count_exact(final_messages, "quit")
            result["finalTerminateCount"] = int(final_trace["terminateCount"])

            page.screenshot(path=str(REANALYSIS_SCREENSHOT), full_page=True)

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
                        result["analysisStarted"] is True,
                        result["firstGoObserved"] is True,
                        result["cancellingObserved"] is True,
                        result["cancelledObserved"] is True,
                        result["cancelResponseMs"] is not None
                        and result["cancelResponseMs"] < 10_000,
                        result["stopSent"] is True,
                        result["quitSentAfterCancel"] is True,
                        result["workerTerminatedAfterCancel"] is True,
                        result["cancelButtonDisabled"] is True,
                        result["reanalyzeButtonEnabled"] is True,
                        result["cancelDidNotPersistPartialResult"] is True,
                        result["replayUsableAfterCancel"] is True,
                        result["reanalysisStarted"] is True,
                        result["secondUsiObserved"] is True,
                        result["reanalysisStatus"] == "COMPLETED",
                        "153 / 153" in (result["reanalysisProgress"] or ""),
                        result["realEngineVisible"] is True,
                        result["fallbackVisible"] is False,
                        result["mockVisible"] is False,
                        result["graphSvg"] is True,
                        1 <= result["goodCandidates"] <= 5,
                        1 <= result["badCandidates"] <= 5,
                        result["reanalyzeButtonLabel"] == "現在設定で再解析",
                        result["finalUsiCount"] >= 2,
                        result["finalGoCount"] >= 154,
                        result["finalStopCount"] >= 1,
                        result["finalQuitCount"] >= 2,
                        result["finalTerminateCount"] >= 2,
                    ]
                )
                result["passed"] = bool(valid)
                result["status"] = (
                    "PASS_REAL_CANCEL_REANALYSIS"
                    if valid
                    else "INVALID_REAL_CANCEL_REANALYSIS"
                )

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
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    lines = [
        "YaneuraOu Real Cancel / Re-analysis Gate",
        "==========================================",
        f"Status: {result.get('status')}",
        f"Passed: {result.get('passed')}",
        f"crossOriginIsolated: {result.get('crossOriginIsolated')}",
        f"SharedArrayBuffer: {result.get('sharedArrayBuffer')}",
        f"Sample Preview: {result.get('samplePreview')}",
        f"Step3 reached: {result.get('step3Reached')}",
        f"Replay squares: {result.get('replaySquares')}",
        f"First analysis started: {result.get('analysisStarted')}",
        f"First go observed: {result.get('firstGoObserved')}",
        f"Progress before cancel: {result.get('progressBeforeCancel')}",
        f"Cancel immediate status: {result.get('cancelImmediateStatus')}",
        f"Cancel final status: {result.get('cancelStatus')}",
        f"CANCELLING observed: {result.get('cancellingObserved')}",
        f"CANCELLED observed: {result.get('cancelledObserved')}",
        f"Cancel response ms: {result.get('cancelResponseMs')}",
        f"stop sent: {result.get('stopSent')} ({result.get('stopCountAfterCancel')})",
        f"quit after cancel: {result.get('quitSentAfterCancel')} ({result.get('quitCountAfterCancel')})",
        f"Worker terminated after cancel: {result.get('workerTerminatedAfterCancel')} ({result.get('terminateCountAfterCancel')})",
        f"Cancel button disabled: {result.get('cancelButtonDisabled')}",
        f"Re-analyze button enabled: {result.get('reanalyzeButtonEnabled')}",
        f"Cancelled partial result not rendered: {result.get('cancelDidNotPersistPartialResult')}",
        f"Replay usable after cancel: {result.get('replayUsableAfterCancel')} ({result.get('replayBefore')} -> {result.get('replayAfter')})",
        f"Re-analysis started: {result.get('reanalysisStarted')}",
        f"Second usi observed: {result.get('secondUsiObserved')}",
        f"Re-analysis status: {result.get('reanalysisStatus')}",
        f"Re-analysis progress: {result.get('reanalysisProgress')}",
        f"Real Engine visible: {result.get('realEngineVisible')}",
        f"Fallback visible: {result.get('fallbackVisible')}",
        f"Mock visible: {result.get('mockVisible')}",
        f"Graph SVG: {result.get('graphSvg')}",
        f"Good candidates: {result.get('goodCandidates')}",
        f"Bad candidates: {result.get('badCandidates')}",
        f"Re-analyze button label: {result.get('reanalyzeButtonLabel')}",
        f"Final usi count: {result.get('finalUsiCount')}",
        f"Final go count: {result.get('finalGoCount')}",
        f"Final stop count: {result.get('finalStopCount')}",
        f"Final quit count: {result.get('finalQuitCount')}",
        f"Final top-level Worker terminate count: {result.get('finalTerminateCount')}",
        f"Wall clock ms: {result.get('wallClockMs')}",
        "",
        "Page errors:",
        *(result.get("pageErrors") or ["(none)"]),
        "",
        "Error:",
        json.dumps(result.get("error"), ensure_ascii=False),
    ]
    OUT_TXT.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(OUT_TXT.read_text(encoding="utf-8"))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
