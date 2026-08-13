# Shogi Reflection Ver.1.8.3 — Run #27 Real Cancel / Re-analysis Gate

## Purpose

Run #27 does not add a new user feature.

It measures the existing production cancellation lifecycle with the verified
Real YaneuraOu WASM runtime:

Real analysis
→ real `go`
→ Cancel UI
→ CANCELLING
→ AbortSignal
→ `AnalyzeGame.cancel()`
→ `engine.cancelAnalysis()`
→ USI `stop`
→ `dispose()`
→ USI `quit`
→ top-level Worker `terminate()`
→ CANCELLED
→ Replay still usable
→ analyze button enabled
→ fresh Real YaneuraOu session
→ full Sample KIF re-analysis
→ COMPLETED 153 / 153

## Production changes

None.

The current production implementation is tested as-is.

## Evidence method

The browser verifier patches only the page's `Worker.prototype.postMessage`
and `Worker.prototype.terminate` before application startup so the test can
record commands sent by `BrowserWorkerUsiTransport` and top-level Worker
termination.

It does not replace the production Worker, Engine Adapter, Transport,
AnalyzeGame, BrowserEngineProvider or UI event handlers.

## Important assertions

- cancellation is requested only after a real `go` command was observed
- `CANCELLING` and `CANCELLED` are observed
- `stop` is sent
- `quit` is sent
- top-level Real Worker is terminated
- Cancel response is measured and must be under 10 seconds in GitHub Actions
- cancelled partial analysis is not rendered as a completed result
- Replay remains usable after cancellation
- re-analysis starts a fresh USI session
- Real YaneuraOu V9.00 completes 153 / 153 positions
- Good/Bad Candidate and Evaluation Graph return
- Mock / ReflectionLocal fallback must not contaminate the evidence

## Formal status

NOT FORMAL.

A green Run #27 closes the production Real Cancel / Re-analysis runtime gate.
License/distribution finalization, consolidated Formal Completion evaluation,
and final candidate ZIP extraction/re-test still remain.
