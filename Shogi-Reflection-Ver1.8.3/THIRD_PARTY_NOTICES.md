# THIRD_PARTY_NOTICES — Ver.1.8.3 Run #6 Candidate

Date: 2026-08-11
Status: provisional engineering notice; final distribution notice requires post-build/license review

## Current repository/patch status

**Real YaneuraOu binary status in this Run #6 patch: NOT BUNDLED.**

The Run #6 patch itself does **not** bundle a newly generated YaneuraOu binary. GitHub Actions is expected to generate the Real runtime assets from the pinned official source. Run #5 CI artifacts existed as test evidence, but they failed Real runtime verification and are not treated as distributable/Formal engine assets.

## YaneuraOu

- Project: YaneuraOu
- Release: V9.00
- Exact commit: `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- Source: official `yaneurao/YaneuraOu` repository
- Selected profile: built-in `material`, `MATERIAL_LEVEL=1`
- Third-party NNUE / 水匠 weights: not included
- License handling: see `ENGINE_LICENSE_AUDIT.md`; pinned upstream license/README evidence and Corresponding Source are retained for any future binary conveyance.

## Emscripten

- Fixed Run #6 SDK target: 3.1.43
- Expected official release mapping: `bf3c159888633d232c0507f4c76cc156a43c32dc`
- Selection reason: the exact pinned YaneuraOu source's own WASM GitHub Actions workflow uses `emscripten/emsdk:3.1.43`.
- Build-time toolchain is not bundled wholesale with the application.
- Applicable Emscripten/runtime notices must be preserved according to the exact generated output and licenses.

## Generated runtime assets expected from the upstream material profile

- `yaneuraou.material.js`
- `yaneuraou.material.worker.js` — Emscripten-generated pthread Worker
- `yaneuraou.material.wasm`

These files are generated from the pinned YaneuraOu/Emscripten build and are hash-bound before acceptance. Generated output is not assumed to be license-free merely because it is generated.

## First-party Worker bootstrap

`engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js` is Shogi Reflection first-party integration code. It is **not** the same file as the Emscripten-generated `yaneuraou.material.worker.js`.

## Build-only infrastructure

GitHub Actions, Node.js, Python, actions/checkout and actions/upload-artifact are build/test infrastructure. Their versions/provenance are recorded in Build Metadata/logs; they are not automatically runtime dependencies of the distributed browser app.

## Distribution warning

Personal testing readiness, public distribution readiness and commercial distribution readiness are intentionally separate decisions.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION** of a package that conveys Real YaneuraOu generated binaries unless the applicable obligations and combined-distribution architecture have been conclusively reviewed.
