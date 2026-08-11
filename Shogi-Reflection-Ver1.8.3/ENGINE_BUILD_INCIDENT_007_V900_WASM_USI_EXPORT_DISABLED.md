# ENGINE_BUILD_INCIDENT_007 — V9.00 WASM USI export disabled in pinned source

Date: 2026-08-11  
Status: **MEASURED RUN #7 FACT / RUN #8 PATCH PREPARED / NOT FORMAL**

## What happened

GitHub Actions Run #7 successfully built the pinned YaneuraOu V9.00 MATERIAL WebAssembly target with make exit code `0` and produced the expected Emscripten 3.1.43 asset set:

- `yaneuraou.material.js`
- `yaneuraou.material.worker.js`
- `yaneuraou.material.wasm`

The Build Bridge then stopped at its own artifact gate because that gate still compared the deterministic bridge command against the upstream packaging command. Direct inspection of the Run #7 WASM uncovered a second, deeper issue that must be fixed before retrying Real USI.

## Confirmed facts

1. Run #7 `make` exit code: `0`.
2. Run #7 generated JS, pthread worker and WASM and measured their SHA-256 values.
3. `source/wasm_pre.js` sends commands through `Module.ccall("usi_command", ...)`.
4. Direct `WebAssembly.Module.exports()` inspection of the Run #7 WASM found 27 exports and **no `usi_command` / `_usi_command` export**.
5. In the pinned V9.00 `source/usi.cpp`, the legacy Emscripten `usi_command` wrapper is located inside a larger `#if 0 ... #endif` disabled section.
6. That disabled wrapper also calls an old `usi_cmdexec(pos, states, cmd)` form, whereas the active V9.00 implementation is the member function `USIEngine::usi_cmdexec(const std::string&)`.
7. `USIEngine::loop()` intentionally does not run the blocking command-input loop when `__EMSCRIPTEN__` is defined.
8. The active YaneuraOu engine entry creates `YaneuraOuEngine` and `USIEngine` as stack objects and then calls `usi.loop()`. Under Emscripten that loop returns, so those objects do not provide a persistent browser command endpoint.
9. Emscripten documents `EMSCRIPTEN_KEEPALIVE` as preserving and exporting a compiled symbol. Therefore simply adding an export flag cannot restore a source function that is disabled before compilation.

## Cause

The fixed V9.00 source and its WASM packaging path are sufficient to produce a valid JS/worker/WASM bundle, but the active source at this commit does not provide the current-API `usi_command` bridge expected by its own `wasm_pre.js` queue.

This is not treated as evidence that YaneuraOu generally cannot run in WebAssembly. It is a compatibility gap between the pinned V9.00 source's current USI refactor and its legacy browser bridge at this exact commit.

## Run #8 adoption decision

Keep the official V9.00 commit as the immutable base and apply one explicit, reviewable source patch:

`patches/yaneuraou-v9.00-wasm-usi-bridge.patch`

The patch changes only:

- `source/usi.h`
- `source/engine/yaneuraou-engine/yaneuraou-search.cpp`

Its responsibilities are limited to:

1. expose a tiny Emscripten-only public dispatcher that delegates to the existing private `USIEngine::usi_cmdexec(const std::string&)`;
2. keep the YaneuraOu engine and USIEngine alive after the Emscripten non-blocking `loop()` returns;
3. export `usi_command(const char*)` with `EMSCRIPTEN_KEEPALIVE` so the existing upstream `wasm_pre.js` queue can call it.

The patch does **not** change MATERIAL evaluation logic, search logic, move generation, evaluation normalization, application Domain Model, Repository, Replay, Graph, KeyPosition or Reflection flow.

## New fail-closed checks

Run #8 must reject the build unless all of the following are true:

- pristine checkout matches the pinned commit before patching;
- `git apply --check` succeeds;
- applied diff exactly matches the reviewed patch;
- modified source file set is exactly the two files above;
- patch SHA-256 is recorded;
- make exits `0`;
- JS / pthread worker / WASM exist;
- the resulting WASM actually exports `usi_command` or `_usi_command`;
- metadata and manifest bind the patch hash and measured export;
- Real USI and Real application E2E subsequently pass for the same WASM hash.

## Corresponding Source / license impact

Run #8 is no longer an **unmodified upstream source build**. Any accepted Real binary is derived from:

**official pinned YaneuraOu V9.00 commit + documented Shogi Reflection WASM USI bridge patch**.

CI therefore preserves both the pristine upstream archive and a deterministic modified-source archive, plus the exact patch and its SHA-256. Public/commercial distribution remains **LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**; this engineering patch does not change that gate or the existing application LICENSE.

## Alternatives considered

- **Change to another YaneuraOu commit:** not adopted without first identifying and auditing an official commit that demonstrably fixes the bridge; “newer” alone is not sufficient.
- **Only add linker/export flags:** not adopted because the Run #7 source function is disabled by preprocessing and therefore absent from the produced module.
- **Rewrite the application around a different engine interface:** not adopted; it would violate the existing Port/Adapter architecture and is unnecessary at this stage.
- **ReflectionLocal fallback:** retained for graceful degradation but never counts as Real Formal evidence.

## Unconfirmed until Run #8

- whether the documented patch compiles under the exact pinned Docker toolchain;
- whether the resulting WASM exports the expected bridge symbol;
- whether `usi -> usiok -> isready -> readyok` succeeds;
- whether search, stop, quit, re-analysis and full application E2E succeed;
- smartphone/iPhone/Safari performance and stability.
