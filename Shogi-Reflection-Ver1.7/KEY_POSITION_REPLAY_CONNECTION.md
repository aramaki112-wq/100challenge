# KEY_POSITION_REPLAY_CONNECTION.md

## 1. 目的

Ver.1.3の中心は、Ver.1.2で再現できる現在局面を、既存GameReviewの重要局面入力へ安全に接続することです。

安全な接続とは、Replay側の客観Dataを利用できる一方で、次を維持することです。

- KeyPosition本文をReplay都合で再構成しない
- FACT・INTERPRETATION・HYPOTHESISを自動生成しない
- Button ClickだけでRepositoryへ保存しない
- Replay失敗で現在Formや保存済みReviewを変更しない
- Snapshotなしの旧Dataを有効なDataとして読む

## 2. 接続全体像

```text
Position History
↓ 現在手数と直前手数を参照
ReplayPositionSnapshotFactory
↓ 客観DataだけをSnapshot化
KeyPositionReplayReference
↓ 任意参照として候補へ添付
AddCurrentPositionToKeyPosition
↓ 重複・件数・SourceをValidation
KeyPositionReplayController
↓
BrowserGameReviewFormView
↓ 本人が本文を追記
SubmitGameReviewForm
↓ 明示的な保存操作
Repository + LocalStorage Snapshot
```

Replay Application ServiceとRepositoryの間に直接接続はありません。

## 3. 責務境界

### Replay側

- Position Historyを保持する
- 現在局面と直前局面を返す
- Current Move、Previous Move、Source KIF Moveを返す
- Replay Warningと再現可能範囲を返す

### Snapshot側

- Replay状態を不変の客観Dataへ変換する
- Board、Hand、Side to Move、Last MoveをValidationする
- Snapshot Versionを明示する
- JSON変換と復元を担当する

### GameReview／KeyPosition側

- 振り返り本文を保持する
- 重要局面3〜5件Ruleを維持する
- 任意のReplay Referenceを持てる
- Snapshotがない旧KeyPositionも有効とする

### Browser UI側

- ButtonとFocusを扱う
- Snapshotを表示する
- 自動入力項目と本人入力項目を分けて見せる
- Snapshot生成Ruleや将棋の盤面更新Ruleを持たない

## 4. 追加操作の順序

`この局面を重要局面へ追加`では次を行います。

1. Replayが利用可能か確認する。
2. 0手目ではないことを確認する。
3. Form棋譜とReplay Sourceが一致することをFingerprintで確認する。
4. Form内の意味のある重要局面数を数える。
5. 5件上限を確認する。
6. 同一手数がないことを確認する。
7. Position Historyの現在局面・直前局面からSnapshotを作る。
8. KeyPosition候補へ手数・指し手・Replay Referenceを反映する。
9. 本人入力欄は空欄のままにする。
10. FormへFocusし、未保存であることを通知する。

この処理はRepositoryを受け取りません。

## 5. 0手目の方針

0手目は通常の重要局面として追加しません。

理由は、既存KeyPositionの`moveNumber`が1以上であり、重要局面が「対局中の判断を振り返る局面」として定義されているためです。0手目を暗黙に1手目へ補正せず、日本語の無効理由を表示します。

初期配置や対局前Observationは、将来別のConceptとして必要性を確認します。

## 6. 重複方針

同一手数の自動追加は拒否します。

- 同一手数・同一Snapshot：拒否して既存項目へFocus
- 同一手数・異なるSnapshot：Source不一致または改ざんの可能性として拒否
- 同じ盤面・別手数：手数が異なるため追加可能
- 未保存候補：保存済み項目と同様に重複判定へ含める
- 保存済み項目：編集Formへ読み込んだ後に重複判定へ含める

既存本文を推測で上書きしません。

## 7. 保存済みReviewからの追加

保存済み詳細を見ている状態で追加Buttonを押すと、対象Reviewを編集Formへ読み込み、そのForm候補へ追加します。

- 自動でRepositoryは更新しない
- Review IDは維持する
- 保存済みSnapshotは「保存済み」と表示する
- 新規候補は「未保存」と表示する
- 最後に従来の保存Buttonを押したときだけ更新する

## 8. KIF Import直後の追加

Import PreviewをFormへ反映すると、まだRepositoryには保存されていません。その未保存FormとReplay Sourceは同じReview ID・KIF Textを使用するため、直後から候補を追加できます。

Import失敗、Replay失敗、Snapshot生成失敗では、現在Formを消しません。

## 9. Replay Warning

途中まで再現できる棋譜では、再現可能最終手数までの局面を追加できます。

- 失敗手数以降はPosition Historyに存在しないため追加不可
- Warning／Failureの公開用情報をSnapshotへ保持
- 低レベルError Detailは画面へ直接表示しない
- Warningは本人入力欄を書き換えない

## 10. 将来Ver.1.4への接続

Replay Referenceには、将来次を計算するために必要な客観Dataがあります。

- KeyPosition ID
- Source Game ID
- Move Number
- Current／Previous Move
- Current／Previous Position
- Board／Hand Differenceの計算元
- Side to Move
- Source KIF Move
- Replay Warning
- Snapshot Version

Ver.1.3ではDifferenceやFACT文を自動生成しません。
