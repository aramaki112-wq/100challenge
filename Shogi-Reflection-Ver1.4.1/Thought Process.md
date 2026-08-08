# Thought Process.md — Ver.1.4.1 設計判断記録

> この文書は内部推論の逐語記録ではなく、再利用可能な設計判断・採否理由・検証方針をまとめる。

## 判断1：Fixed GridはCSSだけでなくDOM境界も作る

単に`font-size`を小さくする案は不採用とした。別の2文字駒や将来の表示変更で同じ問題が再発するためである。SquareとSVGの間にPiece Containerを入れ、Grid GeometryとPiece Visualを構造的に分離した。

## 判断2：9列だけでなく9行も明示する

盤面は9×9というDomain上不変の形を持つ。Presentationでも列・行の双方を固定し、局面中の内容からtrack sizingを独立させる。

## 判断3：2文字駒はPiece内部で縮める

成桂・成香・成銀のためにSquare幅を広げない。`is-two-character`とpiece-specific classでfont-sizeやletter-spacingを調整し、外形は全駒共通にする。

## 判断4：Replay Scroll Policyへ触れない

Page全体Scrollの問題はVer.1.3.2で解決済みであり、今回のGraphics改善とは別責務である。PolicyとReplay DomainをHash一致で保ち、Browser Testで回帰だけを検査する。

## 判断5：Raw KIFを削除しない

一覧で見にくいことと、保存Dataとして不要であることは同義ではない。Replay、Backup、Restore、将来のParser互換に必要なのでRaw KIFは保持し、Presentationだけを整理する。

## 判断6：戦型のためにDomain Propertyを増やさない

既にKIF Import Metadataとして`note`へ戦型が保存されている。Ver.1.4.1の一覧要件だけを理由にDomain/Storage Migrationを行わず、PresenterでSummaryへ変換する。

## 判断7：Layout Shiftは見た目ではなくBounding Boxでも確認する

Browser Automationで通常局面から成駒局面へ進め、Board幅・高さ、Square幅・高さが変化しないことを実寸値で検証する。さらに成桂・成香・成銀・馬・龍を同じSquareへ描画してもContainerがSquare内に収まることを検査する。

## 判断8：Browser確認とStatic確認を区別する

Browser Automationを行った項目だけを`BROWSER_VERIFICATION_RESULT.txt`へPASSとして記録する。Hash互換やMissing ImportなどはStatic Verificationの責務として分離する。
