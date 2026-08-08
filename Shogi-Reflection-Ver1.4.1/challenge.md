# 将棋振り返りアプリ Ver.1.4.1 Challenge

## Theme

**Presentation LayerでFixed Gridを守り、Raw Dataと利用者向けSummaryを分離する。**

## 課題

Ver.1.4の実使用で二つの問題が見つかった。

1. 成桂・成香・成銀などの表示で盤面の升が変形して見える。
2. 保存済み対局一覧へ長いRaw KIF Headerが表示される場合がある。

## 制約

- Domain Modelを原則変更しない。
- Repository/LocalStorage構造を変更しない。
- Storage Migrationを行わない。
- Replay Domainを変更しない。
- Ver.1.3.2のReplay Scroll Policyを破壊しない。
- Step UI / 棋譜先行保存 / Saved Game Viewer / Backup / Restore / Markdown Export / Observation Cardを維持する。
- AI/Engine/Application化へ範囲を広げない。

## 成功条件

- 9×9盤面の81升が同じGeometryである。
- 2文字駒がSquareを押し広げない。
- Replay/Snapshot/Board FlipでFixed Gridを維持する。
- 保存済み一覧に`対局日：`と戦型を表示する。
- Raw KIF Header全文を一覧へ表示しない。
- Raw KIF Dataは保存互換のため保持する。
- Automated / Browser / Static Testが0 fail。
- ZIP展開後の成果物だけで再検証する。

## 学習ポイント

UI bugをDomain改造で直さず、責務境界を見つけて最小のLayerで修正すること。
