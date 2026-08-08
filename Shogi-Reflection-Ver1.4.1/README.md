# 将棋振り返りアプリ Ver.1.4.1

棋譜を先に保存し、後日Replayしながら、自分のFACT・INTERPRETATION・HYPOTHESISを振り返るBrowser Applicationです。
Ver.1.4.1はVer.1.4のWorkflow・Domain・保存方式を維持したUI安定化版です。

## Ver.1.4.1の中心変更

1. **9×9将棋盤を固定Grid化**
   - 81升を同一Geometryで描画
   - 列だけでなく行も9分割で固定
   - Replay盤／重要局面Snapshot盤で同じ思想を使用
   - 成桂・成香・成銀など2文字駒もSquare Sizeを変更しない
2. **Piece Containerを導入**
   - Square → Piece Container → SVG Piece → Piece Labelの境界を明示
   - SVGや文字がGrid track sizingへ影響しない構造
   - 駒外形は共通五角形、成駒は文字＋Promotion Markで識別
3. **保存済み対局一覧を整理**
   - `対局日：YYYY/MM/DD`を明示
   - 戦型を簡潔に表示
   - Raw KIF Headerを一覧へ表示しない
   - 元KIF Dataそのものは保存・Detail・Backup/Restoreのため保持

## Ver.1.4から維持したもの

- 7 Step UI
- 棋譜だけ先に保存して後日再開するLifecycle
- `棋譜のみ` / `振り返り中` / `振り返り完了`
- 保存済み対局Viewer / Detail / Delete確認
- KIF File / Drag & Drop / Paste / Clipboard / Clear / Retry / Preview
- Position History / Replay Application Service / Replay View Model
- Ver.1.3.2で解決済みのReplay Scroll Policy
- Current Move Highlight / Move List Container内部Scroll
- Board Flip / KeyPosition / Replay Position Snapshot
- 重要局面3〜5件、Observation Theme 1件、実行Rule 1〜3件
- LocalStorage / Backup / Restore Schema Version 1
- Markdown Export / Observation Card
- 日本語UI / Application内取扱説明書

## 起動方法

ES Moduleを利用するため、Local HTTP Serverから開いてください。

```bash
cd Shogi-Reflection-Ver1.4.1
python -m http.server 8000
```

Browserで `http://localhost:8000` を開きます。

## Test

```bash
npm test
python3 browser_verify.py
npm run check
```

- Automated Test: 567件
- Browser Automation: 107項目（390×844 / Chromium via Playwright）
- Static Verification: `STATIC_VERIFICATION_RESULT.txt`参照

Browser Automationで実際に確認していない事項を「Browser確認済み」とは記載しません。

## 実使用Flow

```text
対局
↓
KIF登録
↓
棋譜保存
↓
保存済み対局一覧
↓
対局日・戦型を確認
↓
対局を開く
↓
固定9×9盤でReplay
↓
重要局面
↓
FACT / INTERPRETATION / HYPOTHESIS
↓
次局のObservation Theme / 実行Rule
↓
最終レポート
```

## 主要Document

- `Ver.1.4.1操作手順書.md`
- `USER_MANUAL.md`
- `BOARD_FIXED_GRID_DESIGN.md`
- `SAVED_GAME_SUMMARY_DISPLAY_DESIGN.md`
- `REPLAY_SCROLL_POLICY.md`
- `STEP_UI_DESIGN.md`
- `GAME_SAVE_LIFECYCLE.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `COMPLETION_REPORT.md`
- `TEST_RESULT.txt`
- `BROWSER_VERIFICATION_RESULT.txt`
- `STATIC_VERIFICATION_RESULT.txt`

## 対象外

Ver.1.4.1ではAI Advice、Engine解析、評価値、最善手、AI振り返り問題、振り返り対局、Game Story、PWA/Tauri/Electron/Native App、Account、Cloud Sync、課金を実装しません。
