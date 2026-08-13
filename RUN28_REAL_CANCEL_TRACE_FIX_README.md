# Shogi Reflection Ver.1.8.3 — Run #28 Real Cancel Trace Harness Fix

## Run #27 measured result

Run #27 reached:

- crossOriginIsolated: true
- SharedArrayBuffer: true
- Sample KIF preview: true
- STEP3: true
- Replay 9x9 / 81 squares: true
- analysis status entered ANALYZING: true
- browser page errors: none

It then waited 120 seconds for a traced `go` command and timed out.

## Root cause

The Playwright `page.add_init_script()` source was written as:

`()` => `{ ... }`

That source evaluates to a function object but does not invoke it as an init
script. Therefore:

- `globalThis.__realCancelTrace` was never created
- `Worker.prototype.postMessage` was never wrapped
- the production Real Engine analysis could run, but the gate could not observe
  `usi` / `go` / `stop` / `quit`
- Run #27 timed out before pressing Cancel

This is a verification-harness defect, not measured evidence that production
Cancel failed.

## Run #28 correction

Production code changes: **0**

The init script is now an immediately invoked function expression:

`(() => { ... })();`

The verifier also checks `traceInstalled` immediately after page load and fails
fast if the Worker instrumentation is not active.

## Production contract under test remains unchanged

- BrowserWorkerUsiTransport sends USI commands to its real Worker
- AnalyzeGame / UI cancellation uses Abort + engine cancellation
- UsiEngineAdapter sends `stop`
- dispose sends `quit`
- BrowserWorkerUsiTransport terminates the top-level Worker
- a fresh Real Engine session must complete 153 / 153 on re-analysis

## Formal status

NOT FORMAL.

Run #28 must produce the first measured Real Cancel / stop / quit / terminate /
re-analysis evidence before this runtime gate can be closed.
