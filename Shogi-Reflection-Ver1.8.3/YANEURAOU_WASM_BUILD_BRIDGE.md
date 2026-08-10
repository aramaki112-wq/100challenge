# Shogi Reflection Ver.1.8.3 — YaneuraOu WASM Build Bridge

Date: 2026-08-10
Status: **IMPLEMENTED / REAL BUILD NOT EXECUTED IN THIS SANDBOX / NOT FORMAL**

## 1. Purpose

このBridgeは「偶然入手したWASM」を採用しないための再現Build経路である。Application Domain、Repository、Storage、Replay、KeyPosition、Evaluation Graph等の既存設計は変更せず、Engine Adapter境界の外側にBuild provenanceを追加する。

```text
GitHub Actions
  -> fixed emsdk 4.0.15
  -> verify official release mapping
  -> official YaneuraOu repository
  -> detached exact V9.00 commit
  -> MATERIAL_LEVEL=1 / TARGET_CPU=WASM / COMPILER=em++
  -> actual JS/WASM/pthread worker discovery
  -> SHA-256
  -> ENGINE_BUILD_METADATA.json
  -> Corresponding Source evidence archive
  -> GitHub Actions artifact
  -> integrate-yaneuraou-build-artifact.sh
  -> Real Artifact Gate
  -> Real Browser / Real USI / Real E2E
  -> Formal Completion Gate
```

## 2. Fixed upstream source

- Repository: `https://github.com/yaneurao/YaneuraOu`
- Release: `V9.00`
- Commit: `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- Evaluation: `YANEURAOU_ENGINE_MATERIAL`
- `MATERIAL_LEVEL=1`
- `TARGET_CPU=WASM`
- `COMPILER=em++`

Pinned upstream facts were checked against the exact commit, not a moving branch.

## 3. Fixed toolchain

- emsdk target: `4.0.15`
- expected Emscripten release commit mapping: `b412b6307e541b93dd93f01b61181e15c17302ec`
- emsdk installer repository itself is cloned at workflow execution time, and its exact HEAD is recorded. The workflow then verifies that its release registry still maps `4.0.15` to the expected Emscripten release commit before installation.
- actual `emcc --version`, `em++ --version`, `em++ -v`, LLVM, Node, Python, OS, runner image identifiers are recorded as measured Build evidence.

This separates the fixed compiler release from the mutable hosted-runner image.

## 4. Build command

```bash
make -j1 normal \
  TARGET_CPU=WASM \
  COMPILER=em++ \
  YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL \
  MATERIAL_LEVEL=1
```

The script refuses:

- wrong YaneuraOu commit;
- dirty upstream checkout;
- missing `emcc` / `em++`;
- missing upstream MATERIAL/WASM/`wasm_pre.js` evidence;
- missing JS/WASM output;
- any unexpected separate `yaneuraou*.worker.js` output under pinned Emscripten 4.0.15.

## 5. Actual output is Source of Truth

The Bridge accepts the actual upstream build products documented by the pinned Makefile: `yaneuraou.js` and its emitted `yaneuraou.wasm`. A second GitHub Actions run confirmed that the compile reached completion but the original bridge failed only because it expected a separate pthread `.worker.js`. Official Emscripten 4.0.15 behavior is different: pthreads reuse the main generated JavaScript as the Worker script and no separate `.worker.js` is emitted.

Therefore the measured result is recorded as `pthreadWorkerPackaging=MAIN_JS_SELF_WORKER`, `generatedPthreadWorkerCount=0`, `workerFile=null`, and `workerSha256=null`. Shogi Reflection's own `YaneuraOuWasmWorkerBootstrap.js` remains the outer classic Worker boundary and receives its own SHA-256. No nonexistent generated Worker filename is invented.

## 6. Official wasm_pre.js boundary

Application code does not call `usi_command` directly. `YaneuraOuWasmWorkerBootstrap.js` continues to use the module-level `postMessage()` bridge supplied by the pinned upstream `wasm_pre.js`. The upstream pre-js owns command queueing while pthreads start and owns quit/terminate handling. Domain code remains unaware of these details.

## 7. Upstream WASM resource profile

The pinned Makefile uses, for the selected MATERIAL level:

- pthread enabled;
- `PTHREAD_POOL_SIZE=32`;
- initial memory `138,412,032` bytes;
- maximum memory `4,294,967,296` bytes;
- memory growth enabled;
- stack `67,108,864` bytes;
- `wasm_pre.js` pre-js.

These values are **build reproducibility facts**, not smartphone recommendations. They are explicitly labeled `UPSTREAM_WASM_DEFAULTS_NOT_SMARTPHONE_VALIDATED` in the runtime manifest. Ver.1.8.3 does not silently rewrite them for iPhone.

## 8. Browser deployment boundary

### Local development / desktop browser

The supplied Real Browser verifier serves COOP/COEP response headers locally and checks `crossOriginIsolated` plus `SharedArrayBuffer` before Real Engine use.

### GitHub Pages

Emscripten pthread builds require COOP/COEP response headers. GitHub Pages official documentation checked in this audit documents HTTPS and publishing mechanisms, but this audit did **not** establish an official GitHub Pages configuration mechanism for arbitrary COOP/COEP response headers. Therefore:

**GitHub Pages + upstream pthread WASM = NOT PROVEN FOR FORMAL DEPLOYMENT.**

No Service Worker isolation shim is silently adopted in Ver.1.8.3. It may be investigated later as a distinct hosting/security design with its own browser and license tests.

### iPhone Safari

WebKit documents SharedArrayBuffer/Wasm threading behind COOP/COEP in Safari 15.2+, but that does not prove this specific engine/resource profile works on a physical iPhone. Physical iPhone status remains **UNVERIFIED**.

### Future installed app

An installed-app WebView/native wrapper can be evaluated separately. It must not inherit “browser verified” or “iPhone optimized” status from desktop tests.

## 9. GitHub Actions workflow

File: `.github/workflows/build-yaneuraou-wasm.yml`

The workflow:

1. checks out Shogi Reflection;
2. records GitHub runner provenance;
3. clones official emsdk;
4. verifies `4.0.15 -> b412...` release mapping;
5. installs and activates `4.0.15`;
6. clones official YaneuraOu;
7. checks out detached exact commit;
8. verifies clean checkout;
9. runs the fixed MATERIAL WASM build;
10. checks actual outputs;
11. hashes generated JS/WASM plus the application Worker bootstrap;
12. generates measured metadata;
13. creates a source evidence tarball from the exact checkout;
14. stores upstream README/Makefile/wasm_pre.js and Emscripten license evidence when present;
15. runs artifact/static/automated gates;
16. uploads a traceable Actions artifact.

## 10. Integration after Actions build

After downloading the Actions artifact, overlay it through:

```bash
./scripts/integrate-yaneuraou-build-artifact.sh /path/to/downloaded-artifact
```

This script copies the generated Engine artifacts and immediately runs the Real Artifact Gate. Passing this step means only **the real build artifact is present and hash-consistent**. It does not mean Formal Completion.

## 11. Real gates still required

After integration, run and record:

- Real Browser load;
- USI handshake;
- cp / mate / PV / MultiPV / depth / nodes / time;
- bestmove / stop / quit;
- evaluation sanity positions;
- Sample KIF all-ply analysis;
- Good/Bad Candidate;
- Best/Actual/Difference/PV;
- Candidate -> Replay -> Board Scroll -> KeyPosition;
- Graph marker -> Replay / STEP4;
- FACT / INTERPRETATION / HYPOTHESIS manual reflection flow;
- cancel / re-analysis;
- existing automated/browser/visual/static tests;
- license/source-distribution review;
- unpacked ZIP re-verification.

Mock or ReflectionLocal output never satisfies these Real gates.

## 12. Current verdict

The Build Bridge is implemented, but this sandbox did not have a usable external GitHub clone path or activated Emscripten compiler. Therefore no Real YaneuraOu artifacts were produced here and **Formal Completion remains NOT ACHIEVED**.

## Primary sources checked

- YaneuraOu exact commit/release/README/Makefile/wasm_pre.js: `https://github.com/yaneurao/YaneuraOu`
- Emscripten SDK install docs: `https://emscripten.org/docs/getting_started/downloads.html`
- Emscripten pthread docs: `https://emscripten.org/docs/porting/pthreads.html`
- emsdk release registry: `https://github.com/emscripten-core/emsdk/blob/main/emscripten-releases-tags.json`
- WebKit Safari 15.2 threading/COOP/COEP: `https://webkit.org/blog/12140/new-webkit-features-in-safari-15-2/`
- GitHub-hosted runners: `https://docs.github.com/en/actions/concepts/runners/github-hosted-runners`
- GitHub Pages HTTPS/publishing docs: `https://docs.github.com/en/pages/`

## 13. Ver.1.8.3 CI Real Evidence extension

Build Artifact検証後、CIはPlaywright 1.57.0を意図的に固定し、既存Browser/Visual/ReflectionLocal regressionを再実行する。その後、Real USI verifierとReal Application E2E verifierを別Stepで実行する。Real verifierは失敗してもEvidence fileをArtifactへ残せるよう一旦`continue-on-error`とし、Artifact upload後の最終Enforcement StepがいずれかのReal/Formal resultがPASSでなければJobを失敗させる。

この構造により「失敗したためLog/Resultが残らない」を避けつつ、失敗を成功扱いにもできない。

### Formal Gate placement clarification

GitHub ActionsはReal USI/E2EまでをBuild Artifactに対して強制し、Formal Completion Gateは診断として実行してResultを保存する。Jobの成功条件にはFinal Formalを含めない。理由は、Final Formal CompletionにはBuild ArtifactをShogi Reflectionへ統合した後のSource of Truth Audit、Completion Report、正式候補ZIP作成、別Folder展開後再検証まで必要だからである。Real runtime PASSと正式配布物完成を同一Stepへ短絡しない。
