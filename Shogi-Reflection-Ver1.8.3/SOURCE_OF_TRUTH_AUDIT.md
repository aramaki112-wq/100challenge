# Shogi Reflection Ver.1.8.3 — SOURCE OF TRUTH AUDIT

Date: 2026-08-10
Verdict: **Source of Truth preserved / Build Bridge changes isolated / Formal Completion NOT achieved**

## 1. Baseline

- Source of Truth artifact: `Shogi-Reflection-Ver1.8.2-NOT-FORMAL-Integration-Candidate(1).zip`
- Baseline ZIP SHA-256: `089c7625bcbd750d511cd0b1a511f146bd520659162307a555bcf9d414a41087`
- Baseline file count: **365**
- Final working-tree file count before packaging: **384**
- Hash-identical baseline files: **322**
- Modified baseline files: **43**
- Added files: **19**
- Deleted baseline files: **0**
- Existing Application `LICENSE` SHA-256: `f80358715ec38c12618abead454a81ecd7dc1a8cf4e64e1f498d749a5697988c` — **unchanged**

## 2. Architecture preservation audit

| Area | Result | Ver.1.8.3 decision |
|---|---|---|
| Domain Model | UNCHANGED | no Real Engine concern introduced into Domain |
| Repository | UNCHANGED | existing repositories retained |
| LocalStorage / Backup / Restore | UNCHANGED | schema/compatibility not changed |
| KIF Import / Parser / Sample KIF | UNCHANGED | existing path reused by Real E2E verifier |
| Replay Domain / Position History / View Model | UNCHANGED | no reconstruction |
| Replay Scroll Policy | UNCHANGED in application code | existing explicit Candidate board-scroll exception retained |
| KeyPosition / Snapshot / STEP4 | UNCHANGED | Real E2E only verifies existing flow |
| Fixed 9×9 Board / SVG / Flip | UNCHANGED | visual regression retained |
| Evaluation Graph | UNCHANGED | Ver.1.8.3 records future improvement only |
| Good / Bad Candidate logic | UNCHANGED | Real E2E will validate existing selection against Real Engine |
| Engine Port / Adapter architecture | UNCHANGED | Build/runtime evidence added outside Domain boundary |
| Engine manifest | CHANGED | fail-closed Build Metadata / hash / pthread provenance fields |
| Build Bridge | ADDED | GitHub Actions + fixed Source/Toolchain + actual-output hashing |
| Real USI evidence | ADDED | separate Real protocol/evaluation verifier |
| Real Application E2E evidence | STRENGTHENED | hash-bound Sample KIF/full-ply/Graph/STEP4/Cancel verifier |
| License / Source Distribution evidence | STRENGTHENED | exact-commit source archive design and three readiness levels |

## 3. YaneuraOu / Build facts fixed by this version

- Repository: `https://github.com/yaneurao/YaneuraOu`
- Release: `V9.00`
- Exact commit: `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- Evaluation: `YANEURAOU_ENGINE_MATERIAL`
- `MATERIAL_LEVEL=1`
- `TARGET_CPU=WASM`
- `COMPILER=em++`
- emsdk target: `4.0.15`
- expected official Emscripten release mapping: `b412b6307e541b93dd93f01b61181e15c17302ec`
- third-party NNUE / 水匠 weight: **not adopted**
- Docker: **not adopted in Ver.1.8.3**

The upstream pthread/memory/stack values are recorded as reproducibility inputs only. They are not labeled as iPhone-optimal settings.

## 4. Real evidence status in this execution environment

- `emsdk` activated: **NO**
- `emcc`: **UNAVAILABLE**
- `em++`: **UNAVAILABLE**
- external GitHub clone from container: **failed (`Could not resolve host: github.com`)**
- Real YaneuraOu JS generated: **NO**
- Real YaneuraOu WASM generated: **NO**
- separate generated pthread Worker: **NOT EXPECTED for Emscripten 4.0.15**
- GitHub Actions Run #2 upstream `make`: **COMPLETED before first-party post-build worker assumption failed**
- generated JS/WASM retained in app artifact: **NO — bridge stopped before copy/hash**
- JS/WASM/application-bootstrap measured SHA-256: **NO — Run #3 required**
- Real Artifact Gate: **FAIL as designed**
- Real USI result: **NOT RUN — Real asset unavailable**
- Real Application E2E result: **NOT RUN — Real asset unavailable**
- Formal Completion Gate: **NOT_FORMAL**

ReflectionLocal/Mock results are not used to fill any of these items.

## 5. Verification status

- Automated Test: **697 / 697 PASS**
- Static Verification: **143 PASS / 0 FAIL** at the latest pre-report run; Missing Import **0**
- Browser Regression: **154 / 154 PASS** at 390×844
- Visual Verification: **24 / 24 PASS**
- ReflectionLocal fallback browser gate: **16 / 16 PASS**; explicitly not Real YaneuraOu evidence
- Physical iPhone: **NOT TESTED**
- Real YaneuraOu performance/battery/thermal: **NOT MEASURED**

One browser regression run transiently observed Candidate→KeyPosition page scroll movement of 17 px (3908→3925). An immediate repeat and the final rerun both passed 154/154. No application UI change was made in response because the issue did not reproduce consistently; the observation is retained rather than hidden.

## 6. Modified baseline files

- `BROWSER_VERIFICATION_RESULT.txt`
- `CHANGELOG.md`
- `COMPLETION_REPORT.md`
- `DISTRIBUTION_LICENSE_CHECKLIST.md`
- `Design Handbook.md`
- `Design Novel.md`
- `Design Rules.md`
- `ENGINE_BUILD_REPRODUCIBILITY.md`
- `ENGINE_COMPONENT_DECISION.md`
- `ENGINE_LICENSE_AUDIT.md`
- `ENGINE_LICENSE_GATE_RESULT.json`
- `ENGINE_PERFORMANCE_RESULT.txt`
- `ENGINE_SOURCE_DISTRIBUTION_PLAN.md`
- `Explanation.md`
- `FORMAL_COMPLETION_GATE_RESULT.json`
- `FORMAL_COMPLETION_STATUS.md`
- `Learning Roadmap.md`
- `README.md`
- `REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt`
- `REAL_YANEURAOU_ARTIFACT_GATE_RESULT.json`
- `REAL_YANEURAOU_BROWSER_E2E_RESULT.txt`
- `REAL_YANEURAOU_E2E_RESULT.json`
- `Review Checklist.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `STATIC_VERIFICATION_RESULT.txt`
- `SYNTAX_CHECK_RESULT.txt`
- `TEST_RESULT.txt`
- `THIRD_PARTY_NOTICES.md`
- `Thought Process.md`
- `VISUAL_CANDIDATE_JUMP_BOARD_SCROLL.png`
- `VISUAL_VERIFICATION_RESULT.txt`
- `ZIP_EXTRACTED_VERIFICATION_RESULT.txt`
- `browser_verify.py`
- `engine/yaneuraou/engine-manifest.json`
- `package.json`
- `real_engine_browser_verify.py`
- `real_yaneuraou_browser_verify.py`
- `scripts/build-yaneuraou-wasm.sh`
- `scripts/finalize-yaneuraou-manifest.mjs`
- `scripts/formal-completion-gate.mjs`
- `scripts/real-yaneuraou-artifact-gate.mjs`
- `verify.mjs`
- `visual_verify.py`

## 7. Added files

- `.github/workflows/build-yaneuraou-wasm.yml`
- `ENGINE_ASSET_SHA256SUMS.txt`
- `ENGINE_BUILD_METADATA.json`
- `ENGINE_BUILD_RESULT.txt`
- `ENGINE_REAL_E2E_RESULT.txt`
- `ENGINE_REAL_PERFORMANCE_RESULT.json`
- `ENGINE_REAL_USI_RESULT.txt`
- `REAL_YANEURAOU_USI_RESULT.json`
- `YANEURAOU_WASM_BUILD_BRIDGE.md`
- `YaneuraOuBuildBridgeV183.test.js`
- `build-record/node-test.tap`
- `real_yaneuraou_usi_verify.py`
- `requirements-real-engine.txt`
- `scripts/hash-engine-assets.sh`
- `scripts/integrate-yaneuraou-build-artifact.sh`
- `scripts/run-node-tests-with-evidence.sh`
- `scripts/update-engine-build-metadata.mjs`
- `scripts/update-engine-license-gate.mjs`
- `scripts/verify-yaneuraou-wasm.sh`

## 8. Deleted files

- none

## 9. Compatibility conclusions

- Backup compatibility: preserved; storage/domain schema not changed.
- Restore compatibility: preserved.
- Markdown export compatibility: preserved.
- Observation Card compatibility: preserved.
- Replay compatibility: preserved.
- Evaluation Graph behavior: preserved.
- Missing Import: 0.
- Existing Application LICENSE: unchanged.

## 10. Audit conclusion

Ver.1.8.3 is a narrowly scoped **YaneuraOu WASM Build Bridge** extension of the supplied Ver.1.8.2 NOT-FORMAL artifact. It does not earn Formal Completion merely by adding CI scripts. The next legitimate state transition requires a successful measured official-source build and Real runtime evidence for the same WASM hash.
