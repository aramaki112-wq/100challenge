# USER_MANUAL.md — 将棋振り返りアプリ Ver.1.4 取扱説明書

## 1. このApplicationの目的

最善手を自動判定するApplicationではありません。棋譜を再現し、自分が何を見たか（FACT）、どう解釈したか（INTERPRETATION）、何を仮説として考えたか（HYPOTHESIS）を残し、次局のObservation Themeと実行Ruleへ接続します。

## 2. KIFを登録する

STEP1で次のいずれかを使います。

- KIF File選択
- Drag & Drop
- KIF本文Paste
- Clipboardから読み込み

読み込むとまずPreviewが表示されます。この時点では保存されません。

### 入力をクリア

`入力をクリア`はTemporary KIF Inputと現在のPreviewだけを消します。保存済み対局は削除しません。

### 棋譜入力へ戻る

Previewだけを閉じ、貼り付けたKIFは保持します。別KIFへ修正して再Previewできます。

## 3. 対局情報

STEP2で対局日時、先手、後手、自分の側、結果、対局相手、対局種別・持ち時間、対局メモ、KIF本文を確認します。KIFから取得できた先手・後手は自動入力され、必要なら編集できます。

## 4. 棋譜だけ保存して終了する

STEP2の`対局を保存して一覧へ`を押します。重要局面0件、Observation Themeなし、実行Ruleなしでも保存できます。状態は`棋譜のみ`です。

## 5. 保存済み対局を開く

Headerの`保存済み対局`を押します。一覧から対局を選びます。

- 棋譜のみ
- 振り返り中
- 振り返り完了

がBadgeで分かります。`棋譜再現へ`または`振り返りを開く`から再開します。

## 6. 棋譜再現

STEP3で`最初へ`、`前へ`、`次へ`、`最後へ`、任意手数Jumpを使います。Keyboardでは← / → / Home / Endを使えます。入力欄Focus中はShortcutを無効化します。

Navigation時にBrowser Page全体は自動Scrollしません。Current Moveへの追従は棋譜一覧Container内部だけで行います。

## 7. 盤面反転

`盤面を反転`で先後の見え方を切り替えます。内部局面座標やSnapshotは変わりません。

## 8. 重要局面

Replay中に`この局面を重要局面へ追加`を押すと、手数・指し手・局面記録が候補へ入ります。FACT / INTERPRETATION / HYPOTHESISは空欄のままで、自動生成されません。

STEP4で3〜5件へ整理し、自分で各項目を入力します。3〜5件Ruleは振り返り完成時に適用されます。

## 9. 振り返り

STEP5で一局全体の振り返りと判断Patternを記録します。

## 10. Observation Theme / 実行Rule

STEP6で次局のObservation Themeを1件、実行Ruleを1〜3件入力します。途中なら`振り返りを途中保存`できます。

## 11. 最終レポート

STEP7で対局情報、重要局面、FACT / INTERPRETATION / HYPOTHESIS、振り返り、Observation Theme、実行Ruleをまとめて確認します。

`振り返りを完了する`には以下が必要です。

- 重要局面3〜5件
- Observation Theme 1件
- 実行Rule 1〜3件

## 12. Markdown書き出し

振り返り完了後、保存済み対局Detailから`振り返り.md`を開けます。Preview、Clipboard Copy、`.md`書き出しは既存機能を維持しています。

## 13. 次局用Observation Card

振り返り完了後、保存済み対局Detailから`次局用Observation Card.md`を生成できます。Observation Themeと実行Ruleを次局へ持ち越すための成果物です。

## 14. Backup

保存済み対局Viewer下部の`JSONバックアップ`で全保存DataをJSONへ出力します。

## 15. Restore

`JSONから復元`でBackupを復元します。Ver.1.3.3で作成したSchema Version 1 Backupも、Status等の新項目がない場合は後方互換推定で読み込みます。

## 16. 保存済み対局Delete

保存済み対局の`対局を削除`は確認Dialog後に実行します。STEP1の`入力をクリア`とは完全に別Operationです。
