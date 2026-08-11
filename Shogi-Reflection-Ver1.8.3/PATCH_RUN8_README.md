# Ver.1.8.3 Build Bridge — Run #8 Patch

Status: **NOT-FORMAL**

## Purpose

Run #7 proved that the pinned YaneuraOu V9.00 commit can be built with the upstream-compatible Emscripten 3.1.43 Docker toolchain and official MATERIAL settings, but the measured WASM did not export the `usi_command` symbol called by the pinned `source/wasm_pre.js` command queue.

Run #8 keeps the exact official V9.00 commit as the immutable source base and applies one explicit, reviewable two-file Emscripten-only bridge patch:

`patches/yaneuraou-v9.00-wasm-usi-bridge.patch`

The patch:

- exposes the current `USIEngine::usi_cmdexec(const std::string&)` through a tiny Emscripten-only public dispatcher;
- keeps `YaneuraOuEngine` / `USIEngine` alive after the non-blocking Emscripten `loop()` returns;
- exports `usi_command(const char*)` with `EMSCRIPTEN_KEEPALIVE`;
- changes no MATERIAL evaluation, search, move generation, Domain, Repository, Replay, Graph, KeyPosition, Reflection or storage logic.

## Fail-closed rules

The CI build must fail unless the source is pristine before patching, the applied diff exactly matches the reviewed patch, only the two approved source files change, the patch hash is recorded, the build succeeds, and the resulting WASM physically exports `usi_command` or `_usi_command`.

Real USI / Real application E2E are still required after build. This patch does not claim those results in advance.

## Apply

Extract this patch ZIP into the `100challenge` repository root and overwrite same-name files. Do not delete `Shogi-Reflection-Ver1.8.3`.

Then Commit -> Push. The root GitHub Actions workflow will start Run #8 automatically.
