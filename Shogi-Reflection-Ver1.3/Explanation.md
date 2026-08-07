# Explanation.md — Ver.1.3 棋譜再現盤・重要局面登録接続

## 1. 今回の課題

Ver.1.2では棋譜を再現し、目的の手数へ移動できました。しかし、盤面で見つけた局面と既存KeyPosition Formは別々でした。利用者は手数や盤面を見ながら手入力する必要があり、Replayと振り返りの学習Loopが途中で切れていました。

Ver.1.3は、その切れ目を埋めます。ただし、Replay DataをそのままGameReviewへ混ぜると、次の危険があります。

- KeyPositionが盤面Engineの都合で巨大化する
- FACTと盤面Snapshotが混同される
- Button Clickだけで保存済みReviewが変わる
- 盤面反転状態が内部座標へ混入する
- 旧Ver.1.2 Dataが読めなくなる

そのため、客観的な局面Dataを任意のReplay Referenceとして接続しました。

## 2. 主要Model

### BoardSnapshot

盤上に存在する駒だけを、Square・Piece Type・Owner・Promotionで保持します。同一Square重複や不正座標を拒否します。

### HandSnapshot

先手・後手の持ち駒を、Piece TypeごとのCountとして保持します。

### ShogiPositionSnapshot

Board、両者のHand、Side to Move、Last Move From／Toを一つの局面として保持します。

### ReplayPositionSnapshot

現在手数、現在指し手、直前指し手、元KIF指し手、現在局面、直前局面、Warning、終局情報を保持します。

### KeyPositionReplayReference

KeyPositionとReplay Snapshotを接続する任意参照です。Source Game ID、KIF Fingerprint、Move Number、Snapshot Versionを持ちます。

## 3. KeyPositionを壊さない拡張

既存KeyPositionの必須本文PropertyとValidationを維持し、次を任意Propertyとして追加しました。

- `moveText`
- `decisionPattern`
- `learning`
- `replayReference`

`replayReference`がなくても有効です。これにより旧DataをMigrationなしで読めます。

## 4. Application Service

`AddCurrentPositionToKeyPosition`は次を担当します。

- Replay利用可否
- 0手目拒否
- Source一致確認
- 5件上限
- 同一手数重複
- Snapshot生成
- 本人入力を空欄にした候補作成

Repositoryを依存として受け取らないため、追加操作だけで保存できません。

## 5. Form接続

`KeyPositionReplayController`はReplay Controllerから現在状態を読み、Application Serviceへ渡します。成功時はFormの空Cardへ候補を入れ、失敗時は利用者向けError View Modelを表示します。

自動入力欄には「Replayから自動入力・編集可」、本人入力欄には「自動生成されません」を表示します。

Snapshotは`details`を開いたときに描画し、複数の81Square盤を常時描画しません。

## 6. 保存境界

```text
Replay Navigation       → 保存しない
局面候補追加            → 保存しない
FACT等の入力            → 保存しない
振り返りを保存する      → Repositoryへ保存
                         → LocalStorage Snapshotへ保存
```

保存済み詳細から追加した場合も、まず編集Formへ読み込みます。Review IDは同じですが、保存Buttonを押すまで永続Dataは変わりません。

## 7. Compatibility

Top-level Snapshot SchemaはVersion 1を維持しています。Replay Referenceは任意拡張です。

復元時はReplay ReferenceをConstructorで再検証します。不正VersionやBoard／Handを含むBackupは全件置換前に拒否され、現在Repositoryを維持します。

Snapshotが最初から存在しない旧KeyPositionは正常Dataです。

## 8. Performance

候補追加時にKIF全体を再Parseしません。Ver.1.2のPosition Historyにある現在Positionと直前PositionをSnapshotへ変換します。

最大5件のSnapshotだけをGameReviewとともに保存します。Formの小型盤面は必要時に描画します。

## 9. Test結果

- Ver.1.2継承：333件
- Ver.1.3追加：125件
- 合計：458件成功／0件失敗
- Chromium：116件成功／0件失敗

Model、Reference、Application Service、Compatibility、View Model、Controller、Integration、Browser UIを確認しています。
