# ENGINE_BUILD_REPRODUCIBILITY — Ver.1.8.2

更新日: 2026-08-09

## Pinned Source Decision

| Field | Value |
|---|---|
| Repository | `https://github.com/yaneurao/YaneuraOu` |
| Release | `V9.00` |
| Commit | `a5ee2786c0030edc7d4a1cdfe94b04dffec55493` |
| Edition | `YANEURAOU_ENGINE_MATERIAL` |
| ENGINE | MATERIAL |
| MATERIAL_LEVEL | `1` |
| TARGET_CPU | `WASM` |
| COMPILER | `em++` |
| Toolchain target | Emscripten `4.0.15` |

V9.00を維持する理由: 公式Release一覧では後発V9.40等はふかうら王Deep系であり、今回のMATERIAL integration基準を変更する根拠にならない。既存Integration Candidateの再現可能性も優先する。「最新だから」では変更しない。

Emscripten 4.0.15は2025-09-17の公式Releaseで、YaneuraOu V9.00（2025-09-19）直前の固定版として採用候補にする。実Buildを行っていないため`engine-manifest.json.emscriptenVersion`はnullのまま。

## Official Makefile WASM Facts

Pinned V9.00 Makefileで確認したupstream設定:

- pthread enabled
- `PTHREAD_POOL_SIZE=32`
- MATERIAL low-level initial memory: `138412032` bytes = 132 MiB
- maximum memory: `4294967296` bytes = 4 GiB
- stack: `67108864` bytes = 64 MiB
- memory growth enabled
- `--pre-js wasm_pre.js`
- MODULARIZE / web, worker, node environments

これらは**upstream default**でありiPhone最適値ではない。Source変更を行わずにThread数だけApplication Preset=1へしても、pthread pool/memory build設定そのものが消えるわけではない。

## Current Toolchain Audit

| Item | Result |
|---|---|
| `emcc` | NOT INSTALLED |
| `em++` | NOT INSTALLED |
| emsdk | NOT INSTALLED |
| system clang | present, but NOT an Emscripten substitute |
| Docker/Podman | unavailable |
| Official source checkout | not materialized in build container |
| Build | NOT RUN |
| Output JS | NOT PRODUCED |
| Output WASM | NOT PRODUCED |
| pthread worker | NOT PRODUCED |
| JS SHA-256 | NOT AVAILABLE |
| WASM SHA-256 | NOT AVAILABLE |
| Real USI | NOT RUN |

### Failure handling

何が起きたか: official build commandを実行できる`em++`が環境にない。

確認できた事実: pinned source/build settings、公式WASM API、Toolchain install procedure/4.0.15 release情報までは一次資料で確認済み。

原因: current sandboxにEmscripten toolchain/SDK artifactがなく、shell側network acquisitionも成立しない。

未確認事項: generated V9.00 glueの実binary behavior、Browser pthread startup、iOS Safari memory/thermal、Real Engine評価品質。

採用判断: **Build成功とは扱わない。ReflectionLocalへ黙って置換しない。**

代替案: Build再現Script/manifest/fail-closed Runtime Gate/Formal Gateまで実装し、Emscriptenが使える環境でのみReal Gateを再実行する。

## Reproduction Command

```bash
./emsdk install 4.0.15
./emsdk activate 4.0.15
source ./emsdk_env.sh
emcc --version
em++ --version

# official source exact checkout
# git checkout a5ee2786c0030edc7d4a1cdfe94b04dffec55493

./scripts/build-yaneuraou-wasm.sh /path/to/YaneuraOu
```

Build helper内のmake:

```bash
make -j1 normal \
  TARGET_CPU=WASM \
  COMPILER=em++ \
  YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL \
  MATERIAL_LEVEL=1
```

成功後に`finalize-yaneuraou-manifest.mjs`がJS/WASM/worker SHA-256を記録する。ただし`available=true`だけでは正式完成ではなく、Real E2EとLicense Gateが別途必要。
