# Shogi Reflection Ver.1.8.3 — Run #5 → Run #6 Patch

Apply this patch to the `100challenge` repository root. Do **not** delete `Shogi-Reflection-Ver1.8.3`.

## Purpose

Run #5 reached Real Browser execution but failed Real USI with `RuntimeError: function signature mismatch` and correctly fell back to ReflectionLocal.

Inspection of the pinned YaneuraOu V9.00 source revealed that its own official WASM workflow pins Emscripten 3.1.43 and its own `script/wasm_build.js material` profile. Run #6 aligns the Build Bridge to that official upstream build path.

## Expected next evidence

Run #6 must prove, rather than assume:

- official-source material JS / worker.js / WASM generation;
- hashes and metadata;
- Real `usi -> usiok`;
- Real `isready -> readyok`;
- Real analysis / bestmove / PV;
- Real application E2E.

Formal Completion remains fail-closed.
