# COMPLETION_REPORT — Shogi Reflection Ver.1.8.2 Finalization

Date: 2026-08-09

## Final Verdict

**FORMAL COMPLETION NOT ACHIEVED**

The requested Real YaneuraOu WASM Build / actual run / Real Engine E2E gate could not be satisfied in this environment. The application improvements and non-Real verification are completed, but the artifact must remain a **NOT-FORMAL Integration Candidate**.

## Implementation

- Integration Candidate kept as Source of Truth.
- Existing 7 STEP, Domain, Repository, LocalStorage, Backup/Restore, KIF, Replay, fixed board, SVG pieces, Board Flip, Snapshot and KeyPosition flow retained.
- Added all-ply Evaluation Graph.
- Added Good/Bad/KeyPosition/Mate graph markers.
- Added Graph Candidate → existing Replay → Board Scroll.
- Added KeyPosition marker → STEP4 exact KeyPosition card → FACT focus.
- Strengthened Best Evaluation vs Actual Evaluation bad-move regression coverage.
- Fixed Candidate→KeyPosition browser scroll anchoring.
- Corrected Real WASM Worker boundary to use official `wasm_pre.js` message API instead of direct `ccall` invocation.
- Added build/hash/thread/cross-origin capability gate and hard formal completion gates.

## YaneuraOu / Build

| Field | Result |
|---|---|
| Engine | YaneuraOu |
| Version | V9.00 |
| Commit Hash | `a5ee2786c0030edc7d4a1cdfe94b04dffec55493` |
| Source | official `yaneurao/YaneuraOu` repository |
| License | GPLv3 per official project documentation |
| Evaluation | MATERIAL |
| MATERIAL Level | 1 |
| TARGET_CPU | WASM |
| COMPILER | `em++` |
| Planned Emscripten | 4.0.15 |
| Actual Emscripten Version | **NOT AVAILABLE / NOT RUN** |
| Build Command | `make -j1 normal TARGET_CPU=WASM COMPILER=em++ YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL MATERIAL_LEVEL=1` |
| Output JS | NOT PRODUCED |
| Output WASM | NOT PRODUCED |
| WASM SHA-256 | NOT AVAILABLE |
| pthread Worker | NOT PRODUCED |
| Real Engine startup | **NO** |
| Real USI | **NOT RUN** |

### Upstream WASM resource configuration observed

- pthread enabled
- upstream PTHREAD pool: 32
- initial memory for MATERIAL low level: 138,412,032 bytes (132 MiB)
- maximum memory: 4 GiB
- stack: 64 MiB
- memory growth enabled

These are upstream build settings and **not** iPhone-safe/optimal measurements.

## USI

Adapter/parser automated coverage exists for `usi`, `usiok`, `setoption`, `isready`, `readyok`, `usinewgame`, `position`, `go`, `info`, `score cp`, `score mate`, `depth`, `nodes`, `time`, `pv`, `multipv`, `bestmove`, `stop`, `quit`.

**Real YaneuraOu USI result: NOT RUN.** ReflectionLocal/Mock protocol results are not counted as Real evidence.

## Evaluation / Candidate

### Implemented

- Best Move
- Best Evaluation
- Actual Move
- Actual Evaluation
- Difference (`bestMoveDifferenceCp`)
- short PV
- Good Candidate max 5
- Bad Candidate max 5
- fewer than 5 allowed
- duplicate/proximity suppression
- mate and shape-transition ranking
- viewer-perspective normalization

### Bad Move regression cases

- clear blunder
- quiet blunder
- tactical loss
- mate miss
- winning → equal
- winning → losing
- best-vs-actual priority
- no false forced 5

**Important:** Future-loss quality using real search remains unverified until Real YaneuraOu executes.

## Evaluation Graph

- all analyzed ply timeline
- viewer-perspective CP
- Mate Found / Mate Against / Unknown kept separate from CP
- Good marker
- Bad marker
- KeyPosition marker
- Mate marker
- Graph → Replay
- Graph → STEP4 exact card
- 0-ply KeyPosition support
- no CP line drawn across Mate/Unknown gaps

Graph is a navigation map; it does not create a second Replay state or automatically create KeyPositions.

## Candidate / Replay / KeyPosition

- Candidate 「局面を見る」 uses existing Replay and intentionally scrolls to the board.
- Normal Next/Previous/First/Last/Keyboard/Move List/Board Flip do not intentionally page-scroll.
- Candidate→KeyPosition uses the existing user-owned KeyPosition flow.
- Engine Candidate is never auto-converted into KeyPosition.
- FACT / INTERPRETATION / HYPOTHESIS remain user-authored.

## ReflectionLocalEngine / Graceful Degradation

ReflectionLocalEngine is retained for fallback/development/test. When Real YaneuraOu is unavailable, UI metadata explicitly says the app switched to the simplified engine and does not reuse the YaneuraOu name.

Fallback Browser verification: **16/16 PASS** including analysis, candidate jump, board scroll, key-position add, Cancel and re-analysis availability.

## Threads / Browser Capability

Production selection of the Real WASM path is fail-closed:

- verified build metadata required
- JS/WASM SHA-256 required
- Worker required
- for the pinned threaded build, `crossOriginIsolated === true` required
- `SharedArrayBuffer` required

A manifest that merely says `available=true` without build/hash metadata is rejected.

## Analysis Settings

Existing application presets remain user-facing abstraction. SMARTPHONE_SAFE currently requests one analysis thread and conservative app-side depth/node/time/hash limits. This does **not** prove the upstream pthread/memory build is smartphone-safe.

## Smartphone Browser Test

Automated Chromium viewport: 390×844.

- Browser Test: **154/154 PASS**
- Visual Test: **24/24 PASS**
- no page-wide horizontal overflow in verified flow
- Graph / Candidate / Replay / STEP4 navigation verified

### Physical Device

- Physical iPhone: **NOT TESTED**
- Safari Real WASM: **NOT TESTED**
- Battery: **NOT MEASURED**
- Thermal: **NOT MEASURED**
- device memory pressure/crash behavior: **NOT MEASURED**

## Performance

Measured in headless Chromium only, not a device guarantee:

- Replay Next ×100: about 1.9 s in the latest run, average about 19 ms/click
- Snapshot open/render dispatch: about 1.9 ms
- ReflectionLocal initialization / short analysis / cancel metrics recorded in `ENGINE_PERFORMANCE_RESULT.txt`
- Real YaneuraOu WASM download/load/init/position/KIF/cancel/memory: **NOT MEASURED**

No “fast”, “lightweight”, or “optimal” claim is made for Real YaneuraOu on iPhone.

## License Gate

- Existing application LICENSE unchanged.
- YaneuraOu Source audited separately from compiled WASM.
- MATERIAL uses source-integrated material evaluation; no third-party NNUE/Suisho weight bundled.
- Emscripten toolchain audited separately from engine runtime.
- No unverified prebuilt WASM or unknown-rights weight is bundled.
- Corresponding Source plan documented for a future conveyed GPL binary.

### Readiness

- Personal Use: app + ReflectionLocal **READY**; Real YaneuraOu **NOT AVAILABLE**.
- Public Distribution: current no-YaneuraOu-binary candidate is separate from a Real Engine release; a bundled Real Engine release is **NOT READY**.
- Commercial Distribution: bundled Real YaneuraOu release is **NOT READY**.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION** of a package conveying the GPL engine.

## Verification

| Gate | Result |
|---|---|
| Existing + new Automated Tests | 676/676 PASS |
| Browser 390×844 | 154/154 PASS |
| Visual | 24/24 PASS |
| Static | PASS, Missing Import 0 |
| Fallback Engine Browser | 16/16 PASS |
| Real YaneuraOu Artifact Gate | FAIL |
| Real YaneuraOu Browser E2E | NOT RUN / hard-gated |
| Formal Completion Gate | FAIL |
| Physical iPhone | NOT TESTED |

## Known Limitations

1. Current environment lacks `emcc/em++`/emsdk, therefore no official-source WASM binary exists.
2. Real search quality for quiet/future tactical blunders is not proven.
3. Upstream WASM pthread/memory settings may be unsuitable for iPhone; no physical measurement exists.
4. Real binary-specific public/commercial license/source-distribution review remains open.

## ZIP / Integrity

Formal `Shogi-Reflection-Ver1.8.2.zip` must **not** be produced while Formal Completion Gate is false.

A separate `Shogi-Reflection-Ver1.8.2-NOT-FORMAL-Integration-Candidate.zip` may be produced after extracting it into a fresh folder and re-running non-Real tests plus the intentionally failing Real/Formal gates. Extracted-candidate verification completed: 676/676 automated, 115 static checks with Missing Import 0, 154/154 browser, 24/24 visual, 16/16 fallback engine. Real/Formal gates intentionally remained FAIL. See `ZIP_EXTRACTED_VERIFICATION_RESULT.txt`.

## Next completion gate

Do not change architecture or add stronger weights first. The next required action for formal Ver.1.8 is: obtain the pinned official source + Emscripten 4.0.15 (or document a justified replacement), build MATERIAL_LEVEL=1 WASM, record hashes, run Real USI/E2E/sanity/resource/license gates, then create the formal ZIP only if all pass.
