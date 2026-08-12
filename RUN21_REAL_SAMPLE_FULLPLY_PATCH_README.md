# Shogi Reflection Ver.1.8.3 — Run #21 Real Sample Full-Ply Patch

Run #20 proved the production `YaneuraOuWasmAdapter` and
`BrowserWorkerUsiTransport` on one real position.

Run #21 extends that proof to the bundled Piyo sample KIF without changing the
production Domain/Application/Repository/Storage code.

The new independent gate checks:

- existing Shift_JIS KIF reader
- existing KIF parser
- full PositionHistory (`152` moves / `153` positions)
- `AnalyzeGame` over every position using the Real YaneuraOu WASM
- viewer-side normalization for all timeline points
- Best/Actual comparison rows for the user's GOTE moves
- existing Good/Bad Candidate selector, max 5 per group
- existing Evaluation Graph model and SVG view

The gate uses the existing `FAST` preset so this is an integration/reliability
check, not a claim of optimal analysis strength.

Formal status remains **NOT FORMAL**. Full UI navigation, KeyPosition, STEP4,
Cancel/Re-analysis, final license gate and ZIP re-verification remain later.
