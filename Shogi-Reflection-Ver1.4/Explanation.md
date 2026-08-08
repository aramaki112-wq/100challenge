# Explanation.md — Ver.1.4

## 今回何を変えたか

Ver.1.4は機能追加よりもWorkflow境界の再設計である。Ver.1.3.3ではGameReview自体は未完成でも保存できたが、UI上はKIF登録から振り返り完成までが一続きに見えた。Ver.1.4では保存操作をIntentとして分離した。

- `SAVE_GAME`: 棋譜・対局情報を保存する。
- `SAVE_REFLECTION_DRAFT`: 本人入力途中を保存する。
- `COMPLETE_REFLECTION`: 既存完成Ruleを満たした時だけ完了へ遷移する。

`GameReview`へOptionalなWorkflow Status / Timestamp / 先手名 / 後手名を追加したが、Repository PortとLocalStorage Snapshot Schemaは維持した。

## なぜStatusが必要か

一覧から再開する時、「保存されているか」だけでは次の行動を決められないためである。Statusは課金・権限制御ではなくWorkflow状態を説明する最小Dataとして使う。

## なぜStep NavigationをDomainへ入れないか

STEP3へ進んだから重要局面が必要、STEP7へ表示したから完成、という設計にするとUI変更がDomain Ruleを壊す。`BrowserStepNavigation`はPanelの表示状態だけを管理する。

## なぜViewerでReplayを作らないか

数千局へ増えた時に一覧表示だけで全棋譜のPosition Historyを作ると重い。一覧はSnapshotの軽量項目とKIF指し手行の数だけを使う。Replayは選択時だけ構築する。

## なぜSVG駒か

外部Asset Licenseを持ち込まず、五角形・文字・成駒Mark・先後回転を一つのComponentで統一できるため。Replay盤とSnapshot盤で同じComponentを使い、Presentation差分だけをCSSへ置く。
