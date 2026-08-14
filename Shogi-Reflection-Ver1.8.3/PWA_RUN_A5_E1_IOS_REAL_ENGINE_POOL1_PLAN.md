# PWA Run A5-E1 — iPhone Real Engine Pool1 Isolation Plan

## Purpose

Isolate the iPhone Home Screen App reload observed immediately after starting Real YaneuraOu analysis.

## Observed Gate Failure

- Home Screen launch: PASS
- Standalone UI: PASS
- Sample KIF import/preview: PASS
- STEP3 reached: PASS
- Real Engine analysis start: **page reloaded / returned to STEP1**

This is treated as an iPhone Real Engine Gate failure, not as PWA Phase completion.

## Controlled Change

`PTHREAD_POOL_SIZE: 32 -> 1`

No memory, stack, search-depth, hash, MultiPV, source commit, evaluation model, or PWA navigation changes are mixed into this experiment.

## Risk

Pool size 1 may still fail if the actual cause is Wasm memory pressure, WebKit thread behavior, a worker lifecycle fault, or another iOS-specific limitation. A pass supports—but does not by itself prove—the worker-pool hypothesis.

## Test after build artifact is produced

1. create a private deploy kit from A4-W3 + Pool1 candidate runtime
2. preserve Cloudflare Access / COOP / COEP
3. verify candidate runtime hashes before deploy
4. deploy privately
5. launch from iPhone Home Screen
6. import same 152-ply sample
7. reach STEP3
8. start analysis once
9. observe whether page remains alive and progresses
10. if complete, check graph / Good 5 / Bad 5 / Candidate Jump

## Exit Criteria

A5-E1 passes only if the iPhone Home Screen App remains alive and Real analysis begins and completes with the candidate runtime. If it still reloads, do not broaden the refactor; proceed to the next single-variable resource experiment.
