# ENGINE BUILD INCIDENT 002 — Emscripten pthread Worker packaging

Date: 2026-08-11
Run: Build pinned YaneuraOu WASM #2
Status: ROOT CAUSE CONFIRMED; BUILD BRIDGE CORRECTED

## What happened

The second real GitHub Actions run executed the YaneuraOu MATERIAL/WASM compile for about 1 minute 45 seconds. The upstream `make` command completed and returned to the source directory, but the first-party Build Bridge then failed with:

```text
ERROR: expected exactly one generated pthread worker; found 0
```

Because the bridge stopped before copying/hashing the outputs, the Real USI and Real Application E2E gates correctly remained `NOT_RUN_REAL_WASM_ASSET_UNAVAILABLE`.

## Confirmed facts

### YaneuraOu pinned Makefile

Pinned YaneuraOu V9.00 commit:

`a5ee2786c0030edc7d4a1cdfe94b04dffec55493`

The official Makefile uses pthreads for the `em++` path and defines the WASM output target as `yaneuraou.js`; the matching `.wasm` is emitted by Emscripten. It does not define a separate YaneuraOu pthread worker target.

Primary source:

- https://github.com/yaneurao/YaneuraOu/blob/a5ee2786c0030edc7d4a1cdfe94b04dffec55493/source/Makefile

### Emscripten pinned toolchain behavior

Emscripten's official ChangeLog states that as of 3.1.68 pthread programs no longer generate a separate `.worker.js`; the file had already become redundant in 3.1.58. The pinned compiler is 4.0.15, so **zero separate pthread worker files is the expected result**.

Primary source:

- https://github.com/emscripten-core/emscripten/blob/4.0.15/ChangeLog.md

The Emscripten 4.0.15 pthread implementation sets the pthread worker script to the main generated JavaScript (`TARGET_JS_NAME`) for non-Wasm-ESM output, and creates Web Workers from that main script URL.

Primary source:

- https://github.com/emscripten-core/emscripten/blob/4.0.15/src/lib/libpthread.js

## Cause

The first Ver.1.8.3 Build Bridge incorrectly encoded an **obsolete Emscripten artifact assumption**:

```text
pthread enabled => exactly one generated yaneuraou*.worker.js
```

That assumption is false for Emscripten 4.0.15.

The YaneuraOu compile itself was not shown to have failed in Run #2. The first-party post-build artifact rule failed after the compile because it expected a file that the pinned Emscripten version intentionally does not create.

## Adoption decision

Keep:

- YaneuraOu V9.00 exact commit;
- Emscripten 4.0.15;
- MATERIAL_LEVEL=1;
- TARGET_CPU=WASM;
- COMPILER=em++;
- pthread configuration;
- existing `BrowserWorkerUsiTransport -> YaneuraOuWasmWorkerBootstrap -> YaneuraOu` architecture.

Change only the first-party artifact model:

1. `yaneuraou.js` = required generated engine JS;
2. `yaneuraou.wasm` = required generated WASM;
3. separate generated pthread `.worker.js` = **must be absent for pinned Emscripten 4.0.15**;
4. `YaneuraOuWasmWorkerBootstrap.js` = Shogi Reflection's application-level Worker boundary and is hashed separately;
5. metadata records `pthreadWorkerPackaging=MAIN_JS_SELF_WORKER` and `generatedPthreadWorkerCount=0`;
6. `workerFile` / `workerSha256` remain `null` instead of inventing a nonexistent generated file.

## Why Emscripten is not downgraded

Downgrading solely to recover an obsolete `.worker.js` artifact would make the build conform to our earlier assumption rather than conforming our bridge to the pinned toolchain's real behavior. That is contrary to the Source-of-Truth rule.

## Architecture impact

No Domain Model, Repository, Storage, Replay, Graph, Candidate, or Reflection flow is changed.

The outer application Worker remains:

```text
BrowserWorkerUsiTransport
  -> YaneuraOuWasmWorkerBootstrap.js
     -> yaneuraou.js
        -> Emscripten pthread workers (main-JS self-worker packaging)
        -> yaneuraou.wasm
```

## License impact

No new third-party component is introduced. The generated JS still contains Emscripten/YaneuraOu-derived runtime code and remains part of the existing post-build license/corresponding-source audit. The absence of a separate `.worker.js` does not relax distribution obligations.

## Next gate

Run GitHub Actions again with the corrected artifact model. Only the next run can establish whether:

- JS/WASM copy and SHA-256 succeed;
- the actual browser can initialize the pthread runtime;
- Real USI succeeds;
- Real Application E2E succeeds.
