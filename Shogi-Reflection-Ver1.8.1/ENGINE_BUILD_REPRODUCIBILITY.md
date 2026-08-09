# ENGINE_BUILD_REPRODUCIBILITY

更新日: 2026-08-09

## Pinned Source

- Repository: `https://github.com/yaneurao/YaneuraOu`
- Release baseline: `V9.00`
- Commit: `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- Edition: `YANEURAOU_ENGINE_MATERIAL`
- MATERIAL_LEVEL: `1`
- Target: `WASM`
- Compiler frontend: `em++`

## Current Build Record

| Field | Value |
|---|---|
| Build Date | NOT BUILT |
| Emscripten Version | NOT RECORDED — `em++` unavailable in current verification environment |
| Build Command | prepared below |
| Output JS | NOT PRODUCED |
| Output WASM | NOT PRODUCED |
| pthread worker | NOT PRODUCED |
| JS SHA-256 | NOT AVAILABLE |
| WASM SHA-256 | NOT AVAILABLE |
| Worker SHA-256 | NOT AVAILABLE |
| Real USI smoke test | NOT RUN against official WASM |

この空欄を埋めずに `engine-manifest.json.available=true` へ変更してはならない。

## Reproduction Procedure

1. Official repositoryを取得する。
2. `git checkout a5ee2786c0030edc7d4a1cdfe94b04dffec55493`。
3. Officially supported emsdkを導入し、使用するexact versionを固定する。
4. `em++ --version` を記録する。
5. App rootから `./scripts/build-yaneuraou-wasm.sh /path/to/YaneuraOu` を実行する。
6. Scriptはcommit一致を確認してから次を実行する。

```bash
make -j1 normal \
  TARGET_CPU=WASM \
  COMPILER=em++ \
  YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL \
  MATERIAL_LEVEL=1
```

7. `yaneuraou.js` / `yaneuraou.wasm` / 生成される場合はpthread Workerを `engine/yaneuraou/` へ置く。
8. `finalize-yaneuraou-manifest.mjs` でSHA-256とCompiler versionを記録する。
9. USI handshake、1局面、Cancel、short/normal/long KIFを実WASMで確認する。
10. Smartphone Resource Test前に「最適」「軽量」「安全」と表現しない。

## Important: upstream WASM defaults are not our smartphone preset

Pinned MakefileのEmscripten pathには `PTHREAD_POOL_SIZE=32`、初期Memory、最大Memory、Stack等が設定される。これはupstream build configurationの確認値であり、390px iPhoneでの安全性を実測した値ではない。正式同梱する前に、Source patchの必要性・patch license/source disclosure・SharedArrayBuffer/COOP/COEP・Safari behaviorを別Gateで確認する。

## Current Environment Failure

- `em++`: not installed
- `emcc`: not installed
- emsdk: not installed
- したがって official-source WASM compile / output hash / real WASM E2E は未実施。

これは機能をLocal Engineで置き換えて「成功」と扱う理由にはならない。`ReflectionLocalEngine` はFallbackであり、YaneuraOuとは別Component/Engine Nameである。
