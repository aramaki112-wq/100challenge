# ENGINE BUILD INCIDENT 005 — Official WASM Toolchain Alignment

## Status

Resolved in the Run #6 Build Bridge candidate. Formal Completion is **not** asserted until GitHub Actions produces new Real USI / Real E2E evidence.

## What happened

Run #5 successfully built and hash-bound the YaneuraOu V9.00 MATERIAL WebAssembly assets with Emscripten 4.0.15, and the browser environment satisfied `crossOriginIsolated` / `SharedArrayBuffer`. However the Real USI verifier failed before `usiok` with repeated browser runtime errors including:

`RuntimeError: function signature mismatch`

The application then correctly degraded to `Shogi Reflection Local Engine` instead of treating the Real Engine as usable.

## Confirmed facts

The pinned YaneuraOu source at commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493` contains its own official WebAssembly workflow and packaging script.

The upstream workflow explicitly selects:

- GitHub Actions runner: `ubuntu-22.04`
- Emscripten SDK image/version: `emscripten/emsdk:3.1.43`
- build entry point: `node script/wasm_build.js <edition>`

The upstream `material` profile explicitly selects:

- `YANEURAOU_ENGINE_MATERIAL`
- `MATERIAL_LEVEL=1`
- `EM_EXPORT_NAME=YaneuraOu_Material`
- `EM_INITIAL_MEMORY_SIZE=92274688`
- output set: `yaneuraou.material.js`, `yaneuraou.material.worker.js`, `yaneuraou.material.wasm`

The official emsdk release registry maps Emscripten `3.1.43` to release commit:

`bf3c159888633d232c0507f4c76cc156a43c32dc`

## Root cause decision

The prior Bridge selected Emscripten 4.0.15 because it was a previously considered fixed compiler candidate. That choice was reproducible, but it was **not aligned with the pinned YaneuraOu V9.00 source tree's own WASM build workflow**. Run #5 proves that “compiles successfully” is not sufficient evidence of runtime compatibility.

This incident therefore changes the Build Bridge policy:

> For a pinned upstream engine commit that contains an explicit WASM workflow/toolchain, prefer that pinned upstream toolchain/profile over a newer compiler merely because the newer compiler can build the source.

## Adopted correction

Run #6 aligns the Build Bridge with the pinned source tree:

1. Emscripten `3.1.43`.
2. Official release mapping commit `bf3c159...` verified.
3. GitHub runner changed to `ubuntu-22.04` to match upstream workflow.
4. Upstream `script/wasm_build.js material` is executed directly.
5. The generated `yaneuraou.material.worker.js` is treated as a real required runtime artifact and SHA-256-bound.
6. The application outer Worker remains `YaneuraOuWasmWorkerBootstrap.js` and loads `yaneuraou.material.js` / `YaneuraOu_Material` without modifying the generated upstream artifacts.
7. Real USI and Real E2E remain fail-closed and must be rerun.

## Architecture impact

No Domain Model, Repository, LocalStorage, Backup/Restore, Replay, KeyPosition, Evaluation Graph, Candidate, or Reflection flow is changed.

Only the Engine Build / Runtime Asset boundary is corrected.

## License impact

No application LICENSE change is made. The older Emscripten version does not remove the existing license audit requirements. Generated JS/worker/WASM and Corresponding Source evidence remain separately tracked.

## Formal status

**NOT FORMAL until Run #6 Real Engine evidence passes.**
