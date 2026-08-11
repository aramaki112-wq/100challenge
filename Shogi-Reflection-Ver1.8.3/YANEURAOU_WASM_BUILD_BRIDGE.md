# YANEURAOU_WASM_BUILD_BRIDGE — Ver.1.8.3 Run #8 Candidate

Date: 2026-08-11
Status: **NOT FORMAL — upstream-compatible toolchain proven in Run #7; documented V9.00 WASM USI source bridge prepared for Real Run #8**

## 1. Purpose

The Build Bridge exists to make a Real YaneuraOu WebAssembly artifact reproducible and explainable. It does not add a new Shogi Reflection feature and does not move YaneuraOu knowledge into the Domain layer.

Architecture remains:

```text
Browser UI
  -> Engine Application Service
  -> ShogiEnginePort
  -> YaneuraOuWasmAdapter
  -> BrowserWorkerUsiTransport
  -> first-party YaneuraOuWasmWorkerBootstrap
  -> generated YaneuraOu MATERIAL JS / pthread Worker / WASM
```

ReflectionLocalEngine remains a separate fallback and cannot satisfy a Real/Formal gate.

## 2. Pinned engine source

- YaneuraOu: V9.00
- Repository: official `yaneurao/YaneuraOu`
- Commit: `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- Evaluation: built-in MATERIAL only
- No third-party NNUE / 水匠 weights are introduced.

## 3. Run #5 evidence and correction

Run #5 successfully produced hash-bound Real YaneuraOu assets with the previous Emscripten 4.0.15 bridge and reached the Real Browser verifier. However, the engine crashed before `usiok` with repeated `RuntimeError: function signature mismatch`, and application E2E therefore degraded to ReflectionLocal.

That Run #5 result remains an important negative Real test. It is not reclassified as success.

A primary-source re-audit of the exact pinned YaneuraOu commit then found that upstream's own `.github/workflows/make-wasm.yml` uses Ubuntu 22.04 and `emscripten/emsdk:3.1.43`. The same commit's `script/wasm_build.js` defines the `material` profile and its generated runtime set. Run #6 therefore aligns to that upstream path instead of preserving 4.0.15 merely because it had compiled.

## 4. Run #6 build path

```text
GitHub Actions
  -> ubuntu-22.04
  -> fixed emsdk installer checkout
  -> verify 3.1.43 release mapping
  -> install/activate Emscripten 3.1.43
  -> clone official YaneuraOu
  -> detached checkout exact commit
  -> verify clean source
  -> node script/wasm_build.js material
  -> verify exact material JS / worker.js / WASM
  -> SHA-256 all runtime assets
  -> Build Metadata + Manifest
  -> Corresponding Source evidence
  -> existing automated/static/browser/visual/fallback tests
  -> Real USI
  -> Real application E2E
  -> diagnostic Formal Gate
  -> upload all evidence even on Real-gate failure
```

## 5. Official material profile

The pinned upstream build script defines:

- profile: `material`
- edition: `YANEURAOU_ENGINE_MATERIAL`
- export name: `YaneuraOu_Material`
- `MATERIAL_LEVEL=1`
- `EM_INITIAL_MEMORY_SIZE=92274688`

Its packaging loop requires:

- `yaneuraou.material.js`
- `yaneuraou.material.worker.js`
- `yaneuraou.material.wasm`

The bridge treats those actual generated names as Source of Truth. It does not invent a nonexistent worker filename and does not patch generated glue.

## 6. Worker boundary

`YaneuraOuWasmWorkerBootstrap.js` is a **first-party outer Worker** used by Shogi Reflection's transport boundary. It imports `yaneuraou.material.js`, obtains `YaneuraOu_Material`, and connects the upstream `wasm_pre.js` message bridge to the application's Worker messaging contract.

`yaneuraou.material.worker.js` is the **Emscripten-generated pthread Worker** used internally by the generated engine runtime. It is a separate generated third-party runtime asset in the 3.1.43 upstream profile.

Both are hash-bound independently.

## 7. Resource settings are not smartphone claims

The upstream MATERIAL profile's 92,274,688-byte initial memory is recorded as a reproducibility input. Other thread/memory/stack values that come from the pinned Makefile are also captured where applicable.

None of these values is described as "iPhone optimized", "lightweight", "fast", or "battery efficient" without physical measurement. Smartphone optimization remains a later measurement-driven task.

## 8. cross-origin isolation

The Real Browser verifier must check both `crossOriginIsolated === true` and availability of `SharedArrayBuffer` before a pthread Real Engine run is accepted. Run #5 demonstrated that those browser conditions could be established in the CI verifier, but the engine itself still failed; therefore isolation support and engine runtime correctness remain separate gates.

GitHub Pages and physical iPhone deployment remain separate hosting/device gates. No desktop-CI result is relabeled as physical-iPhone verification.

## 9. License/provenance boundary

Build success is separate from distribution permission. The Build Bridge retains exact source/commit/build/toolchain evidence and a Corresponding Source plan, but public/commercial distribution remains gated by the license audit and legal review where the combined-work characterization is unresolved.

The existing application LICENSE is not silently changed.

## 10. Run #6 acceptance condition

Run #6 is only a successful Real-engine step if the generated 3.1.43 asset set loads and the Real verifier records the required USI protocol/analysis evidence. If it still fails, the artifact and failure logs are preserved and the next decision is based on that evidence.

Formal Completion remains fail-closed until all user-specified Formal Gate items, license/source-distribution gates, and final ZIP re-verification pass.

## Run #7: deterministic official-setting Docker bridge

The pinned upstream workflow identifies `emscripten/emsdk:3.1.43` as its WASM toolchain. Run #7 therefore uses that exact image tag and records the actual pulled image ID/RepoDigest at build time.

The bridge no longer relies on the upstream JavaScript wrapper to report the underlying `make` status. It preserves the same MATERIAL build settings while separating `clean` and `tournament`, capturing the real exit code, and accepting no artifact until JS + pthread worker.js + WASM all exist and hash successfully.

This is an execution/traceability adaptation only. The pinned YaneuraOu source tree and Makefile are not patched.

## Run #8: explicit V9.00 WASM USI source bridge

Run #7 produced the real MATERIAL JS / pthread worker / WASM with make exit `0`. Direct WASM export inspection then showed that `usi_command` is absent even though the pinned `wasm_pre.js` invokes that symbol. The pinned V9.00 source contains a legacy wrapper under a disabled `#if 0` region and the active Emscripten `USIEngine::loop()` returns instead of blocking for stdin.

Run #8 does not change the pinned commit. It applies one hash-bound two-file patch after verifying a pristine checkout, then requires the resulting WASM itself to expose `usi_command` before any Real USI test can start. The patch and a deterministic modified-source archive are retained as Corresponding Source evidence.

Architecture remains:

```text
Browser UI
 -> Engine Application Service
 -> ShogiEnginePort
 -> YaneuraOuWasmAdapter
 -> BrowserWorkerUsiTransport
 -> YaneuraOuWasmWorkerBootstrap
 -> upstream wasm_pre.js queue
 -> documented usi_command bridge patch
 -> current USIEngine::usi_cmdexec
 -> YaneuraOu MATERIAL engine
```

This is still **NOT FORMAL** until Real USI and Real application E2E pass for the measured patched WASM hash.

## Run #9: deterministic reviewed-diff representation

The source patch remains byte-for-byte unchanged. Run #8 showed that Git's automatically chosen abbreviated blob IDs can differ across environments even when the applied source hunks are identical. Run #9 therefore emits the post-apply review diff with `git diff --binary --abbrev=7`, matching the reviewed patch's representation before the existing `cmp` gate.

This is an evidence-format correction only. It does not bypass patch verification and does not assert Real Engine success.
