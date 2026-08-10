# JAPANESE_UI_GUIDELINE.md

## 方針

利用者に直接見えるPresentation Layerは、スマートフォンで一読して意味が分かる日本語を優先する。内部Class名、Function名、File名、Domain Model、Error CodeはUI翻訳だけを理由にRenameしない。

## Ver.1.3.2 UI監査とVer.1.3.3表示

| 監査対象 | Ver.1.3.3の主表示方針 |
|---|---|
| Header | 将棋振り返り／Ver.1.3.3／スマホKIF入力 |
| Navigation | 棋譜操作、前へ、次へ、最初へ、最後へ |
| KIF Import | KIFを読み込む／KIFファイルを選択 |
| KIF Paste | KIF本文を貼り付け／入力をクリア |
| Import Preview | 棋譜読み込み確認 |
| Retry | 棋譜入力へ戻る |
| Replay | 棋譜再現 |
| Move List | 棋譜一覧 |
| Current Move | 現在の手 |
| Previous Move | 直前の手 |
| Turn | 手番 |
| Hands | 持ち駒 |
| Board Flip | 盤面を反転 |
| Jump | 手数を指定／手数スライダー |
| KeyPosition | 重要局面 |
| Snapshot Preview | 局面記録 |
| GameReview | 振り返り／保存済み対局 |
| Saved Games | 保存済み対局 |
| Backup | バックアップ |
| Restore | 復元 |
| Markdown Export | Markdown書き出し／Markdown確認 |
| Observation Theme | 次局の観察テーマ |
| Execution Rule | 次局で守るルール |
| Warning | 注意 |
| Error | エラー |
| Save | 保存 |
| Delete | 削除 |
| Edit | 編集 |
| Button | 結果を予測できる動詞を含める |
| aria-label | 可能な範囲で日本語化 |
| Placeholder | 利用者が入力内容を予測できる日本語 |
| Help Text | Smartphone操作を短い日本語で案内 |
| Empty State | 「何がないか」「次に何をするか」を日本語で示す |
| Validation | Domain Error Codeは維持し、表示Messageを日本語化 |

## 維持する英語／技術表記

- KIF：棋譜File Format名。
- Markdown：成果物Format名。
- Obsidian：製品名。
- JSON、UTF-8、Shift_JIS：技術Format／Encoding名。
- Home／End：Keyboardの実キー名。
- FACT／INTERPRETATION／HYPOTHESIS：方法論識別子。日本語の事実／解釈／仮説を併記する。
- Observation Card：既存成果物File名との互換性があるため、必要箇所では正式名を維持する。

## Naming Rule

- `戻る`だけのButtonは禁止。`棋譜入力へ戻る`のように戻り先を含める。
- `クリア`だけで対象が曖昧な場合は`入力をクリア`とする。
- 保存済みDataを消す操作は`削除する`と明記し、Clearと見た目・責務を分ける。
- UI翻訳を理由にDomain ModelをRenameしない。
