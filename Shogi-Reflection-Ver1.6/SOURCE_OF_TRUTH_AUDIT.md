# SOURCE OF TRUTH AUDIT — Ver.1.6

Source of Truth: `Shogi-Reflection-Ver1.4.1(1).zip`
監査日: 2026-08-09

## 1. Summary

- Ver.1.4.1元File数: **257**
- Ver.1.6 File数: **296**
- Hash一致保持File: **228**
- 変更File: **29**
- 追加File: **39**
- 削除File: **0**
- 削除理由: **削除なし**
- Missing Import: **0**
- Existing + Ver.1.6 Automated Test: **606 / 606 pass**
- Browser Automation: **123 / 123 pass**（390×844 / Chromium / Verification Mock Engine）
- Static Verification: **49 / 49 pass**
- JavaScript Syntax: **181 files pass**
- Design Rules最終番号: `INTERLUDE-Rule-EZ`

## 2. Checkpoint 1 — Ver.1.4.2相当

### Form Help

`BrowserGameReviewFormView.js` のFACT / INTERPRETATION / HYPOTHESIS等へ短いPlaceholder例を追加。
`value`ではないため保存Dataへ混入しない。

### Piece Graphics

`ShogiPieceSvg.js` の共通五角形を、同じ100×110 viewBox/footprint内のrounded pathへ変更。
Square Size、Piece Container Size、2文字駒の内部Typographyは変更しない。

### Fixed Grid

- 9×9固定Grid維持
- 81升同一Geometry
- 成桂・成香・成銀で拡大なし
- 馬・龍維持
- Board Flip維持
- Snapshot維持

## 3. Domain変更

**GameReview Domain変更なし。**

`GameReview.js` はVer.1.4.1 baselineとSHA-256一致。
Engine解析結果をGameReview propertyへ追加していない。

KeyPosition Domainも既存Flowを利用し、Engine Candidate専用KeyPosition Domainを新設していない。

## 4. Repository変更

既存GameReview Repository contractは変更しない。

追加:

- `EngineAnalysisRepository.js`

Engine AnalysisはGameReview Repositoryから分離し、同一gameIdで参照関係だけ持つ。

## 5. Storage変更

既存GameReview Storage / Snapshot schemaは変更しない。

`GameReviewSnapshotService.js` はVer.1.4.1 baselineとSHA-256一致し、schema version 1を維持。

追加:

- `LocalStorageEngineAnalysisStore.js`
- key: `shogi-reflection-interlude.engine-analyses.v1`

### Migration

GameReview Migration: **不要**。
Ver.1.4.1保存Dataはそのまま読める。
Engine Analysisは新規別Storeであり、存在しない旧環境は空Historyとして扱う。

## 6. Replay変更

Replay Domain/Application Service/View Model/PositionHistoryをEngine都合で再設計していない。
Engine用SFEN/USI変換は `UsiPositionMapper` へ分離した。

### ReplayScrollPolicy変更

**なし。** `ReplayScrollPolicy.js` はVer.1.4.1 baselineとSHA-256一致。
Browser Automationで前/次/最初/最後/Keyboard/Move List Jumpの回帰を確認。

## 7. Board変更

Board Rendering自体のArchitecture変更なし。
`style.css` にはEngine UI styleを追加したが、Fixed Grid geometry ruleを維持。

## 8. Piece変更

変更はPresentationのみ。
`ShogiPieceSvg.js` の共通五角形輪郭へ軽い丸みを追加。
Piece ownership、type、promotion、Replay logicは変更しない。

## 9. Step UI変更

既存7 Stepを維持。
Engine解析PanelはSTEP4「重要局面」の補助UIとして追加。
Step responsibilityを増減・renameしていない。

## 10. Engine Architecture

追加:

- `ShogiEnginePort.js`
- `UsiEngineAdapter.js`
- `YaneuraOuEngineAdapter.js`
- `BrowserWorkerUsiTransport.js`
- `NodeChildProcessUsiTransport.js`
- `BrowserEngineProvider.js`
- `MockShogiEngineAdapter.js`

```text
UI -> AnalyzeGame -> ShogiEnginePort -> Adapter -> Transport -> External Engine
```

Application ServiceはUSI commandを直接扱わない。

## 11. Analysis Model

追加:

- `EngineAnalysisConstants.js`
- `EngineAnalysisSettings.js`
- `EvaluationNormalizer.js`
- `EvaluationDelta.js`
- `UsiInfoParser.js`

保存Metadata:

- Engine Name
- Engine Version
- Evaluation Model
- Evaluation Model Version
- Analysis Settings
- Analyzed At
- Analysis Schema Version

## 12. Candidate Selection

`EngineCandidateSelector.js` を追加。

- 本人の手だけを対象
- Before / After本人視点Delta
- Mate別Transition
- Major Dropoff
- Review Candidate
- Good Move Candidate
- Best Move一致
- Shape change
- 近接局面重複抑制
- Primary上限5

## 13. KeyPosition互換

Engine Candidateから「重要局面へ追加」を押した場合も、既存の `AddCurrentPositionToKeyPosition` Flowへ合流する。
自動登録しない。
手動Replay登録も維持。

## 14. Snapshot互換

既存Replay Position Snapshotを使用。
Engine raw dataをSnapshotへ混入しない。

## 15. Backup互換

既存GameReview Backup schemaを変更しない。
Engine AnalysisはVer.1.6ではGameReview Backupへ含めない。
再生成可能なReferenceとして別Storeに保存。

## 16. Restore互換

Ver.1.4.1 Backup Restoreを維持。
Engine Analysisが無くてもGameReviewは復元・利用可能。

## 17. Markdown Export互換

既存Export formatterを変更していない。
Engine Referenceを本人のFACT等として自動出力しない。
Ver.1.6ではEngine Analysis sectionの自動追加も行わず、既存Markdown formatを完全維持する方を採用。

## 18. Observation Card互換

Observation Theme 1件、実行Rule 1〜3件を維持。
EngineはObservation Cardを自動生成・上書きしない。

## 19. Saved Game Viewer

Ver.1.4.1のSummary Read ModelとRaw KIF Header非表示方針を維持。
Engine Analysis StatusをDomain Game Statusへ混ぜていない。

## 20. Engine License監査

- Application LICENSE: existing MIT unchanged
- YaneuraOu Source: GPLv3
- YaneuraOu public packaged Release: V9.00を確認
- Development: 2026-07-02 V9.60、さらに公式CIにV9.70 commitを確認
- Suisho11: development version / supporter distributionを確認
- Suisho11 redistribution/commercial bundling: 今回の一次資料だけでは包括条件を確定できず **UNCONFIRMED**
- Binary / Suisho / NNUE/SFNN model: ZIPへ同梱しない

## 21. Test追加

Engine Port、error、normalization、delta、mate、USI parse/mapping、candidate ranking、metadata、re-analysis、persistence、engine missing、UI markupを追加。

## 22. Real Engine Test

**未実施。**
現在の実行環境に検証用YaneuraOu Binary / Evaluation Fileがなく、外部取得も成立しなかった。
Browser E2Eは `Verification Mock Engine` であり、実Engine確認済みとは扱わない。

## 23. Source of Truth変更File

Baseline 257 filesのうち、最終的に変更したのは主に:

- version/readme/docs/report類
- `index.html`
- `main.js`
- `style.css`
- `BrowserGameReviewFormView.js`
- `ShogiPieceSvg.js`
- Piece graphics expectations in tests
- Browser/static verification scripts/results

主要Domain (`GameReview.js`) とReplay Scroll Policy (`ReplayScrollPolicy.js`) はHash一致保持。

## 24. 削除File

**0。**
Ver.1.4.1の全Fileを完全版Folderに保持する。
