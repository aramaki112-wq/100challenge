# ENGINE BUILD INCIDENT 013 — Diagnostic measured semantics

## What happened

GitHub Actions Run #13 successfully produced a diagnostic YaneuraOu WASM build and recorded real compiler/toolchain/hash metadata, but the diagnostic integrity gate stopped before Real USI execution.

The failing assertion was:

```text
diagnostic build must remain non-formal measured=false
```

## Confirmed facts

Run #13 `ENGINE_BUILD_METADATA.json` records:

- `diagnosticBuild: true`
- `measured: true`
- `status: DIAGNOSTIC_BUILD_NOT_FORMAL`
- pinned YaneuraOu V9.00 commit
- Emscripten 3.1.43 / LLVM version
- JS / WASM / pthread worker hashes
- `usi_command` export

Therefore `measured=true` means **the artifact was actually built and its provenance was measured**. It does not mean the artifact is eligible for Formal Completion.

Formal readiness is separately blocked by:

- `diagnosticBuild: true`
- `status: DIAGNOSTIC_BUILD_NOT_FORMAL`
- the normal Formal artifact/completion gates

## Cause

The diagnostic integrity script conflated two different concepts:

1. measured build evidence
2. Formal distribution/completion readiness

That made the diagnostic-only artifact fail its own integrity gate before the browser diagnostic could run.

## Run #14 decision

Keep the diagnostic artifact measured and hash-bound:

```text
metadata.measured === true
```

Keep it explicitly non-formal:

```text
metadata.diagnosticBuild === true
metadata.status === DIAGNOSTIC_BUILD_NOT_FORMAL
```

The Formal artifact gate is still expected to reject the diagnostic build.

## Architecture impact

No YaneuraOu source, search, evaluation, MATERIAL logic, USI bridge, Worker bootstrap, or application-domain behavior is changed.

This is a diagnostic-evidence gate correction only.
