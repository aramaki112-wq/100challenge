# Run #22 — Real Reflection Flow Integration Gate

Run #22 is intentionally narrower than Formal Completion.

It uses the actual `index.html` / `main.js` UI and the production engine-selection path:

```text
Bundled Sample KIF
→ existing KIF Import
→ Step3 Replay
→ BrowserEngineProvider
→ FallbackShogiEngineAdapter (primary must remain Real YaneuraOu)
→ YaneuraOuWasmAdapter
→ BrowserWorkerUsiTransport
→ Real YaneuraOu WASM
→ AnalyzeGame
→ Good / Bad Candidate
→ Evaluation Graph
→ Graph → Replay
→ Candidate → Replay + Board Scroll
→ Candidate → KeyPosition
→ Graph KeyPosition Marker
→ Graph → STEP4 exact card
→ FACT / INTERPRETATION / HYPOTHESIS remain user-owned blank fields
```

The gate fails if the application silently falls back to ReflectionLocalEngine or Mock.

This run does **not** yet claim Formal Completion. Cancel/Re-analysis in the production Real flow,
final license/corresponding-source audit, performance/mobile evidence, and final ZIP re-verification
remain later gates.
