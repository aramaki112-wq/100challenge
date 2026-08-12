# Shogi Reflection Ver.1.8.3 — Run #17 Minimal USI Node Runtime Boundary

## Run #16 measured result

Browser minimal Real USI:
- `usiok`: PASS
- `readyok`: PASS
- `crossOriginIsolated`: true
- `SharedArrayBuffer`: true
- Browser errors: none

Node minimal Real USI:
- YaneuraOu main `.cjs` loaded
- generated pthread worker `.js` was still interpreted as ESM because the
  parent application package declares `"type": "module"`
- worker failed on its CommonJS `require()` before the USI handshake

## Reproduction and measured fix

Using the exact Run #16 artifact, adding this runtime-local file:

```json
{"type":"commonjs"}
```

as `runtime/package.json` made the same generated pthread worker run as
CommonJS.

Measured local replay:
- Node `usiok`: PASS
- Node `readyok`: PASS
- process exit: 0

## Run #17 change

Only `minimal-real-usi/build-minimal-usi.sh` changes.

After generated runtime assets are copied, it creates:

`minimal-real-usi/runtime/package.json`

with `"type":"commonjs"`.

This package boundary is scoped only to the generated minimal Node runtime.
It does not change the Shogi Reflection application package type and browsers
ignore this file.

## Formal status

NOT FORMAL.

A green Run #17 establishes the Minimal Real USI handshake in both Node and
Browser. Full USI search (`position` / `go` / `bestmove`), application E2E,
Cancel/Re-analysis, licensing, performance and final ZIP gates remain later.
