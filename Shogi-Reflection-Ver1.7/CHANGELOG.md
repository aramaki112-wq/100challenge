# CHANGELOG

## Ver.1.7 — 2026-08-09

### Engine Analysis Flow
- Engine解析PanelをSTEP4からSTEP3「棋譜再現」へ移動。
- 7 Step構成は変更なし。
- Candidate一覧は重要局面選定前の補助として表示。
- Candidate -> Replayは既存`ShogiReplayController.jump()`を利用。
- Candidate -> KeyPositionは既存`AddCurrentPositionToKeyPosition`を利用。
- Candidate自動登録なし、手動KeyPosition Flow維持。
- Saved Game ViewerへGame Statusと分離したAnalysis Statusを追加。
- Primary CandidateだけをSTEP3へ表示し、その他CandidateでUIを過密化しない。

### Replay Scroll
- Candidate JumpでPage Scrollを要求しない。
- Ver.1.6のMove List Jump Page-Scroll例外をVer.1.7要件に合わせ廃止。
- 次/前/最初/最後/Keyboard/Move List/CandidateでMove List Container内部だけ追従。
- `ReplayScrollPolicy.js`自体は変更なし。

### Piece Graphics
- 既存Fixed 9×9 Gridを維持。
- `ShogiPieceSvg.js`をオリジナルSVG五角形へ改善。
- 控えめな輪郭、上面Highlight、System Japanese Serif Font Stackを採用。
- 成桂/成香/成銀をSVG内2段表示。
- 馬/龍、先後方向、Flip、Snapshotを共通Componentで維持。
- 外部画像Asset / Font File追加なし。

### Verification
- Ver.1.6変更前Baseline: 606/606 Automated Test、49/49 Static。
- Ver.1.7追加Automated Testを追加。
- 390×844 Chromium Browser Verificationを更新。
- Screenshot based Visual Verificationを追加。
- 300手fixtureのPerformance Verificationを追加。

## Ver.1.6 — 2026-08-09

### Checkpoint 1 — Ver.1.4.2相当

- FACT / INTERPRETATION / HYPOTHESIS等へ短い記入例Placeholderを追加。
- Placeholderは保存Dataへ混入しない。
- Piece SVGをFixed footprint内で軽く丸めた。
- 9×9 Fixed Grid、2文字駒Size、Board Flip、Snapshotを維持。
- Replay Scroll PolicyをRegression確認。

### Checkpoint 2 — Ver.1.5相当

- `ShogiEnginePort` を追加。
- `UsiEngineAdapter` / `YaneuraOuEngineAdapter` を追加。
- `BrowserWorkerUsiTransport` / `NodeChildProcessUsiTransport` を追加。
- `UsiInfoParser` / `UsiPositionMapper` を追加。
- Engine固有USI protocolをAdapter boundaryへ隔離。
- `EngineAnalysisSettings` presetsを追加。
- Engine metadata / Evaluation Model metadataを追加。
- Engine Analysis専用Repository / LocalStorageを追加。
- Engine未設定時のGraceful Degradationを追加。

### Ver.1.6 Candidate Selection

- Evaluationを本人視点へNormalize。
- 本人の手だけをBefore/After比較。
- CP Delta計算。
- Mate transitionをCPと分離。
- Major Dropoff / Review / Good CandidateをRule-based Ranking。
- 近接局面Duplicate Suppression。
- Primary Candidate最大5件。
- MultiPV保存可能Model。
- Candidate -> Replay。
- Candidate -> existing KeyPosition Flow。
- Engine Candidateの自動KeyPosition登録は禁止。
- Re-analysis history保持。
- Analysis progress / cancel / error UI。
- Engine resultと本人Reflectionを分離。

### License / Packaging

- YaneuraOu GPLv3を監査。
- Suisho11の現在の頒布状態を監査。
- 確認できない再配布条件を許可扱いしない。
- Engine Binary / Evaluation ModelはVer.1.6 ZIPへ同梱しない。
- Existing Application LICENSEは変更しない。

### Verification

- Existing + Ver.1.6 Automated Testsを継続。
- 390×844 Browser AutomationはVerification Mock Engineで実施。
- Real Engine E2Eは実行環境にBinary/Evaluation Fileが無いため未確認。

## Ver.1.4.1

Ver.1.4.1以前の履歴はSource of Truth baseline hash manifestおよび各既存Completion Reportを参照。
