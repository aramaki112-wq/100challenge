# YaneuraOu Minimal Real Search Harness — Run #18

Run #17 established the minimal Real USI handshake in both Node and Browser:

```text
usi
  ↓
usiok
  ↓
isready
  ↓
readyok
```

Run #18 moves exactly one step further and still excludes the Shogi Reflection
application UI, Replay, Candidate, Evaluation Graph, STEP4, LocalStorage and
reflection flow.

The isolated question is now:

```text
Real YaneuraOu MATERIAL WASM
  ↓
usi → usiok
  ↓
setoption Threads=1
setoption USI_Hash=64
setoption USI_OwnBook=false
  ↓
isready → readyok
  ↓
usinewgame
position startpos
go nodes 5000
  ↓
info score cp|mate
info depth
info nodes
info time
info pv
  ↓
bestmove ?
```

## Why `go nodes 5000`

The gate is intended to prove that the engine can search a real position and
return analysis output, without turning this step into a performance benchmark.
A fixed node budget avoids depending on wall-clock scheduling for the first
search proof.

## Resource-safety options

Before `isready`, the harness sets:

- `Threads = 1`
- `USI_Hash = 64`
- `USI_OwnBook = false`

These settings are only for this minimal search experiment. They are not yet the
formal Smartphone preset.

## Pass condition

Both Node and cross-origin-isolated Chromium must observe:

- `usiok`
- `readyok`
- at least one `info` line
- score (`cp` or `mate`)
- depth
- nodes
- time
- PV
- `bestmove`

Even if Run #18 passes, this is **NOT FORMAL COMPLETION**. It proves only the
minimal Real Search path. Full USI coverage, `stop`, `quit`, mate-specific
positions, application integration, Sample KIF full-ply analysis, Cancel /
Re-analysis, performance, license distribution gates and final ZIP
re-verification remain later stages.
