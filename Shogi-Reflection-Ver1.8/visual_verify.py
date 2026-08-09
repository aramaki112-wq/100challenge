from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_verify import build_html, wait_initialized, goto_step

ROOT = Path(__file__).resolve().parent
OUT = {
    'normal': ROOT / 'VISUAL_NORMAL_BOARD.png',
    'promoted': ROOT / 'VISUAL_PROMOTED_PIECES.png',
    'flip': ROOT / 'VISUAL_BOARD_FLIP.png',
    'smartphone': ROOT / 'VISUAL_SMARTPHONE_STEP3.png',
}
rows = []

def check(name, ok, detail=''):
    rows.append((name, bool(ok), detail))
    if not ok:
        raise AssertionError(f'{name}: {detail}')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
    page.set_content(build_html(), wait_until='load')
    wait_initialized(page)
    kif=(ROOT/'fixtures/replay-basic.kif').read_text(encoding='utf-8')
    page.fill('#kif-paste-text', kif)
    page.click('#preview-kif-paste')
    page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
    page.click('#apply-kif-import')
    goto_step(page,3)
    page.wait_for_function("document.querySelectorAll('.replay-square').length===81")

    # Normal board: representative current Replay rendering.
    page.locator('#shogi-board').screenshot(path=str(OUT['normal']))
    check('通常盤面 Screenshot', OUT['normal'].exists() and OUT['normal'].stat().st_size>1000)
    check('通常盤面 81升', page.locator('.replay-square').count()==81)

    # Promoted gallery: render the shared SVG component itself at smartphone-relevant size.
    result = page.evaluate("""async () => {
      const { shogiPieceMarkup } = await import('ShogiPieceSvg.js');
      const labels=['成桂','成香','成銀','馬','龍'];
      const host=document.createElement('section');
      host.id='visual-promoted-gallery';
      host.setAttribute('aria-label','成駒視認性確認');
      host.style.cssText='background:#f7f1e6;padding:16px;display:grid;grid-template-columns:repeat(5,1fr);gap:8px;width:358px;box-sizing:border-box;';
      host.innerHTML=labels.map(label=>`<div style="text-align:center;font-size:12px"><div style="width:58px;height:66px;margin:auto">${shogiPieceMarkup({label,type:'TEST',promoted:true,rotated:false},{containerClassName:'replay-piece-container'})}</div><div>${label}</div></div>`).join('');
      document.body.appendChild(host);
      return {svg:host.querySelectorAll('svg').length, labels:[...host.querySelectorAll('svg')].map(x=>x.textContent.trim())};
    }""")
    page.locator('#visual-promoted-gallery').screenshot(path=str(OUT['promoted']))
    check('成駒 Gallery 5種', result['svg']==5, str(result))
    check('成桂/成香/成銀/馬/龍', all(x in ''.join(result['labels']) for x in ['成桂','成香','成銀','馬','龍']))

    # Board flip uses the same board and fixed geometry.
    before=page.locator('.replay-board-grid').bounding_box()
    page.click('#replay-flip')
    after=page.locator('.replay-board-grid').bounding_box()
    page.locator('#shogi-board').screenshot(path=str(OUT['flip']))
    check('Board Flip Screenshot', page.locator('#replay-flip').get_attribute('aria-pressed')=='true')
    check('Flip fixed geometry', abs(before['width']-after['width'])<=1 and abs(before['height']-after['height'])<=1, str((before,after)))

    # STEP3 smartphone Engine panel with candidates visible.
    page.click('#analyze-game')
    page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='COMPLETED'", timeout=10000)
    panel=page.locator('#engine-analysis-panel')
    panel.scroll_into_view_if_needed()
    page.screenshot(path=str(OUT['smartphone']), full_page=False)
    check('Smartphone STEP3 Screenshot', OUT['smartphone'].exists() and OUT['smartphone'].stat().st_size>1000)
    check('Engine候補 visible', page.locator('[data-engine-candidate]').count()>=1)
    check('Board width within 390px', page.locator('#shogi-board').bounding_box()['width']<=390)
    browser.close()

failed=[r for r in rows if not r[1]]
text=[
    'Shogi Reflection Ver.1.8 Visual Verification',
    '=============================================',
    'Browser: Chromium via Playwright',
    'Viewport: 390x844',
    f'Checks: {len(rows)}',
    f'Passed: {len(rows)-len(failed)}',
    f'Failed: {len(failed)}',
    '',
]
for name,ok,detail in rows:
    text.append(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f' | {detail}' if detail else ''))
text += ['', 'Screenshot files:'] + [f'- {p.name}' for p in OUT.values()]
(ROOT/'VISUAL_VERIFICATION_RESULT.txt').write_text('\n'.join(text)+'\n', encoding='utf-8')
print('\n'.join(text))
raise SystemExit(1 if failed else 0)
