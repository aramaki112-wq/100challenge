# SHOGI_BOARD_GRAPHICS_GUIDELINE.md — Ver.1.4

## 目的

長時間Replayしても読みやすく、スマートフォン縮小時にも駒が崩れにくい将棋盤をPresentation Layerだけで実現する。

## Board

- 木材を連想させる落ち着いた盤色。
- 9×9の境界線を十分に識別できるContrast。
- 最終手From / To Highlightを維持。
- Current MoveはMove List側で`aria-current`と視覚Highlightを維持。
- 盤面反転は表示順と駒向きだけを変更し、内部Square座標を変更しない。

## Piece Component

`ShogiPieceSvg.js`が外部AssetなしでInline SVGを生成する。

- 共通ViewBox `0 0 100 112`
- 共通五角形Polygon
- 全駒で外形を統一
- `is-two-character`で成桂・成香・成銀などを縮小調整
- `is-promoted`と上部Promotion Markで成駒を色だけに依存せず識別
- `is-rotated`で後手方向を表現
- SVG自体は装飾扱い`aria-hidden=true`とし、Squareの`aria-label`で所有者＋駒名を読み上げる

## 成駒

- と
- 成香
- 成桂
- 成銀
- 馬
- 龍

文字そのものとPromotion Markを併用し、色覚だけに依存しない。

## Snapshot

Replay盤とKeyPosition Snapshotは同じ`ShogiPieceSvg.js`を使用する。Snapshot専用に別Assetを持たず、表示差分はCSS Classだけに限定する。

## Regression

Graphics変更を理由に`PositionHistory`、`ShogiReplayApplicationService`、`ReplayScrollPolicy`、Snapshot内部座標へ変更を入れない。
