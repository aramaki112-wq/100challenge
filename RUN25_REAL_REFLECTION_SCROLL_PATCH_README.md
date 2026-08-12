# Shogi Reflection Ver.1.8.3 — Run #25 Real Candidate Scroll Reliability Fix

## Run #24 measured result

Real YaneuraOu / reflection flow itself reached all of the following:

- 153 / 153 Real positions analyzed
- Good Candidate 5
- Bad Candidate 5
- Best / Actual / Difference / PV present
- Evaluation Graph present
- Graph -> Replay true
- Candidate -> Replay true
- Candidate replay position = correct ply
- Candidate -> KeyPosition true
- Graph KeyPosition marker true
- Graph -> STEP4 true
- Exact STEP4 card true
- FACT / INTERPRETATION / HYPOTHESIS remained blank

The only failed contract was Candidate -> Board Scroll.

Measured after Candidate Jump:
- target ply: 86
- Replay board ply: correct
- window.scrollY: 8
- board top: about 9571 px
- viewport height: 844 px

The page therefore changed position but did not bring the board into view.

## Root cause decision

This is no longer treated as a test-harness timing issue.

Production Candidate Jump used a long-distance:

`scrollIntoView({ behavior: "smooth", ... })`

through `BrowserShogiReplayView`.

The earlier short/mock Browser tests passed, but the Real full-ply STEP3 becomes
very tall and the smooth page scroll did not complete reliably.

## Run #25 production correction

Only explicit Engine navigation exceptions change:

- Candidate -> Replay: `behavior: "auto"`
- Evaluation Graph -> Replay: `behavior: "auto"`

Ordinary Replay Navigation is unchanged and still follows Replay Scroll Policy
with no Browser page scroll.

Candidate -> KeyPosition also remains a non-navigation action and continues to
preserve the viewport.

No Domain Model, Repository, Storage, KIF, Engine analysis, Candidate ranking,
Graph calculation, KeyPosition model, Backup/Restore, Markdown or reflection
text behavior changes.

## Why `auto`

The requirement is that an explicit “局面を見る” action reliably brings the
existing Replay board into view. Smooth animation is not part of the formal
contract. On a Real full-ply page, deterministic immediate scrolling is safer
than a long animated scroll.

## Verification

Baseline reconstructed Ver.1.8.3:
- Node tests after patch: 698 / 698 PASS
- Static Verification after patch: 144 PASS / 0 FAIL
- Missing Import: 0

The user's current repository contains additional later Run tests/gates, so the
GitHub Actions Run #25 remains the authoritative Real full-ply measurement.

## Formal status

NOT FORMAL.

Run #25 must re-run the existing Real Reflection Flow Gate and prove:

Real Candidate -> Replay -> Board visible -> KeyPosition -> Graph Marker ->
Graph -> STEP4 -> reflection fields remain user-owned.

Cancel/Re-analysis remains the next separate gate after this passes.
