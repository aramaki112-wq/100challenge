# Run #15 — YaneuraOu Minimal Real USI Harness

Apply this ZIP to the `100challenge` repository root and overwrite same-name
files. Do not delete `Shogi-Reflection-Ver1.8.3`.

This patch intentionally adds a separate GitHub Actions workflow instead of
changing the existing Full Application workflow.

After Push, use the workflow named:

`YaneuraOu Minimal Real USI Harness`

Primary question:

`usi -> usiok ?`

The workflow builds the pinned V9.00 MATERIAL WASM with:

1. the existing reviewed Shogi Reflection USI command bridge; and
2. one candidate Emscripten thread worker-initialization patch.

It then runs only:

- direct Node minimal USI probe;
- cross-origin-isolated Chromium minimal USI probe.

It does NOT run Replay, Candidate, Graph, STEP4, LocalStorage or Full E2E.
Even a green Run #15 is NOT Formal Completion.
