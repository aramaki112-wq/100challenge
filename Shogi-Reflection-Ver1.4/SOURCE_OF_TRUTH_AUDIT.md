# SOURCE_OF_TRUTH_AUDIT.md

## 1. 監査対象

- 正式Source of Truth: `Shogi-Reflection-Ver1.3.3.zip`
- 実際に受領した添付: `Shogi-Reflection-Ver1.3.3(1).zip`
- Ver.1.3.3正式File数: **229**
- Ver.1.3.3 Automated Test: **505 / 505 PASS**
- Ver.1.3.3 Browser Verification記録: **181 / 181 PASS**
- Ver.1.3.3 Static Verification: **75 / 75 PASS**
- `package.json` Test Script: `node --test`
- Static Script: `node verify.mjs`
- Browser起動方法: `python3 -m http.server 8000`
- Ver.1.3.3 Design Rules最終番号: **INTERLUDE-Rule-DQ**

受領ZIPを作業Folderとは別に展開し、実装前に全FileのSHA-256を`SOURCE_OF_TRUTH_V1_3_3_BASELINE_HASHES.json`へ固定した。以降の差分監査はこの229 Fileを基準にしている。

## 2. Ver.1.4 File監査

- Ver.1.4収録File数: **250**
- Hash一致保持File: **192**
- 変更File: **37**
- 追加File: **21**
- 削除File: **0**
- 削除理由: **削除なし**

### Hash一致保持File

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
- `GameReview.test.js`
- `GameReviewApplicationServices.test.js`
- `GameReviewEditMapper.test.js`
- `GameReviewFormMapper.test.js`
- `GameReviewLibraryPresenter.test.js`
- `GameReviewMarkdownFormatter.test.js`
- `GameReviewMarkdownNaming.js`
- `GameReviewReplayCompatibility.test.js`
- `GameReviewRepository.js`
- `GameReviewSnapshotService.js`
- `GameReviewSnapshotService.test.js`
- `GetGameReview.js`
- `HandSnapshot.js`
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
- `SOURCE_OF_TRUTH_AUDIT_V1_3_3.md`
- `SOURCE_OF_TRUTH_BASELINE_HASHES.json`
- `SOURCE_OF_TRUTH_V1_3_1_BASELINE_HASHES.json`
- `SOURCE_OF_TRUTH_V1_3_2_BASELINE_HASHES.json`
- `SOURCE_OF_TRUTH_V1_3_BASELINE_HASHES.json`
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
- `BrowserShogiReplayView.js`
- `CHANGELOG.md`
- `COMPLETION_REPORT.md`
- `Design Handbook.md`
- `Design Novel.md`
- `Design Rules.md`
- `Explanation.md`
- `FILE_INVENTORY.txt`
- `GameReview.js`
- `GameReviewEditMapper.js`
- `GameReviewFormMapper.js`
- `GameReviewLibraryPresenter.js`
- `GameReviewMarkdownFormatter.js`
- `GameReviewSnapshotMapper.js`
- `KifImportFormMapper.js`
- `Learning Roadmap.md`
- `README.md`
- `Review Checklist.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `STATIC_VERIFICATION_RESULT.txt`
- `SYNTAX_CHECK_RESULT.txt`
- `SaveGameReview.js`
- `SubmitGameReviewForm.js`
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

- `ASSET_LICENSE_POLICY.md`
- `BoardGraphicsV14.test.js`
- `BrowserApplicationView.js`
- `BrowserFinalReportView.js`
- `BrowserStepNavigation.js`
- `GAME_SAVE_LIFECYCLE.md`
- `GameSaveWithoutReflectionV14.test.js`
- `HelpAndLifecycleCompatibilityV14.test.js`
- `ReflectionCompletionValidationV14.test.js`
- `ReflectionWorkflowStatus.js`
- `SAVED_GAME_VIEWER_DESIGN.md`
- `SHOGI_BOARD_GRAPHICS_GUIDELINE.md`
- `SOURCE_OF_TRUTH_V1_3_3_BASELINE_HASHES.json`
- `STEP_UI_DESIGN.md`
- `SavedGameViewerV14.test.js`
- `ShogiPieceSvg.js`
- `StepNavigationV14.test.js`
- `USER_MANUAL.md`
- `Ver.1.4操作手順書.md`
- `WorkflowErrors.js`
- `browser_verify_v1_3_3_reference.py`

### 削除File

- なし

## 3. Domain変更

大規模なDomain再構成は行っていない。既存`GameReview`へ後方互換なOptional Lifecycle情報を追加し、`ReflectionWorkflowStatus.js`で「保存」と「完成」を分離した。

| 内部Status | 画面表示 | 意味 | 完了Validation |
|---|---|---|---|
| `GAME_ONLY` | 棋譜のみ | KIF/対局情報を保存済み。振り返りは未開始 | 不要 |
| `REFLECTION_IN_PROGRESS` | 振り返り中 | 重要局面・振り返り・次局接続の一部を入力 | 不要 |
| `REFLECTION_COMPLETE` | 振り返り完了 | 次局へ接続できる完成状態 | 重要局面3〜5件、Observation Theme 1件、実行Rule 1〜3件 |

`REFLECTION_COMPLETE`へ移す場合だけ既存の次局接続条件をDomain Validationとして要求する。したがって、KIFだけを保存するために重要局面3〜5件を要求しない。

`GameReview`へ追加した主なOptional情報は`workflowStatus`、`createdAt`、`updatedAt`、`senteName`、`goteName`である。旧Snapshotにこれらが無い場合も読込可能である。

## 4. Repository変更

`GameReviewRepository.js`のPortは**Hash一致保持**であり、Repository契約をVer.1.4都合で再設計していない。`SaveGameReview.js`は既存Portを使用したまま、初回`createdAt`保持と`updatedAt`更新を行う。

保存済み一覧は`GameReviewLibraryPresenter.js`でSummaryを生成し、一覧表示のためだけに`PositionHistory`またはReplay全局面を生成しない。手数はKIF本文の手行を軽量に数える。

## 5. Storage変更

`LocalStorageSnapshotStore.js`は**Hash一致保持**。Storage Schema Versionは既存の**1**を維持し、IndexedDB Migrationは行っていない。

Snapshot MapperにLifecycle項目を追加したため、新規BackupにはStatus・作成日時・更新日時・先手名・後手名が含まれる。Ver.1.3.3 BackupのようにLifecycle項目が無いDataは、内容から安全にStatusを推定して復元する。

LocalStorage依存はRepository/Storage Adapter境界の内側に留めており、将来IndexedDB等へ交換する余地を維持した。

## 6. Data Lifecycle

正式Lifecycleは次の通り。

```text
Temporary KIF Input
  ↓ Preview
Import Preview
  ↓ 棋譜を登録する
Form State
  ↓ 対局を保存
Saved Game Data / GAME_ONLY
  ↓ 後日Open
Unsaved Reflection Draft
  ↓ 振り返りを途中保存
Saved Game Data / REFLECTION_IN_PROGRESS
  ↓ Completion Validation成功
Completed Reflection Data / REFLECTION_COMPLETE
```

`入力をクリア`はTemporary KIF Input / Import Previewだけを破棄する。保存済みGameのDeleteとは別Operationで、Deleteには確認Dialogを設けた。

## 7. Step UI変更

既存一画面Sectionを次の責務へ移した。

| 既存内容 | Ver.1.4 Step | Domain変更 | 保存タイミング |
|---|---|---|---|
| KIF File / Drag & Drop / Paste / Clipboard / Preview / Clear / Retry | STEP1 棋譜登録 | なし | まだ保存しない |
| 対局基本情報 | STEP2 対局情報 | Optional player/lifecycle項目追加 | `対局を保存`可能 |
| 棋譜再現盤 / Move List / Flip | STEP3 棋譜再現 | Replay Domain変更なし | 保存なし |
| KeyPosition / Snapshot / FACT / INTERPRETATION / HYPOTHESIS | STEP4 重要局面 | 既存Rule維持 | 途中保存時に保存 |
| 振り返り本文 / 判断Pattern / 学び | STEP5 振り返り | 既存Modelを利用 | 途中保存時に保存 |
| Observation Theme / 実行Rule | STEP6 次局への接続 | 既存Rule維持 | 途中保存または完成 |
| 統合Preview / Markdown / Observation Card | STEP7 最終レポート | 完了Validationだけ適用 | `振り返りを完了` |

Step NavigationはDOM表示責務だけを持ち、画面遷移を保存・削除・Domain Completionの代替にしていない。

## 8. Saved Game Viewer

Headerの`保存済み対局`からWorkflowとは独立したViewを開く。Summaryには対局日、相手、先手/後手、自分の側、勝敗、手数、振り返り状態、保存日時、更新日時を表示できる。

Detailから対局情報、棋譜、重要局面、振り返り、Observation Theme、実行Ruleを確認し、`棋譜再現へ`または`振り返りを続ける`で再開できる。完成済みではMarkdown/Observation Cardへ接続する。

## 9. Game Status

| 内部Status | 画面表示 | 意味 | 完了Validation |
|---|---|---|---|
| `GAME_ONLY` | 棋譜のみ | KIF/対局情報を保存済み。振り返りは未開始 | 不要 |
| `REFLECTION_IN_PROGRESS` | 振り返り中 | 重要局面・振り返り・次局接続の一部を入力 | 不要 |
| `REFLECTION_COMPLETE` | 振り返り完了 | 次局へ接続できる完成状態 | 重要局面3〜5件、Observation Theme 1件、実行Rule 1〜3件 |

Status内部識別子は英語、利用者表示は日本語に分離した。旧Dataでは内容からStatusを推定する。対局メモだけの入力は振り返り開始と判定しない。

## 10. Board Graphics / Piece Graphics

Replay Domainを変更せずPresentation Layerだけを改善した。`ShogiPieceSvg.js`はApplication内で生成するオリジナルSVG駒で、外部画像URLや他社ApplicationのAssetを使用しない。

- 五角形の共通外形
- 全駒で外形Size統一
- `成香` / `成桂` / `成銀`は2文字専用Class
- 成駒は文字に加えてPromotion Markを持ち、色だけに依存しない
- 先手/後手方向と盤面反転へ対応
- Replay盤と重要局面Snapshotで同じPiece Componentを使用
- Piece accessible nameを付与

`ASSET_LICENSE_POLICY.md`へ、自作AssetをProject LICENSEの範囲で配布可能とする方針と、第三者Assetを無断導入しないRuleを記録した。

## 11. Help

Application Headerから`使い方`を開ける。各Stepには`この画面の使い方`Context Helpを設け、USER_MANUAL内の対応Sectionへ移動できる。

Manualには目的、KIF登録、Clipboard、Clear、Preview、棋譜だけ保存、保存済み対局、Replay、盤面反転、重要局面、FACT / INTERPRETATION / HYPOTHESIS、振り返り、Observation Theme、実行Rule、最終レポート、Markdown、Observation Card、Backup、Restoreを含む。

## 12. Replay変更 / Replay Scroll Policy互換

以下のCore FileはVer.1.3.3とSHA-256一致で保持した。

- `ReplayScrollPolicy.js`
- `PositionHistory.js`
- `ShogiReplayApplicationService.js`
- `AddCurrentPositionToKeyPosition.js`
- `ReplayPositionSnapshotFactory.js`

`ReplayScrollPolicy.js`はPage Scroll APIを使用せず、必要な追従をMove List Containerの`scrollTop`変更だけで実施する。Browser Automationでは300手棋譜を使用し、Next 50回、Previous 10回、First、Last、Keyboard NavigationでPage Scroll位置が変わらないことと、Move List内部Scrollが追従することを確認した。

利用者がMove List項目を明示選択した場合に盤面へ戻す既存Policyは維持している。

## 13. KeyPosition / Snapshot互換

重要局面3〜5件Ruleを維持。Replayからの`この局面を重要局面へ追加`、Snapshot、Replay Reference、FACT / INTERPRETATION / HYPOTHESIS手動入力を維持した。Replay SnapshotのDomain生成CoreはHash一致保持である。

## 14. Backup / Restore互換

- Backup Schema Version: **1のまま**
- 新Lifecycle項目: Backupへ含む
- Ver.1.3.3 Lifecycle欠落Snapshot: 後方互換推定
- Browser Automation: Backup Download → 保存済み対局Delete → Restore → 対局復元を確認

## 15. Markdown Export互換

既存Formatter/Application Serviceを維持し、基本情報へOptionalの先手/後手表示を追加した。UIでは振り返り未完成時に完成Markdown/Observation Cardの操作を無理に有効化しない。

## 16. Observation Card互換

Observation Theme 1件、実行Rule 1〜3件という既存の次局接続条件を維持する。振り返り完成後にObservation Cardを出力できる。

## 17. Test追加

Ver.1.4追加Automated Test: **38件**。

- Game Save Without Reflection
- Reflection Completion Validation
- Saved Game Viewer
- Step Navigation
- Board Graphics
- Help / Lifecycle Compatibility

最終Node Test: **543 / 543 PASS**。

Browser Automation: **86 / 86 PASS**（Chromium / Playwright / 390×844）。これは実機iPhone Safariの確認を意味しない。

Static Verification: **83 / 83 PASS**、Missing Import **0**。

## 18. Design Rules

Ver.1.3.3最終`INTERLUDE-Rule-DQ`の次から重複を避けて追加し、Ver.1.4最終番号は**INTERLUDE-Rule-ED**。

## 19. 将来機能を実装していないこと

Ver.1.4ではAI Advice Layer、Engine解析、評価値、最善手、悪手判定、振り返り対局、Game Story、判断Pattern集計、PWA、Native/Desktop App、Account、Cloud Sync、課金/Subscriptionを実装していない。
