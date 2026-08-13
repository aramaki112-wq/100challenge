# Run #36 — Final Formal Completion / Release Candidate Gate

## Purpose

Run #36 does not add application features. It closes the final release-evidence gap after the successful non-diagnostic Formal Build Profile candidate and the successful Post-ZIP Standalone Package Gate.

The previous successful workflow intentionally deleted its internal candidate ZIP and did not upload the Formal runtime binaries as a reusable artifact. Therefore Run #36 must **not** substitute the older diagnostic WASM. It rebuilds the exact non-diagnostic profile and accepts it only if all four runtime SHA-256 values match `RUN36_FORMAL_RELEASE_LOCK.json` byte-for-byte.

## Exit criteria

A package may be named `Shogi-Reflection-Ver1.8.3.zip` only when all of the following pass in one Run #36 execution:

1. Fresh YaneuraOu V9.00 build from commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`.
2. Emscripten `3.1.43`; no diagnostic flags.
3. Exact match to the locked JS / WASM / pthread Worker / first-party Worker bootstrap SHA-256 values.
4. Run #30 Real runtime/application gates pass.
5. Internal ZIP extraction gate passes: Automated Tests, Static Verification, Missing Import = 0, unexpected Baseline deletion = 0, metadata/hash consistency.
6. Corresponding Source, both documented source patches, YaneuraOu license, Emscripten license and provenance evidence are present.
7. Run #36 finalizer records technical Formal Completion while keeping Public/Commercial Distribution as not approved pending legal review.
8. Final `Shogi-Reflection-Ver1.8.3.zip` is created, extracted to a new directory, and re-verified.
9. Final ZIP SHA-256 is emitted next to the ZIP.

## Formal scope

`FORMAL TECHNICAL RELEASE` means the exact package is technically complete for the verified personal-use scope. It does **not** mean legal approval for public or commercial distribution.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION.**

Physical iPhone Safari, battery and thermal behavior remain separately unverified/unmeasured and are not silently converted into passed gates.

## Workflow roles after Run #36 patch

- `Legacy Diagnostic YaneuraOu WASM (non-formal)`: manual diagnostic evidence only. A red Formal gate is expected and is not a release failure.
- `YaneuraOu Formal Build Profile Candidate`: manual reproduction of the Run #30 / Run #35 technical candidate path.
- `YaneuraOu Final Formal Release`: the only workflow permitted to issue the formally named `Shogi-Reflection-Ver1.8.3.zip`.
