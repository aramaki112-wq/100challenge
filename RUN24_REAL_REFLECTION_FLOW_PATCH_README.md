# Shogi Reflection Ver.1.8.3 — Run #24 Real Reflection Flow Scroll-Settlement Fix

## Run #23 measured result

The Real Reflection Flow reached the end of the intended user path.

Measured TRUE in the Run #23 artifact:

- Real YaneuraOu analysis COMPLETED
- 153 / 153 positions
- Good Candidates: 5
- Bad Candidates: 5
- Best / Actual / Difference / PV present
- Evaluation Graph rendered
- Graph -> Replay
- Candidate -> Replay
- Candidate Replay board position = requested ply
- intentional Candidate page scroll occurred
- Candidate add kept page scroll
- KeyPosition added
- Graph KeyPosition marker appeared
- Graph -> STEP4
- exact STEP4 card focused
- FACT empty
- INTERPRETATION empty
- HYPOTHESIS empty
- Engine did not auto-fill reflection
- page errors: none

The only FALSE gate was `candidateBoardVisible`.

## Cause

The harness deliberately reset the page to `scrollY=0` and then invoked the
production Candidate -> Replay action. Production uses smooth scrolling.

After Real full-ply analysis the Step3 document is very tall. Run #23 sampled
board geometry after a fixed 700 ms. The browser could still be in the middle
of the long smooth scroll even though:

- page scroll had changed, and
- the replay board was already on the correct candidate ply.

This is a verification timing defect, not evidence of a Production replay
position failure.

## Run #24 correction

Production code changes: **0**

The browser harness now polls the real board geometry for up to 10 seconds.
It accepts the same existing visibility contract only when:

- board intersects the viewport, and
- board top is not hidden behind the sticky Step Navigation.

The final measured geometry is also written into the evidence JSON/TXT.

No visibility rule is weakened.

## Formal status

NOT FORMAL.

Run #24 still has to pass the Real Reflection Flow gate in GitHub Actions.
Cancel/Re-analysis, final license/completion documentation and final ZIP
re-verification remain later gates.
