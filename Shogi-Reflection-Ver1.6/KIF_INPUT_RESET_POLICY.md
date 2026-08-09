# KIF_INPUT_RESET_POLICY.md

## 目的

KIF入力のやり直しを、保存済みDataを失う危険のない一時状態操作として定義する。

## State Boundary

| State | Owner | Clear | Retry | Save/Delete |
|---|---|---:|---:|---:|
| KIF Textarea | BrowserKifImportView | 消去 | 保持 | なし |
| Pending Import Preview | KifImportController/View | 破棄 | 破棄 | なし |
| File Inputの一時選択 | BrowserKifImportView | Reset | Reset | なし |
| Form編集中Data | BrowserGameReviewFormView | 変更しない | 変更しない | 保存Buttonのみ |
| Saved GameReview | Repository | 変更しない | 変更しない | 専用Serviceのみ |
| LocalStorage Snapshot | Persistence Coordinator | 変更しない | 変更しない | 保存/削除/復元のみ |
| OS/Browser Clipboard | Browser Clipboard API | 変更しない | 変更しない | 読取のみ |

## `入力をクリア`

- Pending Previewをcancelする。
- Textareaを空文字にする。
- Preview UIを閉じる。
- File Inputの一時選択をResetする。
- 入力欄へFocusする。
- Parserを呼ばない。
- Repository／LocalStorage／Clipboardを呼ばない。

Clear対象が空でもErrorにはせず、安全な冪等操作として扱う。

## `棋譜入力へ戻る`

- Pending Previewをcancelする。
- Preview UIを閉じる。
- Textarea本文は保持する。
- 再編集／貼替え後に既存Preview経路を再利用できる。

## ResetとUndo

Resetは「今回のImport Draftを破棄して入力段階へ戻す」操作である。Undoのように保存済みGameReviewや過去のForm履歴へ戻す機能ではない。

## Error時

Clear/Retry処理のErrorを理由にRepository Dataを変更しない。Preview生成失敗、Parser Error、Clipboard Errorは既存Error Presenterを通すが、保存済みGameReviewは不変とする。

## Performance

Clear/RetryだけではKIF Parser、Replay Position History、Snapshotを再構築しない。再Previewを利用者が明示した時だけ既存解析経路を実行する。
