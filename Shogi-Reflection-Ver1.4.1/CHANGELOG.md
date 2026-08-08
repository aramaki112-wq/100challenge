# CHANGELOG

## Ver.1.4.1 — 2026-08-08

### Fixed

- Replay盤とSnapshot盤を9列×9行の固定Gridへ変更。
- Squareの幅・高さを局面内容から独立させ、81升のGeometryを固定。
- Square内にPiece Containerを追加し、SVG Pieceが升Sizeを決定しない構造へ変更。
- 成桂・成香・成銀の2文字表示をPiece内部で調整し、Gridを押し広げないよう修正。
- SVGの外形を共通の将棋駒らしい五角形へ統一し、Square外へのVisual overflowを防止。
- 保存済み対局一覧のRaw KIF Headerフォールバック表示を廃止。
- 保存済み対局Cardに`対局日：`、戦型、対戦相手、自分の側、勝敗、手数、振り返り状態を整理して表示。

### Preserved

- Domain ModelのVer.1.4構造。
- Repository Contract / LocalStorage構造 / Backup Schema Version 1。
- Position History / Replay Application Service / Replay View Model。
- Ver.1.3.2で解決済みのReplay Scroll Policy。
- Step UI / 棋譜先行保存 / Reflection再開。
- KeyPosition 3〜5件 / Observation Theme 1件 / 実行Rule 1〜3件。
- KIF ClearとSaved Game Deleteの分離。
- Markdown Export / Observation Card / Help。

### Verification

- Automated Test: 567 / 567 pass。
- Browser Automation: 107 / 107 pass（390×844 Chromium via Playwright）。
- ZIP展開後検証結果は`COMPLETION_REPORT.md`へ記録。

## Ver.1.4 — 2026-08-08

### Added

- 7 Step型Workflow UI
- `GAME_ONLY` / `REFLECTION_IN_PROGRESS` / `REFLECTION_COMPLETE` Lifecycle Status
- 棋譜だけ先に保存する`SAVE_GAME` Intent
- 振り返り途中保存と明示Completionの分離
- 保存済み対局Viewer / Detail / Replay再開
- 保存日時・更新日時
- 先手名・後手名のOptional保存
- `ShogiPieceSvg.js`によるオリジナルInline SVG駒
- Application内取扱説明書とContext Help
- Ver.1.4 Automated Test 38件
- Ver.1.4 Browser Automation 86項目

### Changed

- 縦長一画面UIをStep責務へ分割
- 対局メモだけでは振り返り中にしないLifecycle判定
- 保存済み対局一覧の手数をReplay構築なしで算出
- 成桂・成香・成銀の2文字駒を専用Layout化
- Replay盤とSnapshot盤の駒Componentを共通化

### Preserved

- Ver.1.3.3既存505 Automated Test
- Replay Scroll Policy
- KIF File / Drag & Drop / Paste / Clipboard / Clear / Retry / Preview
- Position History / Replay Application Service / Replay View Model
- KeyPosition 3〜5件、Observation Theme 1件、実行Rule 1〜3件
- Backup / Restore Schema Version 1
- Markdown Export / Observation Card
- MIT LICENSE

## Ver.1.3.3 — 2026-08-08

### Added

- KIF貼り付け欄の`入力をクリア`操作
- Preview後の`棋譜入力へ戻る`／再Preview経路
- Presentation専用`KifImportDraftResetController`
- KIF Clear／Import Retry／Japanese UI Automated Test
- KIF Clear／Retry／Data Safetyを含むBrowser Verification
- `KIF_INPUT_RESET_POLICY.md`
- `JAPANESE_UI_GUIDELINE.md`
- `Ver.1.3.3操作手順書.md`

### Changed

- Browser UIの主要な利用者向け英語表記を日本語中心へ変更
- aria-label、Help Text、Empty State、Error／Warning表示を日本語中心へ整理
- SmartphoneのKIF操作Buttonを48px以上のTouch Targetへ調整
- Import Previewの中止を「Previewだけ破棄してKIF本文を保持」する意味へ明確化

### Preserved

- `ReplayScrollPolicy.js`とVer.1.3.2のPage Scroll抑制
- KIF File Import／Drag & Drop／Clipboard読込
- GameReview／KeyPosition／Replay Domain Model
- 重要局面3〜5件、Observation Theme 1件、実行Rule 1〜3件
- Snapshot／Backup／Restore／Markdown Export／Observation Card
- Ver.1.3.2既存495 Automated Test

## Ver.1.3.1 — 2026-08-08

### Added

- スマホ向けKIF Textareaと長押しPaste経路
- `クリップボードから読み込む` Button
- `貼り付けたKIFをPreview` Button
- `BrowserKifClipboardAdapter`
- `KifPastedTextAdapter`
- Clipboard API非対応・権限拒否時の手動Paste案内
- Paste経路のAutomated Test 13件
- Paste経路を含むChromium Verification 133項目

### Preserved

- KIF File選択／Drag & Drop
- File Reader → Parser → Import Preview → Form反映の既存経路
- 貼り付けただけでは保存しない境界
- Ver.1.3のReplay・KeyPosition Snapshot・Domain Rule・Backup／Restore・Markdown Export・Observation Card
- Ver.1.3既存458 Automated Test

## Ver.1.3 — 2026-08-02

### Added

- 棋譜再現盤の現在局面を重要局面候補へ追加する操作
- `BoardSnapshot`、`HandSnapshot`、`ShogiPositionSnapshot`
- `ReplayPositionSnapshot`とSnapshot Version 1
- `KeyPositionReplayReference`
- Position HistoryからSnapshotを作るFactoryとSerializer／Deserializer
- Source KIF Move、現在局面、直前局面、持ち駒、手番、最終移動元・移動先、Replay Warningの保持
- 同一手数の重複判定と既存項目へのFocus
- 重要局面5件上限の事前無効化と無効理由
- Form内の局面Snapshot詳細表示と小型盤面Preview
- 保存済みReviewのReplayから編集状態へ移って候補を追加する接続
- KIF Import直後の未保存Formから候補を追加する接続
- Ver.1.2 Data／SnapshotなしKeyPosition互換処理
- Replay接続Error Codeと利用者向け日本語Message
- Ver.1.3追加Automated Test 125件
- Chromium Browser Verification 116件
- `KEY_POSITION_REPLAY_CONNECTION.md`
- `SNAPSHOT_FORMAT.md`
- `SNAPSHOT_COMPATIBILITY_MATRIX.md`
- `Ver.1.3操作手順書.md`

### Changed

- `KeyPosition`へ任意のReplay Referenceと客観的指し手情報を追加
- Form Mapper、Edit Mapper、Persistent Snapshot Mapperを任意Snapshot対応へ拡張
- Markdown Exportへ指し手とReplay Snapshot識別情報を追加
- Replay Controllerへ現在状態の読取境界を追加
- Browser FormへReplay由来項目、Snapshot Preview、局面単位の判断Pattern・学びを追加
- `main.js`へReplay→Form候補接続を追加
- `index.html`と`style.css`をVer.1.3 UIへ拡張
- Versionを`1.3.0`へ更新
- 教材・監査・検証資料をVer.1.3へ更新

### Preserved

- GameReview Aggregateと次局接続Rule
- 重要局面3〜5件、Observation Theme 1件、実行Rule 1〜3件
- FACT・INTERPRETATION・HYPOTHESISの本人入力
- Repository Contract／InMemory Repository
- LocalStorage／JSON Backup／Atomic Restore
- KIF File Reader／KIF Parser／Import Preview
- Position History／Replay Application Service
- Markdown Export／Observation Card
- Ver.1.2既存333 Test

## Ver.1.2 — 2026-08-02

- 平手初期局面とPosition History
- 前後移動、Jump、棋譜一覧、持ち駒、成駒、盤面反転
- KIF Import後および保存済みReviewからのReplay
- Ver.1.2追加162 Test、全333 Test

## Ver.1.1 — 2026-08-02

- KIF File選択／Drag & Drop
- Shift_JIS／UTF-8読込
- Generic KIF Parser
- Import Preview
- Form反映と保存の分離
- ぴよ将棋互換確認

## 1.3.2 - 2026-08-08

### Fixed
- Replay Navigation時のCurrent Move `scrollIntoView()`がBrowser Page全体を棋譜一覧へ移動させる問題を修正。
- 重要局面追加成功時のFeedback FocusがReplay位置を奪う問題を修正。

### Added
- `ReplayScrollPolicy.js`
- Replay Scroll Policy Unit Test / Browser Markup Test
- 300手Replay Fixture
- Page `scrollY` / Move List `scrollTop` Browser Verification
- `REPLAY_SCROLL_POLICY.md`
- `MOBILE_REPLAY_UX.md`
- `Ver.1.3.2操作手順書.md`

### Changed
- Current Moveへ安定したDOM IDを付与。
- Move Listの現在手だけを更新し、同一棋譜中の不要な全List再構築を抑制。
- 390px前後のNavigationを4列・48px以上へ調整。
- 明示的にReplayへ移動する場合は盤面中央寄せへ変更。

### Compatibility
- GameReview Domain変更なし。
- KeyPosition Validation変更なし。
- Replay Snapshot Schema変更なし。
- Backup/Restore Schema変更なし。
- Markdown Export / Observation Card互換維持。
