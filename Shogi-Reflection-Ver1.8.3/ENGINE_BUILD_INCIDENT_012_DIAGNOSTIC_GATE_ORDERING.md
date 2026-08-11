# ENGINE BUILD INCIDENT 012 — Diagnostic Gate Ordering

## Status

Run #12 successfully produced a diagnostic YaneuraOu MATERIAL WASM artifact with:

- Emscripten 3.1.43
- `-sASSERTIONS=2`
- `-g3`
- `-Wcast-function-type`
- measured JS / pthread worker / WASM hashes
- measured `usi_command` export

However, the workflow invoked the **Formal Real Artifact Gate** before the diagnostic
runtime verifier. The Formal gate correctly rejected the artifact because
`diagnosticBuild=true` and `metadata.measured=false`.

That correct fail-closed behavior unintentionally prevented the diagnostic Real USI
browser run, so Run #12 produced no new runtime stack trace for the measured
`function signature mismatch`.

## Run #13 correction

Run #13 separates two concepts:

1. **Diagnostic artifact integrity gate**
   - requires `diagnosticBuild=true`
   - requires the expected diagnostic flags
   - verifies JS / WASM / pthread worker / bootstrap SHA-256 against metadata and manifest
   - verifies the measured `usi_command` export
   - does not mark the artifact Formal

2. **Formal artifact gate**
   - remains unchanged and must reject diagnostic builds

The Real USI verifier receives an explicit one-run environment opt-in:
`YANEURAOU_ALLOW_DIAGNOSTIC_ARTIFACT=1`.

The opt-in is accepted only when `metadata.diagnosticBuild=true`; normal production
runs still require `metadata.measured=true`.

Run #13 also records browser console messages and page errors so Emscripten assertion
output / pthread stack evidence is preserved in `REAL_YANEURAOU_USI_RESULT.json`.

## Boundary

Run #13 is diagnostic-only. Real Application E2E is deliberately not used as a completion
signal, and Formal Completion must remain false regardless of the diagnostic USI outcome.
