# Shogi Reflection Ver.1.8.4 PWA — Run A5-E1 Retry A

## Why Retry A exists
GitHub Actions Run A5-E1 #1 stopped before the YaneuraOu build.
Automated test 283 assumed that the GitHub repository checkout already contained the Run36 measured Formal runtime.
The repository correctly carries the distribution-safe `NOT_BUILT_IN_CURRENT_VERIFICATION_ENVIRONMENT` manifest instead.

## Retry A changes
1. Candidate isolation test now accepts either the repository NOT_BUILT manifest or a packaged Formal manifest.
2. Candidate build fingerprints the exact checked-in `engine/yaneuraou` area and `ENGINE_BUILD_METADATA.json` before and after the build, instead of assuming four Formal runtime binaries are present.
3. Workflow creates `ios-real-engine-gate/evidence` before Docker image evidence is written.
4. PTHREAD_POOL_SIZE candidate itself is unchanged: 32 -> 1 only.

## Unchanged
- YaneuraOu V9.00
- commit a5ee2786c0030edc7d4a1cdfe94b04dffec55493
- Emscripten 3.1.43
- MATERIAL / MATERIAL_LEVEL=1
- INITIAL_MEMORY=92274688
- STACK_SIZE=67108864
- SMARTPHONE_SAFE Threads=1
- existing production application behavior
- Run36 packaged Formal runtime

## Apply
Extract this ZIP over the existing `100challenge` repository root and commit/push the changed files.
Then run GitHub Actions workflow `YaneuraOu iPhone Pool1 Candidate` again.
