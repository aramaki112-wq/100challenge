from __future__ import annotations

import base64
import json
import re
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
STORAGE_KEY = "shogi-reflection-interlude.game-reviews.v1"


def rewrite_imports(text: str) -> str:
    return re.sub(
        r'(["\'])\./([^"\']+\.js)(["\'])',
        lambda m: m.group(1) + m.group(2) + m.group(3),
        text,
    )


def build_html(seed: dict[str, str] | None = None) -> str:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    html = re.sub(r'<link rel="stylesheet" href="\./style\.css">', f"<style>{css}</style>", html)
    html = re.sub(r'<script type="module" src="\./main\.js"></script>', "", html)
    imports: dict[str, str] = {}
    for path in ROOT.glob("*.js"):
        if path.name.endswith(".test.js") or path.name == "main.js":
            continue
        source = rewrite_imports(path.read_text(encoding="utf-8"))
        encoded = base64.b64encode(source.encode("utf-8")).decode("ascii")
        imports[path.name] = f"data:text/javascript;base64,{encoded}"
    main_source = rewrite_imports((ROOT / "main.js").read_text(encoding="utf-8"))
    main_encoded = base64.b64encode(main_source.encode("utf-8")).decode("ascii")
    seed_json = json.dumps(seed or {}, ensure_ascii=False)
    bootstrap = f"""
<script>
(() => {{
  if (!crypto.randomUUID) {{
    let seq = 0;
    crypto.randomUUID = () => `00000000-0000-4000-8000-${{String(++seq).padStart(12, '0')}}`;
  }}
  const data = new Map(Object.entries({seed_json}));
  const storage = {{
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
    clear: () => data.clear(),
    key: index => [...data.keys()][index] ?? null,
    get length() {{ return data.size; }},
    _dump: () => Object.fromEntries(data.entries())
  }};
  Object.defineProperty(window, 'localStorage', {{ value: storage }});
  window.__SHOGI_REFLECTION_USE_MOCK_ENGINE__ = true;
  window.__SHOGI_REFLECTION_MOCK_DELAY_MS__ = 1;
  let clipboardText = '';
  Object.defineProperty(navigator, 'clipboard', {{ value: {{
    writeText: async value => {{ clipboardText = String(value); }},
    readText: async () => clipboardText
  }} }});
}})();
</script>
"""
    import_map = f'<script type="importmap">{json.dumps({"imports": imports})}</script>'
    main_script = f'<script type="module" src="data:text/javascript;base64,{main_encoded}"></script>'
    return html.replace("</body>", bootstrap + import_map + main_script + "</body>")


class Checks:
    def __init__(self) -> None:
        self.rows: list[tuple[str, bool, str]] = []

    def check(self, name: str, condition: bool, detail: str = "") -> None:
        ok = bool(condition)
        self.rows.append((name, ok, detail))
        if not ok:
            raise AssertionError(f"{name}: {detail}")

    @property
    def passed(self) -> int:
        return sum(1 for _, ok, _ in self.rows if ok)


def wait_initialized(page) -> None:
    page.wait_for_selector(".key-position-card", state="attached", timeout=10000)
    page.wait_for_function("document.querySelectorAll('.key-position-card').length === 3")


def goto_step(page, number: int) -> None:
    page.select_option("#step-menu", str(number))
    page.wait_for_function("n => document.querySelector('#step-menu').value === String(n)", arg=number)


def jump(page, move_number: int) -> None:
    page.fill("#replay-jump-number", str(move_number))
    page.click("#replay-jump-button")
    page.wait_for_function(
        "move => document.querySelector('#replay-status')?.innerText.includes(`${move}手目 /`)",
        arg=move_number,
    )


def fill_key_position(card, index: int) -> None:
    card.locator('[data-field="title"]').fill(f"重要局面{index}")
    card.locator('[data-field="fact"]').fill(f"事実{index}")
    card.locator('[data-field="interpretation"]').fill(f"解釈{index}")
    card.locator('[data-field="hypothesis"]').fill(f"仮説{index}")


def run() -> int:
    checks = Checks()
    logs: list[str] = []
    screenshot = ROOT / "BROWSER_VERIFICATION_SCREENSHOT.png"
    backup_path = ROOT / "browser-verification-backup.json"

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/chromium", headless=True, args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.on("console", lambda msg: logs.append(f"console {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: logs.append(f"pageerror: {err}"))
        page.set_content(build_html(), wait_until="load")
        wait_initialized(page)

        # Initial Step UI / Help / accessibility.
        checks.check("Ver1.7 title", "Ver.1.7" in page.title(), page.title())
        checks.check("Initial Step1", "STEP 1 / 7" in page.locator("#step-current-status").inner_text())
        checks.check("Seven Step menu", page.locator("#step-menu option").count() == 7)
        checks.check("Current Step aria-label", "現在のステップ" in (page.locator("#step-current-status").get_attribute("aria-label") or ""))
        checks.check("Help header button", page.locator("#nav-help").is_visible())
        checks.check("KIF paste touch target", page.locator("#clear-kif-paste").bounding_box()["height"] >= 48)
        checks.check("KIF paste 16px on smartphone", page.evaluate("getComputedStyle(document.querySelector('#kif-paste-text')).fontSize") == "16px")

        page.click("#nav-help")
        checks.check("Help view opens", page.locator("#help-view").is_visible())
        checks.check("Help explains backup", "Backup" in page.locator("#help-backup").inner_text())
        checks.check("Help explains Replay", "Page全体" in page.locator("#help-replay").inner_text())
        page.click("#help-back-workflow")
        checks.check("Help returns to workflow", page.locator("#workflow-view").is_visible())

        # Paste / Preview / Retry / Clear / Clipboard / File / Drag & Drop.
        basic_kif = (ROOT / "fixtures/replay-basic.kif").read_text(encoding="utf-8")
        alt_kif = (ROOT / "fixtures/normal-resign-utf8.kifu").read_text(encoding="utf-8")
        page.fill("#kif-paste-text", basic_kif)
        page.click("#preview-kif-paste")
        page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        checks.check("Paste Preview", "先手太郎" in page.locator("#kif-import-preview").inner_text())
        checks.check("Preview not saved", page.locator("#saved-count").inner_text() == "0")
        page.click("#cancel-kif-import")
        checks.check("Retry hides Preview", page.locator("#kif-import-preview").is_hidden())
        checks.check("Retry preserves paste", page.locator("#kif-paste-text").input_value() == basic_kif)
        page.fill("#kif-paste-text", alt_kif)
        page.click("#preview-kif-paste")
        page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        checks.check("Retry different KIF", "勇太" in page.locator("#kif-import-preview").inner_text())
        page.click("#clear-kif-paste")
        checks.check("Clear empties temporary KIF", page.locator("#kif-paste-text").input_value() == "")
        checks.check("Clear does not save/delete", page.locator("#saved-count").inner_text() == "0")

        page.evaluate("text => navigator.clipboard.writeText(text)", basic_kif)
        page.click("#read-kif-clipboard")
        page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        checks.check("Clipboard Preview", "先手太郎" in page.locator("#kif-import-preview").inner_text())
        page.click("#cancel-kif-import")

        page.set_input_files("#kif-file-input", str(ROOT / "fixtures/replay-basic.kif"))
        page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        checks.check("File Preview", "5" in page.locator("#kif-import-preview").inner_text())
        page.click("#cancel-kif-import")

        page.evaluate("""text => {
          const file = new File([text], 'drop-v14.kif', {type:'text/plain'});
          const dt = new DataTransfer(); dt.items.add(file);
          document.querySelector('#kif-drop-zone').dispatchEvent(new DragEvent('drop', {bubbles:true, cancelable:true, dataTransfer:dt}));
        }""", basic_kif)
        page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        checks.check("Drag Drop Preview", "drop-v14.kif" in page.locator("#kif-import-preview").inner_text())
        page.click("#cancel-kif-import")

        # Register KIF -> Step2 and save game only. Use opening header for Ver.1.7 summary verification.
        summary_kif = basic_kif.replace("手合割：平手", "戦型：四間飛車\n手合割：平手")
        page.fill("#kif-paste-text", summary_kif)
        page.click("#preview-kif-paste")
        page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        page.click("#apply-kif-import")
        checks.check("Apply moves to Step2", "STEP 2 / 7" in page.locator("#step-current-status").inner_text())
        checks.check("Sente name mapped", page.locator('[name="senteName"]').input_value() == "先手太郎")
        checks.check("Gote name mapped", page.locator('[name="goteName"]').input_value() == "後手花子")
        checks.check("Game remains unsaved after apply", page.locator("#saved-count").inner_text() == "0")
        page.fill('[name="note"]', "大会メモ")
        page.click("#save-game-and-exit")
        page.wait_for_function("document.querySelector('#saved-count').textContent === '1'")
        checks.check("Game-only save opens Viewer", page.locator("#library-view").is_visible())
        list_text = page.locator("#saved-review-list").inner_text()
        checks.check("Game-only status visible", "棋譜のみ" in list_text)
        checks.check("Saved list game date label", "対局日：2026/08/02" in list_text, list_text)
        checks.check("Saved list opening", "戦型：四間飛車" in list_text, list_text)
        checks.check("Saved list raw KIF hidden", "#KIF version" not in list_text and "棋戦：" not in list_text, list_text)
        checks.check("Saved list opponent", "対戦相手：後手花子" in list_text, list_text)
        checks.check("Saved list result", "勝敗：勝ち" in list_text, list_text)
        checks.check("Saved list move count", "手数：5手" in list_text, list_text)
        checks.check("Saved list analysis status separate", "解析状態：未解析" in list_text, list_text)
        stored = json.loads(page.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
        checks.check("Game-only persisted", stored["gameReviews"][0]["workflowStatus"] == "GAME_ONLY")
        checks.check("Zero key positions persisted", len(stored["gameReviews"][0]["keyPositions"]) == 0)
        checks.check("Lifecycle timestamps persisted", bool(stored["gameReviews"][0].get("createdAt")) and bool(stored["gameReviews"][0].get("updatedAt")))
        checks.check("Sente/Gote persisted", stored["gameReviews"][0]["senteName"] == "先手太郎" and stored["gameReviews"][0]["goteName"] == "後手花子")

        # Saved Game Viewer -> Replay.
        page.click('#saved-review-list [data-view-review]')
        checks.check("Saved detail opens", "棋譜本文" in page.locator("#saved-review-detail").inner_text())
        checks.check("Incomplete markdown disabled", page.locator('#saved-review-detail [data-preview-observation-card]').is_disabled())
        page.click('#saved-review-detail [data-replay-review]')
        page.wait_for_function("document.querySelectorAll('.replay-square').length === 81")
        checks.check("Saved Replay opens Step3", "STEP 3 / 7" in page.locator("#step-current-status").inner_text())
        checks.check("Board has 81 squares", page.locator(".replay-square").count() == 81)
        checks.check("Board initial piece count 40", page.locator(".replay-square .replay-piece").count() == 40)
        checks.check("Piece is SVG", page.locator(".replay-square svg.replay-piece").count() == 40)
        checks.check("Board accessible names", page.locator('.replay-square[aria-label*="の"]').count() >= 40)
        initial_geometry = page.evaluate("""() => {
          const grid = document.querySelector('.replay-board-grid').getBoundingClientRect();
          const squares = [...document.querySelectorAll('.replay-square')].map(el => el.getBoundingClientRect());
          const widths = squares.map(r => Math.round(r.width * 1000) / 1000);
          const heights = squares.map(r => Math.round(r.height * 1000) / 1000);
          return {gridWidth:grid.width, gridHeight:grid.height, widths:[...new Set(widths)], heights:[...new Set(heights)]};
        }""")
        checks.check("Board grid has one square width", len(initial_geometry["widths"]) == 1, str(initial_geometry))
        checks.check("Board grid has one square height", len(initial_geometry["heights"]) == 1, str(initial_geometry))
        checks.check("Board grid is square", abs(initial_geometry["gridWidth"] - initial_geometry["gridHeight"]) <= 1, str(initial_geometry))
        checks.check("Replay Next touch target", page.locator("#replay-next").bounding_box()["height"] >= 48)
        piece_path = page.locator('.replay-piece .piece-body').first.get_attribute('d') or ''
        checks.check("Polished piece outline", piece_path.startswith('M50 5 C52 5 53.5 5.6 55.1 6.6'), piece_path)

        baseline_y = page.evaluate("window.scrollY")
        for _ in range(5):
            page.evaluate("document.querySelector('#replay-next').click()")
        checks.check("Next navigation", "5手目 / 5手" in page.locator("#replay-status").inner_text())
        checks.check("Next keeps Page scroll", abs(page.evaluate("window.scrollY") - baseline_y) <= 1)
        for _ in range(5):
            page.evaluate("document.querySelector('#replay-previous').click()")
        checks.check("Previous navigation", "0手目 / 5手" in page.locator("#replay-status").inner_text())
        checks.check("Previous keeps Page scroll", abs(page.evaluate("window.scrollY") - baseline_y) <= 1)
        jump(page, 3)
        checks.check("Current Move highlight", page.locator('#replay-move-3.is-current[aria-current="true"]').count() == 1)
        checks.check("Horse promoted SVG", page.locator('[data-square="22"] svg.replay-piece.is-promoted').count() == 1)
        checks.check("Horse text", "馬" in page.locator('[data-square="22"]').inner_text())
        promoted_geometry = page.evaluate("""() => { const r=document.querySelector('.replay-board-grid').getBoundingClientRect(); const sq=document.querySelector('.replay-square').getBoundingClientRect(); return {gridWidth:r.width,gridHeight:r.height,squareWidth:sq.width,squareHeight:sq.height}; }""")
        checks.check("Promoted move keeps grid width", abs(promoted_geometry["gridWidth"] - initial_geometry["gridWidth"]) <= 1, str((initial_geometry, promoted_geometry)))
        checks.check("Promoted move keeps grid height", abs(promoted_geometry["gridHeight"] - initial_geometry["gridHeight"]) <= 1, str((initial_geometry, promoted_geometry)))
        injected_layout = page.evaluate("""async () => {
          const { shogiPieceMarkup } = await import('ShogiPieceSvg.js');
          const square = document.querySelector('.replay-square');
          const grid = document.querySelector('.replay-board-grid');
          const original = square.innerHTML;
          const baseline = grid.getBoundingClientRect();
          const labels = ['成桂','成香','成銀','馬','龍'];
          const rows = [];
          for (const label of labels) {
            square.innerHTML = shogiPieceMarkup({label, type:'TEST', promoted:true, rotated:false}, {containerClassName:'replay-piece-container'});
            await new Promise(requestAnimationFrame);
            const g = grid.getBoundingClientRect();
            const sq = square.getBoundingClientRect();
            const pc = square.querySelector('.replay-piece-container').getBoundingClientRect();
            rows.push({label, gridWidth:g.width, gridHeight:g.height, squareWidth:sq.width, squareHeight:sq.height, contained:pc.width <= sq.width + .01 && pc.height <= sq.height + .01});
          }
          square.innerHTML = original;
          return {baseline:{width:baseline.width,height:baseline.height}, rows};
        }""")
        for row in injected_layout["rows"]:
            checks.check(f"Fixed grid injected {row['label']}", abs(row["gridWidth"] - injected_layout["baseline"]["width"]) <= 1 and abs(row["gridHeight"] - injected_layout["baseline"]["height"]) <= 1 and row["contained"], str(row))
        before_flip_y = page.evaluate("window.scrollY")
        page.evaluate("document.querySelector('#replay-flip').click()")
        checks.check("Board flip", page.locator("#replay-flip").get_attribute("aria-pressed") == "true")
        checks.check("Flip keeps Page scroll", abs(page.evaluate("window.scrollY") - before_flip_y) <= 1)

        # Shared piece component in real browser for all requested promoted labels.
        piece_result = page.evaluate("""async () => {
          const { shogiPieceSvg } = await import('ShogiPieceSvg.js');
          const host = document.createElement('div'); host.id = 'v14-piece-check'; document.body.appendChild(host);
          const labels = ['成桂','成香','成銀','馬','龍'];
          host.innerHTML = labels.map((label, i) => shogiPieceSvg({label, type:'TEST', promoted:true, rotated:i%2===1})).join('');
          return labels.map(label => ({label, found:[...host.querySelectorAll('svg')].some(svg => svg.textContent.includes(label)), two:[...host.querySelectorAll('svg')].find(svg => svg.textContent.includes(label))?.classList.contains('is-two-character') ?? false}));
        }""")
        for item in piece_result:
            checks.check(f"Promoted piece browser render {item['label']}", item["found"])
        checks.check("Two-character promoted pieces use compact class", all(item["two"] for item in piece_result if item["label"] in ["成桂", "成香", "成銀"]))

        # Engine analysis flow uses explicit verification Mock only; it is not a real-engine claim.
        checks.check("Engine Panel is inside Step3", page.locator('#engine-analysis-panel').is_visible() and "STEP 3 / 7" in page.locator("#step-current-status").inner_text())
        checks.check("Engine Analyze button touch target", page.locator("#analyze-game").bounding_box()["height"] >= 48)
        checks.check("Engine analysis status accessible", page.locator("#engine-analysis-status").get_attribute("role") == "status")
        page.evaluate("document.querySelector('#analyze-game').click()")
        page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status === 'ANALYZED'", timeout=10000)
        checks.check("Engine status analyzed", "解析済み" in page.locator("#engine-analysis-status").inner_text())
        checks.check("Engine verification is labeled Mock", "Mock Engine" in page.locator("#engine-analysis-status").inner_text())
        candidate_count = page.locator("[data-engine-candidate]").count()
        checks.check("Engine candidate displayed", candidate_count >= 1)
        checks.check("Engine candidate max five", candidate_count <= 5, str(candidate_count))
        checks.check("Engine candidate Replay button", page.locator("[data-engine-replay-ply]").first.is_enabled())
        checks.check("Engine candidate KeyPosition button", page.locator("[data-engine-add-key-position]").first.is_enabled())
        checks.check("Analysis progress text recorded", "局面を解析" in page.locator("#engine-analysis-progress-text").inner_text())
        candidate_ply = int(page.locator("[data-engine-replay-ply]").first.get_attribute("data-engine-replay-ply"))
        candidate_move_text = page.locator("[data-engine-candidate]").first.locator(".engine-candidate-data dd").first.inner_text()
        candidate_jump_y = page.evaluate("window.scrollY")
        page.evaluate("document.querySelector('[data-engine-replay-ply]').click()")
        page.wait_for_function("ply => document.querySelector('#replay-status')?.innerText.includes(`${ply}手目 /`)", arg=candidate_ply)
        checks.check("Candidate to Replay stays Step3", "STEP 3 / 7" in page.locator("#step-current-status").inner_text())
        checks.check("Candidate Replay Current Ply", page.locator("#replay-jump-number").input_value() == str(candidate_ply))
        checks.check("Candidate Replay Current Move", candidate_move_text in page.locator("#replay-status").inner_text())
        checks.check("Candidate Replay Move highlight", page.locator(f'#replay-move-{candidate_ply}.is-current[aria-current="true"]').count() == 1)
        checks.check("Candidate Jump keeps Page scroll", abs(page.evaluate("window.scrollY") - candidate_jump_y) <= 1, str((candidate_jump_y, page.evaluate("window.scrollY"))))
        candidate_board = page.evaluate("""() => ({squares:document.querySelectorAll('.replay-square').length, pieces:document.querySelectorAll('.replay-square .replay-piece').length, boardLabel:document.querySelector('#shogi-board').getAttribute('aria-label')})""")
        checks.check("Candidate Replay Board Position", candidate_board["squares"] == 81 and f"{candidate_ply}手目" in candidate_board["boardLabel"], str(candidate_board))
        add_y = page.evaluate("window.scrollY")
        page.evaluate("document.querySelector('[data-engine-add-key-position]').click()")
        checks.check("Candidate add keeps Page scroll", abs(page.evaluate("window.scrollY") - add_y) <= 1, str((add_y, page.evaluate("window.scrollY"))))
        checks.check("Candidate to KeyPosition", page.evaluate("[...document.querySelectorAll('[data-field=moveNumber]')].filter(x=>x.value).length") == 1)
        checks.check("Candidate KeyPosition move number", page.evaluate("[...document.querySelectorAll('[data-field=moveNumber]')].find(x=>x.value)?.value") == str(candidate_ply))
        # Duplicate candidate must be rejected by the existing KeyPosition rule.
        page.evaluate("document.querySelector('[data-engine-add-key-position]').click()")
        checks.check("Candidate duplicate rejected", page.evaluate("[...document.querySelectorAll('[data-field=moveNumber]')].filter(x=>x.value).length") == 1)
        checks.check("Candidate duplicate message", "同じ手数" in page.locator("#add-current-position-reason").inner_text())
        goto_step(page, 4)
        checks.check("STEP4 contains candidate-added normal KeyPosition", page.evaluate("ply => [...document.querySelectorAll('[data-field=moveNumber]')].some(x => x.value === String(ply))", candidate_ply))
        checks.check("FACT example placeholder", "相手の飛車が自陣へ侵入" in page.locator('[data-field="fact"]').first.get_attribute("placeholder"))
        checks.check("INTERPRETATION example placeholder", "自玉の安全" in page.locator('[data-field="interpretation"]').first.get_attribute("placeholder"))
        checks.check("HYPOTHESIS example placeholder", "一度受けてから" in page.locator('[data-field="hypothesis"]').first.get_attribute("placeholder"))
        # Return to a clean state so legacy manual KeyPosition regression remains independent.
        page.evaluate("""() => { const card=[...document.querySelectorAll('[data-key-position]')].find(c=>c.querySelector('[data-field=moveNumber]').value); card?.querySelector('[data-remove-key-position]')?.click(); }""")
        checks.check("Engine candidate removal returns manual flow clean", page.evaluate("[...document.querySelectorAll('[data-field=moveNumber]')].filter(x=>x.value).length") == 0)
        # Cancel can interrupt a re-analysis from STEP3.
        goto_step(page, 3)
        page.evaluate("window.__SHOGI_REFLECTION_MOCK_DELAY_MS__ = 30")
        page.evaluate("document.querySelector('#analyze-game').click()")
        page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status === 'ANALYZING'", timeout=5000)
        checks.check("Analysis Cancel enabled", page.locator("#cancel-analysis").is_enabled())
        page.evaluate("document.querySelector('#cancel-analysis').click()")
        page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status === 'CANCELLED'", timeout=5000)
        checks.check("Analysis Cancel status", "中止" in page.locator("#engine-analysis-status").inner_text())
        page.evaluate("window.__SHOGI_REFLECTION_MOCK_DELAY_MS__ = 1")

        # Add 3 KeyPositions manually and verify Step data survives navigation.
        for move in (1, 3, 5):
            jump(page, move)
            page.click("#add-current-position")
        checks.check("Three replay KeyPositions", page.evaluate("[...document.querySelectorAll('[data-field=moveNumber]')].filter(x=>x.value).length") == 3)
        goto_step(page, 4)
        page.evaluate("""() => { for (const details of document.querySelectorAll('[data-snapshot-details]:not([hidden])')) { details.open = true; details.dispatchEvent(new Event('toggle', {bubbles:true})); } }""")
        page.wait_for_function("document.querySelectorAll('.snapshot-board').length >= 3")
        snapshot_boards = page.locator(".snapshot-board")
        checks.check("Snapshot boards rendered", snapshot_boards.count() >= 3, str(snapshot_boards.count()))
        checks.check("Snapshot board has 81 squares", snapshot_boards.first.locator(".snapshot-square").count() == 81)
        snapshot_geometry = page.evaluate("""() => { const b=document.querySelector('.snapshot-board').getBoundingClientRect(); const sq=[...document.querySelectorAll('.snapshot-board .snapshot-square')].slice(0,81).map(x=>x.getBoundingClientRect()); return {width:b.width,height:b.height,sw:[...new Set(sq.map(r=>Math.round(r.width*1000)/1000))],sh:[...new Set(sq.map(r=>Math.round(r.height*1000)/1000))]}; }""")
        checks.check("Snapshot fixed grid geometry", abs(snapshot_geometry["width"] - snapshot_geometry["height"]) <= 1 and len(snapshot_geometry["sw"]) == 1 and len(snapshot_geometry["sh"]) == 1, str(snapshot_geometry))
        cards = page.locator(".key-position-card")
        for i in range(3):
            fill_key_position(cards.nth(i), i + 1)
        first_title = cards.nth(0).locator('[data-field="title"]').input_value()
        goto_step(page, 5)
        page.fill('[name="gameStory"]', "一局全体の振り返り")
        page.fill('[name="decisionPattern"]', "攻めを急ぐ傾向")
        goto_step(page, 4)
        checks.check("Step navigation keeps entered data", cards.nth(0).locator('[data-field="title"]').input_value() == first_title)
        goto_step(page, 6)
        page.click("#save-reflection-draft")
        stored_draft = json.loads(page.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))["gameReviews"][0]
        checks.check("Draft status persisted", stored_draft["workflowStatus"] == "REFLECTION_IN_PROGRESS")
        checks.check("Draft resumes with KeyPositions", len(stored_draft["keyPositions"]) == 3)

        # Complete conditions and final report.
        page.fill('[name="observationTheme"]', "相手の次の一手を見る")
        page.fill('[name="actionRule1"]', "候補手を二つ並べる")
        goto_step(page, 7)
        checks.check("Final report includes reflection", "一局全体の振り返り" in page.locator("#final-report-preview").inner_text())
        page.click("#complete-reflection")
        completed = json.loads(page.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))["gameReviews"][0]
        checks.check("Completion status persisted", completed["workflowStatus"] == "REFLECTION_COMPLETE")
        checks.check("Completion keeps 3-5 rule", len(completed["keyPositions"]) == 3)
        checks.check("Observation Theme persisted", completed["observationTheme"] == "相手の次の一手を見る")
        checks.check("Execution Rule persisted", completed["actionRules"] == ["候補手を二つ並べる"])

        page.click("#nav-library")
        page.click('#saved-review-list [data-view-review]')
        checks.check("Viewer shows complete status", "振り返り完了" in page.locator("#saved-review-detail").inner_text())
        checks.check("Viewer keeps Analysis Status separate", "解析状態：解析済み" in page.locator("#saved-review-detail").inner_text())
        checks.check("Completed Markdown enabled", page.locator('#saved-review-detail [data-preview-review-markdown]').is_enabled())
        checks.check("Completed Observation Card enabled", page.locator('#saved-review-detail [data-preview-observation-card]').is_enabled())
        page.click('#saved-review-detail [data-preview-review-markdown]')
        checks.check("Markdown Export works", "対局基本情報" in page.locator("#markdown-preview").input_value())
        page.click("#nav-library")
        page.click('#saved-review-list [data-view-review]')
        page.click('#saved-review-detail [data-preview-observation-card]')
        checks.check("Observation Card works", "Observation" in page.locator("#markdown-preview").input_value())

        # Backup -> Delete -> Restore, and Clear remains separate.
        page.click("#nav-library")
        with page.expect_download() as download_info:
            page.click("#download-backup")
        download = download_info.value
        download.save_as(str(backup_path))
        checks.check("Backup JSON downloaded", backup_path.exists() and backup_path.stat().st_size > 100)
        page.click('#saved-review-list [data-view-review]')
        page.once("dialog", lambda dialog: dialog.accept())
        page.click('#saved-review-detail [data-delete-review]')
        page.wait_for_function("document.querySelector('#saved-count').textContent === '0'")
        checks.check("Saved review Delete requires/uses separate operation", page.locator("#saved-count").inner_text() == "0")
        page.set_input_files("#restore-backup", str(backup_path))
        page.wait_for_function("document.querySelector('#saved-count').textContent === '1'")
        checks.check("Backup Restore", page.locator("#saved-count").inner_text() == "1")
        page.click("#nav-new-game")
        page.fill("#kif-paste-text", basic_kif)
        page.click("#clear-kif-paste")
        checks.check("KIF Clear never deletes saved review", page.locator("#saved-count").inner_text() == "1")

        # Long Replay regression: next/previous/first/last/keyboard cannot move page; move list scrolls internally.
        long_page = browser.new_page(viewport={"width": 390, "height": 844})
        long_page.on("pageerror", lambda err: logs.append(f"long pageerror: {err}"))
        long_page.set_content(build_html(), wait_until="load")
        wait_initialized(long_page)
        long_kif = (ROOT / "fixtures/replay-long-300.kif").read_text(encoding="utf-8")
        long_page.fill("#kif-paste-text", long_kif)
        long_page.click("#preview-kif-paste")
        long_page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        long_page.click("#apply-kif-import")
        goto_step(long_page, 3)
        long_page.wait_for_function("document.querySelector('#replay-jump-number')?.max === '300'")
        # A normal-length fixture verifies the formal 3-5 primary-candidate presentation rule.
        long_page.evaluate("document.querySelector('#analyze-game').click()")
        long_page.wait_for_function("document.querySelector('#engine-analysis-status')?.dataset.status === 'ANALYZED'", timeout=20000)
        long_candidate_count = long_page.locator("[data-engine-candidate]").count()
        checks.check("Long game Candidate 3-5", 3 <= long_candidate_count <= 5, str(long_candidate_count))
        long_page.locator("#shogi-board").scroll_into_view_if_needed()
        long_page.wait_for_timeout(100)
        long_y = long_page.evaluate("window.scrollY")
        for _ in range(10):
            long_page.evaluate("document.querySelector('#replay-next').click()")
        checks.check("Long Replay first 10 next", "10手目 / 300手" in long_page.locator("#replay-status").inner_text())
        checks.check("Long first 10 next page scroll stable", abs(long_page.evaluate("window.scrollY") - long_y) <= 1)
        for _ in range(40):
            long_page.evaluate("document.querySelector('#replay-next').click()")
        checks.check("Long Replay 50 next", "50手目 / 300手" in long_page.locator("#replay-status").inner_text())
        checks.check("Long Next page scroll stable", abs(long_page.evaluate("window.scrollY") - long_y) <= 1, str((long_y, long_page.evaluate("window.scrollY"))))
        checks.check("Move list internal scroll follows", long_page.evaluate("document.querySelector('#replay-move-list').scrollTop") > 0)
        checks.check("Move highlight after long next", long_page.locator('#replay-move-50.is-current[aria-current="true"]').count() == 1)
        move_list_jump_y = long_page.evaluate("window.scrollY")
        long_page.evaluate("document.querySelector('#replay-move-10').click()")
        checks.check("Move List Jump", "10手目 / 300手" in long_page.locator("#replay-status").inner_text())
        checks.check("Move List Jump page scroll stable", abs(long_page.evaluate("window.scrollY") - move_list_jump_y) <= 1, str((move_list_jump_y, long_page.evaluate("window.scrollY"))))
        # Return to 50 so the following Previous regression remains comparable.
        long_page.evaluate("document.querySelector('#replay-jump').value='50'; document.querySelector('#replay-jump').dispatchEvent(new Event('input',{bubbles:true}))")
        prev_y = long_page.evaluate("window.scrollY")
        for _ in range(10):
            long_page.evaluate("document.querySelector('#replay-previous').click()")
        checks.check("Long Replay 10 previous", "40手目 / 300手" in long_page.locator("#replay-status").inner_text())
        checks.check("Long Previous page scroll stable", abs(long_page.evaluate("window.scrollY") - prev_y) <= 1)
        for selector, label, expected in (("#replay-first", "First", 0), ("#replay-last", "Last", 300)):
            y = long_page.evaluate("window.scrollY")
            long_page.evaluate(f"document.querySelector('{selector}').click()")
            checks.check(f"Long {label}", f"{expected}手目 / 300手" in long_page.locator("#replay-status").inner_text())
            checks.check(f"Long {label} page scroll stable", abs(long_page.evaluate("window.scrollY") - y) <= 1)
        long_page.evaluate("document.body.focus()")
        keyboard_y = long_page.evaluate("window.scrollY")
        long_page.keyboard.press("ArrowLeft")
        checks.check("Keyboard Replay", "299手目 / 300手" in long_page.locator("#replay-status").inner_text())
        checks.check("Keyboard page scroll stable", abs(long_page.evaluate("window.scrollY") - keyboard_y) <= 1)
        long_page.evaluate("document.querySelector('#add-current-position').click()")
        checks.check("Long Replay KeyPosition add", long_page.evaluate("[...document.querySelectorAll('[data-field=moveNumber]')].some(x => x.value === '299')"))
        long_page.screenshot(path=str(screenshot), full_page=True)

        # Console/page error check after all flows.
        errors = [line for line in logs if "pageerror" in line or "console error" in line]
        checks.check("No browser page errors", len(errors) == 0, " | ".join(errors[:5]))
        browser.close()

    # Browser backup is a temporary verification artifact, not an application deliverable.
    backup_path.unlink(missing_ok=True)

    result_lines = [
        "Shogi Reflection Ver.1.7 Browser Verification",
        "==============================================",
        f"Viewport main: 390x844",
        f"Checks: {len(checks.rows)}",
        f"Passed: {checks.passed}",
        f"Failed: {len(checks.rows) - checks.passed}",
        "Browser: Chromium via Playwright",
        "Automation: yes",
        "",
    ]
    for name, ok, detail in checks.rows:
        suffix = f" | {detail}" if detail else ""
        result_lines.append(f"[{'PASS' if ok else 'FAIL'}] {name}{suffix}")
    result_lines += ["", "Browser logs:", *(logs or ["(none)"])]
    (ROOT / "BROWSER_VERIFICATION_RESULT.txt").write_text("\n".join(result_lines) + "\n", encoding="utf-8")
    print("\n".join(result_lines[:10]))
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
