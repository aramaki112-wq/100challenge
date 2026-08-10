# CHANGELOG

## Ver.1.8 Integration Candidate — 2026-08-09

### Source of Truth
- ユーザー提供`Shogi-Reflection-Ver1.8-Integration-Candidate(1).zip` 331 filesをSource of Truthとして固定。
- `SOURCE_OF_TRUTH_V1_8_BASELINE_HASHES.json`へBaseline SHA-256を保存。
- Existing Application `LICENSE`は変更しない。

### YaneuraOu Integration Boundary
- `YaneuraOuWasmAdapter`を追加し既存`ShogiEnginePort`へ接続可能にした。
- `YaneuraOuWasmWorkerBootstrap.js`を追加。
- `BrowserEngineProvider`をverified manifest優先 + `ReflectionLocalEngine`明示Fallbackへ更新。
- V9.00 / commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493` / MATERIAL_LEVEL=1をBuild再現Targetとして固定。
- `scripts/build-yaneuraou-wasm.sh` / `scripts/finalize-yaneuraou-manifest.mjs`を追加。
- 現検証環境にEmscriptenがないためYaneuraOu WASM binaryは生成・同梱していない。

### USI
- `usi / usiok / setoption / isready / readyok / usinewgame / position / go / info / score cp / score mate / pv / multipv / nodes / depth / time / bestmove / stop / quit`をAdapter/Parser Testへ拡張。
- `info` token順序への依存を減らし、PV後に別keywordが来ても読み筋へ混入しないよう改善。
- timeout / structured worker crashを明示Errorへ変換。

### Candidate Selection
- Good CandidateとBad Candidateを独立Group化。
- Good最大5件 + Bad最大5件、合計最大10件。
- 合理的Candidateが不足するとき水増ししない。
- 近接する同種Candidateを重複抑制。
- Mate transition専用Rankingを維持。
- Bad CandidateへBest Move / Best Evaluation / Actual Evaluation / Difference / short PVを追加。
- MultiPV拡張可能性を維持。

### Candidate UI
- 「良かった手」「考え直したい手」を別Section表示。
- 「基準を満たす候補のみ表示しています」を表示。
- Engine推奨を「唯一の正解」と表現しない。
- Engine情報を本人のFACT/INTERPRETATION/HYPOTHESISへ自動入力しない。

### Candidate → Replay → Board Scroll
- Candidate Jumpは既存`ShogiReplayController.jump()`を使用。
- Current Move / Snapshot / Board / Move List Highlightを同一Replay Stateで更新。
- Candidateの「局面を見る」だけ、Replay Boardまで意図的Page Scroll。
- Sticky Header offsetを考慮。
- 次/前/最初/最後/Keyboard/Move List/Board FlipはPage Scrollなしを維持。

### Resource Policy
- `SMARTPHONE_SAFE` / `DESKTOP_BALANCED` Presetを追加。
- Smartphone defaultはThreads 1 / Hash 16MB / MultiPV 1 / maxPlies 160。
- 値はPhysical iPhoneで最適化済みとは表現しない。

### Sample KIF
- ユーザー添付`piyo_20260617_170236.kif`を`samples/`へ同梱。
- STEP1「サンプル棋譜を試す」から既存Import Previewへ投入可能。
- Shift_JIS / 152手 / 投了をParser Testで確認。

### License Gate
- YaneuraOu Source、WASM output、MATERIAL Evaluation、Emscripten、NNUE/水匠Weightを別Componentとして監査。
- 権利不明Weight/third-party prebuilt WASMを同梱しない。
- GPLを「無料ならOK」「Workerなら別物」と単純化しない。
- YaneuraOuをBundleするPublic/Commercial buildは`LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION`を維持。

### Verification
- Automated Testを656件へ拡張（最終Package roundで再計測）。
- Browser 390×844でGood/Bad UI、Candidate Jump、Board Scroll、Replay scroll回帰を検証。
- Visual screenshotsを更新。
- Real YaneuraOu WASM E2EはEmscripten不在により未実施と明示。
- Physical iPhone / Battery / Thermalは未測定。

---

## Ver.1.7以前
Ver.1.7以前の履歴はSource of Truth ZIP内のBaseline CHANGELOGとSHA-256 manifestで追跡可能です。今回の実装では既存Domain/Repository/Backup/Replay/7 STEPを大規模再構成していません。
## Ver.1.8.2 Finalization Record

- Source of TruthをIntegration Candidate 347 filesへ再固定。
- `EngineEvaluationGraphModel/View`追加。全ply、CP/Mate/Unknown、Good/Bad/KeyPosition/Mate marker対応。
- Graph Candidate markerから既存ReplayへJumpし盤面までScroll。
- KeyPosition markerからSTEP4該当Card/FACTへ直接Navigation。
- `AnalyzeGame`へ軽量`evaluationTimeline`追加。
- Bad Move DetectionのBest-vs-Actual回帰Testを追加（clear/quiet/tactical/mate miss/形勢帯遷移/no forced five）。
- Candidate→KeyPosition登録時のDOM scroll anchoringによる56px Page shiftを修正。
- Official V9.00 `wasm_pre.js`の`Module.postMessage`/queue/quit terminate設計へWorker Bootstrapを整合。
- Real manifest選択条件へEmscripten/Hash metadata、SharedArrayBuffer、cross-origin isolation Gateを追加。
- `package.json` patch versionを1.8.2へ更新。
- `real-yaneuraou-artifact-gate.mjs` / `formal-completion-gate.mjs`追加。Real evidence不足時は意図的にFAIL。
- Real YaneuraOu WASM binaryはToolchain不在のため未生成・未同梱。

## Ver.1.8.3 — YaneuraOu WASM Build Bridge

- GitHub Actionsによるofficial YaneuraOu V9.00 exact-commit Build Bridgeを追加。
- emsdk/Emscripten 4.0.15とofficial release mappingを固定。
- MATERIAL_LEVEL=1 / TARGET_CPU=WASM / COMPILER=em++を固定。
- actual generated pthread Worker名をBuild結果から検出する方式へ変更。
- JS/WASM/Worker SHA-256と`ENGINE_BUILD_METADATA.json`生成を追加。
- exact-commit Corresponding Source evidence archive生成を追加。
- Real Artifact Gateをmeasured Build Metadata必須へ強化。
- Real USI verifierとReal Application E2E verifierを分離し、同一WASM SHA-256照合をFormal Gateへ追加。
- CIでexisting Browser/Visual/ReflectionLocal regressionとReal USI/E2Eを実行する経路を追加。
- legacy manifest finalizerがFile名だけでReal Engineを有効化できないようfail-closed化。
- HostingをLocal/Desktop/GitHub Pages/iPhone Safari/Installed Appで分離記録。
- Existing Application LICENSEは変更なし。
- 現環境ではReal Build未実行のためFormal CompletionはNOT-FORMALを維持。
