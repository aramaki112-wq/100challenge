# ENGINE BUILD INCIDENT 003 — Static Verification blocked Real runtime evidence

## What happened

GitHub Actions Run #3 built the pinned official-source YaneuraOu V9.00 MATERIAL_LEVEL=1 JavaScript/WASM artifact and passed the Real Artifact Gate, but `npm run check` returned two Static Verification failures. Because Static Verification was inside the same fail-fast workflow step, Real USI and Real application E2E were skipped.

## Confirmed facts

- Official-source YaneuraOu checkout and fixed commit verification succeeded.
- Emscripten 4.0.15 build succeeded.
- `yaneuraou.js` and `yaneuraou.wasm` were generated and hash-bound.
- Real Artifact Gate passed.
- Automated tests were 697/697 PASS in the uploaded Run #3 artifact.
- Static Verification reported Missing Import 0 but two failed checks.
- Real USI/E2E were NOT RUN because the preceding static step stopped normal workflow progression.

## Architecture correction

Static Verification remains a mandatory Formal Gate, but it is now a non-blocking diagnostic step during evidence collection. Its result is always uploaded, and the final enforcement step still fails unless Static Verification reports `Failed checks: 0` and `Missing imports: 0`. This preserves fail-closed Formal Completion while allowing Real Engine evidence to be collected.

The workflow now also records which Source-of-Truth baseline files are absent immediately after GitHub checkout, before Build scripts run. This separates repository/checkout differences from Build-generated changes.

## pthread bootstrap correction

The generated Emscripten 4.0.15 pthread runtime reuses the current Worker script URL. Because Shogi Reflection intentionally uses `YaneuraOuWasmWorkerBootstrap.js` as the outer Worker boundary, spawned pthread workers can execute that bootstrap with worker name `em-pthread`. The bootstrap now detects that context and only imports the generated YaneuraOu glue; it does not install the application USI wrapper or construct a second main-engine instance inside pthread workers.

## Formal status

NOT FORMAL until Real USI, Real E2E, Static Verification, Browser/Visual/Fallback regression, License/Corresponding Source, final integration and ZIP re-verification all pass.
