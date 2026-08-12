# YaneuraOu Minimal Runtime Gate — Run #19

Run #17 established the Real USI handshake in Node and Browser.
Run #18 established a real search in both minimal environments:

```text
position startpos
  ↓
go nodes 5000
  ↓
info score / depth / nodes / time / pv
  ↓
bestmove
```

Run #19 still does **not** return to the Shogi Reflection full application.
It exercises the remaining runtime behavior that the later application adapter
will depend on.

## Isolated sequence

```text
usi → usiok
isready → readyok
  ↓
setoption MultiPV=2
position startpos
go nodes 8000
  ↓
MultiPV 1 + MultiPV 2 + bestmove
  ↓
position startpos
go infinite
  ↓
info ...
stop
  ↓
bestmove
  ↓
position startpos moves 7g7f 3c3d
go nodes 5000
  ↓
info ... + bestmove
  ↓
known forced-mate position
go nodes 200000
  ↓
info score mate ... pv ...
bestmove
  ↓
quit
```

## Why this gate exists

The application needs more than a one-shot `bestmove` call.
It must be able to:

- request multiple candidate PVs;
- cancel a running search with `stop`;
- analyze another position in the same engine session;
- preserve `mate` as a dedicated score type instead of converting it to a huge CP value;
- shut down cleanly with `quit` / worker termination.

## Mate evidence

This gate intentionally tests **normal search output containing `score mate`**,
not a dedicated `go mate` solver. The Shogi Reflection analysis model needs to
preserve mate as a separate evaluation state in ordinary game analysis.

The SFEN used by the harness is taken from a public YaneuraOu issue that records
an expected `score mate -8` line under ordinary search:

`l6nl/6k2/+P3p2p1/1B1p1Pp1p/1p7/7nP/3P1SP1L/2+p3GK1/L6+r1 b B2G2S5Prgs2np 0`

Reference: https://github.com/yaneurao/YaneuraOu/issues/139

## Resource-safety settings

The minimal harness continues to use:

- `Threads = 1`
- `USI_Hash = 64`
- `USI_OwnBook = false`

These values are experimental safety settings, not the final smartphone preset.

## Pass condition

Both Node and cross-origin-isolated Chromium must show:

- `usiok` / `readyok`;
- `MultiPV` option presence;
- `multipv 1` and `multipv 2` info;
- score / depth / nodes / time / PV / bestmove;
- `go infinite` followed by `stop` and a returned bestmove;
- a second position analyzed in the same session;
- an ordinary-search `score mate` with PV and bestmove;
- `quit` sent without runtime errors.

Even a green Run #19 is **NOT FORMAL COMPLETION**. It proves only the isolated
runtime behavior. Shogi Reflection integration, full-ply Sample KIF analysis,
Cancel/Re-analysis through the application layers, performance measurements,
license/distribution review and final ZIP re-verification remain later gates.
