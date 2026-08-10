# ENGINE BUILD INCIDENT 004 — Runtime WASM Base URL

## What happened

GitHub Actions Run #4 completed the pinned official-source MATERIAL WASM build, hashing, browser setup, regression suites, and invoked both Real USI and Real Application E2E. The Real engine then aborted before `usiok`.

Observed browser error:

`WebAssembly.instantiate(): expected magic word 00 61 73 6d, found 3c 21 44 4f @+0`

The first four returned bytes decode to `<!DO`, proving the runtime fetched an HTML response instead of the measured WASM binary.

## Confirmed cause

The official generated Emscripten 4.0.15 JavaScript derives its worker-side script directory from `WorkerGlobalScope.location` and then requests `yaneuraou.wasm` from that directory. The application bootstrap was at the application root while `yaneuraou.wasm` was under `engine/yaneuraou/`. The `locateFile` object property passed by the bootstrap was not present in the Closure-generated runtime path and therefore did not redirect the WASM request.

## Decision

Do not modify the generated YaneuraOu JS/WASM and do not create an untracked duplicate WASM at the application root.

Instead, the reproducible Build Bridge copies the application bootstrap into `engine/yaneuraou/` and the manifest points to that measured runtime copy. This places bootstrap, generated JS, and generated WASM in one directory. It also preserves Emscripten 4.0.15 main-JS pthread self-worker behavior because spawned `em-pthread` workers re-enter the same co-located bootstrap.

## Traceability

The runtime bootstrap copy is SHA-256 bound in `ENGINE_BUILD_METADATA.json`, `engine-manifest.json`, and the Real Artifact Gate. The source template remains `YaneuraOuWasmWorkerBootstrap.js` at the application root.

## Static verification incident found in the same run

Run #4 also showed that eleven Japanese operation-manual baseline filenames had become mojibake filenames in the Windows checkout. The contents were not intentionally removed. Run #5 restores the exact baseline filenames/content from the Ver.1.8.2 Source of Truth; the mojibake duplicates are not treated as substitutes for baseline preservation.

## Formal status

NOT FORMAL until Real USI, Real E2E, all static checks, license/source-distribution evidence, and final ZIP re-verification pass.
