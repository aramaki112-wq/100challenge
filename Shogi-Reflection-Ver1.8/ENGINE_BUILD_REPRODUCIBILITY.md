# ENGINE_BUILD_REPRODUCIBILITY — Shogi Reflection Ver.1.8

確認日: 2026-08-09

## 1. Ver.1.8正式Baseline

Shogi Reflection Local Engineはtranspile/bundleを必要としないfirst-party JavaScript Workerである。

- Source: `ReflectionLocalEngineWorker.js`
- Version: 1.0.0
- Build Date: 2026-08-09
- Compiler: N/A（BrowserがJavaScript sourceを直接実行）
- Build Command: N/A
- Build Option: classic Web Worker / single worker
- Output: source file itself
- SHA-256: `86e9e5975347f3d511d9143304b74f8d332610c2fcb856e4407c640861219dc8`
- Evaluation File: none
- Model/Weight: none

再現確認:

```bash
sha256sum ReflectionLocalEngineWorker.js
node --test RealEngineAdapterV18.test.js EngineWorkerV18.test.js RealEngineE2EV18.test.js
```

## 2. YaneuraOu WASM調査Build

### Source
- Repository: https://github.com/yaneurao/YaneuraOu
- Public release investigated: V9.00
- Release commit: `a5ee278`
- License: GPL-3.0

### 公式Sourceで確認できたWASM経路
公式`source/Makefile`には以下の設計がある。

- `TARGET_CPU = WASM`
- `COMPILER = em++`
- `ENVIRONMENT=web,worker,node`
- Pthreads
- Memory growth
- `yaneuraou.js` output
- NNUE WASM SIMD source

### 今回のBuild実績
**NOT BUILT.** この実行環境に`em++`/Emscripten toolchainがなく、公式Sourceからの再現Buildとoutput hash固定を実行できなかった。そのため第三者作成WASMを代用して正式ZIPへ入れていない。

### 将来の再現Build Gate
YaneuraOu WASMを正式採用する前に、少なくとも以下を固定する。

1. Source release/tag/commit
2. Emscripten version/commit
3. exact Makefile options
4. Evaluation architecture
5. Evaluation File exact source/license/hash
6. output `.js`/`.wasm` hash
7. required pthread/worker auxiliary files
8. build log
9. corresponding source package
10. license/notice/source offer plan

評価関数権利が不明なまま`nn.bin`等をBuildへ埋め込まない。
