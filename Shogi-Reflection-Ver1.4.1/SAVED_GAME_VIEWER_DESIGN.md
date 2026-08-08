# SAVED_GAME_VIEWER_DESIGN.md — Ver.1.4.1

## Viewerの役割

保存済み対局を一覧から選び、Detailを開き、振り返りを再開する。

## List Card

表示優先順：

1. 振り返り状態
2. 対局日
3. 対戦相手
4. 自分の側 / 勝敗
5. 戦型 / 手数
6. 必要に応じて保存日時・更新日時

Raw KIF Header全文をListへ表示しない。

## Read Model

`GameReviewLibraryPresenter`はRepository Entityを直接HTMLへ渡さず、List用Summaryへ変換する。

- KIF指し手数はReplayを構築せず数える。
- 戦型は既存KIF Import Metadataから要約する。
- Raw KIFはStory ExcerptへFallbackしない。

## Detail

Detailでは元KIFを保持しており、Replay再開・確認に利用できる。

## Compatibility

Domain / Repository / LocalStorage / Backup SchemaはVer.1.4から変更しない。
