# Shogi Reflection Ver.1.8.3 — Run #22 Real Reflection Flow Integration

## Purpose

Run #21 proved Real YaneuraOu full-ply analysis, Candidate selection and Evaluation Graph generation.
Run #22 returns those Real results to the existing user-facing Reflection flow without changing
production Domain / Repository / Storage / Replay / Engine Adapter code.

## New independent gate

`YaneuraOu Real Reflection Flow Gate`

Job:

`Real Candidate Replay KeyPosition STEP4`

## What is proven

- bundled Piyo sample follows existing KIF Import UI
- Step3 Replay uses the existing 9x9 board
- BrowserEngineProvider chooses verified Real YaneuraOu, not Mock/Local fallback
- full 153-position SMARTPHONE_SAFE analysis completes
- Good and Bad Candidate groups are both populated and bounded to 5 each
- Bad Candidate UI exposes Actual / Best / Difference / PV comparison
- production Evaluation Graph renders
- Graph Candidate → Replay
- Candidate → Replay and intentional Board scroll
- Candidate → KeyPosition without page-scroll jump
- KeyPosition graph marker appears
- KeyPosition graph marker → exact STEP4 card
- FACT / INTERPRETATION / HYPOTHESIS remain blank and are not engine-filled

## Deliberately not changed

No production JavaScript module is modified by this patch.

## Still not Formal

Run #22 does not yet close production Real Cancel/Re-analysis, final license/distribution readiness,
physical iPhone performance/battery/heat, or final ZIP extraction/re-test gates.
