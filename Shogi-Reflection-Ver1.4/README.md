# 将棋振り返りアプリ Ver.1.4

棋譜を先に保存し、後日見やすい将棋盤でReplayしながら、自分のFACT・INTERPRETATION・HYPOTHESISを振り返るブラウザApplicationです。最善手・評価値・AI助言はVer.1.4の対象外です。

## Ver.1.4の中心変更

1. 7 Step型UI
2. 棋譜だけ先に保存できるLifecycle
3. 保存済み対局Viewerと後日再開
4. オリジナルInline SVG駒による盤面視認性改善
5. Application内「使い方」とContext Help

## SaveとComplete

```text
KIF登録 → 対局情報 → 対局を保存
                         ↓
                      棋譜のみ
                         ↓ 後日
保存済み対局 → Replay → 重要局面 → 振り返り → 次局への接続 → 最終レポート
                                                        ↓
                                                 振り返り完了
```

棋譜保存には重要局面・Observation Theme・実行Ruleを要求しません。振り返り完了時だけ既存Rule（重要局面3〜5件、Observation Theme 1件、実行Rule 1〜3件）を適用します。

## 起動方法

ES Moduleを使うためLocal HTTP Serverから開きます。

```bash
cd Shogi-Reflection-Ver1.4
python -m http.server 8000
```

Browserで`http://localhost:8000`を開いてください。

## Test

```bash
npm test
python3 browser_verify.py
npm run check
```

正式結果は`TEST_RESULT.txt`、`BROWSER_VERIFICATION_RESULT.txt`、`STATIC_VERIFICATION_RESULT.txt`を参照してください。

## Data保存

現Versionは既存LocalStorage Adapterを維持します。DomainはRepository Portへ依存し、将来IndexedDB等へAdapter交換できる構造を維持します。人工的な50局制限等は設けていません。BrowserごとのLocalStorage容量上限は存在するため、長期保存ではJSON Backupを推奨します。

## Replay Scroll Policy

Ver.1.3.2で解決済みの仕様を維持します。

- 次へ／前へ／最初へ／最後へ／KeyboardでPage全体を自動Scrollしない。
- Current Move Highlightを維持。
- 追従はMove List Container内部だけ。
- Move Listを利用者が明示選択した場合だけ盤面へ戻るScrollを許可。

`ReplayScrollPolicy.js`、`PositionHistory.js`、`ShogiReplayApplicationService.js`はVer.1.3.3からHash一致で保持します。

## Board Asset

外部駒画像を使用しません。`ShogiPieceSvg.js`がApplication専用の五角形SVGを生成します。成桂・成香・成銀は2文字専用Layout、成駒は文字＋Promotion Mark、先後は回転で区別します。

## 主要Document

- `USER_MANUAL.md`
- `STEP_UI_DESIGN.md`
- `GAME_SAVE_LIFECYCLE.md`
- `SAVED_GAME_VIEWER_DESIGN.md`
- `SHOGI_BOARD_GRAPHICS_GUIDELINE.md`
- `ASSET_LICENSE_POLICY.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `COMPLETION_REPORT.md`
