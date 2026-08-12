# Shogi Reflection Ver.1.8.3 — Run #19 Minimal Runtime Gate

## Purpose

Run #18 proved real `position -> go -> info -> bestmove` search.
Run #19 keeps the full Shogi Reflection application out of the test and adds:

1. MultiPV=2 evidence
2. `go infinite -> stop -> bestmove`
3. same-session re-analysis of another position
4. ordinary-search `score mate` evidence
5. `quit` / shutdown evidence

## Source and engine scope

No additional YaneuraOu source change is introduced by Run #19.
The already-measured V9.00 source, documented USI bridge patch and Emscripten
thread-worker initialization candidate remain the build basis from the green
minimal search path.

## Pre-delivery real replay

The Node runtime gate was executed against the existing real MATERIAL WASM
artifact from the successful minimal path.

Measured result:

- status: PASS_MINIMAL_RUNTIME
- MultiPV option: present
- multipv 1: observed
- multipv 2: observed
- stop: returned bestmove
- stop response: measured
- re-analysis: returned info + bestmove
- mate position: `score mate -8` observed with PV
- quit: sent
- errors: none

The browser Run #19 path remains for GitHub Actions to measure. The browser code
has syntax-checked and reuses the cross-origin-isolated Worker runtime that was
already green in Run #18.

## Formal status

NOT FORMAL.
