# Review Checklist.md — Ver.1.4.1

## Source of Truth
- [ ] Ver.1.4正式ZIPを基準にした
- [ ] 元250 Fileを監査した
- [ ] 元543 Automated Testが変更前に成功した
- [ ] Design Rules最終番号EDを確認してから追加した

## Fixed Board Grid
- [ ] Replay盤は9列×9行を明示する
- [ ] Snapshot盤も9列×9行を明示する
- [ ] 全81升が同じSquare classを使う
- [ ] Empty/Piece SquareでGeometryを変えない
- [ ] Piece ContainerがSquare Sizeを決めない
- [ ] SVGがContainer外へLayout影響を出さない
- [ ] 成桂・成香・成銀を2文字専用classでPiece内部調整する
- [ ] と・成香・成桂・成銀・馬・龍を文字だけで区別できる
- [ ] 先手/後手方向が視覚的・accessible nameで区別できる
- [ ] Board FlipでGridが変形しない
- [ ] Snapshotで同じ比率を維持する

## Replay Regression
- [ ] PositionHistoryを変更していない
- [ ] Replay Application Serviceを変更していない
- [ ] Replay View Modelを変更していない
- [ ] ReplayScrollPolicyを変更していない
- [ ] 次へ/前へ/最初/最後でPage全体Scrollが動かない
- [ ] KeyboardでもPage全体Scrollが動かない
- [ ] Current Move Highlightを維持する
- [ ] Move List Container内部だけが追従する

## Saved Game Summary
- [ ] `対局日：YYYY/MM/DD`を表示する
- [ ] 戦型を簡潔に表示する
- [ ] 戦型不明を自然な日本語で扱う
- [ ] 対戦相手を表示する
- [ ] 自分の側を表示する
- [ ] 勝敗を表示する
- [ ] 手数を表示する
- [ ] 棋譜のみ/振り返り中/振り返り完了を日本語で表示する
- [ ] Raw KIF Header全文を一覧へ表示しない
- [ ] Raw KIF Dataそのものは削除しない

## Compatibility
- [ ] Step UI 1〜7の責務を維持する
- [ ] 棋譜先行保存を維持する
- [ ] 振り返り再開を維持する
- [ ] KIF ClearとSaved Game Deleteを混同しない
- [ ] KeyPosition 3〜5件Ruleを維持する
- [ ] Observation Theme 1件を維持する
- [ ] 実行Rule 1〜3件を維持する
- [ ] Backup/Restore Schema Version 1を維持する
- [ ] Markdown Exportを維持する
- [ ] Observation Cardを維持する
- [ ] Helpを更新する

## Verification
- [ ] `npm test`が0 fail
- [ ] 390×844 Browser Automationが0 fail
- [ ] 通常局面→成駒局面でBoard Bounding Box不変
- [ ] 成桂/成香/成銀/馬/龍でPiece ContainerがSquare内
- [ ] Replay Scroll回帰なし
- [ ] `npm run check`でMissing Import 0
- [ ] ZIP Integrity成功
- [ ] ZIPを別Folderへ展開した
- [ ] 展開物だけでAutomated/Browser/Staticを再実行した
- [ ] `SOURCE_OF_TRUTH_AUDIT.md`を更新した
- [ ] `COMPLETION_REPORT.md`を更新した
