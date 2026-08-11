# ENGINE BUILD INCIDENT 010 — Pthread Main Script URL Not Supplied

## What happened

GitHub Actions Run #10 successfully produced the pinned YaneuraOu V9.00 MATERIAL
WebAssembly artifacts and verified the physical `usi_command` export.

The Real USI browser verifier then failed before the first `usiok` response.
The generated Emscripten pthread worker repeatedly reported:

`Failed to execute 'createObjectURL' on 'URL': Overload resolution failed.`

## Confirmed facts

- Real artifact gate passed.
- `crossOriginIsolated` was true.
- `SharedArrayBuffer` was available.
- The current WASM SHA-256 matched the Real USI/E2E evidence.
- The generated pthread worker received `urlOrBlob` as a non-string value and
  attempted `URL.createObjectURL(...)`.
- The modularized Emscripten glue was loaded through an outer classic Worker.
- In that loading mode, the generated glue could not infer its own main-script
  URL from `document.currentScript` or `__filename`.

## Cause

The outer Shogi Reflection Worker did not provide
`Module.mainScriptUrlOrBlob`.

Emscripten documents this Module property specifically so pthread workers can
independently reload the main JavaScript file from a URL or Blob.

## Decision

Pass an absolute URL for the generated `yaneuraou.material.js` into the
Emscripten factory as `mainScriptUrlOrBlob`.

No YaneuraOu engine source, MATERIAL evaluation logic, search logic, or USI
bridge source patch is changed by this incident correction.

## Formal status

This correction is NOT proof of Real USI success.

Real `usi -> usiok -> isready -> readyok -> go -> info -> bestmove`, Real
Application E2E, Cancel/Re-analysis, license/source distribution gates, and ZIP
re-verification must still pass in a subsequent GitHub Actions run.
