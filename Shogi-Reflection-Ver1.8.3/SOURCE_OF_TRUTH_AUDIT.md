# Shogi Reflection Ver.1.8.3 — SOURCE OF TRUTH AUDIT / Run #6 Candidate

Date: 2026-08-11
Verdict: **Source of Truth preserved / Build-runtime boundary corrected / Formal Completion NOT achieved**

## 1. Baseline

- Source of Truth: `Shogi-Reflection-Ver1.8.2-NOT-FORMAL-Integration-Candidate(1).zip`
- Baseline ZIP SHA-256: `089c7625bcbd750d511cd0b1a511f146bd520659162307a555bcf9d414a41087`
- Existing Application `LICENSE` SHA-256: `f80358715ec38c12618abead454a81ecd7dc1a8cf4e64e1f498d749a5697988c` — **unchanged**
- Run #6 patch purpose: correct only the YaneuraOu build/runtime-asset contract after measured Run #5 Real failure.

The static verifier continues to compare the working tree against the recorded Ver.1.8 integration baseline and reports modified/added/deleted/missing-import counts on every run. Run #6 local preflight currently reports **Missing Import 0** and **143/143 static checks PASS**.

## 2. Architecture preservation

| Area | Result | Run #6 decision |
|---|---|---|
| Domain Model | UNCHANGED | no YaneuraOu/Emscripten dependency introduced |
| Repository | UNCHANGED | existing ports/repositories retained |
| LocalStorage | UNCHANGED | no schema change |
| Backup / Restore | UNCHANGED | compatibility retained |
| KIF Import / Parser / ぴよ将棋 / Sample KIF | UNCHANGED | existing Real E2E input path retained |
| Replay / Position History / View Model | UNCHANGED | no reconstruction |
| Replay Scroll Policy | UNCHANGED | Candidate board-scroll exception retained |
| KeyPosition / Snapshot / STEP4 | UNCHANGED | existing flow only verified |
| Fixed 9×9 Grid / SVG / Board Flip | UNCHANGED | browser/visual regression retained |
| Good / Bad Candidate selection | UNCHANGED | Real engine only supplies evaluation/reference data |
| Evaluation Graph | UNCHANGED | no Run #6 feature expansion |
| Reflection FACT / INTERPRETATION / HYPOTHESIS | UNCHANGED | Engine still does not auto-fill reflection |
| Engine Port / Adapter | UNCHANGED | existing `YaneuraOuWasmAdapter -> BrowserWorkerUsiTransport` boundary retained |
| Worker bootstrap | CHANGED | points to upstream material-profile generated JS/export |
| Engine manifest / Build Metadata | CHANGED | separate generated pthread Worker + 3.1.43 profile are hash-bound |
| Build Bridge | CHANGED | aligns with pinned upstream WASM workflow/profile |
| License / Corresponding Source evidence | STRENGTHENED | upstream build script/workflow retained alongside exact source archive |

## 3. Pinned source/toolchain facts for Run #6

- YaneuraOu: V9.00
- exact commit: `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- repository: official `yaneurao/YaneuraOu`
- upstream WASM runner: Ubuntu 22.04
- upstream WASM Emscripten choice: 3.1.43
- official emsdk release mapping expected: `3.1.43 -> bf3c159888633d232c0507f4c76cc156a43c32dc`
- upstream build entry point: `node script/wasm_build.js material`
- evaluation: `YANEURAOU_ENGINE_MATERIAL`, `MATERIAL_LEVEL=1`
- export: `YaneuraOu_Material`
- material initial memory override: `92274688`
- generated runtime contract: `yaneuraou.material.js`, `yaneuraou.material.worker.js`, `yaneuraou.material.wasm`
- third-party NNUE / 水匠 weight: **not adopted**

Docker is not used by the Run #6 bridge itself; the same fixed 3.1.43 SDK is installed directly so compiler/runtime metadata can be captured explicitly. This choice still requires Real Run #6 evidence before being accepted as runtime-equivalent for this application.

## 4. Historical Real evidence — Run #5

Run #5 is retained as negative evidence, not overwritten:

- official exact YaneuraOu source: acquired/pinned
- Emscripten 4.0.15 bridge: compile/hash gate passed
- CI browser `crossOriginIsolated`: true
- CI browser `SharedArrayBuffer`: true
- Real USI: **FAILED before `usiok`**
- repeated error: `RuntimeError: function signature mismatch`
- Real application E2E: **FAILED**
- application behavior: correctly degraded to ReflectionLocal and did not count fallback as Real evidence

This measured failure triggered the upstream-toolchain re-audit and Run #6 correction.

## 5. Run #6 evidence status before GitHub execution

- Run #6 Emscripten 3.1.43 Real build: **NOT YET RUN**
- Real generated JS / pthread Worker / WASM: **NOT YET MEASURED**
- Real SHA-256: **NOT YET MEASURED**
- Real `usi / usiok`: **NOT YET RUN**
- Real analysis / PV / bestmove / cancel: **NOT YET RUN**
- Real Sample KIF full-ply E2E: **NOT YET RUN**
- Formal Gate: **NOT_FORMAL**

Mock/ReflectionLocal results cannot fill these fields.

## 6. Local Run #6 non-Real preflight

- Automated Test: **701 / 701 PASS**
- Static Verification: **143 / 143 PASS**
- Missing Import: **0**
- Browser Regression at 390×844: **154 / 154 PASS**
- Visual Verification: **24 / 24 PASS**
- ReflectionLocal fallback browser verification: **16 / 16 PASS**
- built-metadata/artifact-gate contract simulation with dummy files: **PASS** (structural test only; explicitly not Real evidence)
- Physical iPhone: **NOT TESTED**
- Real YaneuraOu battery/thermal/performance under Run #6: **NOT MEASURED**

## 7. Build/runtime files changed or added by Run #6

Primary Run #6 delta is limited to:

- repo-root and app-local `.github/workflows/build-yaneuraou-wasm.yml`
- `scripts/build-yaneuraou-wasm.sh`
- `scripts/hash-engine-assets.sh`
- `scripts/update-engine-build-metadata.mjs`
- `scripts/verify-yaneuraou-wasm.sh`
- `scripts/real-yaneuraou-artifact-gate.mjs`
- `scripts/formal-completion-gate.mjs`
- `YaneuraOuWasmWorkerBootstrap.js`
- `real_yaneuraou_usi_verify.py`
- `real_yaneuraou_browser_verify.py`
- Build Bridge/static tests
- engine manifest / unmeasured Build Metadata placeholders
- incident/reproducibility/license/source-distribution/completion documentation

No baseline application domain/storage/replay/graph implementation file is intentionally modified for the Run #6 toolchain correction.

## 8. Compatibility conclusion

- Backup compatibility: preserved.
- Restore compatibility: preserved.
- Markdown export compatibility: preserved.
- Observation Card compatibility: preserved.
- KIF/Replay/KeyPosition compatibility: preserved.
- Existing Application LICENSE: unchanged.
- Missing Import: 0.

## 9. Audit conclusion

Ver.1.8.3 remains a narrowly scoped **NOT-FORMAL YaneuraOu WASM Build Bridge candidate**. Run #6 may advance the project only if the new exact asset set is measured and the Real USI/E2E gates pass for the same WASM hash. Build success alone is insufficient.

## Run #7 delta audit

Run #7 changes are confined to the Build Bridge/evidence layer. Domain Model, Repository, LocalStorage, Backup/Restore, KIF, Replay, KeyPosition, Evaluation Graph, Candidate flow and Reflection flow are unchanged.

Build-layer delta:
- exact upstream Emscripten Docker image path adopted (`emscripten/emsdk:3.1.43`);
- Docker image ID/RepoDigest evidence added;
- clean/build split for deterministic execution and real make-exit capture;
- Run #6 missing-output incident documented;
- no YaneuraOu source/Makefile modification.

Formal status: NOT-FORMAL pending Run #7 measured evidence.
