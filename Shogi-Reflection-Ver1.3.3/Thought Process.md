# Thought Process.md — Ver.1.3.3 公開可能な設計判断記録

この文書は内部の逐語的な推論ではなく、再利用可能な設計判断と採否理由を記録します。

## 1. 「クリア」で保存済み対局まで初期化する案

**不採用。** 利用者が意図しているのは今回のKIF入力のやり直しであり、保存済みGameReviewの削除ではありません。ClearとDeleteは意味も危険度も異なります。

## 2. Browser Clipboardも一緒に空にする案

**不採用。** ClipboardはApplication外の利用者Dataです。KIF Textareaを空にするために外部状態へ書き込む必要はありません。再Pasteに使える利点も失います。

## 3. Preview取消時にKIF Textareaも空にする案

**不採用。** 誤字修正や別KIFへの貼替えをしたいのに、元KIFまで失うとやり直しの負担が増えます。`棋譜入力へ戻る`はPreviewだけを破棄します。

## 4. Undo Stackを導入する案

**不採用。** 今回必要なのはImport DraftのResetです。保存済みDomain DataやForm履歴を巻き戻すUndo SystemはScope過大で、責務とError Pathを増やします。

## 5. Reset責務をmain.jsへ直接追加する案

**一部可能だが不採用。** Event HandlerへRepositoryやViewの処理が混在すると、将来「Clear」が何を触るか読み取りにくくなります。Presentation専用`KifImportDraftResetController`へ、Preview破棄とInput Resetだけを集約しました。

## 6. UI日本語化に合わせ内部ClassもRenameする案

**不採用。** `Replay`を画面で「棋譜再現」と呼ぶことと、Domain/API識別子をRenameすることは別問題です。表示文言の改善を理由にImport PathやTest資産へ不要な変更を広げません。

## 7. 「戻る」というButton名

**不採用。** Browser Back、Form編集へ戻る、Previewを閉じるなど意味が複数あります。今回は結果を予測できる`棋譜入力へ戻る`を採用しました。

## 8. Replay Scroll Policyへ手を入れる案

**不採用。** Ver.1.3.2で実機解決済みの責務です。KIF UX改善とScroll責務は独立しているため、変更しないこと自体をRegression Strategyとしました。

## 9. 実装中に見つかったTest失敗

日本語化後、旧英語表示文字列を直接期待していた既存UI Testが4件失敗しました。原因はDomain Regressionではなく、Presentation Copy変更に対してTest Fixtureの期待値が旧表示のままだったことです。意味とDOM契約を確認した上で、日本語表示へ期待値を更新しました。

Browser Verificationでも同様に、重要局面の入力元表示を旧`Replayから追加`で期待していた1項目が失敗しました。実装は意図通り`棋譜再現から追加`へ変わっていたため、検証側の表示期待を更新し、全181項目を再実行しました。
