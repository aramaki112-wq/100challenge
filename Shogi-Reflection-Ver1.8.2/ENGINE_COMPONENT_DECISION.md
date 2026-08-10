# ENGINE_COMPONENT_DECISION — Ver.1.8 Real YaneuraOu Integration

更新日: 2026-08-09

## 結論

Ver.1.8の第一候補は **YaneuraOu公式Source / V9.00 / commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493` / `YANEURAOU_ENGINE_MATERIAL` / `MATERIAL_LEVEL=1` / Emscripten WASM / Web Worker** とする。

ただし、この検証環境には `em++` / emsdk が存在せず、公式SourceからのWASM Buildを完了できなかった。したがって `engine/yaneuraou/engine-manifest.json` は `available:false` のままにし、**未検証BinaryをProduction Defaultとして偽装しない**。Browserは検証済みWASMが存在するときだけ `YaneuraOuWasmAdapter` を第一候補にし、存在しないときは名前を分けた `ReflectionLocalEngine` へ明示Fallbackする。

## なぜV9.00を固定したか

2026年の公式更新履歴にはV9.40、V9.60など、V9.00より新しい開発履歴がある。一方、公式Releasesには「やねうら王V9.00 GitHub版」が明示された再現可能なReleaseとして存在する。今回は「最新だから」ではなく、**初回Browser/WASM Integrationの再現性を優先**してV9.00のRelease commitを固定した。将来更新時は `ENGINE_UPDATE_GUIDE.md` に従い、Version/Commit/Makefile/USI/License/Resourceを再監査する。

## 採用Component

| Component | Decision | 理由 |
|---|---|---|
| ShogiEnginePort | KEEP | Domain/Applicationをspecific engineから隔離 |
| YaneuraOuWasmAdapter | ADOPT | USI Adapterの外側でYaneuraOu固有Metadataを保持 |
| BrowserWorkerUsiTransport | KEEP/EXTEND | Main Thread block回避、stop/terminate/crashを扱う |
| YaneuraOu V9.00 Source | PINNED CANDIDATE | Release commitを固定可能 |
| MATERIAL_LEVEL=1 | ADOPT FIRST | 外部NNUE WeightなしでIntegrationを切り分ける |
| Emscripten | REQUIRED, NOT AVAILABLE HERE | WASM生成Toolchain。Build時Version記録必須 |
| ReflectionLocalEngine | KEEP AS FALLBACK | Manual workflow継続、Development/Test、Graceful Degradation |
| 水匠/第三者NNUE Weight | NOT ADOPTED | 第二段階。権利監査前は同梱しない |
| Third-party prebuilt YaneuraOu WASM | REJECT | Official-source reproducibility/hash/source obligationを満たせないため |

## 公式Sourceで確認したBuild面

Pinned V9.00 `source/Makefile` には以下が存在する。

- `YANEURAOU_ENGINE_MATERIAL`
- `MATERIAL_LEVEL = 1`
- `TARGET_CPU = WASM`
- `COMPILER = em++`
- Emscripten時 `MODULARIZE=1`
- `EXPORT_NAME=YaneuraOu`
- `ENVIRONMENT=web,worker,node`
- pthread使用
- `PTHREAD_POOL_SIZE=32`
- `ALLOW_MEMORY_GROWTH=1`
- MATERIAL_LEVEL<5時の初期Memory 138,412,032 bytes
- 最大Memory 4GiB設定
- Stack 64MiB設定

これらは「公式設定」であって「iPhone最適値」ではない。特に32-thread poolとMemory設定はSmartphone向け正式Defaultにそのまま採用しない。

## 現在のGate

- Adapter/USI/Worker/Application接続: IMPLEMENTED + AUTOMATED TESTED
- Good/Bad Candidate + Best comparison + PV: IMPLEMENTED + TESTED
- Candidate -> Replay -> Board Scroll: IMPLEMENTED + BROWSER TEST TARGET
- Official YaneuraOu WASM Build: **BLOCKED / NOT BUILT**
- Official YaneuraOu Real E2E: **NOT RUN**
- Physical iPhone: **NOT TESTED**
- Public/Commercial bundled distribution: **NOT APPROVED**

このため、現在の成果物を「Ver.1.8正式完成」と判定してはならない。

## 一次資料

- Repository: https://github.com/yaneurao/YaneuraOu
- V9.00 commit: https://github.com/yaneurao/YaneuraOu/commit/a5ee2786c0030edc7d4a1cdfe94b04dffec55493
- Pinned Makefile: https://raw.githubusercontent.com/yaneurao/YaneuraOu/a5ee2786c0030edc7d4a1cdfe94b04dffec55493/source/Makefile
- Releases: https://github.com/yaneurao/YaneuraOu/releases
- 2026 update history: https://github.com/yaneurao/YaneuraOu/wiki/やねうら王の更新履歴2026
## Ver.1.8.2 Finalization Record

- Keep YaneuraOu V9.00 exact commit for MATERIAL integration reproducibility.
- Do not adopt later FukauraOu Deep releases as a substitute for this MATERIAL milestone.
- Do not bundle third-party prebuilt WASM or NNUE/Suisho weights.
- Runtime primary may be YaneuraOuWasmAdapter only after Build/Hash/Browser capability gates.
- Current package decision: **ReflectionLocal fallback usable; Real YaneuraOu component rejected for bundling because it was not built/verified.**
