# Shogi Reflection Ver.1.8.3 — Run #12 Function-Pointer Diagnostic Patch

Status: DIAGNOSTIC ONLY — NOT FORMAL

Run #11 measured a Real Browser runtime failure in the Emscripten pthread workers:

`RuntimeError: function signature mismatch`

Run #12 keeps the fixed YaneuraOu V9.00 commit, Emscripten 3.1.43,
MATERIAL_LEVEL=1, the documented USI source bridge, and existing app architecture.

It adds only diagnostic compiler flags through Emscripten's EMCC_CFLAGS:

`-sASSERTIONS=2 -g3 -Wcast-function-type`

The diagnostic artifact is explicitly rejected by Formal Completion even if
protocol behavior improves. `EMULATE_FUNCTION_POINTER_CASTS` is NOT enabled.

Local pre-delivery verification:
- Automated Test: 713 / 713 PASS
- Static Verification: 146 / 146 PASS
- Missing Import: 0
- Root workflow YAML parse: PASS
- Standalone workflow YAML parse: PASS
- Shell/Node syntax checks: PASS

Apply this ZIP to the `100challenge` repository root, overwrite same-name files,
commit, and push. Do not delete `Shogi-Reflection-Ver1.8.3`.
