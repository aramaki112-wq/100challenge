# Design-Decisions.md

## Ver.1.0までの決定

- GameReview・KeyPosition Domain Modelを中心にする
- RepositoryとLocalStorage Adapterを分離する
- JSON Restoreは全件検証後にAtomic適用する
- Browser FormはMapperを介してDomainへ接続する
- 保存済みReviewの一覧・編集・削除をApplication Service経由で行う
- Markdownを保存済みSnapshotから生成するDerived Artifactとして扱う
- Observation Card作成条件をDomain Ruleから変更しない

## Ver.1.1の決定

### DD-1｜KIF Importを既存Domainの外側へ置く

KIFは外部形式であり、GameReview・KeyPositionへParsing責務を追加しない。

### DD-2｜File ReaderとParserを分ける

File ReaderはBrowser File、Size、Extension、Encodingを担当し、ParserはKIF Textの意味だけを担当する。

### DD-3｜Import DTOをDomain Entityにしない

解析成功はDomain保存成功を意味しないため、境界Objectとして扱う。

### DD-4｜Previewを必須にする

Parser結果を直接Formへ入れず、利用者がWarningと基本情報を確認してから反映する。

### DD-5｜ImportとSaveを分ける

KIF Import ControllerはRepositoryを持たず、保存は既存`SubmitGameReviewForm`へ委ねる。

### DD-6｜人間の観察項目を上書きしない

KIFから物語、重要局面、感情、解釈、仮説、判断Pattern、Theme、Ruleを生成しない。

### DD-7｜元KIF Textを保持する

解析結果だけでなく原文を残し、将来のParser改善時に再検証できるようにする。

### DD-8｜平手以外はWarning付きImportにする

Ver.1.1は盤面再現を行わないため、基本情報と原文の保存は許可し、将来の盤面処理対象外であることをWarningで示す。

### DD-9｜ぴよ将棋固有判断をGeneric Parserへ埋め込まない

Source Compatibility Ruleを別Classへ分離する。

### DD-10｜既存DomainにKIF専用Propertyを追加しない

専用Propertyがない基本情報は、自由Memo内の明示的な境界Metadata Blockへ記録する。

## Ver.1.2の決定

### DD-11｜Replay ModelをGameReviewから分離する

Position HistoryとNavigationはGameReview保存責務へ入れない。

### DD-12｜盤面反転はView設定とする

内部SquareとPiece Ownerを反転せず、表示順だけを変更する。

### DD-13｜途中Replay失敗を部分成功として表現する

再現可能最終手数と失敗手数を分離し、Warningを隠さない。

## Ver.1.3の決定

### DD-14｜Replay ReferenceをKeyPositionの任意Propertyとする

Snapshotなし旧KeyPositionを有効に保ち、Replay技術Dataを本文から分離する。

### DD-15｜0手目を重要局面へ追加しない

既存moveNumber Ruleを維持し、暗黙に1手目へ補正しない。

### DD-16｜同一手数の自動重複追加を拒否する

既存項目へFocusし、本文を推測で上書きしない。

### DD-17｜Position HistoryからSnapshotを生成する

候補追加ごとにKIF全体を再Parseせず、現在Positionと直前Positionを使用する。

### DD-18｜Snapshot作成日時を保存しない

同一Source・同一手数から決定的なSnapshotを再生成できることを優先する。

### DD-19｜Top-level Schema Version 1を維持する

Replay Referenceは任意拡張とし、Replay Position自身のVersionを別に管理する。

### DD-20｜不正Snapshotを含むRestoreをAtomicに拒否する

壊れたSnapshotを黙って削除せず、現在Repositoryを変更しない。

### DD-21｜保存済み詳細からの追加は編集Formへ自動移行する

保存済みDataを直接変更せず、従来の保存Buttonでのみ更新する。

### DD-22｜Snapshot Previewは必要時に描画する

最大5個の81Square盤面を常時描画せず、入力欄とSmartphone操作を優先する。
