# Shogi Reflection Ver.1.8.3 — Run #36 Final Formal Release Patch

## Apply location

Extract this patch **directly into the `100challenge` repository root** and overwrite matching files.

Do not apply it inside `Shogi-Reflection-Ver1.8.3/` alone; the repository-root workflow copies are intentionally included.

## What this patch changes

- Adds `YaneuraOu Final Formal Release` GitHub Actions workflow.
- Freezes the successful Run #30 non-diagnostic runtime hashes in `RUN36_FORMAL_RELEASE_LOCK.json`.
- Requires a fresh Run #36 build to reproduce all four hashes byte-for-byte.
- Reuses the already proven Real runtime/application gates and Run #35 standalone Post-ZIP gate.
- Adds final Formal technical release metadata/docs generation.
- Creates the formally named `Shogi-Reflection-Ver1.8.3.zip` only after final extraction re-verification.
- Emits an external ZIP SHA-256 and `RUN36_FINAL_ZIP_GATE_RESULT.json` to bind the exact final ZIP without a self-hash cycle.
- Makes the old Diagnostic workflow manual-only and labels it explicitly as non-formal.
- Makes the Run #30/35 candidate workflow manual-only; it remains available for reproduction/audit.
- Preserves public/commercial distribution as fail-closed pending legal review.

## After applying

1. Commit and push the patch to GitHub.
2. Open **Actions**.
3. Select **YaneuraOu Final Formal Release**.
4. Choose **Run workflow**.
5. Do not run the Legacy Diagnostic workflow for release completion.

## Success condition

The workflow must finish green and the final artifact must be named similar to:

`Shogi-Reflection-Ver1.8.3-FINAL-<run_id>-<attempt>`

Inside that GitHub artifact, confirm these three files exist:

- `Shogi-Reflection-Ver1.8.3.zip`
- `Shogi-Reflection-Ver1.8.3.zip.sha256`
- `RUN36_FINAL_ZIP_GATE_RESULT.json`

The JSON must contain:

- `passed: true`
- `status: PASS_RUN36_FINAL_DISTRIBUTION_ZIP`
- `formalCompletion: true`
- `freshBuildMatchesFrozenRun30Hashes: true`
- `missingImports: 0`
- `unexpectedDeletedBaselineFiles: 0`

## Important boundary

This Run #36 gate is a **technical/personal-use Formal release gate**.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION.**

Physical iPhone Safari, battery and thermal remain outside the passed gate until separately measured.
