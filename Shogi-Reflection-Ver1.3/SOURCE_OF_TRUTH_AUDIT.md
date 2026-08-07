# SOURCE_OF_TRUTH_AUDIT.md — Ver.1.2 → Ver.1.3

## 1. Source of Truth

- 入力Archive：`Shogi-Reflection-Ver1.2(2).zip`
- 展開元Folder：`Shogi-Reflection-Ver1.2`
- Hash Algorithm：SHA-256
- Ver.1.2元File数：173
- Ver.1.3収録File数：199
- 元のままHash一致で保持：139
- 意図的に変更：34
- 追加：26
- 削除：0

Baseline Hash一覧は`SOURCE_OF_TRUTH_BASELINE_HASHES.json`、期待変更分類は`VER1_3_CHANGE_MANIFEST.json`へ保存しました。`npm run check`は削除、予期しない変更、必須File、Syntax、Importを検証します。

## 2. 正式検証値

- Ver.1.2既存Test：333件成功／0件失敗
- Ver.1.3追加Test：125件成功／0件失敗
- Ver.1.3全Test：458件成功／0件失敗
- Ver.1.2実Chromium：51件成功／0件失敗
- Ver.1.3実Chromium：116件成功／0件失敗
- JavaScript Syntax：126 File成功
- Missing Import：0件

## 3. KeyPosition監査

Ver.1.2の既存Property：`keyPositionId`、`moveNumber`、`title`、`boardState`、`fact`、`interpretation`、`hypothesis`、`myThought`、`opponentIntent`、`emotion`、`decisionImpact`。

既存Rule：moveNumberは1以上、FACT・INTERPRETATION・HYPOTHESISは必須、GameReview内ID重複不可、重要局面は最大5件、次局接続には3〜5件が必要。

Ver.1.3は既存Propertyを削除せず、`moveText`、`decisionPattern`、`learning`、任意の`replayReference`を追加しました。`replayReference`がないVer.1.2 KeyPositionは正常Dataとして読めます。

## 4. Replay／Persistence監査

- Position Historyの現在Position・直前PositionからSnapshotを生成
- 候補追加ごとにKIF全体を再Parseしない
- Top-level JSON Schema Version 1を維持
- Replay Position Snapshot Version 1を新設
- Snapshot付きReviewをLocalStorage／Backupへ保存
- 全件Domain再検証後にAtomic Restore
- 不正Snapshotでは現在Repositoryを変更しない
- Snapshotなし旧Dataを拒否しない
- Markdown Export／Observation Cardの既存Ruleを維持

## 5. 元のままHash一致で保持したFile（139）

- `ApplicationErrors.js`
- `ApplyShogiMove.js`
- `ApplyShogiMove.test.js`
- `BrowserClipboardAdapter.js`
- `BrowserClipboardAdapter.test.js`
- `BrowserFileAdapter.js`
- `BrowserFileAdapter.test.js`
- `BrowserGameReviewLibraryView.js`
- `BrowserGameReviewLibraryView.test.js`
- `BrowserKifImportMarkup.test.js`
- `BrowserKifImportView.js`
- `BrowserMarkdownExportView.js`
- `BrowserMarkdownExportView.test.js`
- `BrowserMarkup.test.js`
- `BrowserReplayMarkup.test.js`
- `Clock.js`
- `DeleteGameReview.js`
- `DeleteGameReviewAndPersist.js`
- `DeleteGameReviewAndPersist.test.js`
- `ExportGameReviewAsMarkdown.js`
- `ExportObservationCardAsMarkdown.js`
- `GameReview.js`
- `GameReview.test.js`
- `GameReviewApplicationServices.test.js`
- `GameReviewEditMapper.test.js`
- `GameReviewFormMapper.test.js`
- `GameReviewLibraryPresenter.js`
- `GameReviewLibraryPresenter.test.js`
- `GameReviewMarkdownFormatter.test.js`
- `GameReviewMarkdownNaming.js`
- `GameReviewRepository.js`
- `GameReviewSnapshotService.js`
- `GameReviewSnapshotService.test.js`
- `GetGameReview.js`
- `INTERLUDE_PLAN.md`
- `Immutable.js`
- `InMemoryGameReviewRepository.js`
- `InMemoryGameReviewRepository.test.js`
- `InitialShogiPositionFactory.js`
- `KIF_SUPPORT_MATRIX.md`
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
- `ReplayTestHelpers.js`
- `RepositoryErrors.js`
- `ReviewIdGenerator.js`
- `ReviewIdGenerator.test.js`
- `SAMPLE_GameReview.md`
- `SAMPLE_ObservationCard.md`
- `SHOGI_REPLAY_SUPPORT_MATRIX.md`
- `SaveGameReview.js`
- `ShogiBoard.js`
- `ShogiHand.js`
- `ShogiPiece.js`
- `ShogiPosition.js`
- `ShogiPosition.test.js`
- `ShogiReplayApplicationService.js`
- `ShogiReplayApplicationService.test.js`
- `ShogiReplayController.test.js`
- `ShogiReplayErrors.js`
- `ShogiReplayViewModel.js`
- `ShogiReplayViewModel.test.js`
- `ShogiSquare.js`
- `SubmitGameReviewForm.js`
- `SubmitGameReviewForm.test.js`
- `TestFixtures.js`
- `Ver.1.1操作手順書.md`
- `Ver.1.2操作手順書.md`
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

## 6. 意図的に変更したFile（34）

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
- `Design-Decisions.md`
- `Explanation.md`
- `FILE_INVENTORY.txt`
- `GameReviewEditMapper.js`
- `GameReviewFormMapper.js`
- `GameReviewMarkdownFormatter.js`
- `GameReviewSnapshotMapper.js`
- `KeyPosition.js`
- `Learning Roadmap.md`
- `README.md`
- `Review Checklist.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `STATIC_VERIFICATION_RESULT.txt`
- `SYNTAX_CHECK_RESULT.txt`
- `ShogiReplayController.js`
- `TEST_RESULT.txt`
- `Thought Process.md`
- `browser_verify.py`
- `challenge.md`
- `index.html`
- `main.js`
- `package.json`
- `style.css`
- `verify.mjs`

## 7. 追加したFile（26）

- `AddCurrentPositionToKeyPosition.js`
- `AddCurrentPositionToKeyPosition.test.js`
- `BoardSnapshot.js`
- `BrowserKeyPositionReplayMarkup.test.js`
- `GameReviewReplayCompatibility.test.js`
- `HandSnapshot.js`
- `KEY_POSITION_REPLAY_CONNECTION.md`
- `KeyPositionReplayController.js`
- `KeyPositionReplayErrors.js`
- `KeyPositionReplayIntegration.test.js`
- `KeyPositionReplayReference.js`
- `KeyPositionReplayReference.test.js`
- `KeyPositionReplayViewModel.js`
- `KeyPositionReplayViewModel.test.js`
- `ReplayPositionSnapshot.js`
- `ReplayPositionSnapshot.test.js`
- `ReplayPositionSnapshotFactory.js`
- `ReplayPositionSnapshotSerializer.js`
- `ReplaySnapshotFingerprint.js`
- `ReplayWarningReference.js`
- `SNAPSHOT_COMPATIBILITY_MATRIX.md`
- `SNAPSHOT_FORMAT.md`
- `SOURCE_OF_TRUTH_BASELINE_HASHES.json`
- `ShogiPositionSnapshot.js`
- `VER1_3_CHANGE_MANIFEST.json`
- `Ver.1.3操作手順書.md`

## 8. 削除したFile（0）

- なし

削除理由：該当なし。

## 9. 互換性確認

- [x] Ver.1.2既存333 Test継承
- [x] 旧GameReview読込
- [x] SnapshotなしKeyPosition読込・編集
- [x] Snapshot付きKeyPosition保存・再読込
- [x] Backup／Restore
- [x] 改ざんSnapshotのAtomic拒否
- [x] KIF Import維持
- [x] 棋譜再現盤維持
- [x] Markdown Export維持
- [x] Observation Card維持
- [x] Ver.1.2 File削除0件
