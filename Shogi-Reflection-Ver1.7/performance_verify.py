from pathlib import Path
from statistics import mean
from playwright.sync_api import sync_playwright
from browser_verify import build_html, wait_initialized, goto_step

ROOT=Path(__file__).resolve().parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    page.set_content(build_html(), wait_until='load')
    wait_initialized(page)
    kif=(ROOT/'fixtures/replay-long-300.kif').read_text(encoding='utf-8')
    page.fill('#kif-paste-text',kif)
    page.click('#preview-kif-paste'); page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
    page.click('#apply-kif-import'); goto_step(page,3)
    page.wait_for_function("document.querySelector('#replay-jump-number')?.max==='300'")
    timings=page.evaluate("""() => { const rows=[]; for(let i=0;i<100;i++){const t=performance.now(); document.querySelector('#replay-next').click(); rows.push(performance.now()-t);} return rows; }""")
    piece_nodes=page.evaluate("""() => { const svg=document.querySelector('.replay-piece'); return svg ? {svgChildren:svg.querySelectorAll('*').length, boardSvg:document.querySelectorAll('.replay-board-grid svg').length, boardNodes:document.querySelector('.replay-board-grid').querySelectorAll('*').length} : {}; }""")
    # Snapshot render measurement for one current position.
    page.evaluate("document.querySelector('#add-current-position').click()")
    goto_step(page,4)
    snap_ms=page.evaluate("""() => { const d=[...document.querySelectorAll('[data-snapshot-details]')].find(x=>!x.hidden); const t=performance.now(); d.open=true; d.dispatchEvent(new Event('toggle',{bubbles:true})); return performance.now()-t; }""")
    snapshot_nodes=page.locator('.snapshot-board *').count()
    browser.close()

avg=mean(timings); mx=max(timings); total=sum(timings)
text=f'''Shogi Reflection Ver.1.7 Performance Verification\n================================================\nEnvironment: Chromium headless / 390x844 / local data-URL test harness\nReplay sample: 300-ply fixture\n\nMeasured results\n- Replay Next x100 total synchronous event/render time: {total:.2f} ms\n- Replay Next average: {avg:.3f} ms/click\n- Replay Next maximum: {mx:.3f} ms/click\n- Current board SVG count: {piece_nodes.get('boardSvg','N/A')}\n- Children inside one piece SVG: {piece_nodes.get('svgChildren','N/A')}\n- Current board descendant DOM nodes: {piece_nodes.get('boardNodes','N/A')}\n- One Snapshot open/render dispatch time: {snap_ms:.3f} ms\n- Snapshot descendant DOM nodes: {snapshot_nodes}\n\nInterpretation\n- Ver.1.7 keeps one SVG per occupied square; it does not create a second board or Canvas layer.\n- The new piece SVG adds a small presentation-only highlight path; two-character promoted labels use two tspan nodes.\n- These are environment-specific measurements, not a general claim that every device is fast.\n- Real-device thermal, battery, and long-session profiling were not performed.\n'''
(ROOT/'PERFORMANCE_RESULT.txt').write_text(text,encoding='utf-8')
print(text)
