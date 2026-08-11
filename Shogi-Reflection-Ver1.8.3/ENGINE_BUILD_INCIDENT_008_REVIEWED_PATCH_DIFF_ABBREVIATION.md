# ENGINE BUILD INCIDENT 008 — Reviewed Patch Diff Abbreviation Mismatch

## Status

Resolved in the Run #9 Build Bridge patch.  
This incident is **not** a YaneuraOu compilation failure and does **not** prove Real USI success.

## What happened

GitHub Actions Run #8 stopped before compilation with:

```text
ERROR: applied YaneuraOu source diff does not exactly match the reviewed patch
```

The documented source patch had already passed `git apply --check` and had been applied. The modified source file set was also limited to the two reviewed files.

## Measured difference

The uploaded Run #8 evidence showed that the reviewed patch and the applied-source diff had identical hunks and content changes.

The only byte-level difference was the abbreviated blob object names on `index` lines:

```text
reviewed patch:
index e77eb04..f3566d0
index f6a8d29..90e2920

measured CI diff:
index e77eb043..f3566d02
index f6a8d299..90e29209
```

Therefore the safety gate rejected a **formatting difference in Git's abbreviated object IDs**, not a different YaneuraOu source modification.

## Cause

The reviewed patch was produced with 7-character abbreviated object IDs. The Git installation used by the GitHub Actions runner emitted a longer unique abbreviation for the same blob IDs.

Git provides `--abbrev=<n>` to control the displayed abbreviation width. Because this project intentionally keeps the reviewed patch itself as a byte-for-byte evidence artifact, the evidence-generation command must use the same deterministic abbreviation representation.

## Correction

Run #9 changes only the evidence-generation command:

```bash
git -C "$SOURCE_ROOT" diff --binary --abbrev=7 \
  > "$RECORD_DIR/yaneuraou-source-modifications.patch"
```

The following safeguards remain unchanged:

- exact official YaneuraOu commit verification;
- clean checkout required before patching;
- patch SHA-256 recorded;
- `git apply --check`;
- `git apply`;
- `git diff --check`;
- modified source file set restricted to the two reviewed files;
- byte-for-byte comparison with the reviewed patch after canonical 7-digit diff formatting;
- full resulting diff preserved as build evidence;
- Corresponding Source packaging;
- Real WASM / Real USI / Real E2E remain separate gates.

## Adoption decision

**ADOPT** the canonical `--abbrev=7` evidence format.

This does not weaken the source-modification gate. It removes a Git-version/configuration-dependent presentation difference while preserving the exact reviewed source changes.

## Formal status

**NOT FORMAL.**

Run #9 must still prove the Real WASM build, physical `usi_command` export, Real Browser USI handshake, real analysis, Real application E2E, and all remaining Formal Completion Gates.
