# SOURCE_OF_TRUTH_AUDIT.md

## 1. Source of Truth

- Source ZIP: `Shogi-Reflection-Ver1.3.1.zip`
- 実際に受領した添付名: `Shogi-Reflection-Ver1.3.1(1).zip`
- Ver.1.3.1元File数: **208**
- Ver.1.3.1正式Automated Test: **471 passed / 0 failed**
- Ver.1.3.1正式Browser Test: **133 passed / 0 failed**
- Design Rules最終番号: **INTERLUDE-Rule-CZ**

Ver.1.3.1 ZIP展開直後に`npm test`、`npm run check`、`python3 browser_verify.py`を再実行し、471/471、Static 30/30、Browser 133/133を再現してから変更を開始した。

## 2. Ver.1.3.2 File監査

- Ver.1.3.2収録File数: **219**
- Hash一致で保持したFile: **178**
- 変更File: **30**
- 追加File: **11**
- 削除File: **0**
- 削除理由: **削除なし**

### Hash一致で保持したFile
- `AddCurrentPositionToKeyPosition.js`
- `AddCurrentPositionToKeyPosition.test.js`
- `ApplicationErrors.js`
- `ApplyShogiMove.js`
- `ApplyShogiMove.test.js`
- `BoardSnapshot.js`
- `BrowserClipboardAdapter.js`
- `BrowserClipboardAdapter.test.js`
- `BrowserFileAdapter.js`
- `BrowserFileAdapter.test.js`
- `BrowserGameReviewLibraryView.js`
- `BrowserGameReviewLibraryView.test.js`
- `BrowserKeyPositionReplayMarkup.test.js`
- `BrowserKifClipboardAdapter.js`
- `BrowserKifClipboardAdapter.test.js`
- `BrowserKifImportMarkup.test.js`
- `BrowserKifImportView.js`
- `BrowserMarkdownExportView.js`
- `BrowserMarkdownExportView.test.js`
- `BrowserMarkup.test.js`
- `BrowserReplayMarkup.test.js`
- `COMPLETION_REPORT_V1_3_1.md`
- `Clock.js`
- `DeleteGameReview.js`
- `DeleteGameReviewAndPersist.js`
- `DeleteGameReviewAndPersist.test.js`
- `Design-Decisions.md`
- `ExportGameReviewAsMarkdown.js`
- `ExportObservationCardAsMarkdown.js`
- `GameReview.js`
- `GameReview.test.js`
- `GameReviewApplicationServices.test.js`
- `GameReviewEditMapper.js`
- `GameReviewEditMapper.test.js`
- `GameReviewFormMapper.js`
- `GameReviewFormMapper.test.js`
- `GameReviewLibraryPresenter.js`
- `GameReviewLibraryPresenter.test.js`
- `GameReviewMarkdownFormatter.js`
- `GameReviewMarkdownFormatter.test.js`
- `GameReviewMarkdownNaming.js`
- `GameReviewReplayCompatibility.test.js`
- `GameReviewRepository.js`
- `GameReviewSnapshotMapper.js`
- `GameReviewSnapshotService.js`
- `GameReviewSnapshotService.test.js`
- `GetGameReview.js`
- `HandSnapshot.js`
- `INTERLUDE_PLAN.md`
- `Immutable.js`
- `InMemoryGameReviewRepository.js`
- `InMemoryGameReviewRepository.test.js`
- `InitialShogiPositionFactory.js`
- `KEY_POSITION_REPLAY_CONNECTION.md`
- `KIF_SUPPORT_MATRIX.md`
- `KeyPosition.js`
- `KeyPositionReplayController.js`
- `KeyPositionReplayErrors.js`
- `KeyPositionReplayIntegration.test.js`
- `KeyPositionReplayReference.js`
- `KeyPositionReplayReference.test.js`
- `KeyPositionReplayViewModel.js`
- `KeyPositionReplayViewModel.test.js`
- `KifFileReaderAdapter.js`
- `KifFileReaderAdapter.test.js`
- `KifImportApplicationService.js`
- `KifImportApplicationService.test.js`
- `KifImportController.js`
- `KifImportController.test.js`
- `KifImportDto.js`
- `KifImportErrorPresenter.js`
- `KifImportErrors.js`
- `KifImportFormMapper.js`
- `KifImportFormMapper.test.js`
- `KifImportIntegration.test.js`
- `KifImportPreviewPresenter.js`
- `KifMoveNormalizer.js`
- `KifMoveNormalizer.test.js`
- `KifParser.js`
- `KifParser.test.js`
- `KifPastedTextAdapter.js`
- `KifPastedTextAdapter.test.js`
- `KifTestHelpers.js`
- `LICENSE`
- `ListGameReviews.js`
- `LocalStoragePersistence.test.js`
- `LocalStorageSnapshotStore.js`
- `MarkdownExportApplicationServices.test.js`
- `MarkdownExportController.js`
- `MarkdownExportController.test.js`
- `MarkdownExportErrors.js`
- `MarkdownFormatHelpers.js`
- `ObservationCardMarkdownFormatter.js`
- `ObservationCardMarkdownFormatter.test.js`
- `PHASE1_COMPATIBILITY_NOTES.md`
- `PHASE2_GUIDE.md`
- `PHASE3_GUIDE.md`
- `PHASE4_GUIDE.md`
- `PHASE5_GUIDE.md`
- `PersistenceErrors.js`
- `Phase1Compatibility.test.js`
- `PiyoShogiCompatibility.js`
- `PositionHistory.js`
- `PositionHistory.test.js`
- `PositionHistoryBuilder.js`
- `Reference/Debug.md`
- `Reference/Design.md`
- `Reference/Example.md`
- `Reference/Pattern.md`
- `Reference/Syntax.md`
- `Reference/Tips.md`
- `Reference/Word.md`
- `ReflectionBackupController.js`
- `ReflectionErrors.js`
- `ReflectionPersistenceCoordinator.js`
- `ReplayIntegration.test.js`
- `ReplayPositionSnapshot.js`
- `ReplayPositionSnapshot.test.js`
- `ReplayPositionSnapshotFactory.js`
- `ReplayPositionSnapshotSerializer.js`
- `ReplaySnapshotFingerprint.js`
- `ReplayTestHelpers.js`
- `ReplayWarningReference.js`
- `RepositoryErrors.js`
- `ReviewIdGenerator.js`
- `ReviewIdGenerator.test.js`
- `SAMPLE_GameReview.md`
- `SAMPLE_ObservationCard.md`
- `SHOGI_REPLAY_SUPPORT_MATRIX.md`
- `SNAPSHOT_COMPATIBILITY_MATRIX.md`
- `SNAPSHOT_FORMAT.md`
- `SOURCE_OF_TRUTH_AUDIT_V1_3_1.md`
- `SOURCE_OF_TRUTH_BASELINE_HASHES.json`
- `SOURCE_OF_TRUTH_V1_3_BASELINE_HASHES.json`
- `SaveGameReview.js`
- `ShogiBoard.js`
- `ShogiHand.js`
- `ShogiPiece.js`
- `ShogiPosition.js`
- `ShogiPosition.test.js`
- `ShogiPositionSnapshot.js`
- `ShogiReplayApplicationService.js`
- `ShogiReplayApplicationService.test.js`
- `ShogiReplayController.js`
- `ShogiReplayErrors.js`
- `ShogiSquare.js`
- `SubmitGameReviewForm.js`
- `SubmitGameReviewForm.test.js`
- `TestFixtures.js`
- `VER1_3_1_CHANGE_MANIFEST.json`
- `VER1_3_CHANGE_MANIFEST.json`
- `Ver.1.1操作手順書.md`
- `Ver.1.2操作手順書.md`
- `Ver.1.3.1操作手順書.md`
- `Ver.1.3操作手順書.md`
- `fixtures/broken-after-termination.kifu`
- `fixtures/broken-duplicate.kifu`
- `fixtures/broken-footer-conflict.kifu`
- `fixtures/broken-gap.kifu`
- `fixtures/broken-header.kifu`
- `fixtures/broken-move.kifu`
- `fixtures/broken-no-moves.kifu`
- `fixtures/broken-winner-conflict.kifu`
- `fixtures/handicap-warning.kifu`
- `fixtures/minimal-warning.kifu`
- `fixtures/no-move-header.kifu`
- `fixtures/normal-resign-utf8.kifu`
- `fixtures/piyo-official-published-sample.kifu`
- `fixtures/piyo-resign-shiftjis.kif`
- `fixtures/piyo-resign-utf8.kif`
- `fixtures/replay-basic.kif`
- `fixtures/replay-capture-promote.kifu`
- `fixtures/replay-drop.kifu`
- `fixtures/replay-missing-handicap.kif`
- `fixtures/replay-partial-invalid.kif`
- `fixtures/replay-unsupported-handicap.kif`
- `fixtures/timeout.kifu`
- `fixtures/unmapped-header-warning.kifu`

### 変更File
- `00_README_FIRST.md`
- `BROWSER_VERIFICATION_RESULT.txt`
- `BROWSER_VERIFICATION_SCREENSHOT.png`
- `BrowserGameReviewFormView.js`
- `BrowserShogiReplayView.js`
- `CHANGELOG.md`
- `COMPLETION_REPORT.md`
- `Design Handbook.md`
- `Design Novel.md`
- `Design Rules.md`
- `Explanation.md`
- `FILE_INVENTORY.txt`
- `Learning Roadmap.md`
- `README.md`
- `Review Checklist.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `STATIC_VERIFICATION_RESULT.txt`
- `SYNTAX_CHECK_RESULT.txt`
- `ShogiReplayController.test.js`
- `ShogiReplayViewModel.js`
- `ShogiReplayViewModel.test.js`
- `TEST_RESULT.txt`
- `Thought Process.md`
- `browser_verify.py`
- `challenge.md`
- `index.html`
- `main.js`
- `package.json`
- `style.css`
- `verify.mjs`

### 追加File
- `BrowserReplayScrollMarkup.test.js`
- `COMPLETION_REPORT_V1_3_2.md`
- `MOBILE_REPLAY_UX.md`
- `REPLAY_SCROLL_POLICY.md`
- `ReplayScrollPolicy.js`
- `ReplayScrollPolicy.test.js`
- `SOURCE_OF_TRUTH_AUDIT_V1_3_2.md`
- `SOURCE_OF_TRUTH_V1_3_1_BASELINE_HASHES.json`
- `VER1_3_2_CHANGE_MANIFEST.json`
- `Ver.1.3.2操作手順書.md`
- `fixtures/replay-long-300.kif`

### 削除File
- なし

## 3. Replay / Scroll監査

### 原因
`BrowserShogiReplayView.render()`内のCurrent Move追従が`scrollIntoView({ block: "nearest" })`を使用しており、Smartphone縦配置ではMove List ContainerだけでなくBrowser Page全体までScroll対象になり得た。

### 修正
- `ReplayScrollPolicy.js`を追加。
- Current Move可視性をContainer RectとItem Rectで判定。
- 見切れた場合だけ`#replay-move-list.scrollTop`を更新。
- Policyは`window.scrollTo`、`window.scrollBy`、`scrollIntoView`を使用しない。
- Current Move IDを`replay-move-{手数}`として生成。
- Current Highlight、`aria-current`、`aria-selected`を維持。
- 同一棋譜のNavigationではMove List構造を不要に再構築せず、現在手状態だけ更新。
- Move Listを利用者自身がTapした場合だけ盤面へ戻る意図的Page Scrollを許可。
- 重要局面追加成功時はForm FeedbackへFocusせずReplay位置を維持。
- 重複重要局面のInput Focusは`preventScroll: true`。

## 4. CSS / Smartphone変更

- 390px前後ではNavigationを4列で維持。
- Navigation Buttonは最低48px Touch Target。
- 350px未満のみ2列Fallback。
- Smartphoneの持ち駒欄と盤面Paddingを小規模調整。
- Move Listは内部`overflow:auto`を維持し、最大高をSmartphone向けに調整。
- Replay PanelのScroll Anchoring副作用を抑制。

## 5. Test追加と結果

- Ver.1.3.1継承: 471件
- Ver.1.3.2追加: 24件
- Automated Test: **495 passed / 0 failed**
- Browser Verification: **162 passed / 0 failed**
- Static Verification: **47 passed / 0 failed**（現行Source検証時点）
- Missing Import: **0**
- 300手Fixtureを追加し、100/200/300手Jumpと50手連続Navigationを検証。

## 6. 互換性監査

- KIF File Import互換: **維持**
- Drag & Drop互換: **維持**
- KIF Paste互換: **維持**
- Clipboard互換: **維持**
- KeyPosition互換: **維持**
- Replay Position Snapshot互換: **維持・Schema変更なし**
- Backup / Restore互換: **維持**
- Markdown Export互換: **維持**
- Observation Card互換: **維持**
- 保存済みGameReview Replay互換: **維持**
- GameReview Domain: **変更なし**
- 重要局面3〜5件Rule: **変更なし**
- Observation Theme 1件Rule: **変更なし**
- 実行Rule 1〜3件Rule: **変更なし**

## 7. Error Code一覧

Ver.1.3.2ではScroll専用の重大Error Codeを追加していない。Scroll Container / Current Move Item不在はUI Policyの安全なStatusとして扱い、Domain / Repository Dataを変更しない。既存Error Code体系は次のとおり。

### Application
- `INVALID_GAME_REVIEW`
- `INVALID_REVIEW_ID`
- `GAME_REVIEW_NOT_FOUND`
- `SAVE_GAME_REVIEW_FAILED`
- `GET_GAME_REVIEW_FAILED`
- `LIST_GAME_REVIEWS_FAILED`
- `DELETE_GAME_REVIEW_FAILED`

### KeyPosition Replay
- `KEY_POSITION_REPLAY_NOT_AVAILABLE`
- `KEY_POSITION_REPLAY_MOVE_REQUIRED`
- `KEY_POSITION_REPLAY_SNAPSHOT_INVALID`
- `KEY_POSITION_REPLAY_DUPLICATE`
- `KEY_POSITION_LIMIT_REACHED`
- `KEY_POSITION_REPLAY_SOURCE_MISMATCH`
- `KEY_POSITION_REPLAY_REFERENCE_INVALID`
- `KEY_POSITION_SNAPSHOT_VERSION_UNSUPPORTED`
- `KEY_POSITION_REPLAY_ADD_FAILED`

### KIF Import
- `KIF_FILE_NOT_SELECTED`
- `KIF_FILE_EMPTY`
- `KIF_FILE_TOO_LARGE`
- `KIF_FILE_EXTENSION_INVALID`
- `KIF_READ_FAILED`
- `KIF_CLIPBOARD_UNAVAILABLE`
- `KIF_CLIPBOARD_READ_FAILED`
- `KIF_ENCODING_UNSUPPORTED`
- `INVALID_KIF_FORMAT`
- `KIF_HEADER_INVALID`
- `KIF_MOVES_NOT_FOUND`
- `KIF_MOVE_INVALID`
- `KIF_MOVE_NUMBER_DUPLICATE`
- `KIF_MOVE_NUMBER_GAP`
- `KIF_TERMINATION_INVALID`
- `KIF_CONTENT_CONFLICT`
- `KIF_IMPORT_CANCELLED`
- `KIF_PREVIEW_NOT_FOUND`

### Markdown Export
- `INVALID_GAME_REVIEW_SNAPSHOT`
- `OBSERVATION_CARD_NOT_READY`
- `CLIPBOARD_UNAVAILABLE`
- `CLIPBOARD_WRITE_FAILED`

### Persistence
- `INVALID_SNAPSHOT_DOCUMENT`
- `INVALID_SNAPSHOT_JSON`
- `INVALID_APPLICATION_ID`
- `UNSUPPORTED_SCHEMA_VERSION`
- `INVALID_EXPORTED_AT`
- `INVALID_REPOSITORY_REVISION`
- `DUPLICATE_GAME_REVIEW_ID`
- `DUPLICATE_KEY_POSITION_ID`
- `DOMAIN_RULE_VIOLATION`
- `SNAPSHOT_RESTORE_FAILED`
- `LOCAL_STORAGE_UNAVAILABLE`
- `LOCAL_STORAGE_SAVE_FAILED`
- `LOCAL_STORAGE_LOAD_FAILED`
- `LOCAL_STORAGE_DELETE_FAILED`
- `INVALID_BACKUP_JSON`

### Reflection Domain
- `INVALID_REVIEW_ID`
- `INVALID_GAME_DATE`
- `INVALID_SIDE`
- `INVALID_RESULT`
- `INVALID_KIFU_TEXT`
- `INVALID_KEY_POSITION`
- `TOO_MANY_KEY_POSITIONS`
- `TOO_FEW_KEY_POSITIONS`
- `INVALID_OBSERVATION_THEME`
- `INVALID_ACTION_RULE`
- `TOO_MANY_ACTION_RULES`

### Repository
- `INVALID_REPOSITORY`
- `INVALID_REVIEW_ENTITY`
- `INVALID_REVIEW_ID`
- `INVALID_REPOSITORY_REVISION`
- `DUPLICATE_REVIEW_ID`
- `REPOSITORY_OPERATION_FAILED`

### Shogi Replay
- `SHOGI_REPLAY_NOT_AVAILABLE`
- `SHOGI_INITIAL_POSITION_UNSUPPORTED`
- `SHOGI_MOVE_PARSE_FAILED`
- `SHOGI_MOVE_SOURCE_NOT_FOUND`
- `SHOGI_MOVE_SOURCE_AMBIGUOUS`
- `SHOGI_MOVE_DESTINATION_INVALID`
- `SHOGI_PIECE_NOT_FOUND`
- `SHOGI_DROP_PIECE_NOT_IN_HAND`
- `SHOGI_CAPTURE_INVALID`
- `SHOGI_PROMOTION_INVALID`
- `SHOGI_MOVE_NUMBER_INVALID`
- `SHOGI_POSITION_BUILD_FAILED`
- `SHOGI_REPLAY_JUMP_OUT_OF_RANGE`
- `SHOGI_TURN_MISMATCH`

## 8. Design Rules

Ver.1.3.1最終`CZ`を継承し、Ver.1.3.2では`DA`〜`DJ`を追加。最終番号は **INTERLUDE-Rule-DJ**。

## 9. ZIP再展開Gate

正式ZIPを別Folderへ展開し、展開物だけでAutomated 495/495、Browser 162/162、Static 47/47、Missing Import 0を再現した場合のみVer.1.3.2を完成扱いとする。
