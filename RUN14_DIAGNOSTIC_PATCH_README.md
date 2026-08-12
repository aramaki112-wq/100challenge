# Shogi Reflection Ver.1.8.3 — Run #14 Diagnostic Gate Semantics Patch

## Run #13 measured result

Run #13 successfully produced a real diagnostic YaneuraOu build with:
- `diagnosticBuild=true`
- `measured=true`
- `status=DIAGNOSTIC_BUILD_NOT_FORMAL`
- Emscripten 3.1.43 / LLVM provenance
- JS / WASM / pthread worker / runtime bootstrap SHA-256
- physical `usi_command` export

The workflow stopped before the Real USI browser diagnostic because the diagnostic
integrity script incorrectly required `metadata.measured === false`.

## Correction

The diagnostic integrity gate now requires:
- `metadata.diagnosticBuild === true`
- `metadata.measured === true`
- `metadata.status === DIAGNOSTIC_BUILD_NOT_FORMAL`

This preserves the distinction:
- `measured=true` = the artifact was actually built and hash/provenance evidence exists
- `DIAGNOSTIC_BUILD_NOT_FORMAL` = the artifact is still forbidden from Formal Completion

The normal Formal artifact/completion gates remain unchanged and must still reject
diagnostic builds.

## Local verification

- Automated Test: 716 / 716 PASS
- Static Verification: 146 / 146 PASS
- Missing Import: 0

## Formal status

NOT FORMAL.

Run #14 exists only to allow the diagnostic Real USI browser execution to occur so
the `function signature mismatch` assertion/stack evidence can finally be captured.
