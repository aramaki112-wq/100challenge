# SAVED_GAME_SUMMARY_DISPLAY_DESIGN.md

## 目的

保存済み対局一覧は「保存Dataを全部見せる場所」ではなく、「見返す対局を選ぶ場所」とする。

## Ver.1.4の原因

`GameReviewLibraryPresenter`のExcerptが次のFallbackを持っていた。

```text
gameStory → decisionPattern → kifuText
```

振り返りが未入力の棋譜のみ対局では`kifuText`へ到達し、Raw KIF HeaderがCard本文へ表示された。

## Ver.1.4.1の表示項目

主要情報：

- 対局日
- 対戦相手
- 自分の側
- 勝敗
- 戦型
- 手数
- 振り返り状態

補助情報：

- 保存日時
- 更新日時
- 重要局面件数
- 実行Rule件数

## Raw KIF Policy

Raw `kifuText`は削除しない。以下のために保持する。

- Replay
- KIF互換
- Detail
- Backup / Restore
- 将来のParser改善

ただしList Presenterの`storyExcerpt`へFallbackしない。

## 戦型の取得

Domain Modelへ`openingName`を新設しない。KIF Import時に既に`note`へ保存されるMetadataを読む。

優先順：

```text
1. note内 KIF Import Metadata の「戦型」
2. 旧Data互換としてRaw KIF Headerの「戦型」
3. 未設定
```

Raw KIFをFallback sourceとして読むことと、Raw KIF全文を画面へ表示することは別である。

## Dateの意味

- `対局日`: 実際に対局した日
- `保存日時`: Applicationへ初めて保存した時刻
- `更新日時`: 最後に更新した時刻

一覧では`対局日：YYYY/MM/DD`のLabelを必須にし、意味を混同しない。

## Domain/Storage Impact

- Domain Property追加なし
- Repository変更なし
- LocalStorage構造変更なし
- Storage Migrationなし
- Backup Schema Version 1維持
