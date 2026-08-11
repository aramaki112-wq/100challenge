# Shogi Reflection Ver.1.8.3 — Run #10 Patch

## Run #9 measured result

- Real YaneuraOu MATERIAL WASM build: succeeded
- `usi_command` WebAssembly export: measured
- Corresponding Source packaging: stopped before Real USI/E2E
- Cause: Git diff object-ID abbreviation width differed between build evidence and packaging evidence

## Run #10 correction

The Corresponding Source packager now generates the reviewed working-tree diff with:

```bash
git diff --binary --abbrev=7
```

The following gates remain unchanged and fail-closed:

- reviewed patch SHA-256
- `git diff --check`
- modified-file allowlist
- byte-for-byte `cmp`
- fixed upstream commit
- source-modification manifest

No YaneuraOu source or engine behavior is changed by Run #10.

## Local verification before delivery

- Automated Test: 710 / 710 PASS
- Static Verification: 146 / 146 PASS
- Missing Import: 0
- Browser Test: 154 / 154 PASS
- Visual Test: 24 / 24 PASS
- ReflectionLocal Fallback: 16 / 16 PASS
- shell syntax: PASS

## Formal status

NOT FORMAL.

Run #10 must still execute Real USI, Real Application E2E, remaining Formal Gates, and ZIP re-verification.
