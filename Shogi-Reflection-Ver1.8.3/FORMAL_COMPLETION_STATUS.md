# Shogi Reflection Ver.1.8.3 — FORMAL COMPLETION STATUS

Date: 2026-08-11
Verdict: **NOT_FORMAL**

**FORMAL COMPLETION NOT ACHIEVED**

## Achieved engineering gates

- YaneuraOu V9.00 exact commit fixed.
- MATERIAL evaluation only; external NNUE/水匠 weights excluded.
- GitHub Actions Build Bridge runs and preserves failure evidence.
- Run #3–#5 proved official-source Real artifact generation/hash path under the prior bridge.
- Run #5 browser prerequisites reached `crossOriginIsolated=true` and SharedArrayBuffer available.
- Existing Automated/Static/Browser/Visual/ReflectionLocal regressions remain separated from Real evidence.
- Corresponding Source / license / distribution readiness are explicit gates.

## Run #5 measured failure

- Historical toolchain: Emscripten 4.0.15.
- Real USI: FAILED before `usiok`.
- Repeated runtime error: `RuntimeError: function signature mismatch`.
- Real application E2E: FAILED and correctly fell back to ReflectionLocal.

No fallback result is counted as Real evidence.

## Run #6 correction prepared

The exact pinned YaneuraOu source's own WASM workflow selects Ubuntu 22.04 and `emscripten/emsdk:3.1.43`. Its `script/wasm_build.js material` profile selects MATERIAL_LEVEL=1 / `YaneuraOu_Material` / initial memory 92274688 and expects:

- `yaneuraou.material.js`
- `yaneuraou.material.worker.js`
- `yaneuraou.material.wasm`

Run #6 aligns the Build Bridge to that path and hash-binds all three generated assets plus the first-party outer Worker bootstrap.

## Hard gates still unmet

- Run #6 official-profile Build measured success.
- Run #6 JS / generated worker / WASM hashes and Build Metadata.
- Real WASM load / YaneuraOu initialize.
- Real `usi -> usiok`, `isready -> readyok`.
- Real cp/mate/PV/MultiPV/depth/nodes/time/bestmove/stop/quit.
- Real Cancel / Re-analysis.
- Real Sample KIF full-ply Good/Bad/Graph/Replay/STEP4 E2E.
- exact-artifact license/Corresponding Source distribution decision.
- Formal candidate ZIP and unpacked ZIP re-verification.

Physical iPhone, battery and thermal remain unverified/unmeasured.

Formal package name **must not** be used until all hard gates pass.
