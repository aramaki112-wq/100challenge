# Shogi Reflection Ver.1.8.3 Formal Completion Status

Date: 2026-08-10

## Verdict

**FORMAL COMPLETION NOT ACHIEVED**

Ver.1.8.3 successfully adds the reproducible YaneuraOu WASM Build Bridge and stronger Real Artifact/Formal gates, but this execution environment did not produce a Real YaneuraOu WASM build. No Mock or ReflectionLocal result is substituted.

## Completed in this version

- GitHub Actions Build Bridge added.
- YaneuraOu V9.00 exact commit fixed and verified by primary-source audit.
- MATERIAL_LEVEL=1 fixed; external NNUE/水匠 weight excluded.
- Emscripten 4.0.15 fixed with official release mapping check.
- exact compiler/runner provenance capture designed.
- actual generated worker filename discovery implemented.
- JS/WASM/Worker SHA-256 automation implemented.
- measured `ENGINE_BUILD_METADATA.json` generation implemented.
- Corresponding Source evidence packaging implemented.
- downloaded Build artifact integration + hash gate implemented.
- Real Artifact Gate strengthened to require measured Build Metadata.
- Formal Gate strengthened to require Real USI/evaluation/E2E evidence.
- Existing Application LICENSE unchanged.
- Existing Domain/Repository/Storage/Replay/Graph architecture preserved.

## Hard Gate still unmet

- Emscripten build executed successfully in an accessible build runner.
- measured JS/WASM/Worker hashes from that build.
- Real Browser load of those exact hashes.
- Real YaneuraOu initialize and full USI evidence.
- Real cp/mate/MultiPV/evaluation sanity positions.
- Real Sample KIF full-ply application E2E.
- Real Good/Bad Candidate quality evidence.
- Real Candidate/Graph navigation evidence.
- Real cancel/re-analysis.
- production hosting COOP/COEP proof.
- binary-specific license/notice audit and final public distribution decision.
- formal candidate ZIP unpack/re-test.

## Hosting status

- Local isolated test server: verifier path exists; Real asset not available here.
- Desktop browser: Real asset not tested here.
- GitHub Pages: pthread hosting **NOT PROVEN**; official Pages documentation reviewed did not establish arbitrary COOP/COEP header configuration in this audit.
- iPhone Safari: **NOT PHYSICALLY TESTED**.
- Future installed app: separate future verification target.

## Artifact naming rule

This package must remain explicitly `NOT-FORMAL`. Do not rename it `Shogi-Reflection-Ver1.8.3.zip` until every Formal Gate check and unpacked-ZIP re-verification succeeds.

## Ver.1.8.3 evidence split

Formal Gate now requires two independent Real result files tied to the same current WASM SHA-256:

- `REAL_YANEURAOU_USI_RESULT.json` — USI handshake, cp/mate, PV/MultiPV, depth/nodes/time, bestmove, stop/quit, evaluation sanity.
- `REAL_YANEURAOU_E2E_RESULT.json` — Sample KIF/full-ply, Good/Bad Candidate, Best/Actual/Difference/PV, Candidate/Graph navigation, STEP4 reflection boundary, Cancel/Re-analysis.

Both are currently `NOT_RUN_REAL_WASM_ASSET_UNAVAILABLE`, which is the correct state for this package. GitHub Actions is prepared to generate Real evidence after the pinned build succeeds, but the final Formal Gate remains separate from CI build success and still requires integration, final audit/report and ZIP re-verification.

## NOT-FORMAL ZIP verification

A separate-folder extraction of the NOT-FORMAL candidate passed all non-Real regression suites (697 Automated / 143 Static / 154 Browser / 24 Visual / 16 fallback) and continued to fail closed on Real Artifact/USI/E2E/Formal gates. This validates packaging consistency only; it does not satisfy the Real YaneuraOu Formal Completion Gate.
