# ENGINE BUILD INCIDENT 009 — Corresponding Source Diff Abbreviation

## What happened

GitHub Actions Run #9 completed the pinned-source MATERIAL WASM build and measured `usi_command`, but the following Corresponding Source packaging step stopped with:

`ERROR: working-tree source modifications differ from reviewed patch`

## Confirmed facts

The reviewed patch and the measured working-tree diff had identical file changes and hunks. The mismatch was limited to Git's abbreviated blob IDs on `index` lines:

- reviewed evidence: 7 hexadecimal digits
- packaging evidence: 8 hexadecimal digits

The build-stage comparison had already been made deterministic with `git diff --binary --abbrev=7`; the Corresponding Source packager was still using Git's environment-dependent default abbreviation width.

## Decision

Do not weaken the byte-for-byte `cmp` gate. Generate the Corresponding Source working-tree evidence with the same explicit representation:

`git diff --binary --abbrev=7`

Patch SHA-256, `git diff --check`, exact modified-file allowlist, and byte-for-byte review comparison remain required.

## Scope

This changes evidence serialization only. It does not change YaneuraOu source, the reviewed WASM USI bridge patch, engine behavior, evaluation, or build flags.

## Formal status

NOT FORMAL until Real USI, Real Application E2E, license/source-distribution gates, and ZIP re-verification all pass.
