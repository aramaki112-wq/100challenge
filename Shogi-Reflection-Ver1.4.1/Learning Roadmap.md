# Learning Roadmap.md — Ver.1.4.1から学ぶ設計テーマ

## 今回の学習テーマ

### 1. CSS GridのGeometryとContentを分離する
`grid-template-columns`だけでなく`grid-template-rows`も明示し、Grid item contentがtrack sizingへ与える影響を理解する。

### 2. Presentation Invariantを決める
「盤面は常に9×9」「Square Sizeは駒種に依存しない」という、見た目側の不変条件を設計Ruleとして扱う。

### 3. Containerを責務境界として使う
Piece Containerは装飾ではなく、Square GeometryとSVG Visualを切り離すAdapterとして考える。

### 4. Read Modelで利用者向けSummaryを作る
Raw KIF、Domain Data、一覧表示を同一視せず、既存Dataを利用者が選択しやすい形へ変換する。

### 5. Migrationしない判断を学ぶ
新しい表示要件が出ても、既存Dataに情報があるならDomain Property追加やStorage Migrationを安易に行わない。

### 6. Regression Safetyを証拠で残す
- Automated Test: 構造・文字列・契約
- Browser Test: 実Layout・Scroll・Touch想定Viewport
- Static Verification: Hash・Import・必須File

## 次に進む前の実使用観測

Ver.1.4.1は実対局で次を観測する。

- 390px前後のPortraitで盤を横Scrollせず見られるか
- 一手ずつ進めても盤面が揺れて見えないか
- 成桂・成香・成銀が読みやすいか
- 保存済み一覧で目的の対局を素早く見つけられるか
- `対局日`と`保存日時`を混同しないか
- 戦型が選択の手掛かりとして有効か

この実使用結果をVer.1.5以降の入力とし、Application化・Storage強化・AI Adviceなどを同時に広げない。
