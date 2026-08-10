# SHOGI_BOARD_GRAPHICS_GUIDELINE.md — Ver.1.4.1

## 固定原則

- Boardは9×9固定Grid。
- 81 SquareのGeometryは局面内容から独立。
- Piece GraphicsはSquare Sizeを決定しない。
- ReplayとSnapshotで同じPiece Component / Fixed Grid思想を使う。
- Board FlipでもGeometryを変更しない。

## DOM責務

```text
Square → Piece Container → SVG Piece → Piece Label
```

Piece ContainerはSquare内のVisual領域を決める。SVGは100%でContainerへ収める。

## 駒

- 共通五角形
- 先後は向きで区別
- 成駒は文字＋Promotion Mark
- 成桂/成香/成銀は2文字専用Typography
- と/成香/成桂/成銀/馬/龍は色だけに依存しない

## 禁止

- 2文字駒のためにGrid column/rowを拡張する
- PieceにSquareより大きいmin-width/min-heightを与える
- SVG overflowでSquare外へ描画する
- Graphics修正をReplay Domain変更の理由にする
