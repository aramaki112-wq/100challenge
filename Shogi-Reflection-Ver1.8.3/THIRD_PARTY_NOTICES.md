# THIRD_PARTY_NOTICES — Ver.1.8.3

Date: 2026-08-10

## Current package status

**No Real YaneuraOu generated JS/WASM binary is bundled in this NOT-FORMAL package.** Pinned Emscripten 4.0.15 does not emit a separate pthread `.worker.js`; the first-party `YaneuraOuWasmWorkerBootstrap.js` is not a YaneuraOu binary.

The following third-party components are referenced by the reproducible Build Bridge. Their inclusion in this notice does not mean every component is redistributed with the app.

## YaneuraOu

- Project: YaneuraOu
- Planned engine source: V9.00 exact commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- Source: official `yaneurao/YaneuraOu` repository
- License statement: pinned README says the YaneuraOu project follows GPLv3 due to Stockfish-derived/referenced GPLv3 projects.
- Selected evaluation: built-in MATERIAL_LEVEL=1 only.
- Current binary status: **NOT BUILT / NOT BUNDLED**.

Before a Real binary is publicly conveyed, replace this provisional notice with notices verified against the exact generated artifact and Corresponding Source package.

## Emscripten

- Fixed SDK target: 4.0.15
- Official release mapping expected: `b412b6307e541b93dd93f01b61181e15c17302ec`
- Emscripten license documentation: MIT OR University of Illinois/NCSA, with incorporated components carrying their own licenses.
- Toolchain status in app ZIP: not bundled.
- Generated JS/runtime status: not present in current package; must be audited after build.

## Build-time tools

GitHub Actions hosted runner, Node and Python are used only by the CI/build process in the current architecture. Their exact versions are intentionally measured and recorded after a successful build. They are not application runtime dependencies merely because the build uses them.

## First-party fallback

`ReflectionLocalEngine` is not YaneuraOu. UI and reports must identify it as the separate first-party fallback whenever the Real engine cannot load.

## Legal gate

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION** of a package that bundles the Real YaneuraOu WASM engine.
