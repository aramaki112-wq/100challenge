# Shogi Reflection Ver.1.8.3 — Run #30 Formal Build Profile Candidate

Run #29 closed the production Real Cancel / Re-analysis gate.

Before final Formal Completion, Run #30 removes the last engineering ambiguity:
the successful runtime used so far was still compiled with diagnostic
`EMCC_CFLAGS=-sASSERTIONS=2 -g3 -Wcast-function-type`.

Run #30 therefore builds a **fresh non-diagnostic** YaneuraOu V9.00 MATERIAL
WASM from the same fixed official commit and re-runs all important Real gates
against the new exact hashes.

## Source identity

- YaneuraOu: V9.00
- commit: `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- Emscripten: 3.1.43
- evaluation: MATERIAL / MATERIAL_LEVEL=1
- USI bridge patch SHA-256:
  `bb79c5297f6b3e06e4dd67187aafb4f8ab18657e837f087ae7cbab15fdc27f07`
- formalized thread compatibility patch SHA-256:
  `de3b26e32d44502cf3d426d6c3fc43394228ebae2253c8cee7fa714af0a61c6d`

## Gates re-run on the same fresh hash

1. Automated Test / Static Verification / Missing Import
2. Minimal Node + Browser Search
3. Minimal Node + Browser Runtime:
   MultiPV / stop / re-analysis / mate / quit
4. Production Adapter
5. bundled Piyo Sample KIF full-ply 153 positions
6. Good / Bad Candidate + Evaluation Graph
7. Candidate / Graph -> Replay
8. Candidate -> Board Scroll
9. Candidate -> KeyPosition
10. Graph Marker -> STEP4
11. FACT / INTERPRETATION / HYPOTHESIS remain user-owned
12. Real Cancel -> stop -> quit -> Worker terminate
13. Real re-analysis 153 / 153
14. Corresponding Source archive / patch / license evidence
15. Internal ZIP creation and extraction
16. Post-extraction Automated Test / Static Verification / runtime hashes

## Formal rule

A green Run #30 does **not** yet publish the final
`Shogi-Reflection-Ver1.8.3.zip`.

It means the exact non-diagnostic engine build is ready for the final ZIP gate.

Public and commercial distribution remain separate from technical completion:

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**

The existing application MIT `LICENSE` is not changed by Run #30.
