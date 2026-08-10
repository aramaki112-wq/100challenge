from __future__ import annotations
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_verify import build_html

ROOT = Path(__file__).resolve().parent
rows: list[tuple[str, bool, str]] = []
metrics: dict[str, float | int | str | None] = {}

def check(name: str, ok: bool, detail: str = "") -> None:
    rows.append((name, bool(ok), detail))
    if not ok:
        raise AssertionError(f"{name}: {detail}")

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/chromium", headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors: list[str] = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.set_content(build_html(real_engine=True), wait_until="load")
    page.wait_for_selector(".key-position-card", state="attached")

    # Measure a standalone Engine handshake in the same real Blob Worker runtime.
    metrics.update(page.evaluate("""async () => {
      const { ReflectionLocalEngineAdapter } = await import('ReflectionLocalEngineAdapter.js');
      const beforeHeap = performance.memory?.usedJSHeapSize ?? null;
      const engine = new ReflectionLocalEngineAdapter({ workerUrl: window.SHOGI_REFLECTION_LOCAL_ENGINE_WORKER_URL, WorkerClass: window.Worker });
      const started = performance.now();
      await engine.initialize();
      const initializationMs = performance.now() - started;
      const info = engine.getEngineInfo();
      await engine.dispose();
      const afterHeap = performance.memory?.usedJSHeapSize ?? null;
      return { initializationMs, beforeHeap, afterHeap, workerUsed: info.runtime?.includes('Worker') ?? false };
    }"""))

    kif = (ROOT / "fixtures/replay-basic.kif").read_text(encoding="utf-8")
    page.fill("#kif-paste-text", kif)
    page.click("#preview-kif-paste")
    page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
    page.click("#apply-kif-import")
    page.select_option("#step-menu", "3")
    page.wait_for_function("document.querySelectorAll('.replay-square').length===81")

    check(
        "Engine Panel before Replay Board",
        page.evaluate("(document.querySelector('#engine-analysis-panel').compareDocumentPosition(document.querySelector('#shogi-board')) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0"),
    )
    check("Board Flip inside Replay Navigation", page.evaluate("document.querySelector('#replay-flip').closest('.replay-navigation') !== null"))
    check(
        "390px no horizontal overflow",
        page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"),
        str(page.evaluate("[document.documentElement.scrollWidth,document.documentElement.clientWidth]")),
    )

    analysis_started = page.evaluate("performance.now()")
    page.click("#analyze-game")
    page.wait_for_function("['INITIALIZING','ANALYZING','COMPLETED'].includes(document.querySelector('#engine-analysis-status')?.dataset.status)")
    page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='COMPLETED'", timeout=15000)
    metrics["shortGameAnalysisMs"] = page.evaluate("performance.now()") - analysis_started
    metadata = page.locator("#engine-analysis-metadata").inner_text()
    check("ReflectionLocal fallback Engine completed", "Shogi Reflection Local Engine" in metadata, metadata)
    progress = page.locator("#engine-analysis-progress-text").inner_text()
    check("Real progress count shown", "/" in progress and "局面" in progress, progress)

    candidate_count = page.locator("[data-engine-candidate]").count()
    check("Fallback candidate generated for short capture fixture", candidate_count >= 1, str(candidate_count))
    ply = int(page.locator("[data-engine-replay-ply]").first.get_attribute("data-engine-replay-ply"))
    page.locator("[data-engine-replay-ply]").first.scroll_into_view_if_needed()
    y = page.evaluate("window.scrollY")
    page.locator("[data-engine-replay-ply]").first.click()
    page.wait_for_function("p => document.querySelector('#replay-jump-number').value===String(p)", arg=ply)
    page.wait_for_timeout(450)
    check("Fallback Candidate -> existing Replay", page.locator("#replay-jump-number").input_value() == str(ply))
    board_view = page.evaluate("""() => { const r=document.querySelector('.replay-board-shell').getBoundingClientRect(); const nav=document.querySelector('.step-navigation')?.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,viewport:innerHeight,navBottom:nav?.bottom ?? 0,scrollY}; }""")
    check("Candidate Jump intentionally scrolls to board", abs(page.evaluate("window.scrollY") - y) > 1, str((y, page.evaluate("window.scrollY"))))
    check("Candidate Jump board visible", board_view["bottom"] > 0 and board_view["top"] < board_view["viewport"], str(board_view))
    check("Candidate Jump board clears sticky header", board_view["top"] >= board_view["navBottom"] - 2, str(board_view))

    page.locator("[data-engine-add-key-position]").first.click()
    check(
        "Fallback Candidate -> existing KeyPosition",
        page.evaluate("p => [...document.querySelectorAll('[data-field=moveNumber]')].some(x=>x.value===String(p))", ply),
    )
    page.locator("#engine-analysis-panel").screenshot(path=str(ROOT / "REAL_ENGINE_PANEL_V18.png"))
    page.locator("#shogi-board").screenshot(path=str(ROOT / "REAL_ENGINE_BOARD_V18.png"))
    page.click("#replay-flip")
    check("Board Flip after real analysis", page.locator("#replay-flip").get_attribute("aria-pressed") == "true")
    page.locator("#shogi-board").screenshot(path=str(ROOT / "REAL_ENGINE_BOARD_FLIPPED_V18.png"))

    # Real cancel path with a long fixture. The engine yields between root moves so stop reaches the Worker.
    page.select_option("#step-menu", "1")
    long_kif = (ROOT / "fixtures/replay-long-300.kif").read_text(encoding="utf-8")
    page.fill("#kif-paste-text", long_kif)
    page.click("#preview-kif-paste")
    page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
    page.click("#apply-kif-import")
    page.select_option("#step-menu", "3")
    page.click("#analyze-game")
    page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='ANALYZING'", timeout=5000)
    check("Fallback Cancel enabled", page.locator("#cancel-analysis").is_enabled())
    cancel_started = page.evaluate("performance.now()")
    page.click("#cancel-analysis")
    page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='CANCELLED'", timeout=5000)
    metrics["cancelResponseMs"] = page.evaluate("performance.now()") - cancel_started
    check("Fallback Cancel completed", "中止" in page.locator("#engine-analysis-status").inner_text())
    check("Re-analysis enabled after cancel", page.locator("#analyze-game").is_enabled())
    check("No page errors", not errors, "; ".join(errors))
    browser.close()

failed = [row for row in rows if not row[1]]
text = [
    "Shogi Reflection Ver.1.8 Engine Browser Verification / Formal Gate",
    "===============================================================",
    "Browser: Chromium / Playwright set_content / actual ReflectionLocal Blob Web Worker",
    "YaneuraOu WASM: NOT RUN — engine/yaneuraou/engine-manifest.json has available=false; no verified YaneuraOu JS/WASM binary is bundled.",
    "This file must not be interpreted as Real YaneuraOu E2E evidence.",
    "Viewport: 390x844",
    f"Checks: {len(rows)}",
    f"Passed: {len(rows)-len(failed)}",
    f"Failed: {len(failed)}",
    "",
]
for name, ok, detail in rows:
    text.append(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" | {detail}" if detail else ""))
text += [
    "",
    "Measured performance (this Chromium run; not a device guarantee)",
    f"- Engine initialization: {metrics.get('initializationMs', 0):.2f} ms",
    f"- Short 5-ply game analysis + candidate generation: {metrics.get('shortGameAnalysisMs', 0):.2f} ms",
    f"- Cancel UI-to-CANCELLED response: {metrics.get('cancelResponseMs', 0):.2f} ms",
    f"- Worker used: {metrics.get('workerUsed')}",
    f"- Main-page JS heap before/after standalone init: {metrics.get('beforeHeap')} / {metrics.get('afterHeap')} bytes (Worker heap not included; availability is browser-dependent)",
    "",
    "Physical iPhone: NOT TESTED",
    "Battery/Thermal: NOT MEASURED",
    "Network upload: none by ReflectionLocal engine implementation; the verification uses an in-memory Blob Worker.",
]
(ROOT / "REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt").write_text("\n".join(text) + "\n", encoding="utf-8")
perf_text = [
    "Shogi Reflection Ver.1.8 Fallback Engine Performance Measurement",
    "============================================================",
    "Environment: Chromium headless / Playwright / 390x844 / ReflectionLocal Blob Web Worker",
    "YaneuraOu WASM performance: NOT MEASURED",
    f"Engine initialization: {metrics.get('initializationMs', 0):.2f} ms",
    f"Short 5-ply game analysis + candidate generation: {metrics.get('shortGameAnalysisMs', 0):.2f} ms",
    f"Cancel UI-to-CANCELLED response: {metrics.get('cancelResponseMs', 0):.2f} ms",
    f"Worker used: {metrics.get('workerUsed')}",
    f"Main-page JS heap before/after standalone init: {metrics.get('beforeHeap')} / {metrics.get('afterHeap')} bytes",
    "Worker heap: NOT DIRECTLY MEASURED",
    "Physical iPhone: NOT TESTED",
    "Battery/Thermal: NOT MEASURED",
    "These measurements are environment-specific and are not claims of device-wide performance.",
]
(ROOT / "ENGINE_PERFORMANCE_RESULT.txt").write_text("\n".join(perf_text) + "\n", encoding="utf-8")
print("\n".join(text))
raise SystemExit(1 if failed else 0)
