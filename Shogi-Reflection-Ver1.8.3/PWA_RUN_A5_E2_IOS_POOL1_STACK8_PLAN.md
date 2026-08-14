# PWA Run A5-E2 — iPhone Real Engine Pool1 + Stack8 Plan

## Observation from A5-E1

- Home Screen App: analysis start caused page/session restart and returned to STEP1.
- Normal Safari: analysis entered ANALYZING and the page survived, but Real YaneuraOu did not finish inside the app time budget; 153/153 completed only after switching to ReflectionLocal fallback.
- Therefore Pool32 alone was not the sole cause.

## A5-E2 controlled experiment

Keep A5-E1 Pool1 and change only WASM `STACK_SIZE` from 64 MiB to 8 MiB.

### Fixed
- Engine/version/commit/evaluation/toolchain
- Pool1
- Initial memory 92,274,688 bytes
- SMARTPHONE_SAFE Threads=1

### Changed
- Stack: 67,108,864 -> 8,388,608 bytes

## Device gate

After CI Build + Node USI probe + artifact hash audit + test deployment:

1. normal iPhone Safari: Sample KIF -> STEP3 -> Real analysis
2. iPhone Home Screen App: same operation
3. record whether Real analysis advances, completes, falls back, errors, or reloads

Do not promote the candidate to Formal on device success alone.
