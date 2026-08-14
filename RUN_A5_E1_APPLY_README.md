# Run A5-E1 — Apply to 100challenge Root

## What this patch does

Adds a new, isolated GitHub Actions workflow:

`YaneuraOu iPhone Pool1 Candidate`

The workflow rebuilds YaneuraOu V9.00 from the same pinned source/toolchain used by Ver.1.8.3, but changes only:

`PTHREAD_POOL_SIZE=32` -> `PTHREAD_POOL_SIZE=1`

It does not overwrite or re-label the existing Run #36 Formal runtime.

## Apply location

Extract this ZIP directly over the **100challenge repository root**.

The root `.github/workflows/yaneuraou-ios-pool1-candidate.yml` must land at the repository root so GitHub Actions can see it.

## After applying

Commit/push the added files. Then in GitHub Actions run:

`YaneuraOu iPhone Pool1 Candidate`

Expected artifact name:

`yaneuraou-ios-pool1-candidate`

Do not deploy that artifact automatically. Bring the artifact back for hash/metadata inspection and private PWA candidate packaging first.

## Status boundary

`IOS_PTHREAD_POOL1_CANDIDATE_NOT_FORMAL`

Technical personal-use test only. Public/commercial distribution is not approved.
