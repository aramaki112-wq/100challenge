from __future__ import annotations

import base64
import json
import re
import sys
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
    html = re.sub(
        r'<link rel="stylesheet" href="\./style\.css">',
        f"<style>{css}</style>",
        html,
    )
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
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
    key: (index) => [...data.keys()][index] ?? null,
    get length() {{ return data.size; }},
    _dump: () => Object.fromEntries(data.entries())
  }};
  Object.defineProperty(window, 'localStorage', {{ value: storage }});
  let clipboardText = '';
  Object.defineProperty(navigator, 'clipboard', {{ value: {{
    writeText: async (value) => {{ clipboardText = String(value); }},
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


def jump(page, move_number: int) -> None:
    page.fill("#replay-jump-number", str(move_number))
    page.click("#replay-jump-button")
    page.wait_for_function(
        "move => document.querySelector('#replay-status')?.innerText.includes(`${move}手目 /`)",
        arg=move_number,
    )


def card_for_move(page, move_number: int):
    return page.locator(
        f'.key-position-card:has([data-field="moveNumber"][value="{move_number}"])'
    )


def find_card_index(page, move_number: int) -> int:
    return page.evaluate(
        """move => [...document.querySelectorAll('.key-position-card')]
          .findIndex(card => card.querySelector('[data-field="moveNumber"]')?.value === String(move))""",
        move_number,
    )


def read_reference(page, index: int) -> dict:
    return page.evaluate(
        """index => JSON.parse(document.querySelectorAll('.key-position-card')[index]
          .querySelector('[data-field="replayReference"]').value)""",
        index,
    )


def complete_visible_key_positions(page) -> None:
    page.fill('[name="gameStory"]', "盤面を見ながら振り返った。")
    cards = page.locator(".key-position-card")
    for index in range(cards.count()):
        card = cards.nth(index)
        if not card.locator('[data-field="moveNumber"]').input_value():
            continue
        card.locator('[data-field="title"]').fill(f"重要局面{index + 1}")
        card.locator('[data-field="boardState"]').fill("Snapshotを見て自分で記録した盤面Memo。")
        card.locator('[data-field="fact"]').fill("盤上で実際に駒が動いた。")
        card.locator('[data-field="interpretation"]').fill("攻めを急ぎたくなった。")
        card.locator('[data-field="hypothesis"]').fill("相手の狙いを確認できた可能性がある。")
        card.locator('[data-field="myThought"]').fill("候補手を十分に並べていなかった。")
        card.locator('[data-field="opponentIntent"]').fill("こちらの攻めを受けて反撃する狙い。")
        card.locator('[data-field="emotion"]').fill("焦り")
        card.locator('[data-field="decisionImpact"]').fill("確認を省略した。")
        card.locator('[data-field="decisionPattern"]').fill("攻めが見えると確認を省略する。")
        card.locator('[data-field="learning"]').fill("相手の応手を先に言語化する。")
    page.fill('[name="decisionPattern"]', "候補手を省略する。")
    page.fill('[name="observationTheme"]', "相手の次の一手を言葉にする。")
    page.fill('[name="actionRule1"]', "候補手を二つ並べる。")


def remove_move(page, move_number: int) -> None:
    index = find_card_index(page, move_number)
    if index < 0:
        raise AssertionError(f"remove target not found: {move_number}")
    page.locator(".key-position-card").nth(index).locator("[data-remove-key-position]").click()


def run() -> int:
    checks = Checks()
    browser_logs: list[str] = []
    screenshot = ROOT / "BROWSER_VERIFICATION_SCREENSHOT.png"
    final_seed: dict[str, str] = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/usr/bin/chromium",
            headless=True,
            args=["--no-sandbox"],
        )
        page = browser.new_page(viewport={"width": 1280, "height": 1000})
        page.on("console", lambda msg: browser_logs.append(f"console {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: browser_logs.append(f"pageerror: {err}"))
        page.set_content(build_html(), wait_until="load")
        wait_initialized(page)

        checks.check("Application title", page.title() == "将棋振り返りアプリ Ver.1.3｜重要局面登録接続", page.title())
        checks.check("Initial key position cards", page.locator(".key-position-card").count() == 3)
        checks.check("File selection element", page.locator("#kif-file-input").count() == 1)
        checks.check("Drag and Drop element", page.locator("#kif-drop-zone").count() == 1)
        checks.check("Add current position button", page.locator("#add-current-position").count() == 1)
        checks.check("Replay starts unavailable", "棋譜" in page.locator("#replay-empty").inner_text())
        checks.check("Add disabled before replay", page.locator("#add-current-position").is_disabled())

        page.set_input_files("#kif-file-input", str(ROOT / "fixtures/replay-basic.kif"))
        page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        preview_text = page.locator("#kif-import-preview").inner_text()
        checks.check("File selection preview", "先手太郎" in preview_text)
        checks.check("Preview total moves", "5" in preview_text)
        checks.check("Import remains unsaved", page.locator("#saved-count").inner_text() == "0")

        drop_text = (ROOT / "fixtures/replay-basic.kif").read_text(encoding="utf-8")
        page.evaluate("""text => {
          const file = new File([text], 'drop-sample.kif', {type:'text/plain'});
          const dt = new DataTransfer();
          dt.items.add(file);
          document.querySelector('#kif-drop-zone').dispatchEvent(
            new DragEvent('drop', {bubbles:true, cancelable:true, dataTransfer:dt})
          );
        }""", drop_text)
        page.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        checks.check("Drag and Drop preview", "drop-sample.kif" in page.locator("#kif-import-preview").inner_text())

        page.click("#apply-kif-import")
        page.wait_for_function("document.querySelectorAll('.replay-square').length === 81")
        checks.check("Board rendered", page.locator(".replay-square").count() == 81)
        checks.check("Initial position status", "0手目 / 5手" in page.locator("#replay-status").inner_text())
        checks.check("Initial piece count", page.locator(".replay-square .replay-piece").count() == 40)
        checks.check("Form apply not saved", page.locator("#saved-count").inner_text() == "0")
        checks.check("Zero move add disabled", page.locator("#add-current-position").is_disabled())
        checks.check("Zero move reason", "0手目" in page.locator("#add-current-position-reason").inner_text())

        page.click("#replay-next")
        checks.check("Next navigation", "1手目 / 5手" in page.locator("#replay-status").inner_text())
        checks.check("Last move source highlight", page.locator('[data-square="77"].is-last-from').count() == 1)
        checks.check("Last move destination highlight", page.locator('[data-square="76"].is-last-to').count() == 1)
        page.click("#replay-previous")
        checks.check("Previous navigation", "0手目 / 5手" in page.locator("#replay-status").inner_text())
        page.click("#replay-last")
        checks.check("Last navigation", "5手目 / 5手" in page.locator("#replay-status").inner_text())
        page.click("#replay-first")
        checks.check("First navigation", "0手目 / 5手" in page.locator("#replay-status").inner_text())

        page.evaluate("""() => {
          const range = document.querySelector('#replay-jump');
          range.value = '3';
          range.dispatchEvent(new Event('input', {bubbles:true}));
        }""")
        checks.check("Range jump", "3手目 / 5手" in page.locator("#replay-status").inner_text())
        checks.check("Promoted piece rendered", page.locator('[data-square="22"] .replay-piece.is-promoted').inner_text() == "馬")
        checks.check("Captured piece in hand", "角" in page.locator("#sente-hand").inner_text())
        checks.check("Add enabled at replayable move", page.locator("#add-current-position").is_enabled())

        saved_before_add = page.locator("#saved-count").inner_text()
        page.click("#add-current-position")
        first_card = page.locator(".key-position-card").first
        checks.check("Move number auto input", first_card.locator('[data-field="moveNumber"]').input_value() == "3")
        checks.check("Current move auto input", "２二角成" in first_card.locator('[data-field="moveText"]').input_value())
        checks.check("FACT remains empty", first_card.locator('[data-field="fact"]').input_value() == "")
        checks.check("INTERPRETATION remains empty", first_card.locator('[data-field="interpretation"]').input_value() == "")
        checks.check("HYPOTHESIS remains empty", first_card.locator('[data-field="hypothesis"]').input_value() == "")
        checks.check("Emotion remains empty", first_card.locator('[data-field="emotion"]').input_value() == "")
        checks.check("Replay candidate remains unsaved", page.locator("#saved-count").inner_text() == saved_before_add)
        checks.check("Replay origin visible", "Replayから追加" in first_card.locator("[data-replay-origin]").inner_text())
        ref3 = read_reference(page, 0)
        checks.check("Snapshot version stored", ref3["snapshotVersion"] == 1)
        checks.check("Source game stored", ref3["sourceGameId"] == page.locator('[name="reviewId"]').input_value())
        checks.check("Source KIF move stored", ref3["sourceKifMove"]["rawLine"].startswith("3 ２二角成"))
        checks.check("Current position stored", ref3["snapshot"]["currentPosition"]["sideToMove"] == "GOTE")
        checks.check("Previous position stored", ref3["snapshot"]["previousPosition"]["sideToMove"] == "SENTE")
        checks.check("Board state stored", len(ref3["snapshot"]["currentPosition"]["board"]["pieces"]) == 39)
        checks.check("Sente hand stored", ref3["snapshot"]["currentPosition"]["senteHand"]["counts"]["BISHOP"] == 1)
        checks.check("Last move from stored", ref3["snapshot"]["currentPosition"]["lastMoveFrom"] == {"file": 8, "rank": 8})
        checks.check("Last move to stored", ref3["snapshot"]["currentPosition"]["lastMoveTo"] == {"file": 2, "rank": 2})
        checks.check("Orientation not stored", "flipped" not in json.dumps(ref3, ensure_ascii=False))

        first_card.locator("[data-snapshot-details] summary").click()
        page.wait_for_function("document.querySelectorAll('[data-snapshot-preview] .snapshot-square').length === 81")
        checks.check("Small board preview", first_card.locator(".snapshot-square").count() == 81)
        checks.check("Small board promoted piece", first_card.locator(".snapshot-piece.is-promoted").count() >= 1)
        checks.check("Small board hand", "角" in first_card.locator("[data-snapshot-preview]").inner_text())
        checks.check("Snapshot ARIA labels", "2筋2段" in first_card.locator('.snapshot-square[aria-label*="2筋2段"]').first.get_attribute("aria-label"))

        page.click("#add-current-position")
        checks.check("Duplicate warning", "同じ手数" in page.locator("#form-feedback").inner_text())
        checks.check("Duplicate code", "KEY_POSITION_REPLAY_DUPLICATE" in page.locator("#form-feedback").inner_text())
        checks.check("Duplicate focuses existing card", page.evaluate("document.activeElement?.dataset?.field") == "title")
        checks.check("Duplicate does not add card", page.evaluate("[...document.querySelectorAll('.key-position-card [data-field=\"moveNumber\"]')].filter(x=>x.value==='3').length") == 1)

        page.click("#replay-flip")
        checks.check("Board flip state", page.locator("#replay-flip").get_attribute("aria-pressed") == "true")
        first_square = page.locator(".replay-square").first.get_attribute("data-square")
        checks.check("Flipped square order", first_square == "19", str(first_square))
        top_hand_id = page.evaluate("document.querySelector('#shogi-board').previousElementSibling.id")
        checks.check("Hands swap on flip", top_hand_id == "sente-hand", str(top_hand_id))
        jump(page, 4)
        page.click("#add-current-position")
        index4 = find_card_index(page, 4)
        ref4 = read_reference(page, index4)
        checks.check("Add while flipped", index4 >= 0)
        checks.check("Flipped add internal from", ref4["snapshot"]["currentPosition"]["lastMoveFrom"] == {"file": 3, "rank": 1})
        checks.check("Flipped add internal to", ref4["snapshot"]["currentPosition"]["lastMoveTo"] == {"file": 2, "rank": 2})
        checks.check("Flipped setting not persisted", "flipped" not in json.dumps(ref4, ensure_ascii=False))

        for move in (1, 2, 5):
            jump(page, move)
            page.click("#add-current-position")
        checks.check("Five candidates registered", sum(1 for m in (1, 2, 3, 4, 5) if find_card_index(page, m) >= 0) == 5)
        checks.check("Five item limit disables add", page.locator("#add-current-position").is_disabled())
        checks.check("Five item limit reason", "5件登録済み" in page.locator("#add-current-position-reason").inner_text())
        checks.check("Manual add also disabled", page.locator("#add-key-position").is_disabled())

        remove_move(page, 1)
        remove_move(page, 2)
        checks.check("Candidate delete", page.locator(".key-position-card").count() == 3)
        checks.check("Delete re-enables add", page.locator("#add-current-position").is_enabled())

        page.locator("body").click(position={"x": 5, "y": 5})
        page.keyboard.press("Home")
        page.keyboard.press("ArrowRight")
        checks.check("Keyboard ArrowRight", "1手目 / 5手" in page.locator("#replay-status").inner_text())
        page.keyboard.press("End")
        checks.check("Keyboard End", "5手目 / 5手" in page.locator("#replay-status").inner_text())
        page.focus('[name="opponentName"]')
        page.keyboard.press("ArrowLeft")
        checks.check("Input focus ignores shortcut", "5手目 / 5手" in page.locator("#replay-status").inner_text())
        page.click('#replay-move-list [data-jump="4"]')
        checks.check("Move list click jump", "4手目 / 5手" in page.locator("#replay-status").inner_text())
        checks.check("Current move highlight", page.locator('#replay-move-list .replay-move-row.is-current[data-jump="4"]').count() == 1)
        checks.check("Termination displayed", "投了（終局）" in page.locator("#replay-move-list").inner_text())

        complete_visible_key_positions(page)
        page.click('#game-review-form button[type="submit"]')
        page.wait_for_function("document.querySelector('#saved-count').textContent === '1'")
        checks.check("Save", page.locator("#saved-count").inner_text() == "1")
        stored = json.loads(page.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
        stored_kps = stored["gameReviews"][0]["keyPositions"]
        checks.check("Snapshot persisted", sum(1 for item in stored_kps if item.get("replayReference")) == 3)
        checks.check("User FACT persisted separately", all(item["fact"] == "盤上で実際に駒が動いた。" for item in stored_kps))
        checks.check("Top-level schema compatible", stored["schemaVersion"] == 1)

        page.click('#saved-review-list [data-view-review]')
        detail_text = page.locator("#saved-review-detail").inner_text()
        checks.check("Saved review detail", "対局の物語" in detail_text)
        checks.check("Detail replay button", page.locator('#saved-review-detail [data-replay-review]').count() == 1)
        page.click('#saved-review-detail [data-replay-review]')
        checks.check("Replay from saved detail", "0手目 / 5手" in page.locator("#replay-status").inner_text())

        page.click('#saved-review-detail [data-preview-review-markdown]')
        review_markdown = page.locator("#markdown-preview").input_value()
        checks.check("Review Markdown preview", "７六歩(77)" in review_markdown)
        checks.check("Review Markdown keeps snapshot info", "Replay Snapshot" in review_markdown)
        page.click("#copy-markdown")
        checks.check("Markdown clipboard", "将棋対局振り返り" in page.evaluate("navigator.clipboard.readText()"))
        page.click('#saved-review-detail [data-preview-observation-card]')
        checks.check("Observation Card preview", "相手の次の一手を言葉にする" in page.locator("#markdown-preview").input_value())

        seed_after_first_save = page.evaluate("localStorage._dump()")
        page.screenshot(path=str(screenshot), full_page=True)

        # Reload: saved Review is loaded, then a saved-detail Replay can enter edit mode and add a candidate without immediate persistence.
        page2 = browser.new_page(viewport={"width": 1280, "height": 1000})
        page2.on("console", lambda msg: browser_logs.append(f"reload console {msg.type}: {msg.text}"))
        page2.on("pageerror", lambda err: browser_logs.append(f"reload pageerror: {err}"))
        page2.set_content(build_html(seed_after_first_save), wait_until="load")
        wait_initialized(page2)
        page2.wait_for_function("document.querySelector('#saved-count').textContent === '1'")
        checks.check("Reload restores saved review", page2.locator("#saved-count").inner_text() == "1")
        new_form_id = page2.locator('[name="reviewId"]').input_value()
        page2.click('#saved-review-list [data-view-review]')
        page2.wait_for_function("document.querySelectorAll('.replay-square').length === 81")
        checks.check("Replay after reload", "0手目 / 5手" in page2.locator("#replay-status").inner_text())
        saved_review_id = json.loads(seed_after_first_save[STORAGE_KEY])["gameReviews"][0]["reviewId"]
        checks.check("Detail view does not pre-edit", new_form_id != saved_review_id)
        jump(page2, 1)
        page2.click("#add-current-position")
        checks.check("Saved detail auto enters edit state", page2.locator('[name="reviewId"]').input_value() == saved_review_id)
        checks.check("Saved detail candidate added", find_card_index(page2, 1) >= 0)
        checks.check("Saved detail add remains unsaved", len(json.loads(page2.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))["gameReviews"][0]["keyPositions"]) == 3)
        index1 = find_card_index(page2, 1)
        card1 = page2.locator(".key-position-card").nth(index1)
        card1.locator('[data-field="title"]').fill("保存済み対局から追加")
        card1.locator('[data-field="boardState"]').fill("追加局面のMemo")
        card1.locator('[data-field="fact"]').fill("先手が歩を進めた。")
        card1.locator('[data-field="interpretation"]').fill("序盤の方針を示す手と受け取った。")
        card1.locator('[data-field="hypothesis"]').fill("別の初手も比較できる。")
        page2.click('#game-review-form button[type="submit"]')
        page2.wait_for_timeout(100)
        updated = json.loads(page2.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
        checks.check("Saved detail edit saves only on Save", len(updated["gameReviews"][0]["keyPositions"]) == 4)
        checks.check("Update does not create duplicate Review", page2.locator("#saved-count").inner_text() == "1")
        checks.check("Snapshot survives saved edit", updated["gameReviews"][0]["keyPositions"][-1]["replayReference"] is not None)
        final_seed = page2.evaluate("localStorage._dump()")

        # Unsupported handicap and invalid KIF preserve current saved data.
        page2.set_input_files("#kif-file-input", str(ROOT / "fixtures/replay-unsupported-handicap.kif"))
        page2.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        page2.click("#apply-kif-import")
        checks.check("Unsupported handicap replay error", "SHOGI_INITIAL_POSITION_UNSUPPORTED" in page2.locator("#replay-error").inner_text())
        checks.check("Replay error preserves saved review", page2.locator("#saved-count").inner_text() == "1")
        before_kifu = page2.locator('[name="kifuText"]').input_value()
        page2.set_input_files("#kif-file-input", str(ROOT / "fixtures/broken-no-moves.kifu"))
        page2.wait_for_function("document.querySelector('#kif-import-status').dataset.kind === 'error'")
        checks.check("Invalid KIF error displayed", "KIF" in page2.locator("#kif-import-status").inner_text())
        checks.check("Invalid import preserves current Form", page2.locator('[name="kifuText"]').input_value() == before_kifu)
        checks.check("Invalid import preserves saved review", page2.locator("#saved-count").inner_text() == "1")

        # JSON Backup Restore + atomic protection against a tampered snapshot.
        backup_json = final_seed[STORAGE_KEY]
        page_backup = browser.new_page(viewport={"width": 1000, "height": 900})
        page_backup.on("console", lambda msg: browser_logs.append(f"backup console {msg.type}: {msg.text}"))
        page_backup.on("pageerror", lambda err: browser_logs.append(f"backup pageerror: {err}"))
        page_backup.set_content(build_html(), wait_until="load")
        wait_initialized(page_backup)
        page_backup.set_input_files("#restore-backup", {
            "name": "Shogi-Reflection-Backup-2026-08-02.json",
            "mimeType": "application/json",
            "buffer": backup_json.encode("utf-8"),
        })
        page_backup.wait_for_function("document.querySelector('#saved-count').textContent === '1'")
        checks.check("Backup restore", page_backup.locator("#saved-count").inner_text() == "1")
        restored_ref_count = page_backup.evaluate(
            f"JSON.parse(localStorage.getItem('{STORAGE_KEY}')).gameReviews[0].keyPositions.filter(x=>x.replayReference).length"
        )
        checks.check("Backup restore keeps snapshots", restored_ref_count == 4)
        tampered = json.loads(backup_json)
        tampered["gameReviews"][0]["keyPositions"][0]["replayReference"]["snapshot"]["snapshotVersion"] = 999
        page_backup.set_input_files("#restore-backup", {
            "name": "tampered.json",
            "mimeType": "application/json",
            "buffer": json.dumps(tampered, ensure_ascii=False).encode("utf-8"),
        })
        page_backup.wait_for_timeout(100)
        checks.check("Tampered backup error displayed", "処理できませんでした" in page_backup.locator("#form-feedback").inner_text())
        checks.check("Tampered backup atomic restore", page_backup.locator("#saved-count").inner_text() == "1")
        checks.check("Tampered backup preserves snapshots", page_backup.evaluate(
            f"JSON.parse(localStorage.getItem('{STORAGE_KEY}')).gameReviews[0].keyPositions.filter(x=>x.replayReference).length"
        ) == 4)

        # Ver.1.2-compatible data: no replayReference and no newly optional KeyPosition fields.
        legacy = json.loads(backup_json)
        for review in legacy["gameReviews"]:
            for kp in review["keyPositions"]:
                kp.pop("moveText", None)
                kp.pop("decisionPattern", None)
                kp.pop("learning", None)
                kp.pop("replayReference", None)
        page_legacy = browser.new_page(viewport={"width": 1000, "height": 900})
        page_legacy.set_content(build_html({STORAGE_KEY: json.dumps(legacy, ensure_ascii=False)}), wait_until="load")
        wait_initialized(page_legacy)
        page_legacy.wait_for_function("document.querySelector('#saved-count').textContent === '1'")
        checks.check("Ver.1.2 data loads", page_legacy.locator("#saved-count").inner_text() == "1")
        page_legacy.click('#saved-review-list [data-edit-review]')
        checks.check("Legacy KeyPosition has no forced snapshot", page_legacy.locator('[data-field="replayReference"][value=""]').count() == 4)
        checks.check("Legacy KeyPosition remains editable", page_legacy.locator('.key-position-card [data-field="fact"]').first.input_value() != "")

        # Partial replay: only replayable positions can be added and Warning is retained.
        page_warning = browser.new_page(viewport={"width": 1000, "height": 900})
        page_warning.set_content(build_html(), wait_until="load")
        wait_initialized(page_warning)
        page_warning.set_input_files("#kif-file-input", str(ROOT / "fixtures/replay-partial-invalid.kif"))
        page_warning.wait_for_function("!document.querySelector('#kif-import-preview').hidden")
        page_warning.click("#apply-kif-import")
        page_warning.wait_for_function("document.querySelectorAll('.replay-square').length === 81")
        checks.check("Partial replay warning shown", "SHOGI_CAPTURE_INVALID" in page_warning.locator("#replay-warning").inner_text())
        jump(page_warning, 2)
        page_warning.click("#add-current-position")
        warning_ref = read_reference(page_warning, 0)
        checks.check("Warning position can be added", warning_ref["snapshot"]["moveNumber"] == 2)
        checks.check("Replay warning retained", warning_ref["replayWarning"]["code"] == "SHOGI_CAPTURE_INVALID")
        checks.check("Warning origin visible", "Warningあり" in page_warning.locator("[data-replay-origin]").first.inner_text())
        checks.check("Failure move not selectable", page_warning.locator("#replay-jump-number").get_attribute("max") == "2")

        # Smartphone layout with saved snapshot data.
        page_mobile = browser.new_page(viewport={"width": 390, "height": 844})
        page_mobile.set_content(build_html(final_seed), wait_until="load")
        wait_initialized(page_mobile)
        page_mobile.click('#saved-review-list [data-view-review]')
        page_mobile.wait_for_function("document.querySelectorAll('.replay-square').length === 81")
        grid_columns = page_mobile.evaluate("getComputedStyle(document.querySelector('.replay-layout')).gridTemplateColumns")
        board_width = page_mobile.locator("#shogi-board").bounding_box()["width"]
        checks.check("Smartphone vertical replay layout", " " not in grid_columns.strip(), grid_columns)
        checks.check("Smartphone board fits viewport", board_width <= 390, str(board_width))
        checks.check("Smartphone navigation buttons visible", page_mobile.locator("#replay-next").is_visible())
        jump(page_mobile, 3)
        checks.check("Smartphone add button visible", page_mobile.locator("#add-current-position").is_visible())
        page_mobile.click('#saved-review-detail [data-edit-review]')
        snapshot_details = page_mobile.locator("[data-snapshot-details]:not([hidden])").first
        snapshot_details.locator("summary").click()
        page_mobile.wait_for_function("document.querySelectorAll('[data-snapshot-preview] .snapshot-square').length >= 81")
        preview_width = snapshot_details.locator(".snapshot-board").bounding_box()["width"]
        checks.check("Smartphone snapshot preview fits viewport", preview_width <= 390, str(preview_width))

        browser.close()

    ignored_console_markers = (
        "KifImportError",
        "PersistenceError",
        "KEY_POSITION_REPLAY_SNAPSHOT_VERSION_UNSUPPORTED",
    )
    errors = [
        line for line in browser_logs
        if ("pageerror" in line or "console error" in line)
        and not any(marker in line for marker in ignored_console_markers)
    ]
    checks.check("Unexpected browser errors", len(errors) == 0, " | ".join(errors))

    report = [
        "Shogi Reflection Ver.1.3 Browser Verification",
        "Date: 2026-08-02",
        "",
        "Execution method:",
        "- Chromium headless via Playwright",
        "- Original index.html, style.css and ES Modules loaded through an Import Map",
        "- Native File, DataTransfer, DragEvent, Keyboard, JSON Backup and responsive viewport boundaries",
        "- Snapshot add, duplicate prevention, five-item limit, save/reload, legacy data and atomic restore",
        "",
    ]
    report.extend(
        f"{'PASS' if ok else 'FAIL'} | {name}" + (f" | {detail}" if detail else "")
        for name, ok, detail in checks.rows
    )
    report.extend([
        "",
        f"Total: {len(checks.rows)}",
        f"Passed: {checks.passed}",
        f"Failed: {len(checks.rows) - checks.passed}",
        f"Screenshot: {screenshot.name}",
    ])
    (ROOT / "BROWSER_VERIFICATION_RESULT.txt").write_text("\n".join(report) + "\n", encoding="utf-8")
    print("\n".join(report[-5:]))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(run())
    except Exception as error:
        failure = [
            "Shogi Reflection Ver.1.3 Browser Verification",
            "Date: 2026-08-02",
            "",
            f"FAILED: {type(error).__name__}: {error}",
        ]
        (ROOT / "BROWSER_VERIFICATION_RESULT.txt").write_text("\n".join(failure) + "\n", encoding="utf-8")
        print("\n".join(failure), file=sys.stderr)
        raise
