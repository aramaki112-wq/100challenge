# Shogi Reflection Ver.1.8.3 — Run #36 Retry A
## Third-Party Notice Ordering Fix

### Incident

The first `YaneuraOu Final Formal Release` run rebuilt the exact non-diagnostic runtime successfully and reproduced the frozen Run #30 JS/WASM/pthread-worker/bootstrap hashes and sizes. Automated Tests also reached 717/717.

The run stopped during the internal ZIP extraction Static Verification because the production manifest already described a bundled Real YaneuraOu runtime while `THIRD_PARTY_NOTICES.md` still contained the repository-stage `NOT BUNDLED` wording. The resulting single static failure was:

`Third-party notice matches runtime bundling state`

This is a Run #36 workflow ordering defect, not a Real Engine, runtime-hash, source-patch, or Automated Test failure.

### Fix

A fail-closed helper `formal-build-gate/run36_prepare_bundled_notices.py` is added.

After `prepare-formal-runtime.sh` has produced the production candidate manifest, and before the internal ZIP is created, the helper:

1. requires measured Build Metadata;
2. rejects a diagnostic build;
3. requires `engine-manifest.json` to be available and non-diagnostic;
4. requires the pinned YaneuraOu commit to match `RUN36_FORMAL_RELEASE_LOCK.json`;
5. requires all four runtime hashes to match the frozen Run #36 release lock;
6. rewrites `THIRD_PARTY_NOTICES.md` so the extracted candidate truthfully states that the exact-hash Real runtime is bundled;
7. preserves `LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION` and keeps public/commercial distribution NOT READY.

The existing Run #36 finalizer still replaces this pre-final candidate notice with the final technical/personal-use release notice only after the Run #35-equivalent Post-ZIP gate succeeds.

### Files changed

- `.github/workflows/yaneuraou-final-formal-release.yml`
- `Shogi-Reflection-Ver1.8.3/.github/workflows/yaneuraou-final-formal-release.yml`
- `Shogi-Reflection-Ver1.8.3/formal-build-gate/run36_prepare_bundled_notices.py`

### Local verification

- Automated Tests: 717 / 717 PASS
- Static Verification: PASS
- Missing imports: 0
- Unexpected deleted Baseline files: 0
- Failure-artifact Run #36 runtime hashes compared with frozen lock: exact match on all four assets
- Simulated bundled-manifest notice preparation: PASS
- Static Verification after bundled notice preparation: PASS

### Retry

Apply this patch to the current `100challenge` root that already contains Run #36, commit/push, then manually rerun **YaneuraOu Final Formal Release**.
