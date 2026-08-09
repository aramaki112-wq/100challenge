# Ver.1.8 Formal Completion Status

Date: 2026-08-09

## Verdict

**FORMAL COMPLETION NOT ACHIEVED**

ユーザー指定の正式完成条件のうち、次が未達です。

- Official YaneuraOu Sourceからのactual WASM Build
- Emscripten Versionの実測記録
- Generated JS/WASM/Worker SHA-256
- Real YaneuraOu `usi -> usiok -> isready -> readyok` Browser E2E
- Real YaneuraOu short / normal / long KIF E2E
- Real YaneuraOu Evaluation sanity / Best Move / PV / Candidate E2E
- Real YaneuraOu bundleに対する最終Distribution License Gate

## Cause

Current verification environmentに`em++` / `emcc` / emsdkが存在せず、official-source Emscripten buildを実行できないためです。

## What is complete

- YaneuraOu V9.00 exact commit / MATERIAL_LEVEL=1 / WASM build targetの固定
- Build/finalize scripts
- YaneuraOuWasmAdapter / Worker bootstrap / provider gate
- ReflectionLocalEngine明示Fallback
- USI parser/adapter strengthening
- Good Candidate max5 + Bad Candidate max5
- Best-vs-Actual / PV UI
- Candidate→existing Replay→Board Scroll
- Candidate→existing KeyPosition
- Sample KIF
- 390px Browser/Visual verification
- Static/Missing Import audit
- License/component documentation

## Release Naming Decision

この状態を`Ver.1.8正式完成`とは呼びません。配布Artifactは**Integration Candidate**として扱います。
