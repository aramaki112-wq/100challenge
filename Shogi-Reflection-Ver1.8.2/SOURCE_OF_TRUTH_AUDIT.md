# SOURCE_OF_TRUTH_AUDIT — Ver.1.8.2 Finalization

Date: 2026-08-09

## Source of Truth

- Artifact: `Shogi-Reflection-Ver1.8-Integration-Candidate(1).zip`
- Baseline files: **347**
- Final working files: **365**
- Hash-identical baseline files: **291**
- Modified baseline files: **56**
- Added files: **18**
- Deleted baseline files: **0**
- Baseline hash manifest: `SOURCE_OF_TRUTH_V1_8_INTEGRATION_CANDIDATE_HASHES.json`
- Existing Application `LICENSE` SHA-256: `f80358715ec38c12618abead454a81ecd7dc1a8cf4e64e1f498d749a5697988c` — preserved

> Note: the Source ZIP itself contains two `__pycache__` files. They are retained unchanged; they are not treated as application source.

## Structural Audit

| Area | Result | Change / Evidence |
|---|---|---|
| Domain Model | PRESERVED | `GameReview.js`, `KeyPosition.js`, `ShogiPosition.js` etc. unchanged |
| Repository | PRESERVED | Repository contracts/implementations unchanged |
| Storage | PRESERVED | LocalStorage Game schema unchanged |
| Migration | NONE | no Game schema migration introduced |
| Backup / Restore | PRESERVED | existing schema/version path retained and tests pass |
| KIF Import / Parser | PRESERVED | existing parser flow reused; sample path retained |
| Position History | PRESERVED | all-ply Engine timeline consumes existing history |
| Replay core | PRESERVED | existing Replay controller/service/view model retained |
| Replay Scroll Policy | PRESERVED + explicit exception | normal nav/flip no page scroll; Candidate/Graph 「局面を見る」 only board scroll |
| Board | PRESERVED | fixed 9×9 Grid unchanged |
| Piece Graphics | PRESERVED | SVG implementation unchanged |
| Board Flip | PRESERVED | no page scroll regression |
| Snapshot | PRESERVED | Replay Position Snapshot unchanged |
| Engine Port | PRESERVED | Domain/Application interface unchanged |
| Engine Adapter | EXTENDED | official WASM message bridge/capability gate strengthened |
| ReflectionLocalEngine | PRESERVED | explicit fallback only |
| YaneuraOu | PINNED / NOT BUILT | V9.00, exact commit; no binary bundled |
| WASM | NOT BUILT | manifest remains `available=false` |
| MATERIAL | PINNED | `YANEURAOU_ENGINE_MATERIAL`, `MATERIAL_LEVEL=1` |
| Worker | MODIFIED | bootstrap now uses official `wasm_pre.js` message bridge |
| Best Move | PRESERVED/USED | candidate comparison reference |
| Best Evaluation | EXPLICIT | root best evaluation exposed per move row |
| Actual Evaluation | EXPLICIT | actual-move-after evaluation exposed per row |
| Difference | EXPLICIT | `bestMoveDifferenceCp` prioritized |
| PV | PRESERVED/SHORT | short candidate PV display; long search tree not persisted |
| Good Candidate | MAX 5 | no forced fill |
| Bad Candidate | MAX 5 | best-vs-actual + mate/transition ranking tests expanded |
| Evaluation Graph | ADDED | all-ply SVG navigation map |
| Graph Marker | ADDED | Good/Bad/KeyPosition/Mate |
| Graph → Replay | ADDED | existing Replay state reused |
| Graph → STEP4 | ADDED | exact KeyPosition card + FACT focus |
| Candidate → Replay | PRESERVED | existing `jump(ply)` |
| Candidate → Scroll | PRESERVED | intentional board scroll only |
| Candidate → KeyPosition | PRESERVED | existing KeyPosition flow; no auto registration |
| Candidate add scroll anchoring | FIXED | DOM update no longer shifts page |
| Backup compatibility | PASS | existing automated/browser suite |
| Restore compatibility | PASS | existing automated/browser suite |
| Markdown compatibility | PASS | formatter/export tests retained |
| Observation Card compatibility | PASS | existing manual source preserved |
| License | AUDITED | components separated; unknown-rights binary/weights absent |
| Test additions | ADDED | Graph, Best-vs-Actual, WASM bridge, browser capability gates |

## Verification Summary

- Automated Test: **676 / 676 PASS**
- Browser 390×844: **154 / 154 PASS**
- Visual 390×844: **24 / 24 PASS**
- Static Verification: **Missing Import 0**, current static report must pass
- Fallback Engine Browser: **16 / 16 PASS**
- Real YaneuraOu Artifact Gate: **FAIL — expected because no built asset**
- Real YaneuraOu Browser E2E: **NOT RUN**
- Formal Completion Gate: **FAIL**
- Physical iPhone: **NOT TESTED**

## Modified Baseline Files

- `AnalyzeGame.js`
- `BROWSER_VERIFICATION_RESULT.txt`
- `BROWSER_VERIFICATION_SCREENSHOT.png`
- `BrowserEngineAnalysisView.js`
- `BrowserEngineProvider.js`
- `BrowserGameReviewFormView.js`
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
- `Explanation.md`
- `FORMAL_COMPLETION_STATUS.md`
- `Learning Roadmap.md`
- `PERFORMANCE_RESULT.txt`
- `README.md`
- `REAL_ENGINE_BOARD_FLIPPED_V18.png`
- `REAL_ENGINE_BOARD_V18.png`
- `REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt`
- `REAL_ENGINE_PANEL_V18.png`
- `RealEngineEvaluationSanityV18.test.js`
- `Review Checklist.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `STATIC_VERIFICATION_RESULT.txt`
- `SYNTAX_CHECK_RESULT.txt`
- `TEST_RESULT.txt`
- `THIRD_PARTY_NOTICES.md`
- `Thought Process.md`
- `VISUAL_BOARD_FLIP.png`
- `VISUAL_CANDIDATE_GROUPS.png`
- `VISUAL_CANDIDATE_JUMP_BOARD_SCROLL.png`
- `VISUAL_NORMAL_BOARD.png`
- `VISUAL_PROMOTED_PIECES.png`
- `VISUAL_SMARTPHONE_STEP3.png`
- `VISUAL_VERIFICATION_RESULT.txt`
- `Ver.1.8操作手順書.md`
- `Ver18FormalRequirements.test.js`
- `YaneuraOuWasmWorkerBootstrap.js`
- `ZIP_EXTRACTED_VERIFICATION_RESULT.txt`
- `browser_verify.py`
- `challenge.md`
- `engine/yaneuraou/engine-manifest.json`
- `index.html`
- `main.js`
- `package.json`
- `style.css`
- `verify.mjs`
- `visual_verify.py`

## Added Files

- `AnalyzeGameEvaluationTimelineV182.test.js`
- `BadMoveDetectionV182.test.js`
- `ENGINE_EVALUATION_GRAPH_DESIGN.md`
- `ENGINE_LICENSE_GATE_RESULT.json`
- `EngineEvaluationGraphModel.js`
- `EngineEvaluationGraphV182.test.js`
- `EngineEvaluationGraphView.js`
- `FORMAL_COMPLETION_GATE_RESULT.json`
- `REAL_YANEURAOU_ARTIFACT_GATE_RESULT.json`
- `REAL_YANEURAOU_BROWSER_E2E_RESULT.txt`
- `REAL_YANEURAOU_E2E_RESULT.json`
- `SOURCE_OF_TRUTH_V1_8_INTEGRATION_CANDIDATE_HASHES.json`
- `VISUAL_EVALUATION_GRAPH_V182.png`
- `VISUAL_GRAPH_TO_STEP4_V182.png`
- `YaneuraOuWasmBootstrapV182.test.js`
- `real_yaneuraou_browser_verify.py`
- `scripts/formal-completion-gate.mjs`
- `scripts/real-yaneuraou-artifact-gate.mjs`

## Deleted Files

- none

## Conclusion

The Integration Candidate remains the architectural baseline; no baseline file was deleted and core Domain/Repository/Storage/Replay/Board contracts were not reconstructed. Ver.1.8.2 feature work is present, but Real YaneuraOu hard gates are not satisfied, so this audit does **not** certify formal completion.
