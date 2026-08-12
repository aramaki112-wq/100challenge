# Shogi Reflection Ver.1.8.3 — Run #26 Gate Baseline Restore

## What happened in Run #25

Run #25 ended in about 27 seconds, before the Real YaneuraOu build/runtime phase.

The Run #25 patch accidentally overwrote two verification files with an older
Build Bridge baseline while adding the Candidate/Graph scroll assertions:

- `Ver18FormalRequirements.test.js`
- `verify.mjs`

That rollback changed current Emscripten verification from 3.1.43 back to
4.0.15 and removed newer Corresponding Source / measured-build verification
rules.

The production `main.js` scroll correction itself is retained.

## Run #26 correction

This patch changes verification files only.

### `Ver18FormalRequirements.test.js`

- restores manifest test Emscripten value to `em++ 3.1.43`
- retains Candidate deterministic `behavior: "auto"` assertion
- retains Graph deterministic `behavior: "auto"` assertion

### `verify.mjs`

Restores the pre-Run25 current Build Bridge verification:
- Emscripten 3.1.43 pinned mapping
- application JS vs Corresponding Source JS separation
- packaged Corresponding Source evidence
- explicit modified-source evidence
- reviewed patch diff abbreviation check
- Real/diagnostic evidence upload check
- full measured metadata requirements including bootstrap/pthread worker

And retains the new Run #25 deterministic Candidate/Graph scroll checks.

## Production changes

None in Run #26.

`main.js` from Run #25 remains the intended Production correction:
- Candidate -> Replay uses `behavior: "auto"`
- Graph -> Replay uses `behavior: "auto"`
- ordinary Replay navigation still has pageScroll=NONE

## Formal status

NOT FORMAL.

After this verification-baseline correction, re-run the existing Real
Reflection Flow Gate. Only then can the Candidate Board Scroll production
correction be judged.
