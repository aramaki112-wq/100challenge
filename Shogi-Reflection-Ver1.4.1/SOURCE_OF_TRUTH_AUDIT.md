# SOURCE_OF_TRUTH_AUDIT.md — Ver.1.4.1

> Source of Truth: `Shogi-Reflection-Ver1.4.zip`（今回添付されたVer.1.4正式版）

## 1. 監査Summary

- Ver.1.4元File数: **250**
- Ver.1.4.1収録File数: **257**
- Hash一致保持File: **217**
- 変更File: **33**
- 追加File: **7**
- 削除File: **0**
- 削除理由: **削除なし**
- Ver.1.4変更前Automated Test: **543 / 543 pass**
- Ver.1.4.1 Automated Test: **567 / 567 pass**
- Ver.1.4.1 Browser Automation: **107 / 107 pass**（390×844 / Chromium via Playwright）
- Static Verification: **0 fail / Missing Import 0**
- Design Rules: Ver.1.4最終`ED` → Ver.1.4.1最終`EL`

## 2. 原因監査

### Board Rendering

- Ver.1.4はGrid列を9分割していたが、行方向の9分割を明示していなかった。
- Piece SVGがSquare直下へ入り、SVG側に`overflow:visible`が残っていた。
- 2文字駒用Typographyはあったが、Square GeometryとPiece Visualの構造境界が弱かった。
- Ver.1.4.1では9列×9行を明示し、Square → Piece Container → SVG → Labelへ分離した。

### Saved Game Viewer

- 長いKIF Headerの直接原因は`GameReviewLibraryPresenter`の`storyExcerpt`が`kifuText`へFallbackしていたこと。
- Raw KIF Dataは削除せず、List Summaryからだけ除外した。
- 戦型は既存`note`内KIF Import MetadataをRead Modelで要約し、旧Data互換時だけRaw KIF Headerを読み取りFallbackとする。

## 3. Layer別変更

### Domain変更

**なし。** `GameReview.js`、`KeyPosition.js`等の主要Domain FileはVer.1.4 Hash一致。

### Repository変更

**なし。** `GameReviewRepository.js`、`InMemoryGameReviewRepository.js`はVer.1.4 Hash一致。

### Storage変更

**なし。** `LocalStorageSnapshotStore.js`、Snapshot Mapper/ServiceはVer.1.4 Hash一致。Storage Migrationなし。Backup Schema Version 1維持。

### Board変更

- `style.css`: 9×9 Fixed Grid、Square containment、Piece Container、Smartphone typography。
- `ShogiPieceSvg.js`: Piece Container markup追加、共通五角形、2文字piece-specific class。
- `BrowserShogiReplayView.js`: Replay Square内でPiece Containerを使用。

### Piece変更

- 全駒の外形GeometryをPiece Container内へ統一。
- 成桂/成香/成銀はSquareではなくPiece Label内部で文字Sizeを調整。
- と/成香/成桂/成銀/馬/龍は文字＋Promotion Markで色だけに依存せず識別。

### Saved Game Viewer変更

- `対局日：YYYY/MM/DD`を明示。
- 対戦相手、自分の側、勝敗、戦型、手数、振り返り状態をCard Summaryへ整理。
- Raw KIF Header全文をListへ表示しない。

### Replay変更

`BrowserShogiReplayView.js`のPiece Presentationのみ変更。Position History、Replay Application Service、Replay View Modelは変更なし。

### Replay Scroll Policy互換

**互換維持。** `ReplayScrollPolicy.js`はVer.1.4 Hash一致。Browser Automationで次へ/前へ/最初/最後/KeyboardのPage Scroll不変とMove List内部Scrollを確認。

### Step UI互換

**互換維持。** `BrowserStepNavigation.js`はVer.1.4 Hash一致し、7 Step panel数もStatic/Browserで確認。

### KeyPosition互換

**互換維持。** Domain/Replay Reference/AddCurrentPosition coreはHash一致。重要局面3〜5件Rule維持。

### Snapshot互換

Snapshot Domain/FactoryはHash一致。Presentationのみ`BrowserGameReviewFormView.js`でPiece Containerを利用し、Fixed Grid Geometryを適用。Browser Automationで81升と実寸を確認。

### Backup / Restore互換

**互換維持。** Schema Version 1、Storage core Hash一致。Browser AutomationでBackup Restoreを確認。

### Markdown Export互換

**互換維持。** `GameReviewMarkdownFormatter.js`はVer.1.4 Hash一致。

### Observation Card互換

**互換維持。** `ObservationCardMarkdownFormatter.js`はVer.1.4 Hash一致。Theme 1件 / Rule 1〜3件Rule維持。

## 4. Test追加

- `FixedBoardGridV141.test.js`
- `PieceLayoutV141.test.js`
- `SavedGameSummaryV141.test.js`
- `BoardGraphicsV14.test.js`を新しい実五角形Geometryに追従。
- `browser_verify.py`へFixed Grid Bounding Box、成桂/成香/成銀/馬/龍、Snapshot、保存済みSummary、Replay Scroll回帰を追加。

## 5. 保護対象Hash一致

- `GameReview.js`: **MATCH**
- `GameReviewRepository.js`: **MATCH**
- `InMemoryGameReviewRepository.js`: **MATCH**
- `LocalStorageSnapshotStore.js`: **MATCH**
- `GameReviewSnapshotService.js`: **MATCH**
- `GameReviewSnapshotMapper.js`: **MATCH**
- `PositionHistory.js`: **MATCH**
- `ShogiReplayApplicationService.js`: **MATCH**
- `ShogiReplayViewModel.js`: **MATCH**
- `ReplayScrollPolicy.js`: **MATCH**
- `ReplayPositionSnapshot.js`: **MATCH**
- `ReplayPositionSnapshotFactory.js`: **MATCH**
- `KeyPosition.js`: **MATCH**
- `KeyPositionReplayReference.js`: **MATCH**
- `AddCurrentPositionToKeyPosition.js`: **MATCH**
- `ReflectionBackupController.js`: **MATCH**
- `GameReviewMarkdownFormatter.js`: **MATCH**
- `ObservationCardMarkdownFormatter.js`: **MATCH**
- `BrowserStepNavigation.js`: **MATCH**
- `LICENSE`: **MATCH**

## 6. 変更File

- `00_README_FIRST.md`
- `BROWSER_VERIFICATION_RESULT.txt`
- `BROWSER_VERIFICATION_SCREENSHOT.png`
- `BoardGraphicsV14.test.js`
- `BrowserGameReviewFormView.js`
- `BrowserGameReviewLibraryView.js`
- `BrowserShogiReplayView.js`
- `CHANGELOG.md`
- `COMPLETION_REPORT.md`
- `Design Handbook.md`
- `Design Novel.md`
- `Design Rules.md`
- `Explanation.md`
- `FILE_INVENTORY.txt`
- `GameReviewLibraryPresenter.js`
- `Learning Roadmap.md`
- `README.md`
- `Review Checklist.md`
- `SAVED_GAME_VIEWER_DESIGN.md`
- `SHOGI_BOARD_GRAPHICS_GUIDELINE.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `STATIC_VERIFICATION_RESULT.txt`
- `SYNTAX_CHECK_RESULT.txt`
- `ShogiPieceSvg.js`
- `TEST_RESULT.txt`
- `Thought Process.md`
- `USER_MANUAL.md`
- `browser_verify.py`
- `challenge.md`
- `index.html`
- `package.json`
- `style.css`
- `verify.mjs`

## 7. 追加File

- `BOARD_FIXED_GRID_DESIGN.md`
- `FixedBoardGridV141.test.js`
- `PieceLayoutV141.test.js`
- `SAVED_GAME_SUMMARY_DISPLAY_DESIGN.md`
- `SOURCE_OF_TRUTH_V1_4_BASELINE_HASHES.json`
- `SavedGameSummaryV141.test.js`
- `Ver.1.4.1操作手順書.md`

## 8. 削除File

- なし

## 9. Hash一致保持File一覧

- `ASSET_LICENSE_POLICY.md`
- `AddCurrentPositionToKeyPosition.js`
- `AddCurrentPositionToKeyPosition.test.js`
- `ApplicationErrors.js`
- `ApplyShogiMove.js`
- `ApplyShogiMove.test.js`
- `BoardSnapshot.js`
- `BrowserApplicationView.js`
- `BrowserClipboardAdapter.js`
- `BrowserClipboardAdapter.test.js`
- `BrowserFileAdapter.js`
- `BrowserFileAdapter.test.js`
- `BrowserFinalReportView.js`
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
- `BrowserReplayScrollMarkup.test.js`
- `BrowserStepNavigation.js`
- `COMPLETION_REPORT_V1_3_1.md`
- `COMPLETION_REPORT_V1_3_2.md`
- `COMPLETION_REPORT_V1_3_3.md`
- `Clock.js`
- `DeleteGameReview.js`
- `DeleteGameReviewAndPersist.js`
- `DeleteGameReviewAndPersist.test.js`
- `Design-Decisions.md`
- `ExportGameReviewAsMarkdown.js`
- `ExportObservationCardAsMarkdown.js`
- `GAME_SAVE_LIFECYCLE.md`
- `GameReview.js`
- `GameReview.test.js`
- `GameReviewApplicationServices.test.js`
- `GameReviewEditMapper.js`
- `GameReviewEditMapper.test.js`
- `GameReviewFormMapper.js`
- `GameReviewFormMapper.test.js`
- `GameReviewLibraryPresenter.test.js`
- `GameReviewMarkdownFormatter.js`
- `GameReviewMarkdownFormatter.test.js`
- `GameReviewMarkdownNaming.js`
- `GameReviewReplayCompatibility.test.js`
- `GameReviewRepository.js`
- `GameReviewSnapshotMapper.js`
- `GameReviewSnapshotService.js`
- `GameReviewSnapshotService.test.js`
- `GameSaveWithoutReflectionV14.test.js`
- `GetGameReview.js`
- `HandSnapshot.js`
- `HelpAndLifecycleCompatibilityV14.test.js`
- `INTERLUDE_PLAN.md`
- `Immutable.js`
- `InMemoryGameReviewRepository.js`
- `InMemoryGameReviewRepository.test.js`
- `InitialShogiPositionFactory.js`
- `JAPANESE_UI_GUIDELINE.md`
- `JapaneseUiText.test.js`
- `KEY_POSITION_REPLAY_CONNECTION.md`
- `KIF_INPUT_RESET_POLICY.md`
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
- `KifImportDraftResetController.js`
- `KifImportDraftResetController.test.js`
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
- `MOBILE_REPLAY_UX.md`
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
- `REPLAY_SCROLL_POLICY.md`
- `Reference/Debug.md`
- `Reference/Design.md`
- `Reference/Example.md`
- `Reference/Pattern.md`
- `Reference/Syntax.md`
- `Reference/Tips.md`
- `Reference/Word.md`
- `ReflectionBackupController.js`
- `ReflectionCompletionValidationV14.test.js`
- `ReflectionErrors.js`
- `ReflectionPersistenceCoordinator.js`
- `ReflectionWorkflowStatus.js`
- `ReplayIntegration.test.js`
- `ReplayPositionSnapshot.js`
- `ReplayPositionSnapshot.test.js`
- `ReplayPositionSnapshotFactory.js`
- `ReplayPositionSnapshotSerializer.js`
- `ReplayScrollPolicy.js`
- `ReplayScrollPolicy.test.js`
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
- `SOURCE_OF_TRUTH_AUDIT_V1_3_2.md`
- `SOURCE_OF_TRUTH_AUDIT_V1_3_3.md`
- `SOURCE_OF_TRUTH_BASELINE_HASHES.json`
- `SOURCE_OF_TRUTH_V1_3_1_BASELINE_HASHES.json`
- `SOURCE_OF_TRUTH_V1_3_2_BASELINE_HASHES.json`
- `SOURCE_OF_TRUTH_V1_3_3_BASELINE_HASHES.json`
- `SOURCE_OF_TRUTH_V1_3_BASELINE_HASHES.json`
- `STEP_UI_DESIGN.md`
- `SaveGameReview.js`
- `SavedGameViewerV14.test.js`
- `ShogiBoard.js`
- `ShogiHand.js`
- `ShogiPiece.js`
- `ShogiPosition.js`
- `ShogiPosition.test.js`
- `ShogiPositionSnapshot.js`
- `ShogiReplayApplicationService.js`
- `ShogiReplayApplicationService.test.js`
- `ShogiReplayController.js`
- `ShogiReplayController.test.js`
- `ShogiReplayErrors.js`
- `ShogiReplayViewModel.js`
- `ShogiReplayViewModel.test.js`
- `ShogiSquare.js`
- `StepNavigationV14.test.js`
- `SubmitGameReviewForm.js`
- `SubmitGameReviewForm.test.js`
- `TestFixtures.js`
- `VER1_3_1_CHANGE_MANIFEST.json`
- `VER1_3_2_CHANGE_MANIFEST.json`
- `VER1_3_3_CHANGE_MANIFEST.json`
- `VER1_3_CHANGE_MANIFEST.json`
- `Ver.1.1操作手順書.md`
- `Ver.1.2操作手順書.md`
- `Ver.1.3.1操作手順書.md`
- `Ver.1.3.2操作手順書.md`
- `Ver.1.3.3操作手順書.md`
- `Ver.1.3操作手順書.md`
- `Ver.1.4操作手順書.md`
- `WorkflowErrors.js`
- `browser_verify_v1_3_3_reference.py`
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
- `fixtures/replay-long-300.kif`
- `fixtures/replay-missing-handicap.kif`
- `fixtures/replay-partial-invalid.kif`
- `fixtures/replay-unsupported-handicap.kif`
- `fixtures/timeout.kifu`
- `fixtures/unmapped-header-warning.kifu`
- `main.js`

## 10. Packaging検証

- 候補ZIP Integrity: **PASS**
- 別Folder展開: **PASS**
- 展開物のみのAutomated Test: **567 / 567 pass**
- 展開物のみのBrowser Automation: **107 / 107 pass**
- 展開物のみのStatic Verification: **92 / 92 pass**
- Missing Import: **0**
- 正式ZIP最終納品判定: **PASSの場合のみ納品**

## 11. 監査結論

Ver.1.4.1は、Fixed Gridと保存済み対局SummaryというPresentation上の問題を中心に修正し、Domain / Repository / Storage / Replay Scroll Policyの保護対象を維持した。Raw KIF Dataは互換性のため保持し、利用者向けList表示だけを要約した。
