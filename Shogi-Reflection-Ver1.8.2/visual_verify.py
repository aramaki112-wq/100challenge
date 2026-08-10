from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_verify import build_html, wait_initialized, goto_step

ROOT = Path(__file__).resolve().parent
OUT = {
    'normal': ROOT / 'VISUAL_NORMAL_BOARD.png',
    'promoted': ROOT / 'VISUAL_PROMOTED_PIECES.png',
    'flip': ROOT / 'VISUAL_BOARD_FLIP.png',
    'smartphone': ROOT / 'VISUAL_SMARTPHONE_STEP3.png',
    'candidates': ROOT / 'VISUAL_CANDIDATE_GROUPS.png',
    'candidate_jump': ROOT / 'VISUAL_CANDIDATE_JUMP_BOARD_SCROLL.png',
    'evaluation_graph': ROOT / 'VISUAL_EVALUATION_GRAPH_V182.png',
    'graph_step4': ROOT / 'VISUAL_GRAPH_TO_STEP4_V182.png',
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

    page.locator('#shogi-board').screenshot(path=str(OUT['normal']))
    check('通常盤面 Screenshot', OUT['normal'].exists() and OUT['normal'].stat().st_size>1000)
    check('通常盤面 81升', page.locator('.replay-square').count()==81)

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

    before=page.locator('.replay-board-grid').bounding_box()
    page.click('#replay-flip')
    after=page.locator('.replay-board-grid').bounding_box()
    page.locator('#shogi-board').screenshot(path=str(OUT['flip']))
    check('Board Flip Screenshot', page.locator('#replay-flip').get_attribute('aria-pressed')=='true')
    check('Flip fixed geometry', abs(before['width']-after['width'])<=1 and abs(before['height']-after['height'])<=1, str((before,after)))

    page.click('#analyze-game')
    page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status==='COMPLETED'", timeout=10000)
    panel=page.locator('#engine-analysis-panel')
    panel.scroll_into_view_if_needed()
    page.screenshot(path=str(OUT['smartphone']), full_page=False)
    check('Smartphone STEP3 Screenshot', OUT['smartphone'].exists() and OUT['smartphone'].stat().st_size>1000)
    check('Engine候補 visible', page.locator('[data-engine-candidate]').count()>=1)
    check('Good Candidate group visible', page.locator('[data-engine-candidate-group="GOOD"]').count()==1)
    check('Bad Candidate group visible', page.locator('[data-engine-candidate-group="BAD"]').count()==1)
    check('Best Move label visible', 'Engine推奨' in panel.inner_text())
    graph=page.locator('#engine-evaluation-graph')
    graph.scroll_into_view_if_needed()
    graph.screenshot(path=str(OUT['evaluation_graph']))
    check('Evaluation Graph Screenshot', OUT['evaluation_graph'].exists() and OUT['evaluation_graph'].stat().st_size>1000)
    check('Evaluation Graph SVG visible', graph.locator('svg').count()==1)
    check('Graph candidate marker visible', graph.locator('[data-engine-graph-replay-ply]').count()>=1)
    panel.screenshot(path=str(OUT['candidates']))
    check('Candidate Group Screenshot', OUT['candidates'].exists() and OUT['candidates'].stat().st_size>1000)
    check('Board width within 390px', page.locator('#shogi-board').bounding_box()['width']<=390)

    candidate_button = page.locator('[data-engine-replay-ply]').first
    candidate_ply = int(candidate_button.get_attribute('data-engine-replay-ply'))
    candidate_button.click()
    page.wait_for_function("p => document.querySelector('#replay-jump-number').value===String(p)", arg=candidate_ply)
    page.wait_for_timeout(500)
    board_view=page.evaluate("""() => { const r=document.querySelector('.replay-board-shell').getBoundingClientRect(); const nav=document.querySelector('.step-navigation')?.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,viewport:innerHeight,navBottom:nav?.bottom ?? 0}; }""")
    page.screenshot(path=str(OUT['candidate_jump']), full_page=False)
    check('Candidate Jump Screenshot', OUT['candidate_jump'].exists() and OUT['candidate_jump'].stat().st_size>1000)
    check('Candidate Jump Board visible', board_view['bottom']>0 and board_view['top']<board_view['viewport'], str(board_view))
    check('Candidate Jump Board clears Header', board_view['top']>=board_view['navBottom']-2, str(board_view))
    check('Candidate Jump Current Move highlight', page.locator(f'#replay-move-{candidate_ply}.is-current[aria-current="true"]').count()==1)

    # Register the same candidate as a user-owned KeyPosition, then verify the graph marker
    # navigates to the exact STEP4 card rather than only the STEP4 top.
    page.locator('[data-engine-add-key-position]').first.click()
    page.wait_for_function("p => [...document.querySelectorAll('[data-field=moveNumber]')].some(x=>x.value===String(p))", arg=candidate_ply)
    key_marker=page.locator(f'[data-engine-graph-key-position-ply="{candidate_ply}"]')
    check('Graph KeyPosition marker visible', key_marker.count()>=1)
    key_marker.first.click()
    page.wait_for_function("document.querySelector('[data-step-panel=\"4\"]')?.hidden===false")
    page.wait_for_timeout(100)
    active_move=page.evaluate("document.activeElement?.closest('.key-position-card')?.querySelector('[data-field=moveNumber]')?.value ?? null")
    check('Graph -> STEP4 exact KeyPosition card', active_move==str(candidate_ply), str(active_move))
    check('Graph -> STEP4 FACT focus', page.evaluate("document.activeElement?.dataset?.field==='fact'"))
    page.screenshot(path=str(OUT['graph_step4']), full_page=False)
    check('Graph -> STEP4 Screenshot', OUT['graph_step4'].exists() and OUT['graph_step4'].stat().st_size>1000)
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
