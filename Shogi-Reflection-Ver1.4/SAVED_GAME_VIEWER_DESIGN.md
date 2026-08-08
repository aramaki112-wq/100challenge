# SAVED_GAME_VIEWER_DESIGN.md — Ver.1.4

## 目的

保存済みGameReviewを「後から選ぶLibrary」として独立View化し、棋譜だけ保存した対局から振り返りを再開できるようにする。

## 一覧表示

- 対局日
- 対戦相手
- 自分の側／勝敗
- 手数
- 対局種別・持ち時間
- Workflow Status
- 重要局面件数
- 実行Rule件数
- 保存日時
- 更新日時

## Performance境界

一覧表示ではPosition Historyを生成しない。手数はKIFの指し手行を軽量に数え、終局行を除外する。Replay Position構築は利用者が対局を開いた時だけ行う。

## Detail

選択した1局について、棋譜、振り返り、重要局面、FACT / INTERPRETATION / HYPOTHESIS、判断Pattern、Observation Theme、実行Rule、保存状態を表示する。

## 再開先

- 「棋譜再現へ」：STEP3を直接開きReplayを構築する。
- 「振り返りを開く」：Statusと不足内容から自然なStepへ戻す。
- 完了済み：STEP7を開ける。

## Delete

`入力をクリア`とは別Operation。保存済み対局Deleteは確認Dialogを必須とし、既存`DeleteGameReviewAndPersist`によるPersistence rollback境界を維持する。

## Repository交換可能性

Viewerは既存Repository / Application ServiceからSnapshotを取得し、LocalStorageへ直接Queryしない。将来IndexedDB Adapterへ置換してもPresentationの責務を変えない。
