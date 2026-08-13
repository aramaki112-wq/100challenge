# Shogi Reflection Ver.1.8.3 — Run #32 Formal Toolchain Path Fix

## Run #31 measured progress

The uploaded Run #31 artifact proves that the previous malformed patch problem
is resolved:

- USI bridge patch `git apply --numstat`: PASS
- thread compatibility patch `git apply --numstat`: PASS
- pinned YaneuraOu source patches applied
- modified source status recorded
- pristine source archive generated
- patched source archive generated
- exact combined patch generated
- YaneuraOu GPL-3.0 license evidence copied

The non-diagnostic build output/metadata is not present, so the stop occurs
after source packaging and before successful compiler completion.

## Root cause

The Formal build script called:

`clang --version`

as a bare command.

The official `emscripten/emsdk:3.1.43` Docker image exposes Emscripten frontends
through `/emsdk/upstream/emscripten`, while LLVM/Clang itself is installed
under `/emsdk/upstream/bin`.

The Formal build therefore now records LLVM using the exact pinned SDK path:

`/emsdk/upstream/bin/clang --version`

This is more reproducible than relying on an ambient PATH entry.

## Run #32 improvements

Production application changes: **0**

The Formal build now records:

- effective PATH
- `command -v emcc`
- `command -v em++`
- `command -v node`
- `command -v python3`
- exact `/emsdk/upstream/bin/clang --version`
- emcc version
- em++ version
- Node version
- Python version

The entire Docker build stdout/stderr is also tee'd to:

`formal-build-gate/evidence/formal-docker-build.log`

so any later compiler/linker failure remains in the uploaded Artifact even when
the build exits non-zero.

## Formal status

NOT FORMAL.

Run #32 must still produce a fresh non-diagnostic JS/WASM/pthread Worker and
then pass every Real gate on those exact hashes.
