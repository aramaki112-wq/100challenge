# Shogi Reflection Ver.1.8.3 — Run #33 Formal Metadata Absolute Path Fix

## Run #32 measured progress

Run #32 produced a fresh non-diagnostic YaneuraOu V9.00 MATERIAL WASM build.

Measured Formal Build Metadata:

- diagnosticBuild: false
- diagnosticFlags: null
- buildProfile: NON_DIAGNOSTIC_FORMAL_CANDIDATE
- Emscripten: 3.1.43
- MATERIAL_LEVEL: 1
- pthreadPoolSize: 32
- initialMemory: 92274688
- maximumMemory: 4294967296
- stackSize: 67108864
- usi_command export: true
- JS size: 47637 bytes
- WASM size: 679555 bytes
- pthread Worker size: 2930 bytes
- JS SHA-256: `3ba9f967053af62df3a9735c99d3aae25b5c8b21b8eaa0f0c75ebd25f77f8024`
- WASM SHA-256: `1c2a534b652e45682e965a3ecb16e84ad2c787677fe3302f58d7346e902473e7`
- pthread Worker SHA-256: `9cb2d7a0625b41c1771c6f7bd7c5f736d4ee607b036ab34a7d0f09272a250daf`

This proves the non-diagnostic compiler build itself succeeded.

## Run #32 stop point

The build script ended with a Node check equivalent to:

`require('./$APP_DIR/formal-build-gate/FORMAL_BUILD_METADATA.json')`

Inside the build script, `APP_DIR` is argument 2 and the workflow passes it as
an **absolute path** (`$GITHUB_WORKSPACE/$APP_DIR`).

Prepending `./` to that absolute path turns it into a wrong relative module
path. The already-created Formal Build Metadata therefore could not be loaded,
and the build step returned exit code 1 before the later Real gates started.

## Run #33 correction

Production application code changes: **0**

The fragile `require('./absolute/path/...')` check is removed.

The script now passes the exact absolute Metadata path as a Node argument and
reads it with:

`fs.readFileSync(metadataPath, 'utf8')`

It also validates:

- measured = true
- diagnosticBuild = false
- diagnosticFlags = null
- correct non-diagnostic profile
- usi_command export present
- all four runtime SHA-256 values are valid

The self-check is preserved in:

`formal-build-gate/evidence/formal-build-metadata-self-check.txt`

## Local reproduction

- old `./ + absolute path` lookup: reproduced as failure
- new absolute-path JSON read: PASS
- build shell syntax: PASS
- Production code changes: 0

## Next

The existing `YaneuraOu Formal Build Profile Candidate` workflow will run
again automatically because `formal-build-gate/**` changed.

If this blocker is cleared, the same fresh non-diagnostic hashes continue into:

Minimal Search -> Minimal Runtime -> Adapter -> Sample KIF 153/153 ->
Reflection Flow -> Cancel/Re-analysis -> aggregate Formal candidate ->
internal ZIP extraction verification.

## Formal status

NOT FORMAL.

No final `Shogi-Reflection-Ver1.8.3.zip` is issued until the later final ZIP
gate succeeds.
