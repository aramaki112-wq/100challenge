# Shogi Reflection Ver.1.8.3 — Run #31 Formal Thread Patch Syntax Fix

## Run #30 failure

GitHub Actions stopped at:

`Build non-diagnostic Formal Build Profile candidate`

with exit code **128** before the non-diagnostic compiler build began.

The uploaded artifact contains the pristine pinned YaneuraOu source archive,
but not the later modified-source/build outputs. This places the stop inside
the source-patch application phase.

## Reproduced root cause

The Run #30 Formal thread patch used this hunk header:

`@@ -48,17 +48,19 @@ Thread::Thread(`

but the actual old-side hunk contains **15** lines, not 17.

Local syntax-only reproduction:

- old patch `git apply --numstat`: exit **128**
- old patch diagnostic: `error: corrupt patch at line 36`

This is a malformed Unified Diff, not a YaneuraOu runtime or application
failure.

## Run #31 correction

The hunk header is corrected to:

`@@ -48,15 +48,19 @@ Thread::Thread(`

Corrected Formal thread patch SHA-256:

`de3b26e32d44502cf3d426d6c3fc43394228ebae2253c8cee7fa714af0a61c6d`

The build script's expected hash is updated to the same value.

Run #31 also adds fail-fast syntax evidence before any source modification:

- `git apply --numstat` for the USI bridge patch
- `git apply --numstat` for the thread compatibility patch

so a malformed build patch can no longer be confused with a compiler/runtime
failure.

## Local pre-delivery verification

- old Run #30 patch corruption reproduced: PASS
- old patch exit code 128 reproduced: PASS
- corrected patch parses with `git apply --numstat`: PASS
- corrected numstat: `13	9	source/thread.cpp`
- build shell syntax: PASS
- production application code changed: 0 files

## Next GitHub Actions behavior

The existing `YaneuraOu Formal Build Profile Candidate` workflow is triggered
because files under `formal-build-gate/**` change.

It should now move beyond the source-patch phase and attempt the actual fresh
**non-diagnostic** Emscripten 3.1.43 MATERIAL WASM build.

## Formal status

NOT FORMAL.

The non-diagnostic build and every Real gate must still pass on one exact set
of hashes before the final ZIP gate.
