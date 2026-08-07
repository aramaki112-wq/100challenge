# Review Checklist.md — Ver.1.3

## Source of Truth

- [ ] Ver.1.2 ZIPを展開して使用した
- [ ] Ver.1.2全173 Fileを監査した
- [ ] Ver.1.2既存333 Testを変更前に実行した
- [ ] Design Rules最終番号CNを確認した
- [ ] 変更・追加・削除FileをHashで分類した
- [ ] Ver.1.2 Fileを削除していない

## Domain境界

- [ ] GameReviewの次局接続Ruleを変更していない
- [ ] 重要局面3〜5件Ruleを維持した
- [ ] SnapshotなしKeyPositionを有効として扱う
- [ ] Replay Referenceは任意である
- [ ] FACTとSnapshotを分離した
- [ ] INTERPRETATIONとHYPOTHESISを自動生成しない
- [ ] 感情・判断Pattern・学びを自動生成しない

## Snapshot

- [ ] Snapshot Versionがある
- [ ] Current／Previous Moveを保持する
- [ ] Source KIF Moveを構造化保持する
- [ ] Current／Previous Positionを保持する
- [ ] Board PieceのSquare・Type・Owner・Promotionを保持する
- [ ] Sente／Gote Handを保持する
- [ ] Side to Moveを保持する
- [ ] Last Move From／Toを保持する
- [ ] Replay Warningを保持する
- [ ] 盤面反転を内部Dataへ保存しない
- [ ] 不正Square、Board、Hand、Versionを拒否する
- [ ] Snapshot作成日時の設計判断を記録した

## Application Service

- [ ] Replay未開始を拒否する
- [ ] 0手目を拒否する
- [ ] Source Game／KIF不一致を拒否する
- [ ] 同一手数を拒否する
- [ ] 5件上限を拒否する
- [ ] 空Cardを上限Countへ含めない
- [ ] Repositoryへ依存しない
- [ ] 既存Form配列を変更しない
- [ ] 失敗時に候補を返さない

## Browser UI

- [ ] 追加Buttonが表示される
- [ ] 無効理由が文字で表示される
- [ ] 追加成功・失敗を読み上げる
- [ ] 手数と指し手を自動入力する
- [ ] FACT等は空欄である
- [ ] Replay由来を表示する
- [ ] 保存済み／未保存を区別する
- [ ] Snapshotの有無を表示する
- [ ] 小型盤面を必要時に表示する
- [ ] 持ち駒・成駒・Warningを表示する
- [ ] 同一手数で既存CardへFocusする
- [ ] 5件でButtonを事前無効化する
- [ ] Smartphone幅に収まる
- [ ] Keyboard Navigationと入力Focusが競合しない

## Persistence／Compatibility

- [ ] Snapshot付きReviewを保存できる
- [ ] 保存後に再読込できる
- [ ] JSON Backupへ含まれる
- [ ] Atomic Restoreできる
- [ ] 改ざんSnapshotで現在Dataを失わない
- [ ] Ver.1.2 Dataを読める
- [ ] SnapshotなしKeyPositionを編集できる
- [ ] Markdown Exportが動く
- [ ] Observation Cardが動く

## Error

- [ ] 利用者向け日本語Messageがある
- [ ] Error Codeがある
- [ ] 調査Detailと画面Messageを分離した
- [ ] 原因手数・指し手・Source Game IDをContextへ残せる
- [ ] 低レベルCauseを画面へ直接表示しない
- [ ] WarningとErrorのroleを分離した

## Test／Artifact

- [ ] Ver.1.2継承333 Test成功
- [ ] Ver.1.3追加125 Test成功
- [ ] 全458 Test成功／0失敗
- [ ] Chromium 116件成功／0失敗
- [ ] Missing Import 0件
- [ ] Static Verification成功
- [ ] ZIP Integrity成功
- [ ] 別Folder展開後に全Testを再実行した
- [ ] 別Folder展開後にBrowser確認を再実行した
- [ ] SOURCE_OF_TRUTH_AUDIT.mdを更新した
- [ ] COMPLETION_REPORT.mdを更新した
