# ENGINE_BUILD_REPRODUCIBILITY — Ver.1.8.3 Run #8 Candidate

Date: 2026-08-11
Status: **Run #8 documented-source-bridge prepared; patched Real build / Real USI / Real E2E not yet proven**

## Reproducibility contract

A YaneuraOu WASM asset is accepted only when all of the following are tied to the same evidence set:

1. official YaneuraOu repository;
2. exact V9.00 commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`;
3. clean source checkout;
4. pinned source tree's own WASM workflow/toolchain choice;
5. actual compiler/runtime versions;
6. exact upstream material build profile;
7. actual generated JS / pthread Worker / WASM filenames;
8. SHA-256 for every runtime asset and the first-party outer Worker bootstrap;
9. runner/build environment record;
10. Corresponding Source evidence archive;
11. runtime manifest bound to those hashes;
12. Real Browser / USI / application E2E evidence bound to the same WASM SHA-256.

Compiler success alone never satisfies Formal Completion.

## Fixed inputs for Run #6

| Input | Fixed value |
|---|---|
| YaneuraOu release | V9.00 |
| YaneuraOu commit | `a5ee2786c0030edc7d4a1cdfe94b04dffec55493` |
| Evaluation profile | upstream `material` profile |
| Edition | `YANEURAOU_ENGINE_MATERIAL` |
| MATERIAL_LEVEL | 1 |
| Export name | `YaneuraOu_Material` |
| TARGET_CPU | WASM |
| COMPILER | em++ |
| Build entry point | `node script/wasm_build.js material` |
| Emscripten / emsdk target | 3.1.43 |
| expected Emscripten release commit | `bf3c159888633d232c0507f4c76cc156a43c32dc` |
| GitHub runner label | ubuntu-22.04 |
| initial memory from upstream material profile | 92,274,688 bytes |
| expected generated runtime set | `yaneuraou.material.js`, `yaneuraou.material.worker.js`, `yaneuraou.material.wasm` |

The pinned YaneuraOu source tree's own `.github/workflows/make-wasm.yml` uses Ubuntu 22.04 and `emscripten/emsdk:3.1.43`, then invokes `node script/wasm_build.js <edition>`. Its `material` profile fixes `YANEURAOU_ENGINE_MATERIAL`, `YaneuraOu_Material`, `MATERIAL_LEVEL=1`, and `EM_INITIAL_MEMORY_SIZE=92274688`, and expects JS, `worker.js`, and WASM outputs.

## Why Run #5 evidence caused a toolchain correction

Run #5 proved that the previous Emscripten 4.0.15 bridge could compile and hash the engine, but Real Browser startup failed before `usiok` with repeated `RuntimeError: function signature mismatch`. That evidence does **not** prove Emscripten 4.0.15 is inherently incompatible with YaneuraOu; it proves our 4.0.15 build was not a valid Real runtime for this Formal Gate.

More importantly, re-reading the exact pinned source revealed that its own WASM CI path uses Emscripten 3.1.43 and `script/wasm_build.js`. Therefore Run #6 stops treating 4.0.15 as the build baseline and aligns the bridge to the pinned upstream WASM procedure. This is a correction based on primary-source evidence, not an upgrade because a version is newer.

Historical Run #1–#5 incident records remain unchanged as evidence of what actually happened.

## Toolchain integrity

The GitHub Actions bridge:

- pins the emsdk installer repository commit used by the bridge;
- verifies that the official emsdk release registry maps `3.1.43` to `bf3c159888633d232c0507f4c76cc156a43c32dc`;
- installs/activates 3.1.43;
- records `emcc --version`, `em++ --version`, LLVM, Node, Python, OS, hosted-runner image data and GitHub run identifiers.

The bridge does not use `latest`.

## Source integrity

The build requires an exact detached checkout of the pinned YaneuraOu commit and an empty `git status --porcelain`. No local YaneuraOu source patch is part of Run #6.

The Corresponding Source evidence also retains the pinned upstream:

- README;
- `source/Makefile`;
- `source/wasm_pre.js`;
- `script/wasm_build.js`;
- `.github/workflows/make-wasm.yml`;
- exact-commit source archive;
- available license evidence.

## Build command

Run #6 intentionally calls the pinned source's own build wrapper:

```text
node script/wasm_build.js material
```

That wrapper expands to the upstream material build command and determines the exact output names. The Shogi Reflection bridge copies the resulting runtime assets without rewriting generated Emscripten glue.

## Expected runtime assets

After a successful Run #6 build:

- `engine/yaneuraou/yaneuraou.material.js`
- `engine/yaneuraou/yaneuraou.material.worker.js`
- `engine/yaneuraou/yaneuraou.material.wasm`
- `engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js` — first-party outer application Worker

The generated pthread Worker and the first-party outer Worker are different assets and receive different SHA-256 values.

## Runtime evidence binding

`REAL_YANEURAOU_USI_RESULT.json` and `REAL_YANEURAOU_E2E_RESULT.json` must each record the same `wasmSha256` as the currently integrated WASM. The Formal Completion Gate rejects missing, stale, Mock, ReflectionLocal, or hash-mismatched evidence.

## Run #6 proof still required

This document describes the prepared build contract only. Run #6 must still measure and prove:

- successful Emscripten 3.1.43 upstream-profile build;
- actual JS / worker.js / WASM hashes;
- Real Worker/WASM load;
- `usi -> usiok`;
- `isready -> readyok`;
- Real analysis / score / PV / bestmove / stop / quit;
- Real Sample KIF full-ply application E2E;
- cancel / re-analysis;
- existing regression suites;
- Formal Completion Gate and unpacked-ZIP re-verification.

Until those checks pass, status remains **NOT FORMAL**.

## Run #6 → Run #7 reproducibility correction (2026-08-11)

Run #6 reached the pinned Emscripten 3.1.43 build path but the upstream `script/wasm_build.js material` wrapper ended at a missing `yaneuraou.material.js` check. The wrapper's child `make` error was not propagated as primary evidence, so the exact lower-level cause remains unproven.

Run #7 keeps the source commit and official material configuration fixed but improves observability:

- build inside `emscripten/emsdk:3.1.43`, matching the pinned upstream workflow;
- record Docker image ID and RepoDigest;
- execute `make clean` separately;
- execute deterministic `make -j2 tournament` with the same official MATERIAL edition/export/memory values;
- preserve the real `make` exit code;
- require JS, generated pthread worker.js, and WASM before metadata/hashing;
- do not modify YaneuraOu source or Makefile.

Run #7 remains NOT-FORMAL until the CI run produces measured artifacts and Real USI/E2E evidence.

## Run #7 evidence → Run #8 source-bridge correction (2026-08-11)

Run #7 proved that the pinned V9.00 commit can be compiled with the upstream-compatible `emscripten/emsdk:3.1.43` image: make exited `0` and JS / pthread worker / WASM were generated. The remaining Run #7 artifact-gate failure was an internal command-comparison bug and is corrected by distinguishing `upstreamBuildCommand` from the deterministic `buildCommand`.

A deeper inspection of that successfully built WASM found no `usi_command` export even though pinned `wasm_pre.js` calls `ccall("usi_command", ...)`. The exact pinned source places its legacy Emscripten wrapper under `#if 0`, while the active USI API is now `USIEngine::usi_cmdexec(const std::string&)` and `loop()` deliberately does not block under Emscripten.

Run #8 therefore keeps the exact official commit as immutable base but applies the explicitly reviewed patch `patches/yaneuraou-v9.00-wasm-usi-bridge.patch`. The patch hash, exact modified-file set, full diff, actual WASM export list and Corresponding Source are all mandatory evidence. This is a source modification and is no longer described as an unmodified upstream build.

## Run #8 evidence-format incident / Run #9 correction

Run #8 did not reach compilation because the exact reviewed-patch comparison was sensitive to Git's automatically selected abbreviation width for blob object IDs. The reviewed patch used 7 hexadecimal characters on its `index` lines while the GitHub Actions runner emitted 8-character unique prefixes for the same blobs. The patch hunks and modified-file set were otherwise identical.

Run #9 fixes the evidence representation explicitly with `git diff --binary --abbrev=7` before the existing byte-for-byte `cmp` against the reviewed patch. Patch SHA-256, `git apply --check`, modified-file allowlist, `git diff --check`, preserved applied diff, and Corresponding Source evidence remain mandatory. This changes only Git diff presentation; it does not change YaneuraOu engine source, the reviewed patch, compiler settings, MATERIAL settings, or Real Engine gates.

See `ENGINE_BUILD_INCIDENT_008_REVIEWED_PATCH_DIFF_ABBREVIATION.md`.


## Run #9 corresponding-source evidence serialization

Run #9 measured a successful build-stage source-diff comparison, then the Corresponding Source packager reproduced the same reviewed source changes with a different default Git object-ID abbreviation width. The packager now uses `git diff --binary --abbrev=7`, matching the build-stage evidence and reviewed patch. The exact `cmp` gate remains fail-closed; no source or engine behavior is changed by this correction.


## Run #10 pthread main-script URL incident

Run #10 proved the real pinned WASM artifact and `usi_command` export, but the
nested Emscripten pthread worker could not reload the modularized main glue
because the outer Worker did not supply `Module.mainScriptUrlOrBlob`.

The runtime bootstrap now computes the absolute generated-glue URL from
`self.location.href` and passes it as `mainScriptUrlOrBlob`. This changes only
the browser runtime bootstrap; it does not modify YaneuraOu search/evaluation
source or the recorded two-file WASM USI source bridge.
