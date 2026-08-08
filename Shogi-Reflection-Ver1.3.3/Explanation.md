# Explanation.md — Ver.1.3.3 KIF入力やり直し・日本語UI改善

## 1. 今回の課題

Ver.1.3.2の実使用でReplay Scroll問題は解決しました。一方、スマートフォンでKIFを貼り付けて確認した後、間違いに気づいた時に「どこまで消えるのか」が分かりにくい状態でした。また、内部設計用の英語が画面に残り、操作の意味を読み取る負担がありました。

Ver.1.3.3はDomain機能を増やさず、Presentation Layerの境界を改善します。

## 2. Temporary Input StateとSaved Data

今回最も重要なのは、Dataを同じ「入力内容」と見なさないことです。

| 状態 | 例 | Clear/Retryの対象 | 永続化 |
|---|---|---:|---:|
| Temporary Input State | KIF Textarea | 対象 | なし |
| Import Preview State | Parser結果の確認画面 | 対象 | なし |
| Form State | 対局情報・振り返り入力 | 対象外 | 保存Buttonまでなし |
| Saved Domain Data | GameReview | 対象外 | Repository |
| Persistence | LocalStorage Snapshot | 対象外 | LocalStorage |

`KifImportDraftResetController`はRepository、LocalStorage、Clipboardを依存先に持ちません。この構造自体がData Safetyの防波堤です。

## 3. 入力をクリア

`入力をクリア`は次だけを行います。

1. Pending Import Previewを破棄する。
2. KIF Textareaを空にする。
3. File Inputの一時選択をリセットする。
4. KIF入力欄へFocusする。

行わないこと：

- Clipboardの書換え
- GameReviewの削除
- Repositoryへのsave/delete
- LocalStorageのremove/clear
- KIF Parserの再実行
- Position Historyの再構築

## 4. 棋譜入力へ戻る

Preview後の`棋譜入力へ戻る`は、Previewだけを破棄し、貼り付けたKIF本文を保持します。利用者は必要な部分を修正するか、全選択して別KIFへ貼り替え、再度`貼り付けたKIFを確認`を押せます。

これはUndoではありません。すでに保存済みDataを過去状態へ戻すのではなく、今回のImport DraftをResetするだけです。

## 5. 日本語UIと内部Codeの分離

UIでは「Replay」を「棋譜再現」、「Import Preview」を「棋譜読み込み確認」、「Key Position」を「重要局面」などへ変更しました。一方、`ReplayViewModel`、`GameReview`、`KeyPosition`など内部名称は維持しています。

これにより、利用者の理解しやすさとCodeの互換性を同時に守ります。

## 6. Accessibility

- 主要Button／aria-labelを日本語化。
- 既存Focus表示を維持。
- KIF操作ButtonをSmartphoneで48px以上へ。
- Warningは`role="status"`、Errorは`role="alert"`の既存区分を維持。
- Textarea入力中はReplay Keyboard Shortcutを発火させない既存処理を維持。
- Current Moveの読み上げとHighlightを維持。

## 7. Replay Scroll Policy

`ReplayScrollPolicy.js`は変更していません。通常NavigationではPage `scrollY`を触らず、棋譜一覧Containerの`scrollTop`だけを必要に応じて更新します。KIF入力UX変更からReplay Scroll責務を分離したことが回帰防止になります。

## 8. Performance

Clear／RetryはParserを呼びません。再Previewを明示した時だけ既存KIF Import経路を再利用します。したがって「入力を消しただけ」で棋譜解析や盤面履歴生成が走ることはありません。

## 9. Test

- Ver.1.3.2正式Test 495件を継承。
- Ver.1.3.3追加Test 10件。
- 合計505/505 PASS。
- Browser Verification 181/181 PASS。
- 390×844 Chromium responsive viewportでSmartphone UXを自動確認。

実機iPhoneそのものをBrowser Automationしたという意味ではありません。最終的な実機使用感は、完成ZIPを実際の対局で使用して確認します。
