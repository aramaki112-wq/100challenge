# SOURCE_OF_TRUTH_AUDIT.md

## 1. Ver.1.3.2 Source of Truth監査

- Source ZIP: `Shogi-Reflection-Ver1.3.2.zip`
- 実受領添付: `Shogi-Reflection-Ver1.3.2(1).zip`
- 元File数: **219**
- 正式Automated Test: **495 / 495 PASS**
- 正式Browser Test: **162 / 162 PASS**
- 正式Static Test: **47 / 47 PASS**
- Design Rules最終番号: **INTERLUDE-Rule-DJ**
- package script: `npm test` = `node --test`、`npm run check` = `node verify.mjs`
- Browser起動: `python3 -m http.server 8000`

変更前に受領ZIPを別Folderへ展開し、`npm test` 495/495、`npm run check` 47/47を再実行してから実装を開始した。元219 Fileの全File名とSHA-256は`SOURCE_OF_TRUTH_V1_3_2_BASELINE_HASHES.json`へ保存した。

## 2. Ver.1.3.3 File監査

- Ver.1.3.3収録File数: **229**
- Hash一致で保持: **181**
- 変更File: **38**
- 追加File: **10**
- 削除File: **0**
- 削除理由: **削除なし**
- `LICENSE`: **Ver.1.3.2 Hash一致**
- `ReplayScrollPolicy.js`: **Ver.1.3.2 Hash一致**

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
- `BrowserKifClipboardAdapter.test.js`
- `BrowserMarkdownExportView.test.js`
- `BrowserReplayMarkup.test.js`
- `BrowserReplayScrollMarkup.test.js`
- `COMPLETION_REPORT_V1_3_1.md`
- `COMPLETION_REPORT_V1_3_2.md`
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
- `KeyPositionReplayViewModel.test.js`
- `KifFileReaderAdapter.js`
- `KifFileReaderAdapter.test.js`
- `KifImportApplicationService.js`
- `KifImportApplicationService.test.js`
- `KifImportController.js`
- `KifImportController.test.js`
- `KifImportDto.js`
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
- `ReflectionErrors.js`
- `ReflectionPersistenceCoordinator.js`
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
- `SOURCE_OF_TRUTH_BASELINE_HASHES.json`
- `SOURCE_OF_TRUTH_V1_3_1_BASELINE_HASHES.json`
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
- `ShogiReplayController.test.js`
- `ShogiReplayErrors.js`
- `ShogiReplayViewModel.test.js`
- `ShogiSquare.js`
- `SubmitGameReviewForm.js`
- `SubmitGameReviewForm.test.js`
- `TestFixtures.js`
- `VER1_3_1_CHANGE_MANIFEST.json`
- `VER1_3_2_CHANGE_MANIFEST.json`
- `VER1_3_CHANGE_MANIFEST.json`
- `Ver.1.1操作手順書.md`
- `Ver.1.2操作手順書.md`
- `Ver.1.3.1操作手順書.md`
- `Ver.1.3.2操作手順書.md`
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
- `fixtures/replay-long-300.kif`
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
- `BrowserGameReviewLibraryView.js`
- `BrowserGameReviewLibraryView.test.js`
- `BrowserKeyPositionReplayMarkup.test.js`
- `BrowserKifClipboardAdapter.js`
- `BrowserKifImportMarkup.test.js`
- `BrowserKifImportView.js`
- `BrowserMarkdownExportView.js`
- `BrowserMarkup.test.js`
- `BrowserShogiReplayView.js`
- `CHANGELOG.md`
- `COMPLETION_REPORT.md`
- `Design Handbook.md`
- `Design Novel.md`
- `Design Rules.md`
- `Explanation.md`
- `FILE_INVENTORY.txt`
- `KeyPositionReplayViewModel.js`
- `KifImportErrorPresenter.js`
- `Learning Roadmap.md`
- `README.md`
- `Review Checklist.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `STATIC_VERIFICATION_RESULT.txt`
- `SYNTAX_CHECK_RESULT.txt`
- `ShogiReplayViewModel.js`
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
- `COMPLETION_REPORT_V1_3_3.md`
- `JAPANESE_UI_GUIDELINE.md`
- `JapaneseUiText.test.js`
- `KIF_INPUT_RESET_POLICY.md`
- `KifImportDraftResetController.js`
- `KifImportDraftResetController.test.js`
- `SOURCE_OF_TRUTH_AUDIT_V1_3_3.md`
- `SOURCE_OF_TRUTH_V1_3_2_BASELINE_HASHES.json`
- `VER1_3_3_CHANGE_MANIFEST.json`
- `Ver.1.3.3操作手順書.md`

### 削除File
- なし

## 3. KIF Paste／Temporary State変更

- `入力をクリア`を追加。
- `KifImportDraftResetController`を追加し、Pending PreviewとTemporary Inputだけを操作する。
- `BrowserKifImportView.resetPreview()`はTextareaを保持し、`clearInput()`だけがTextareaを空にする。
- Clear/RetryはKIF Parser・Position History・Replay Historyを再構築しない。
- Formへ反映された編集中Data、保存済みGameReviewはClear対象外。

## 4. Clipboard変更

- Clipboard読込機能とAdapter契約は維持。
- 利用者向けMessageのみ日本語中心へ改善。
- KIF Clear/RetryからClipboard write/clearを呼ばない。
- Browser VerificationでClear前後のClipboard内容が不変であることを確認。

## 5. Import Preview変更

- `棋譜入力へ戻る`を追加。
- Previewを破棄しても貼り付けKIF本文を保持。
- 別KIFへ貼替えて再Preview可能。
- 古いPreview内容が残らないことをBrowser Automationで確認。
- Form反映と保存の既存境界を維持。

## 6. 日本語UI変更

監査対象：Header、Navigation、KIF Import/Paste、Import Preview、Replay、Move List、Current Move、Previous Move、Turn、Hands、Board Flip、Jump、KeyPosition、Snapshot Preview、GameReview、Saved Games、Backup、Restore、Markdown Export、Observation Card、Warning、Error Message、Button、aria-label、Placeholder、Help Text、Empty State、Validation Message。

主な表示変更：Replay→棋譜再現、Import Preview→棋譜読み込み確認、KeyPosition→重要局面、Snapshot→局面記録、Current Move→現在の手、Previous Move→直前の手、Warning→注意等。

KIF、Markdown、Obsidian、JSON、UTF-8、Shift_JIS、Home/End、FACT等は形式名・製品名・実キー名・方法論識別子として必要な範囲で維持。内部`GameReview`、`KeyPosition`、`ReplayViewModel`、Error CodeはRenameしていない。

## 7. Replay関連変更／Scroll Policy互換

Replayの利用者向け表示文言だけを日本語化した箇所はあるが、`ReplayScrollPolicy.js`はVer.1.3.2とSHA-256一致で実装変更なし。

- 次へ／前へ／最初へ／最後へ：Page全体を自動Scrollしない。
- Keyboard Navigation：Page全体を自動Scrollしない。
- Current Move Highlight：維持。
- Move List内部追従：維持。
- Move List明示選択時の盤面復帰：維持。

## 8. Test追加／継承

- Ver.1.3.2 Test継承: **495件**。
- Ver.1.3.3追加: **10件**。
- 合計Automated Test: **505 / 505 PASS**。
- Browser Verification: **181 / 181 PASS**。
- Static Verification: **75 / 75 PASS**。
- Missing Import: **0**。

追加範囲はKIF Clear、Import Retry、Repository/LocalStorage/Clipboard不変、日本語Label/aria-label、内部Domain識別子維持、Smartphone KIF Touch Target。

## 9. Compatibility確認

- KeyPosition互換: **維持**。3〜5件Rule変更なし。
- Snapshot互換: **維持**。Snapshot Schema変更なし。
- Backup／Restore互換: **維持**。Persistence Model変更なし。
- Markdown Export互換: **維持**。
- Observation Card互換: **維持**。次局接続条件変更なし。
- 保存済みGameReview Replay: **維持**。
- Repository Contract: **変更なし**。
- LocalStorage保存Schema: **変更なし**。

## 10. 主要監査地点

- KIF Paste Controller: `KifImportController` / `KifPastedTextAdapter`
- Clipboard: `BrowserKifClipboardAdapter`
- Import Preview: `KifImportPreviewPresenter` / `BrowserKifImportView`
- Form反映: `KifImportFormMapper`
- Temporary Reset: `KifImportDraftResetController`
- Replay Controller: `ShogiReplayController`
- Replay Scroll: `ReplayScrollPolicy`
- UI/CSS: `index.html` / `style.css`
- Error: 既存Error modules + Presenter表示

## 11. 結論

Ver.1.3.3は一時KIF入力・Preview・表示文言のPresentation境界を中心に変更し、保存済みDomain DataとVer.1.3.2 Replay Scroll Policyを再構成していない。Ver.1.3.2 File削除は0件である。
