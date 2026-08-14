# Run A5-E1 — iPhone Real Engine Pool1 Candidate

## Status

`IOS_PTHREAD_POOL1_CANDIDATE_NOT_FORMAL`

This run is a controlled technical experiment for **personal-use iPhone Home Screen App testing only**.
It does **not** replace the Run #36 Formal runtime and does not change public/commercial distribution status.

## Why this experiment exists

The Run #36 runtime passed desktop/browser Real gates, but on the iPhone Home Screen App the page returned to STEP1 immediately after `棋譜を解析する` was pressed. The exact cause is not proven yet.

The first controlled variable is Emscripten's pre-created pthread worker pool:

- Run #36 baseline: `PTHREAD_POOL_SIZE=32`
- Run A5-E1 candidate: `PTHREAD_POOL_SIZE=1`

Application analysis settings remain `SMARTPHONE_SAFE` with `Threads=1`.
`INITIAL_MEMORY=92274688` and `STACK_SIZE=67108864` are intentionally unchanged in this run.

Emscripten documents `PTHREAD_POOL_SIZE` as a pre-created Web Worker pool populated before `main()`.
Reducing 32 -> 1 therefore tests worker-pool pressure without simultaneously changing engine search settings or Wasm memory settings.

## What does not change

- YaneuraOu V9.00
- Source commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- MATERIAL evaluation / `MATERIAL_LEVEL=1`
- Emscripten `3.1.43`
- existing USI bridge patch
- existing thread-worker-init compatibility patch
- `INITIAL_MEMORY=92274688`
- `STACK_SIZE=67108864`
- Run #36 production runtime files and hashes
- license/public-distribution gate

## Build output

GitHub Actions workflow:

`YaneuraOu iPhone Pool1 Candidate`

Artifact:

`yaneuraou-ios-pool1-candidate`

The artifact contains a new candidate JS/WASM/pthread Worker plus exact hashes and source-patch evidence. It is **not a Formal release artifact**.

## Exit Criteria for A5-E1 build stage

1. unchanged app tests pass
2. unchanged static verification passes
3. exact pinned YaneuraOu commit is used
4. exact pinned Emscripten image is used
5. only the new pool-size patch changes `PTHREAD_POOL_SIZE=32` to `1`
6. build log proves `PTHREAD_POOL_SIZE=1`
7. memory/stack settings remain unchanged
8. `usi_command` export remains present
9. Node Real USI runtime probe passes
10. Run #36 Formal runtime files remain untouched
11. artifact is explicitly marked `NOT_FORMAL`

Only after these pass should the candidate be injected into the private PWA deployment for the iPhone A5-E1 device test.
