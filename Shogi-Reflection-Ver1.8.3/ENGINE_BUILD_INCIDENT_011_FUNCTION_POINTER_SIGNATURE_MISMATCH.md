# ENGINE BUILD INCIDENT 011 — Pthread Function Pointer Signature Mismatch

## Status

Run #11 measured a Real Browser runtime failure after the pthread main-script URL problem was corrected.

The Real YaneuraOu WASM artifact built successfully, exported `usi_command`, loaded under
`crossOriginIsolated=true` with `SharedArrayBuffer`, and then its nested Emscripten pthread
workers reported:

```text
Uncaught RuntimeError: function signature mismatch
```

The error repeated for the engine worker threads before `usiok`, so Real USI and Real
Application E2E remained fail-closed.

## Interpretation boundary

This incident does **not** prove which YaneuraOu function pointer is invalid.

Emscripten documents this runtime error as a typical symptom of calling a function pointer
with a signature different from the function's real signature. It recommends assertions and
`-Wcast-function-type` for diagnosis, and describes a correctly typed adapter function as the
preferred fix. `EMULATE_FUNCTION_POINTER_CASTS` is diagnostic/workaround territory and has
runtime overhead, so it is not adopted as the production solution here.

## Run #12 diagnostic build

Run #12 intentionally adds:

```text
-sASSERTIONS=2 -g3 -Wcast-function-type
```

through `EMCC_CFLAGS`.

The YaneuraOu fixed commit, MATERIAL profile, documented `usi_command` source bridge,
pthread count, memory settings, and application architecture remain unchanged.

This diagnostic artifact is explicitly blocked from Formal Completion even if Real USI
happens to pass. Its purpose is to obtain a more specific runtime stack/assertion and
compiler warning evidence so the exact source-level adapter/fix can be reviewed before a
new production build.

## Next decision

- If assertions identify a concrete cast/call site, implement the smallest correctly typed adapter.
- If diagnostics remain ambiguous, a separate A/B probe using `EMULATE_FUNCTION_POINTER_CASTS`
  may be used only to confirm the class of defect; it must not be accepted as the final smartphone
  production configuration without a separate performance/architecture decision.
