# Learning Roadmap.md — Ver.1.3.3

## Level 1｜状態の種類を読む

読む順序：`index.html` → `BrowserKifImportView.js` → `KifImportController.js`

到達目標：Temporary Input、Import Preview、Form、Saved Domain Dataの4段階を図にできる。

## Level 2｜Resetの境界を読む

読む順序：`KifImportDraftResetController.js` → `KifImportDraftResetController.test.js` → `main.js`

到達目標：ClearとRetryがRepository／LocalStorage／Clipboardを知らないことをCodeから説明できる。

## Level 3｜ClearとDeleteを比較する

読む順序：`DeleteGameReview.js` → `DeleteGameReviewAndPersist.js` → `KifImportDraftResetController.js`

到達目標：一時状態のResetと永続DataのDeleteが別Application Operationである理由を説明できる。

## Level 4｜PresentationとDomainの言葉を分ける

読む順序：`index.html` → `BrowserGameReviewFormView.js` → `GameReview.js` → `KeyPosition.js`

到達目標：画面で「重要局面」と表示しながら内部`KeyPosition`を維持できる理由を説明できる。

## Level 5｜Replay Scroll回帰防止を読む

読む順序：`ReplayScrollPolicy.js` → `BrowserShogiReplayView.js` → `BrowserReplayScrollMarkup.test.js`

到達目標：Page ScrollとMove List内部Scrollの責務分離を説明できる。

## Level 6｜TestでData Safetyを証明する

読む順序：`KifImportDraftResetController.test.js` → `JapaneseUiText.test.js` → `browser_verify.py`

到達目標：Unit/Static Browser Markup/実Browser Automationで何を分担して検証しているか説明できる。

## 実習

1. Clear操作へLocalStorage依存を追加すると何が危険になるか列挙する。
2. `棋譜入力へ戻る`を単なる`戻る`へ変えた場合の曖昧さを3つ挙げる。
3. UIだけ日本語化し、内部Error Codeを維持する利点を説明する。
4. Undo SystemとImport Draft Resetの違いを例で説明する。
5. ReplayScrollPolicyを変更せずKIF UXだけ変えることが、なぜ回帰リスクを減らすか説明する。

## Ver.1.4へ進む前の到達条件

- Temporary / Preview / Form / Savedの境界を説明できる
- ClearとDeleteを混同しない
- ResetとUndoを混同しない
- Presentation用語とDomain用語を分けられる
- Replay Scroll Policyの責務を説明できる
- Test結果から「何を実機確認していないか」も説明できる
