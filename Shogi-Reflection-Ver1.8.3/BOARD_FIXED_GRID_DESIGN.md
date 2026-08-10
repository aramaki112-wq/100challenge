# BOARD_FIXED_GRID_DESIGN.md

## 目的

Ver.1.4.1の将棋盤は、局面内容と無関係に同じ9×9 Geometryを維持する。

## Ver.1.4監査結果

- Boardは`display:grid`。
- 列は`repeat(9, minmax(0, 1fr))`で固定されていた。
- 行方向の9分割は明示されていなかった。
- SVG PieceがSquare直下へ配置されていた。
- Piece SVGに`overflow:visible`が残っていた。
- 2文字駒は専用classがあったが、GridとPiece contentの責務境界が弱かった。

## Ver.1.4.1の構造

```text
Board
└─ 9 columns × 9 rows
   └─ Square × 81
      └─ Piece Container (駒がある時のみ)
         └─ SVG Piece
            ├─ Pentagon Shape
            ├─ Promotion Mark
            └─ Piece Label
```

## Geometry Rule

```css
.replay-board-grid,
.snapshot-board {
  grid-template-columns: repeat(9, minmax(0, 1fr));
  grid-template-rows: repeat(9, minmax(0, 1fr));
  aspect-ratio: 1 / 1;
  overflow: hidden;
  contain: layout paint;
}
```

Squareは`width:100%` / `height:100%` / `min-width:0` / `min-height:0` / `overflow:hidden`とする。

## Piece Rule

- 全駒の外形SizeはPiece Container内で共通。
- 五角形は共通polygonを使用。
- 先後は180度回転で区別する。
- 成駒は文字とPromotion Markを併用する。
- `成香` / `成桂` / `成銀`は`is-two-character`とpiece-specific classで文字だけ調整する。
- Piece側からSquare width/heightを変更しない。

## Accessibility

Squareのaccessible nameは既存Viewで維持する。SVG自体は`aria-hidden="true"`とし、見た目用の内部文字を二重読み上げさせない。成駒名はSquareのaria-labelで読み上げる。

## Replay Scrollとの境界

Fixed GridはPresentation Layoutの変更であり、`ReplayScrollPolicy.js`を変更しない。Current Move追従はMove List Container内部だけで行う。

## Browser検証

390×844 Chromiumで以下をAutomationした。

- 81升
- Square幅のunique値が1種類
- Square高さのunique値が1種類
- Board幅と高さが同一
- 通常局面→成駒局面でBoard Bounding Box不変
- 成桂/成香/成銀/馬/龍を実Squareへ描画してもBoard Bounding Box不変
- Piece ContainerがSquare内に収まる
- Board Flip
- Snapshot 81升とGeometry
- Replayの次へ/前へ/最初/最後/KeyboardでPage Scroll不変

詳細は`BROWSER_VERIFICATION_RESULT.txt`を参照する。
