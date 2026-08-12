# Run #21 — Real Sample KIF Full-Ply Gate

This gate is the first step after the successful Real Adapter Integration Gate.
It deliberately does **not** drive the complete Shogi Reflection UI yet.

It exercises the production chain:

`bundled Piyo KIF -> KifFileReaderAdapter -> KifParser -> PositionHistoryBuilder -> AnalyzeGame -> YaneuraOuWasmAdapter -> BrowserWorkerUsiTransport -> Real YaneuraOu WASM -> EngineCandidateSelector -> EngineEvaluationGraphModel/View`

## Scope

- bundled `samples/piyo_20260617_170236.kif`
- existing Shift_JIS file-reader path
- existing parser and replay PositionHistory
- player perspective = GOTE for the bundled sample
- all 153 positions (`0..152`)
- production `FAST` analysis preset
- normalized evaluation timeline
- Best/Actual comparison rows for all 76 player moves
- Good/Bad Candidate selection with the existing maximum-five-per-group rule
- Evaluation Graph model and SVG rendering

## Deliberately not included yet

- Candidate -> Replay jump
- Candidate -> Board auto-scroll
- Candidate -> KeyPosition
- Graph -> Replay
- Graph -> STEP4
- Cancel/Re-analysis in the application flow
- Formal Completion

A green Run #21 proves the Real Engine analysis data path through the existing
application services, not the complete UI workflow.
