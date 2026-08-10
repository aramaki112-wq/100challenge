# Run #4 → Run #5 Patch

Apply this patch to the **100challenge repository root**.

1. Keep the existing `Shogi-Reflection-Ver1.8.3` folder.
2. Extract this ZIP.
3. Copy all extracted contents into the `100challenge` root.
4. When Windows asks about same-name files, choose **Replace**.
5. Commit and Push with GitHub Desktop.
6. Wait for `Build pinned YaneuraOu WASM #5`.

Do not rename this patch folder to `Shogi-Reflection-Ver1.8.3` and do not delete the existing app folder.

## What this patch fixes

- Real USI Run #4 fetched HTML (`<!DO`) instead of the measured WASM because Emscripten resolved `yaneuraou.wasm` relative to the outer Worker URL.
- The runtime Worker bootstrap is now copied into `engine/yaneuraou/`, next to `yaneuraou.js` and `yaneuraou.wasm`.
- `engine-manifest.json` points to that co-located, SHA-256-bound runtime bootstrap.
- Real USI verifier launches the manifest Worker URL rather than a hard-coded root Worker URL.
- Eleven exact Japanese operation-manual baseline files are restored under their original filenames. Run #4's mojibake duplicates are not accepted as substitutes for baseline preservation.

Generated YaneuraOu JS/WASM are not patched. The official-source build remains reproducible and hash-bound.

Formal status remains NOT-FORMAL until Run #5 Real USI/E2E and the other formal gates pass.
