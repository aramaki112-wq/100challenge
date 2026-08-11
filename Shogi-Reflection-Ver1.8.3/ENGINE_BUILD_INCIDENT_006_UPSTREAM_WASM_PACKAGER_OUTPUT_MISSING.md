# ENGINE BUILD INCIDENT 006 — Upstream WASM packager output missing

## Status
OPEN FOR RUN #7 VERIFICATION — NOT FORMAL

## What happened
Run #6 aligned the bridge to the pinned YaneuraOu commit's own WASM toolchain generation path:

- YaneuraOu V9.00 / `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- Ubuntu 22.04
- Emscripten 3.1.43
- `node script/wasm_build.js material`

The upstream packager reached its `make`/link stage, but then terminated with:

```text
file not found: .../build/wasm/material/lib/yaneuraou.material.js
```

No Real WASM asset was therefore accepted and Real USI/E2E remained `NOT_RUN_REAL_WASM_ASSET_UNAVAILABLE`.

## Confirmed facts
1. The pinned upstream `script/wasm_build.js` material profile selects `YANEURAOU_ENGINE_MATERIAL`, `YaneuraOu_Material`, `MATERIAL_LEVEL=1`, and `EM_INITIAL_MEMORY_SIZE=92274688`.
2. The pinned upstream workflow uses `emscripten/emsdk:3.1.43` on Ubuntu 22.04.
3. The packager invokes one parallel make command containing both `clean` and `tournament` targets.
4. Its child-process callback resolves regardless of the child error argument, then the script checks whether generated files exist.
5. Run #6 therefore did not preserve a direct `make` exit code as the primary failure evidence; the visible failure was the later missing-file check.

## Cause assessment
The exact lower-level make/link failure is not proven by Run #6 because the upstream wrapper does not propagate the child error. In addition, combining `clean` and `tournament` in one parallel make invocation introduces avoidable nondeterminism for a reproducibility bridge.

Therefore the bridge must not claim that the missing output was caused by a specific compiler defect or by YaneuraOu source code.

## Run #7 adoption decision
Do not modify YaneuraOu source files or Makefile.

Use the exact Emscripten Docker image named by the pinned upstream workflow and preserve the official material settings, but make the build execution deterministic and observable:

1. `make clean`
2. `make -j2 tournament ...` with the same official material edition/export/memory options
3. capture the real make exit code
4. require JS + pthread worker.js + WASM to exist
5. record Docker image ID and RepoDigest
6. only then hash/integrate assets and proceed to Real USI/E2E

This is a Build Bridge execution adaptation, not an engine-source modification.

## Formal status
Run #6 does **not** pass the Formal Completion Gate.
Run #7 must produce measured real artifacts and pass the existing Real gates before any formal claim is made.
