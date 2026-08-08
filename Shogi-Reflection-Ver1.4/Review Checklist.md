# Review Checklist.md — Ver.1.4

## Source of Truth

- [ ] Ver.1.3.3 ZIPから展開したか
- [ ] 元229 Fileを監査したか
- [ ] 既存505 Automated Testを維持したか
- [ ] LICENSEを変更していないか

## Save / Complete

- [ ] KeyPosition 0件で棋譜保存できるか
- [ ] Observation Themeなしで棋譜保存できるか
- [ ] 実行Ruleなしで棋譜保存できるか
- [ ] 対局メモだけで「振り返り中」にならないか
- [ ] 途中保存は「振り返り中」になるか
- [ ] Complete時だけ3〜5 / 1 / 1〜3 Ruleを要求するか

## Step UI

- [ ] 7 Stepの責務が分離されているか
- [ ] Step移動でForm Dataを消さないか
- [ ] 移動先をButton Labelから判断できるか
- [ ] Current Stepを読み上げられるか

## Saved Game Viewer

- [ ] 一覧でStatusを日本語表示するか
- [ ] 日付・相手・手番・勝敗・手数・保存/更新日時が見えるか
- [ ] 一覧表示でPosition Historyを構築しないか
- [ ] 棋譜再現／振り返り再開／Deleteが分離されているか

## Board

- [ ] 五角形SVGか
- [ ] 成桂・成香・成銀の2文字が収まるか
- [ ] 馬・龍を判別できるか
- [ ] 成駒を色だけで表現していないか
- [ ] 盤面反転で内部座標が変わらないか
- [ ] Squareにaccessible nameがあるか

## Replay Regression

- [ ] 次へ10回でPage Scrollが動かないか
- [ ] 前へ10回でPage Scrollが動かないか
- [ ] First / Last / KeyboardでPage Scrollが動かないか
- [ ] Move List内部だけ追従するか
- [ ] Current Move Highlightが維持されるか

## Data Safety

- [ ] KIF ClearとGame Deleteが別Operationか
- [ ] Deleteに確認Dialogがあるか
- [ ] Backup / Restoreが新Lifecycle Dataを保持するか
- [ ] Ver.1.3.3 Backupを復元できるか
