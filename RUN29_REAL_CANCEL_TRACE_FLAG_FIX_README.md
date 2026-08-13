# Shogi Reflection Ver.1.8.3 — Run #29 Real Cancel Trace Flag Fix

## Run #28 measured result

Run #28 functionally passed the production Cancel / Re-analysis lifecycle:

- crossOriginIsolated: true
- SharedArrayBuffer: true
- Sample KIF / STEP3 / 81-square Replay: PASS
- Real analysis entered ANALYZING: PASS
- real `go` observed: PASS
- progress before Cancel: 1 / 153
- CANCELLING observed: PASS
- CANCELLED observed: PASS
- Cancel response: 90 ms
- USI `stop`: 1
- USI `quit` after Cancel: 1
- top-level Worker terminate after Cancel: 1
- cancelled partial result not rendered: PASS
- Replay after Cancel: 0 -> 1, PASS
- fresh re-analysis session: PASS
- second `usi`: PASS
- Real re-analysis: COMPLETED
- progress: 153 / 153
- YaneuraOu V9.00 visible: PASS
- ReflectionLocal fallback: false
- Mock: false
- Evaluation Graph: PASS
- Good Candidates: 5
- Bad Candidates: 5
- final USI sessions: 2
- final go count: 158
- final stop count: 1
- final quit count: 2
- final top-level Worker terminate count: 2
- browser page errors: none

The only failing field was:

`traceInstalled: false`

Yet the same trace object successfully recorded `go`, `stop`, `quit`, and
terminate events, proving instrumentation was actually active.

## Root cause

Run #28 added `traceInstalled` to the result schema and final acceptance rule,
but the intended assignment/check after page load was not present in the
delivered verifier.

This is verification bookkeeping only.

## Run #29 correction

Production application changes: **0**

The verifier now sets `traceInstalled` immediately after page load by checking
the actual trace object:

- `globalThis.__realCancelTrace` exists
- `.messages` is an Array
- `.terminateCount` is an integer

If that object is absent, the verifier fails immediately.

No Cancel behavior, USI command, Worker lifecycle, Engine Adapter, Replay,
Candidate, Graph, KIF, Domain, Repository, Storage, Backup/Restore or UI logic
is changed.

## Formal status

NOT FORMAL.

A green Run #29 closes the measured Real Cancel / Re-analysis runtime gate.
Consolidated Formal Completion, license/distribution finalization and final ZIP
extraction/re-test remain later gates.
