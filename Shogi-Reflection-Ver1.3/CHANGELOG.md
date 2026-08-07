# CHANGELOG

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
