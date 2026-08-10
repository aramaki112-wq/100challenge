# ENGINE_BUILD_REPRODUCIBILITY — Ver.1.8.3

Date: 2026-08-10
Status: **Build Bridge ready; Real build not executed in current sandbox**

## Reproducibility Contract

A YaneuraOu WASM asset is accepted only when all of the following can be tied together:

1. official repository;
2. exact V9.00 commit;
3. clean source checkout;
4. fixed Emscripten 4.0.15 target and verified official release mapping;
5. actual compiler/runtime versions;
6. exact Make command;
7. actual generated JS/WASM filenames and measured pthread Worker packaging mode;
8. SHA-256 for generated JS/WASM and the application Worker bootstrap;
9. runner/build environment record;
10. Corresponding Source evidence archive;
11. runtime manifest matching those hashes;
12. Real Browser/USI/E2E evidence matching the same WASM hash.

## Fixed Inputs

| Input | Fixed value |
|---|---|
| YaneuraOu release | V9.00 |
| YaneuraOu commit | `a5ee2786c0030edc7d4a1cdfe94b04dffec55493` |
| Evaluation | MATERIAL |
| MATERIAL_LEVEL | 1 |
| TARGET_CPU | WASM |
| COMPILER | em++ |
| emsdk target | 4.0.15 |
| expected Emscripten release commit | `b412b6307e541b93dd93f01b61181e15c17302ec` |
| GitHub runner label | ubuntu-24.04 |

`ubuntu-24.04` is not treated as bit-for-bit immutable. Hosted runner images change; exact ImageOS/ImageVersion, OS release and tool versions are captured at build time.

## Measured after successful CI build

`ENGINE_BUILD_METADATA.json` receives the actual:

- build date;
- build platform;
- GitHub Actions run/runner image identifiers;
- emsdk repository HEAD used as installer;
- emcc version;
- em++ version;
- LLVM version;
- Node version;
- Python version;
- JS/WASM actual filenames;
- pthread Worker packaging mode and generated pthread Worker count;
- JS/WASM SHA-256;
- application Worker bootstrap filename/SHA-256.

No null field in the current NOT-BUILT metadata is described as a measured fact.

## Source integrity

The build script requires exact commit match and a clean `git status --porcelain`. The workflow checks out the commit detached. Local patches are therefore **not part of this Ver.1.8.3 bridge**. If a later resource optimization modifies upstream source/Makefile, that becomes a new explicit patch set and must be archived in Corresponding Source evidence.

## Toolchain integrity

The workflow clones official emsdk and verifies that its release registry maps `4.0.15` to the expected Emscripten release commit before installation. This is stronger than using `latest`, but the emsdk installer repository HEAD is also recorded because the installer itself is not pinned by version in this design.

A future hardening option is to pin the emsdk repository commit as well. Do not change compiler release merely because a newer version exists.

## Commands

GitHub Actions is the preferred path. Local reproduction is also possible after an official emsdk 4.0.15 environment is activated:

```bash
./scripts/build-yaneuraou-wasm.sh /path/to/YaneuraOu
./scripts/verify-yaneuraou-wasm.sh
```

The script uses:

```text
make -j1 normal TARGET_CPU=WASM COMPILER=em++ YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL MATERIAL_LEVEL=1
```

## Outputs

Successful build evidence:

- `engine/yaneuraou/yaneuraou.js`
- `engine/yaneuraou/yaneuraou.wasm`
- no separate generated pthread `.worker.js` under Emscripten 4.0.15 (`MAIN_JS_SELF_WORKER` packaging)
- `YaneuraOuWasmWorkerBootstrap.js` (application-level Worker boundary)
- `ENGINE_ASSET_SHA256SUMS.txt`
- `ENGINE_BUILD_METADATA.json`
- `ENGINE_BUILD_RESULT.txt`
- `build-record/*`
- `corresponding-source/YaneuraOu-<commit>.tar.gz`

A successful compiler stage alone never changes Formal Completion to PASS.

## Real evidence binding

Build Artifactの存在だけでは正式Evidenceにならない。`REAL_YANEURAOU_USI_RESULT.json`と`REAL_YANEURAOU_E2E_RESULT.json`はそれぞれ`wasmSha256`を持ち、Formal Completion Gateは現在配置されているWASMの実SHA-256と両方が一致することを要求する。これにより別BuildのUSI結果や古いBrowser結果を流用できない。

CIのPlaywright verifierは`requirements-real-engine.txt`で1.57.0を固定する。これは「最新だから」ではなく、Ver.1.8.3 Build Bridge作成時の検証Harness versionを固定するためである。Browser version自体はReal run結果へ実測記録する。

### Runtime directory invariant added after Run #4

For the pinned Emscripten 4.0.15 pthread build, `engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js`, `yaneuraou.js`, and `yaneuraou.wasm` must be co-located. The manifest Worker URL and Build Metadata SHA-256 bind that runtime layout. This avoids patching generated upstream glue or distributing a second untracked WASM alias.
