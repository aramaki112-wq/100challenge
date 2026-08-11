# Shogi Reflection Ver.1.8.3 — Run #6 Candidate Completion Report

Date: 2026-08-11
Version: **Shogi Reflection Ver.1.8.3 — YaneuraOu WASM Build Bridge**
Formal Completion Verdict: **NOT_FORMAL**

## 1. Current position

The Build Bridge has advanced through five real GitHub Actions runs. Run #5 proved that the application can build/hash a Real YaneuraOu WASM artifact, establish the CI browser's cross-origin-isolated pthread prerequisites, and invoke the Real verifiers. However the 4.0.15-built engine crashed before `usiok` with repeated `RuntimeError: function signature mismatch`, and the application correctly fell back to ReflectionLocal.

A primary-source re-audit of the **exact pinned YaneuraOu V9.00 commit** found that its own WASM workflow selects Ubuntu 22.04 and `emscripten/emsdk:3.1.43`, while its own `script/wasm_build.js material` profile defines the MATERIAL build and expects JS, a separate pthread Worker, and WASM outputs.

Run #6 therefore corrects the Build Bridge to that pinned upstream WASM path. This report does **not** claim Run #6 success before GitHub Actions measures it.

## 2. Run history relevant to Formal Gate

- Run #1: build script execute permission failure; no compile.
- Run #2: compile reached output stage; bridge incorrectly assumed a worker packaging shape for the selected 4.0.15 path.
- Run #3: Real JS/WASM generated and hash-bound; static gate exposed filename/baseline issues.
- Run #4: Real verifiers executed; asset placement/URL issue caused WASM path failure.
- Run #5: build/hash/static/browser prerequisites passed; Real engine then failed before `usiok` with `function signature mismatch`; Real app fell back to ReflectionLocal.
- Run #6 candidate: align build to the pinned upstream Emscripten 3.1.43 / `script/wasm_build.js material` path and rerun Real USI/E2E.

Historical incident evidence is retained rather than rewritten.

## 3. Run #6 fixed build target

| Item | Run #6 target |
|---|---|
| Engine | YaneuraOu |
| Release | V9.00 |
| Commit | `a5ee2786c0030edc7d4a1cdfe94b04dffec55493` |
| Repository | official `yaneurao/YaneuraOu` |
| Evaluation | upstream `material` profile |
| Edition | `YANEURAOU_ENGINE_MATERIAL` |
| MATERIAL Level | 1 |
| Export name | `YaneuraOu_Material` |
| Target CPU | WASM |
| Compiler | em++ |
| emsdk target | 3.1.43 |
| expected Emscripten release commit | `bf3c159888633d232c0507f4c76cc156a43c32dc` |
| Build host label | GitHub Actions `ubuntu-22.04` |
| Build entry point | `node script/wasm_build.js material` |
| External NNUE / 水匠 weight | not adopted |
| Application LICENSE | unchanged |

Expected upstream material outputs:

- `yaneuraou.material.js`
- `yaneuraou.material.worker.js`
- `yaneuraou.material.wasm`

The first-party outer application Worker remains:

- `engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js`

All four runtime assets must be SHA-256-bound independently.

## 4. Resource profile

The pinned upstream `material` profile explicitly supplies initial memory `92,274,688` bytes. The pinned Makefile also retains the threaded WASM path and its thread/memory/stack controls. These values are reproducibility inputs only; they are not described as iPhone-optimized, lightweight, fast, battery-efficient or thermally safe.

## 5. Run #5 measured negative Real evidence

Run #5 measured:

- YaneuraOu commit: `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- Emscripten: 4.0.15 (historical bridge)
- Real Browser version: Chromium 143.0.7499.4
- `crossOriginIsolated`: true
- `SharedArrayBuffer`: true
- Real USI result: **FAILED_REAL_USI_VERIFICATION**
- engine error: repeated `RuntimeError: function signature mismatch`
- `usiok`: not reached
- Real application E2E: **FAILED_REAL_APPLICATION_E2E**
- app behavior on Real engine crash: explicit ReflectionLocal fallback

This evidence is why Run #5 is not Formal and why Run #6 changes the toolchain/profile alignment.

## 6. Run #6 implementation changes

Run #6 candidate changes only the Engine Build/runtime-asset boundary:

- Emscripten target 4.0.15 -> 3.1.43.
- runner 24.04 -> 22.04 for upstream-workflow alignment.
- custom translated Make invocation -> pinned upstream `node script/wasm_build.js material`.
- generated runtime contract -> exact material JS / separate pthread worker.js / WASM.
- manifest/metadata/hash gates require the separate generated worker.
- outer first-party Worker imports `yaneuraou.material.js` / `YaneuraOu_Material`.
- Corresponding Source evidence also keeps upstream `script/wasm_build.js` and upstream WASM workflow.

No Domain Model, Repository, LocalStorage, Backup/Restore, KIF, Replay, KeyPosition, Evaluation Graph, Candidate, Reflection or export contract is intentionally changed.

## 7. Local preflight status for Run #6 patch

Before GitHub execution, the Run #6 patch must pass local non-Real verification. Real USI/E2E are intentionally **not** claimed by local placeholder assets. Final counts are recorded in the patch verification report generated after packaging.

## 8. Formal Completion status

Still **NOT_FORMAL**. Run #6 must prove at minimum:

1. official exact source checkout;
2. fixed 3.1.43 toolchain install/mapping;
3. upstream material build success;
4. measured JS/worker/WASM hashes;
5. Real WASM load;
6. Real `usi / usiok`;
7. Real `isready / readyok`;
8. Real cp/mate/PV/depth/nodes/time/bestmove/stop/quit checks;
9. Real cancel/re-analysis;
10. Real Sample KIF full-ply application E2E;
11. Real Good/Bad Candidate and Graph/Replay/STEP4 flow;
12. existing automated/static/browser/visual/fallback regression suites;
13. license audit + Corresponding Source plan;
14. final Source of Truth audit;
15. Formal candidate ZIP + separate-folder unpacked re-verification.

ReflectionLocal or Mock results cannot satisfy these items.

## 9. Device/hosting status

- CI desktop browser: Run #5 established cross-origin-isolated browser prerequisites, but Real engine runtime failed.
- GitHub Pages Real pthread deployment: not yet Formal-proven.
- physical iPhone: **NOT TESTED**.
- battery/thermal performance: **NOT MEASURED**.
- smartphone optimization: not part of Run #6 toolchain correction.

## 10. License/distribution status

- Existing Application LICENSE: unchanged.
- Personal use of an accepted Real artifact: pending Run #6 Real evidence.
- Public Real-engine distribution: **NOT READY**.
- Commercial Real-engine distribution: **NOT READY**.
- Corresponding Source plan: documented and extended with upstream WASM workflow/build script evidence.
- **LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION** unless unresolved obligations/combined-work questions are conclusively settled.

## 11. Naming rule

Until all hard gates pass, no package may be named as the formal `Shogi-Reflection-Ver1.8.3.zip`. Run #6 work remains a NOT-FORMAL Build Bridge candidate.

## Run #6 evidence and Run #7 status — 2026-08-11

Run #6 did not reach a Real Artifact Gate. The pinned upstream 3.1.43 packaging path ended with `file not found: .../yaneuraou.material.js`, leaving Real USI and Real Application E2E as NOT_RUN because no accepted WASM asset existed.

Run #7 is prepared to retry with the exact upstream Emscripten Docker image and deterministic split clean/build execution. This report does **not** claim Run #7 success in advance. Formal Completion remains blocked until measured Real artifacts, Real USI, Real E2E, license/source-distribution evidence, and final ZIP re-verification pass.

## Run #7 measured result / Run #8 status — 2026-08-11

Run #7 crossed the compiler/build threshold: the exact pinned V9.00 source, upstream-compatible `emscripten/emsdk:3.1.43` Docker image and official MATERIAL settings produced JS, a separate pthread worker and WASM with make exit `0` and measured SHA-256 values.

Run #7 did **not** reach Real USI because the artifact gate had a command-field comparison defect. After correcting that defect in analysis, direct inspection of the measured Run #7 WASM showed a more fundamental runtime prerequisite failure: no `usi_command` export exists, while pinned `wasm_pre.js` calls that name. Source audit found the legacy wrapper inside `#if 0`; the active V9.00 USI refactor uses a private member dispatcher and a non-blocking Emscripten loop.

Run #8 is therefore prepared with an explicit, documented two-file source bridge patch. It keeps the official commit fixed, records the patch/diff/hash, packages modified Corresponding Source and rejects the binary unless the resulting WASM actually exports `usi_command` before Real USI testing.

Formal status remains **NOT-FORMAL**. No claim of Real USI, Real analysis or Real E2E success is made until GitHub Actions Run #8 measures it.
