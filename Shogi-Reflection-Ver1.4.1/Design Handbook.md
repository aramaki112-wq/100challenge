# Design Handbook.md — Ver.1.4.1 Fixed Grid・Piece Container・Saved Game Summary

> 中心の問い：UIの見え方を直す時、Domainや解決済みReplay Policyを動かさず、Presentation LayerだけでGeometryと情報量を安定させるにはどう設計するか。

# 第1部　Source of Truthと問題原因を固定する

## STEP01　Ver.1.4を監査する
### 1. 🎯 このSTEPの目的
変更前の全File、Test、Domain、Repository、Storage、Replay Scroll Policy、Board、Saved Game ViewerをSource of Truthとして固定する。
### 2. 🤔 なぜこの作業をするのか
UI修正の途中で「便利だから」と既存設計まで変更するとRegressionの原因が分からなくなるため。
### 3. 💻 コードを書く
Ver.1.4の250 FileをHash化し、`SOURCE_OF_TRUTH_V1_4_BASELINE_HASHES.json`へ保存する。変更前に543 Automated Testを実行する。
### 4. 💡 設計者のひとこと
改善前の証拠を持つと、変更しなかったことも設計成果として説明できる。
### 5. ✅ チェックポイント
ReplayScrollPolicy、PositionHistory、Repository、LocalStorage、Backup Schema、Step UI、KeyPosition Ruleを特定できる。
### 6. ▶ 次へ進む条件
Presentationだけで直す場所と、Hash一致で守る場所を説明できること。

## STEP02　Square Size変動の原因を分解する
### 1. 🎯 このSTEPの目的
Board Container、Grid、Square、SVG、LabelのどこがGeometryを決めているかを調べる。
### 2. 🤔 なぜこの作業をするのか
成桂だけfont-sizeを下げる対症療法では、別の駒やSnapshotで再発するため。
### 3. 💻 コードを書く
`style.css`と`ShogiPieceSvg.js`を追い、列9分割はあるが行9分割が明示されていないこと、SVGがSquare直下で`overflow:visible`だったことを記録する。
### 4. 💡 設計者のひとこと
Layout bugは「文字が大きい」ではなく「誰がSizeを決めてよいか」の問題として見る。
### 5. ✅ チェックポイント
Grid track sizingとPiece contentの責務境界を言葉で説明できる。
### 6. ▶ 次へ進む条件
Square Geometryを局面内容から独立させる修正方針が決まること。

# 第2部　Fixed GridとPiece Containerを作る

## STEP03　9×9 Grid Geometryを固定する
### 1. 🎯 このSTEPの目的
Replay盤とSnapshot盤の81升を常に同じ幅・高さにする。
### 2. 🤔 なぜこの作業をするのか
盤面は局面ごとに変わるが、盤そのもののGeometryは変わらないため。
### 3. 💻 コードを書く
`grid-template-columns`と`grid-template-rows`を双方9分割にし、Squareを`width:100%` / `height:100%` / `overflow:hidden`へする。
### 4. 💡 設計者のひとこと
9×9は見た目の好みではなく、盤面PresentationのInvariantである。
### 5. ✅ チェックポイント
Empty SquareとPiece Squareが同じclass・同じBounding Boxを使う。
### 6. ▶ 次へ進む条件
通常駒と成駒の局面でBoard/Square実寸が変わらないこと。

## STEP04　Piece Container内で駒を描く
### 1. 🎯 このSTEPの目的
駒GraphicsをSquare Sizeの決定から切り離す。
### 2. 🤔 なぜこの作業をするのか
SVGや2文字LabelがGridを押し広げる経路を構造的になくすため。
### 3. 💻 コードを書く
`shogiPieceMarkup()`を追加し、Square → Piece Container → SVG Piece → Labelへ変更する。成桂・成香・成銀はPiece-specific classで内部文字だけを調整する。
### 4. 💡 設計者のひとこと
Containerは「小さくするCSS」ではなく、責務の境界である。
### 5. ✅ チェックポイント
五角形外形、先後回転、成駒Mark、aria-labelが維持される。
### 6. ▶ 次へ進む条件
成桂・成香・成銀・馬・龍がSquare外へLayout影響を出さないこと。

## STEP05　ReplayとSnapshotを同じ思想で揃える
### 1. 🎯 このSTEPの目的
Replay盤だけ直して重要局面Snapshotを取り残さない。
### 2. 🤔 なぜこの作業をするのか
同じ局面Dataが表示場所によって違うGeometryになると学習時の比較が不安定になるため。
### 3. 💻 コードを書く
`BrowserShogiReplayView`と`BrowserGameReviewFormView`の双方で`shogiPieceMarkup()`を使い、共通Fixed Grid CSSを適用する。
### 4. 💡 設計者のひとこと
共通Componentは見た目を同じにするだけでなく、再発箇所を減らす。
### 5. ✅ チェックポイント
Board Flip、Snapshot 81升、Replay Positionとの一致を既存Domain変更なしで維持する。
### 6. ▶ 次へ進む条件
Replay/SnapshotのPresentationだけが変更され、Replay Domain Hashが保持されること。

# 第3部　保存Dataと利用者向けSummaryを分ける

## STEP06　Raw KIF表示経路を断つ
### 1. 🎯 このSTEPの目的
保存済み対局一覧へ長いKIF Headerを表示しない。
### 2. 🤔 なぜこの作業をするのか
Raw Dataは保存には必要でも、一覧で次の対局を選ぶための情報としては過剰だから。
### 3. 💻 コードを書く
`GameReviewLibraryPresenter`の`storyExcerpt`から`kifuText`フォールバックを外す。Cardは対局日、相手、自分の側、勝敗、戦型、手数、状態を表示する。
### 4. 💡 設計者のひとこと
「保存する」と「一覧で見せる」は別の責務である。
### 5. ✅ チェックポイント
元`kifuText`はDomain/Snapshotに残り、一覧Markupへは出ない。
### 6. ▶ 次へ進む条件
Raw Header非表示でもReplay/Backup/Restoreが成立すること。

## STEP07　戦型をRead Modelで要約する
### 1. 🎯 このSTEPの目的
新しいDomain PropertyやStorage Migrationなしで戦型を一覧表示する。
### 2. 🤔 なぜこの作業をするのか
KIF Import Metadataとして既に保持している情報を、UI要件だけのため二重保存しないため。
### 3. 💻 コードを書く
`note`内Metadataから`戦型`を抽出し、旧DataはRaw KIF Headerを読み取りFallbackとする。不明なら`未設定`を返す。
### 4. 💡 設計者のひとこと
Read ModelはDomain Dataを複製する場所ではなく、利用者の問いへ答える形へ整える場所である。
### 5. ✅ チェックポイント
`対局日：`と保存日時・更新日時が別Labelになり、戦型が簡潔に表示される。
### 6. ▶ 次へ進む条件
Domain/Repository/Storage変更なしでSummary Testが通ること。

# 第4部　Regression Safetyと配布物を検証する

## STEP08　Automated / Browser / Staticを分けて検証する
### 1. 🎯 このSTEPの目的
Fixed Gridの構造、実Browser Geometry、Source互換をそれぞれ適切な方法で確認する。
### 2. 🤔 なぜこの作業をするのか
DOM文字列TestだけではLayout Shiftを証明できず、Browser TestだけではHash互換やMissing Importを証明できないため。
### 3. 💻 コードを書く
Automated TestへFixed Grid/Piece/Summaryを追加し、390×844 ChromiumでBounding Box、Replay Scroll、一覧表示を検査する。`verify.mjs`でHashとImportを監査する。
### 4. 💡 設計者のひとこと
「何を確認したか」だけでなく「どの証拠で確認したか」を分けると報告が正直になる。
### 5. ✅ チェックポイント
Automated 567/567、Browser 107/107、Missing Import 0、ReplayScrollPolicy Hash一致。
### 6. ▶ 次へ進む条件
正式ZIPを別Folderへ展開し、展開物だけで同じTestを再実行できること。
