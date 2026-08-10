# Shogi Reflection Ver.1.8.3 Build Bridge — Run #2 correction patch

Apply this patch at the **root of the `100challenge` repository** and overwrite files when asked.

This patch corrects two GitHub Actions findings:

1. Run #1: Windows-origin shell scripts were not executable on the Linux runner.
2. Run #2: the bridge incorrectly required a separate Emscripten pthread `.worker.js` file.

For pinned Emscripten 4.0.15, pthread builds do not generate a separate `.worker.js` artifact. The generated main `yaneuraou.js` is used by Emscripten for pthread worker startup. `YaneuraOuWasmWorkerBootstrap.js` remains Shogi Reflection's outer browser worker bootstrap and is a separate application asset.

The patch intentionally does **not** mark the Formal Completion Gate as passed. A new GitHub Actions run must generate/hash the real JS/WASM assets and complete Real USI / Real E2E evidence.

After overwrite:

1. Review changed files in GitHub Desktop.
2. Commit (example: `fix: Emscripten 4.0.15 pthread worker packaging`).
3. Push to `main`.
4. Wait for `Build pinned YaneuraOu WASM` Run #3.
5. Inspect/send the Actions result before any manual re-run.
