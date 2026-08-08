# Explanation.md — Ver.1.4.1

## 今回何を直したか

Ver.1.4.1は新しいDomain機能を増やすVersionではない。Ver.1.4を実使用した結果見つかった、盤面のGeometryと保存済み一覧の情報密度をPresentation Layerで修正した。

中心は二つである。

1. 将棋盤を局面内容から独立した固定9×9 Gridにする。
2. 保存済み対局一覧をRaw KIFではなく利用者向けSummaryとして表示する。

## 盤面が不安定に見えた原因

Ver.1.4では列方向に`repeat(9, minmax(0, 1fr))`を指定していたが、行方向の9分割を明示していなかった。またSVG PieceがSquare直下のGrid item contentとして存在し、SVG側には`overflow: visible`が残っていた。

この状態では「盤面の大きさは固定したい」という意図に対して、Grid trackとPiece contentの責務境界が弱い。特に2文字駒はVisualとして占有量が大きく見え、Replay局面が変わるたびに盤面が微妙に揺れる印象を生みやすかった。

## Fixed Gridの修正

Replay盤とSnapshot盤の双方へ、明示的な9列×9行を指定した。

```css
grid-template-columns: repeat(9, minmax(0, 1fr));
grid-template-rows: repeat(9, minmax(0, 1fr));
```

さらにSquareへ`width:100%` / `height:100%` / `overflow:hidden`を与え、その内部へ固定比率のPiece Containerを置いた。

```text
Square
└─ Piece Container
   └─ SVG Piece
      ├─ Piece Shape
      ├─ Promotion Mark
      └─ Piece Label
```

これにより「升のGeometry」と「駒をどう見せるか」を別責務にできる。成桂・成香・成銀の文字Size調整はPiece内部で完結し、Squareを変更しない。

## なぜReplay Domainを変えなかったか

今回の問題は盤面の事実や手順計算ではなく、描画Geometryの問題である。したがって`PositionHistory`、`ShogiReplayApplicationService`、`ShogiReplayViewModel`、`ReplayScrollPolicy`は変更理由にならない。

特にReplay ScrollはVer.1.3.2で解決済み仕様である。Ver.1.4.1はBrowser RegressionでPage Scrollが動かず、Move List Container内部だけが追従することを確認する。

## 保存済み一覧でRaw KIFが出た原因

`GameReviewLibraryPresenter`は振り返り本文が空の場合、一覧の`storyExcerpt`へ`kifuText`をフォールバックしていた。そのため「ぴよ将棋 棋譜ファイル」「棋戦」「開始日時」などのRaw HeaderがCard本文へ出ていた。

修正後はRaw KIFをExcerptへ使わない。元KIF Dataは削除せず、保存・Replay・Detail・Backup/Restoreのため保持する。

## 戦型をDomainへ追加しなかった理由

KIF Import時の`openingName`は既に`note`内のKIF Import Metadataとして保存されている。Ver.1.4.1ではこの既存DataをRead Modelで要約し、`戦型：四間飛車`のように表示する。

旧DataでMetadataがない場合は、互換性のためRaw KIF Headerから読み取りだけを行う。それでも一覧へRaw Header全文は出さない。情報がなければ`未設定`とする。

## 結果

Domain Model、Repository、LocalStorage構造、Backup Schemaを増やさず、利用者が直接触れる二つの問題だけを修正できた。これは「保存する情報」と「見せる情報」を分ける設計でもある。
