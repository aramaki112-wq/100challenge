# Run A5-E2 — iPhone Pool1 + Stack 8 MiB Candidate

This gate is a **technical personal-use experiment** for iPhone Safari / Home Screen App behavior.
It does not replace the Run #36 Formal runtime and it is not a distribution release.

## Controlled change

A5-E1 already changed `PTHREAD_POOL_SIZE` from 32 to 1. A5-E2 keeps Pool1 and changes one additional resource setting only:

- `STACK_SIZE`: 67,108,864 bytes (64 MiB) -> 8,388,608 bytes (8 MiB)

Held constant:

- YaneuraOu V9.00 / commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- MATERIAL_LEVEL=1
- Emscripten 3.1.43
- PTHREAD_POOL_SIZE=1
- INITIAL_MEMORY=92,274,688 bytes
- MAXIMUM_MEMORY=4,294,967,296 bytes
- memory growth enabled
- SMARTPHONE_SAFE Threads=1

## Reason

A5-E1 Pool1 still returned the iPhone Home Screen App to STEP1 when Real YaneuraOu analysis began. In normal Safari the page stayed alive, but Real analysis did not finish inside the application time budget and the app switched to ReflectionLocal fallback. A5-E2 isolates whether the 64 MiB stack allocation is a major resource contributor.

## Status

`NOT_FORMAL` / `TECHNICAL_TEST_ONLY`.
