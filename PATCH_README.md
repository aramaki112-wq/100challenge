# Run #3 → Run #4 patch

Apply this ZIP to the **100challenge repository root** and overwrite matching files. Do not delete `Shogi-Reflection-Ver1.8.3`.

This patch:

1. lets Static Verification produce/upload diagnostics without blocking Real USI/E2E collection;
2. keeps Static Verification mandatory in the final enforcement step;
3. uploads Static/Syntax/Test/Browser/Visual evidence;
4. records baseline files missing immediately after GitHub checkout;
5. adds the Emscripten `em-pthread` self-worker guard to `YaneuraOuWasmWorkerBootstrap.js`;
6. adds an automated regression test for that guard;
7. documents Incident 003.

After overwrite: Commit → Push → wait for `Build pinned YaneuraOu WASM #4`.
