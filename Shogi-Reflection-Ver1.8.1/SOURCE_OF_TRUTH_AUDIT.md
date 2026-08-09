# SOURCE_OF_TRUTH_AUDIT — Shogi Reflection Ver.1.8 Integration Candidate

監査日: 2026-08-09

## Baseline
- Source of Truth: user uploaded `Shogi-Reflection-Ver1.8(1).zip`
- Baseline File数: **331**
- Current File数: **345**
- Hash一致File: **272**
- 変更File: **59**
- 追加File: **14**
- 削除File: **0**
- Existing `LICENSE` SHA-256: `f80358715ec38c12618abead454a81ecd7dc1a8cf4e64e1f498d749a5697988c` / Baseline一致

## Required Audit Matrix

| Item | Result | Detail |
|---|---|---|
| Domain変更 | PASS | breaking Domain restructureなし。GameReview/KeyPosition/Replay Domainを維持 |
| Repository変更 | PASS | Existing Repository contract維持 |
| Storage変更 | PASS | GameReview schema破壊なし。Engine巨大Tree保存なし |
| Migration | NOT REQUIRED | Existing backup/restore互換を維持 |
| Replay変更 | PASS | Candidateもexisting Replay Controllerを使用 |
| Replay Scroll変更 | CONTROLLED | Normal navigationはPage Scrollなし。Candidate「局面を見る」だけ例外 |
| Candidate Scroll | PASS | Jump完了後にBoardまでScroll、Sticky header offsetあり |
| Board変更 | PRESERVED | Fixed 9×9 geometry維持 |
| Piece変更 | PRESERVED | `ShogiPieceSvg.js` Baseline hash一致 |
| Step UI変更 | PASS | 7 STEP維持、STEP3 Engine panel→Candidate→Replay |
| Engine Adapter | PASS | YaneuraOuWasmAdapter + explicit fallback |
| YaneuraOu | PARTIAL | V9.00 exact commit固定、actual WASM未Build |
| WASM | NOT BUILT | manifest `available:false` |
| Worker | PASS | YaneuraOu bootstrap boundary + ReflectionLocal fallback Worker |
| MATERIAL | TARGET CONFIRMED | MATERIAL_LEVEL=1 build target |
| Best Move | PASS in architecture/fallback tests | Real YaneuraOu E2E未実施 |
| PV | PASS in parser/UI/fallback tests | Real YaneuraOu E2E未実施 |
| Good Candidate | PASS | 最大5、no padding |
| Bad Candidate | PASS | 最大5、Best-vs-Actual/PV |
| Candidate → Replay | PASS | existing Replay state |
| Candidate → Scroll | PASS | Candidate action only |
| Candidate → KeyPosition | PASS | existing AddCurrentPositionToKeyPosition |
| Backup互換 | PASS | existing schema retained |
| Restore互換 | PASS | existing schema retained |
| Markdown互換 | PASS |本人Reflection責務を維持 |
| Observation Card互換 | PASS | Engine自動生成/上書きなし |
| License | PARTIAL GATE | Source/components audited; YaneuraOu bundle legal review remains |
| External Asset | SAFE | unverified WASM/NNUE/水匠Weightなし |
| Test追加 | PASS | Formal requirements / USI / Candidate / sample / scroll tests |

## Engine / Build Audit
- YaneuraOu release target: **V9.00**
- Commit: **a5ee2786c0030edc7d4a1cdfe94b04dffec55493**
- Evaluation target: **YANEURAOU_ENGINE_MATERIAL / MATERIAL_LEVEL=1**
- WASM target: **TARGET_CPU=WASM / COMPILER=em++**
- Build reproducibility scripts: present
- Emscripten actual version: **NOT RECORDED — compiler unavailable**
- YaneuraOu JS/WASM output hashes: **NOT RECORDED — not built**
- Runtime provider: verified manifestならYaneuraOu primary、未verifiedならReflectionLocal fallback

## Replay / Scroll Audit
- `ReplayScrollPolicy.js`: Baseline hash一致
- 次へ/前へ/最初へ/最後へ: Page Scrollなし
- Keyboard Navigation: Page Scrollなし
- Move List Jump: Page Scrollなし
- Board Flip: Page Scrollなし
- Engine Candidate「局面を見る」: **explicit exception**
- Candidate Jump後: ply / Current Move / Snapshot / Board / Move List Highlightを既存Replayから更新後、BoardへScroll

## Sample KIF
- `samples/piyo_20260617_170236.kif`
- SHA-256: `72a1c92726dee787cd13af0508b559be44a6c0d7c088b4c37894a3eaba5f06c7`
- Shift_JIS reader + existing Parser route
- 152 moves / 投了をAutomated Testで確認

## Verification Snapshot
- Automated: **656 / 656 PASS**
- Browser: **148 / 148 PASS** at 390×844 Chromium
- Fallback Worker Browser Gate: **16 / 16 PASS**
- Visual: **17 / 17 PASS**
- Static: **96 / 96 PASS** before final package round; final round re-run required
- Missing Import: **0**
- Real YaneuraOu WASM E2E: **NOT RUN**
- Physical iPhone: **NOT TESTED**
- Battery/Thermal: **NOT MEASURED**

## Modified Baseline Files
- `AnalyzeGame.js`
- `BROWSER_VERIFICATION_RESULT.txt`
- `BROWSER_VERIFICATION_SCREENSHOT.png`
- `BrowserEngineAnalysisView.js`
- `BrowserEngineProvider.js`
- `BrowserShogiReplayView.js`
- `BrowserWorkerUsiTransport.js`
- `CHANGELOG.md`
- `COMPLETION_REPORT.md`
- `DISTRIBUTION_LICENSE_CHECKLIST.md`
- `Design Handbook.md`
- `Design Novel.md`
- `Design Rules.md`
- `ENGINE_BUILD_REPRODUCIBILITY.md`
- `ENGINE_CANDIDATE_SELECTION_DESIGN.md`
- `ENGINE_COMPONENT_DECISION.md`
- `ENGINE_INTEGRATION_DESIGN.md`
- `ENGINE_LICENSE_AUDIT.md`
- `ENGINE_PERFORMANCE_RESULT.txt`
- `ENGINE_SOURCE_DISTRIBUTION_PLAN.md`
- `EngineAnalysisSettings.js`
- `EngineCandidateSelector.js`
- `EngineUiFlowV17.test.js`
- `Explanation.md`
- `Learning Roadmap.md`
- `PERFORMANCE_RESULT.txt`
- `README.md`
- `REAL_ENGINE_BOARD_FLIPPED_V18.png`
- `REAL_ENGINE_BOARD_V18.png`
- `REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt`
- `REAL_ENGINE_PANEL_V18.png`
- `RealAnalysisFlowV18.test.js`
- `RealEngineE2EV18.test.js`
- `ReflectionLocalEngineAdapter.js`
- `Review Checklist.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `STATIC_VERIFICATION_RESULT.txt`
- `SYNTAX_CHECK_RESULT.txt`
- `TEST_RESULT.txt`
- `THIRD_PARTY_NOTICES.md`
- `Thought Process.md`
- `UsiEngineAdapter.js`
- `UsiInfoParser.js`
- `VISUAL_BOARD_FLIP.png`
- `VISUAL_NORMAL_BOARD.png`
- `VISUAL_PROMOTED_PIECES.png`
- `VISUAL_SMARTPHONE_STEP3.png`
- `VISUAL_VERIFICATION_RESULT.txt`
- `Ver.1.8操作手順書.md`
- `YaneuraOuEngineAdapter.js`
- `browser_verify.py`
- `challenge.md`
- `index.html`
- `main.js`
- `package.json`
- `real_engine_browser_verify.py`
- `style.css`
- `verify.mjs`
- `visual_verify.py`

## Added Files
- `FORMAL_COMPLETION_STATUS.md`
- `FallbackShogiEngineAdapter.js`
- `SOURCE_OF_TRUTH_V1_8_BASELINE_HASHES.json`
- `UsiProtocolV18.test.js`
- `VISUAL_CANDIDATE_GROUPS.png`
- `VISUAL_CANDIDATE_JUMP_BOARD_SCROLL.png`
- `Ver18FormalRequirements.test.js`
- `YaneuraOuWasmAdapter.js`
- `YaneuraOuWasmWorkerBootstrap.js`
- `ZIP_EXTRACTED_VERIFICATION_RESULT.txt`
- `engine/yaneuraou/engine-manifest.json`
- `samples/piyo_20260617_170236.kif`
- `scripts/build-yaneuraou-wasm.sh`
- `scripts/finalize-yaneuraou-manifest.mjs`

## Deleted Baseline Files
- none

## Formal Completion Verdict
**NOT ACHIEVED.** User requirement includes actual YaneuraOu WASM build and Real Engine E2E; those cannot be asserted from fallback/test-double evidence.
