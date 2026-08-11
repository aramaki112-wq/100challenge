# Shogi Reflection Ver.1.8.3 — Run #11 Patch

## Run #10 measured result

The following stages passed:

- pinned YaneuraOu V9.00 build
- Emscripten 3.1.43 MATERIAL JS / pthread worker / WASM generation
- SHA-256 binding
- Corresponding Source packaging
- Static Verification
- existing Browser / Visual / ReflectionLocal regression suites
- physical `usi_command` WebAssembly export
- crossOriginIsolated / SharedArrayBuffer verification

Real USI failed before `usiok`.

Measured pthread-worker error:

`Failed to execute 'createObjectURL' on 'URL': Overload resolution failed.`

## Cause

The modularized Emscripten glue is loaded through an outer classic Worker.
In this loading mode Emscripten cannot infer the main JS URL from
`document.currentScript` or `__filename`.

The nested pthread worker therefore received no usable `urlOrBlob` value.

## Run #11 correction

The outer Worker now computes an absolute URL for
`./yaneuraou.material.js` and passes it to the Emscripten factory as:

`mainScriptUrlOrBlob: MAIN_SCRIPT_URL`

This is the Emscripten-supported input used by pthread workers to reload the
main JavaScript file.

No YaneuraOu search, evaluation, MATERIAL, move generation, or USI source
bridge logic is modified by Run #11.

## Local verification before delivery

- Automated Test: 711 / 711 PASS
- Static Verification: 146 / 146 PASS
- Missing Import: 0
- Browser Test: 154 / 154 PASS
- Visual Test: 24 / 24 PASS
- ReflectionLocal Fallback: 16 / 16 PASS

## Formal status

NOT FORMAL.

Real USI, Real Application E2E, Cancel/Re-analysis and all remaining Formal
Completion / ZIP re-verification gates still require GitHub Actions Run #11.
