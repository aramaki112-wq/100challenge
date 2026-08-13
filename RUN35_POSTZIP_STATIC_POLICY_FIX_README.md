# Shogi Reflection Ver.1.8.3 — Run #35 Post-ZIP Static Policy Fix

## Run #34 exact failure classes

Run #34 reached the extracted standalone ZIP and passed all 717 Automated Tests.

Post-ZIP Static Verification then had two failed checks. Both causes are identified.

### 1. Two Baseline files absent from the standalone ZIP

The Source of Truth baseline contains these transient Python bytecode caches:

- `__pycache__/browser_verify.cpython-313.pyc`
- `__pycache__/real_engine_browser_verify.cpython-313.pyc`

The Formal ZIP packager intentionally excludes `__pycache__` and `.pyc`.

Run #35 allows only these two exact cache artifacts to be absent. Any other
Baseline application/source deletion remains fail-closed.

### 2. Two false-positive imports from Corresponding Source evidence

The generated evidence file

`formal-build-gate/corresponding-source/YANEURAOU_WASM_BUILD.js`

contains template text with:

- `./lib/yaneuraou.module`
- `./yaneuraou.module`

These are not imports executed by the Shogi Reflection application.

The old verifier excluded only a top-level path starting with
`corresponding-source/`. Run #35 treats any `corresponding-source` path segment
as evidence, at any nesting depth, and excludes those evidence JS files from
the application syntax/import graph.

The Corresponding Source files remain inside the ZIP and inventory.

## Fail-closed behavior retained

- any Baseline deletion other than the exact two pyc caches: FAIL
- Application LICENSE change: FAIL
- real application missing import: FAIL
- application JavaScript syntax error: FAIL
- engine hash/metadata mismatch: FAIL
- failed Real runtime/application gate: FAIL

## Better evidence

Run #35 preserves full pre/post-ZIP Static and Syntax results even on failure,
and creates `RUN35_POSTZIP_PACKAGE_GATE_RESULT.json` only after the extracted
ZIP passes Automated Tests, Static Verification, and engine byte/hash metadata
checks.

The final Enforce step requires that explicit result.

## Formal status

NOT FINAL FORMAL.

A green Run #35 closes the standalone Post-ZIP technical package gate. The
final Completion Report / license-distribution consolidation / final named ZIP
gate remains next.
