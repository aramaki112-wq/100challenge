# Shogi Reflection Ver.1.8.3 — Completion Report

Date: 2026-08-10
Version: **Shogi Reflection Ver.1.8.3 — YaneuraOu WASM Build Bridge**
Formal Completion Verdict: **NOT_FORMAL**

## 1. Result summary

Ver.1.8.3 implements the reproducible Build Bridge and Real-evidence gates requested for YaneuraOu, while preserving the Ver.1.8.2 application architecture. The current sandbox could not obtain/activate Emscripten or clone GitHub from the container network, so **no Real YaneuraOu WASM was built or executed here**. No Mock or ReflectionLocal result is promoted to Real evidence.

Accordingly the output remains a **NOT-FORMAL candidate**. The formal filename `Shogi-Reflection-Ver1.8.3.zip` must not be used yet.

## 2. Implemented

- `.github/workflows/build-yaneuraou-wasm.yml`
- fixed official YaneuraOu V9.00 exact commit gate
- fixed emsdk/Emscripten 4.0.15 target and official release-mapping verification
- clean upstream checkout requirement
- fixed MATERIAL_LEVEL=1 / WASM / em++ build command
- measured compiler/runner provenance capture
- actual generated pthread Worker discovery
- JS/WASM/Worker SHA-256 automation
- `ENGINE_BUILD_METADATA.json` measured/unmeasured distinction
- exact-commit Corresponding Source archive generation by `git archive`
- Build Artifact integration script + Real Artifact Gate
- Real USI verifier separated from application E2E
- Real Application E2E verifier for Sample KIF/full-ply/Good/Bad/Graph/STEP4/Cancel
- Formal Gate requires both Real result files to match current WASM SHA-256
- license gate updated to verify source archive/hash when a Real binary is present
- legacy manifest finalizer made fail-closed; filenames alone cannot enable Real Engine
- existing Browser/Visual/ReflectionLocal regression suites made portable to managed Playwright Chromium in CI
- current app LICENSE preserved unchanged

## 3. Fixed upstream/build target

| Item | Result |
|---|---|
| Engine | YaneuraOu |
| Release | V9.00 |
| Commit | `a5ee2786c0030edc7d4a1cdfe94b04dffec55493` |
| Repository | official `yaneurao/YaneuraOu` |
| Evaluation | MATERIAL |
| MATERIAL Level | 1 |
| Target CPU | WASM |
| Compiler | em++ |
| emsdk target | 4.0.15 |
| expected Emscripten release commit | `b412b6307e541b93dd93f01b61181e15c17302ec` |
| Build host design | GitHub Actions `ubuntu-24.04`; exact hosted image recorded at actual run |
| Docker | not adopted |
| External NNUE / 水匠 weight | not adopted |

Build command:

```text
make -j1 normal TARGET_CPU=WASM COMPILER=em++ YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL MATERIAL_LEVEL=1
```

## 4. Upstream WASM profile recorded, not optimized

Pinned upstream Makefile facts used by the Bridge:

- pthread: enabled
- `PTHREAD_POOL_SIZE=32`
- initial memory: `138,412,032` bytes for selected MATERIAL level
- maximum memory: `4,294,967,296` bytes
- memory growth: enabled
- stack: `67,108,864` bytes
- pre-js: `wasm_pre.js`

These are **reproducibility facts, not smartphone optimization claims**.

## 5. Measured Real Build fields — current result

| Requested item | Current result |
|---|---|
| Build Date | NOT MEASURED — build not executed |
| actual Build OS / runner image | NOT MEASURED |
| actual emcc Version | NOT MEASURED |
| actual em++ Version | NOT MEASURED |
| actual LLVM Version | NOT MEASURED |
| actual Node Version | NOT MEASURED |
| actual Python Version | NOT MEASURED |
| JS filename | NOT GENERATED |
| WASM filename | NOT GENERATED |
| Worker filename | NOT GENERATED |
| JS SHA-256 | NOT AVAILABLE |
| WASM SHA-256 | NOT AVAILABLE |
| Worker SHA-256 | NOT AVAILABLE |

`ENGINE_BUILD_METADATA.json` intentionally keeps these fields null and `measured=false`.

## 6. Real runtime / USI / Application E2E

- Real WASM Load: **NOT RUN**
- Real YaneuraOu Initialize: **NOT RUN**
- `usi / usiok`: **NOT RUN**
- `isready / readyok`: **NOT RUN**
- `usinewgame / position / go / info / bestmove`: **NOT RUN**
- `score cp`: **NOT RUN**
- `score mate`: **NOT RUN**
- depth/nodes/time/PV/MultiPV: **NOT RUN**
- stop/quit: **NOT RUN**
- Initial/material gain/material loss/advantage/disadvantage/mate sanity: **NOT RUN**
- Real Cancel / Re-analysis: **NOT RUN**
- Real Sample KIF full-ply: **NOT RUN**
- Real Good Candidate: **NOT RUN**
- Real Bad Candidate: **NOT RUN**
- Best Evaluation / Actual Evaluation / Difference / PV: **NOT RUN**
- Candidate → Replay / Board Scroll / KeyPosition: **NOT RUN**
- Graph Marker / Graph → STEP4: **NOT RUN**
- FACT / INTERPRETATION / HYPOTHESIS manual-boundary E2E: **NOT RUN**

Evidence files explicitly record this as `NOT_RUN_REAL_WASM_ASSET_UNAVAILABLE`.

## 7. Existing application regression

- Automated Test: **697 / 697 PASS**
- Static Verification: **143 / 143 PASS**, Missing Import **0** at latest pre-report run
- Browser Verification: **154 / 154 PASS**, 390×844
- Visual Verification: **24 / 24 PASS**
- ReflectionLocal Fallback browser verification: **16 / 16 PASS**
- Board Flip: retained
- Fixed 9×9 Board Grid / SVG pieces: retained
- Candidate → Board Scroll: retained
- Replay Scroll Policy: retained
- Evaluation Graph / Graph → Replay / Graph → STEP4: retained
- Backup / Restore / Markdown / Observation Card contracts: unchanged by Ver.1.8.3

### Browser transient observation

During one regression execution, Candidate→KeyPosition registration moved `scrollY` from 3908 to 3925 (17 px), failing the ≤5 px stability check. The immediate repeat passed 154/154, and the final rerun also passed 154/154. Ver.1.8.3 had not changed the application UI flow, so no speculative UI patch was made. Cause remains unconfirmed; if it recurs, investigate browser scroll anchoring/timing as a separate regression rather than silently weakening the check.

## 8. Performance / device

Real YaneuraOu performance is **not measured** because no Real artifact exists in this package.

- WASM/JS/Worker size: not measured
- deployment download: not measured
- load/initialize/isready: not measured
- one position: not measured
- short/Sample/normal/long KIF: not measured
- candidate/graph generation: not isolated with Real engine
- Real cancel response: not measured
- Real observable memory: not measured
- Battery: not measured
- Thermal: not measured
- Physical iPhone: **NOT TESTED**

ReflectionLocal fallback performance exists only as separate fallback evidence and is not used to characterize YaneuraOu.

## 9. Hosting conclusions

### Local development
A test server path is implemented that emits COOP/COEP/CORP and verifies `crossOriginIsolated`/`SharedArrayBuffer` before threaded Real WASM execution.

### Desktop browser
Harness prepared; Real artifact not executed in this sandbox.

### GitHub Pages
**NOT PROVEN for the pinned pthread build.** Emscripten requires SharedArrayBuffer/cross-origin isolation for pthread browser builds. This audit did not establish an official GitHub Pages mechanism for arbitrary COOP/COEP response headers. No Service Worker shim is silently adopted.

### iPhone Safari
WebKit documentation supports the relevant cross-origin-isolated threading capability in modern Safari, but **this specific YaneuraOu build/resource profile has not been physically tested on iPhone**.

### Future installed app
Separate future target; browser results are not inherited automatically.

## 10. License / distribution

- YaneuraOu source: upstream project states GPLv3 project licensing; exact component obligations must follow the actual conveyed artifact.
- MATERIAL_LEVEL=1: built-in source path; no external model weight added.
- Emscripten: build tool/runtime licensing audited separately from YaneuraOu.
- generated JS glue/Worker: must be audited from actual generated artifact; not assumed rights-free.
- Existing Application LICENSE: **unchanged**.
- Corresponding Source plan: exact commit + build scripts/toolchain/options + source archive/hash + notices.

Readiness:

- Personal Use Readiness: **existing app/fallback ready; Real YaneuraOu unavailable in this package**.
- Public Distribution Readiness for a Real YaneuraOu bundle: **NOT READY**.
- Commercial Distribution Readiness for a Real YaneuraOu bundle: **NOT READY**.
- **LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION** of a package conveying the Real engine.

No claim is made that GPL forbids selling, that free distribution automatically satisfies GPL, or that WASM/Worker boundaries automatically determine the legal characterization.

## 11. Formal Completion Gate

Current machine result: **NOT_FORMAL**.

The following hard gates remain unresolved because the Real artifact is absent:

1. official-source Emscripten build success;
2. measured JS/WASM/Worker hashes;
3. Real Browser load;
4. Real USI/evaluation/bestmove/PV/cancel/re-analysis;
5. Real Sample KIF full-ply application E2E;
6. Real Good/Bad Candidate and Graph navigation evidence;
7. binary-specific license/source-distribution review;
8. final Formal candidate ZIP;
9. separate-folder ZIP Real re-verification.

## 12. Naming decision

Because Formal Completion is not achieved, the produced package must use an explicit NOT-FORMAL name:

`Shogi-Reflection-Ver1.8.3-NOT-FORMAL-YaneuraOu-WASM-Build-Bridge.zip`

It must **not** be renamed `Shogi-Reflection-Ver1.8.3.zip` until every hard gate passes.

## 13. Future scope retained, not implemented here

- Evaluation Graph: improve 390px smartphone readability, 0-line/advantage zones/rapid swings/markers/tap details while keeping it a navigation map rather than an information-dense dashboard.
- Long-term analysis: aggregate multiple games/KeyPositions and the user's FACT/INTERPRETATION/HYPOTHESIS/Observation Theme/Rule with Engine reference data to find repeated patterns and form hypotheses. Engine output must not automatically declare the user's weakness.

## 14. NOT-FORMAL ZIP extracted verification

Before final packaging, a provisional NOT-FORMAL ZIP was extracted to a separate folder and tested from extracted files only. Results: Automated 697/697, Static 143/143 with Missing Import 0, Browser 154/154 at 390×844, Visual 24/24, ReflectionLocal fallback 16/16. Real Artifact Gate failed as designed; Real USI/E2E reported Real asset unavailable; Formal Gate remained NOT_FORMAL. The final NOT-FORMAL package is therefore allowed to be distributed as a Build Bridge candidate, but not as a formal Real-Engine completion.
