# 最初にお読みください — Shogi Reflection Ver.1.4

このFolderは、完成済み`Shogi-Reflection-Ver1.3.3.zip`をSource of Truthとして、**Step型UI・棋譜先行保存・保存済み対局Viewer・将棋盤視認性改善・アプリ内取扱説明書**を追加したVer.1.4完全版です。

## 最短の確認手順

```bash
npm test
python3 browser_verify.py
npm run check
python3 -m http.server 8000
```

Browserで`http://localhost:8000`を開きます。

## 最初に試す実使用Flow

1. STEP1でKIFを貼り付け、`貼り付けたKIFを確認`でPreviewする。
2. `棋譜を登録する`でSTEP2へ進む。
3. 対局情報を確認・編集する。
4. `対局を保存`で、重要局面やObservation Themeが未入力のまま一度保存する。
5. `保存済み対局`からその対局を開く。
6. `棋譜再現へ`でReplayし、盤面を見ながら`次へ`を連続操作する。
7. 重要局面を3〜5件登録し、振り返り・Observation Theme・実行Ruleを入力する。
8. 途中なら`振り返りを途中保存`、完成時はSTEP7の`振り返りを完了`を使用する。
9. 完了後にMarkdownと次局用Observation Cardを書き出す。

`入力をクリア`はTemporary KIF Input / Previewだけを対象とし、保存済み対局の削除とは別操作です。保存済み対局の削除には確認Dialogがあります。

## Ver.1.4の重要な境界

- **対局を保存**：棋譜だけでも可能。
- **振り返りを途中保存**：考察を後日継続するための保存。
- **振り返りを完了**：重要局面3〜5件、Observation Theme 1件、実行Rule 1〜3件が必要。
- Step移動そのものは保存・削除・Domain Validationを行わない。
- Replay NavigationではPage全体をScrollせず、必要な追従はMove List Container内部だけで行う。

## 主要資料

1. `Ver.1.4操作手順書.md`
2. `USER_MANUAL.md`
3. `STEP_UI_DESIGN.md`
4. `GAME_SAVE_LIFECYCLE.md`
5. `SAVED_GAME_VIEWER_DESIGN.md`
6. `SHOGI_BOARD_GRAPHICS_GUIDELINE.md`
7. `ASSET_LICENSE_POLICY.md`
8. `REPLAY_SCROLL_POLICY.md`
9. `SOURCE_OF_TRUTH_AUDIT.md`
10. `COMPLETION_REPORT.md`
11. `TEST_RESULT.txt`
12. `BROWSER_VERIFICATION_RESULT.txt`
13. `STATIC_VERIFICATION_RESULT.txt`

## 今回実装していないもの

AI Advice Layer、Engine解析、評価値、振り返り対局、Game Story、PWA / Native App / Desktop App、Account、Cloud Sync、課金はVer.1.4へ含めていません。
