# Shogi Reflection Ver.1.8.3 — Run #7 Patch

Apply this patch to the `100challenge` repository root by overwriting matching files.
Do not delete the existing `Shogi-Reflection-Ver1.8.3` folder.

Then Commit → Push. The root `.github/workflows/build-yaneuraou-wasm.yml` should start Build pinned YaneuraOu WASM #7 automatically.

Run #7 objective:
1. build with exact upstream Emscripten Docker image 3.1.43;
2. capture deterministic make result and Docker digest;
3. require JS + pthread worker + WASM;
4. proceed to Real USI and Real application E2E only after artifact validation.

This patch is NOT a Formal Completion claim.
