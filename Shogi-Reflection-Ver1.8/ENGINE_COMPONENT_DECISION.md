# ENGINE_COMPONENT_DECISION — Shogi Reflection Ver.1.8

確認日: 2026-08-09

## Final Decision

Ver.1.8正式ZIPの標準Engineは、Application内で新規実装した **Shogi Reflection Local Engine 1.0.0** とする。

```text
Browser UI
  ↓
AnalyzeGame
  ↓
ShogiEnginePort
  ↓
ReflectionLocalEngineAdapter
  ↓
BrowserWorkerUsiTransport
  ↓
ReflectionLocalEngineWorker.js
```

これはVerification Mockではない。SFEN局面を受け取り、合法手候補を生成し、短い探索と局面評価を行い、USI形式の`info`/`bestmove`を返す実解析Engineである。一方、最大棋力を狙ったEngineではなく、Material・簡易King Safety・短い探索を中心にした**軽量Baseline**である。棋力・Candidate品質にはKnown Limitationがある。

## 調査した方式

| 方式 | Ver.1.8判断 | 理由 |
|---|---|---|
| A. YaneuraOu WASMをBrowser内蔵 | 今回は不採用 | 公式SourceはWASM/Emscripten経路を持つが、今回の環境で再現Buildできず、評価関数Fileの配布Gateも組合せごとに確定できないため |
| B. Web Worker + WASM | 将来第一候補 | UI Threadを避けやすい。YaneuraOuのWASMを採る場合もWorker境界へ閉じ込める |
| C. External Engine Connector | 維持 | 既存`YaneuraOuEngineAdapter`と`SHOGI_REFLECTION_ENGINE_WORKER_URL`を保持。第三者Assetを正式ZIPへ同梱しない |
| D. Desktop Native USI | 将来候補 | PCではNative Engine差替えに適するがBrowser Ver.1.8の範囲外 |
| E. First-party JavaScript Worker Engine | **Ver.1.8採用** | Binary/Weight不要、Local解析、License明確、WorkerでMain Threadを避け、現在の目的に対して安全に検証可能 |

## YaneuraOu調査結果

- Official Repository: https://github.com/yaneurao/YaneuraOu
- License: GPL-3.0
- USI / MultiPV: 公式READMEで対応を確認。
- Public named release investigated: `V9.00`, release commit `a5ee278`。
- 公式`source/Makefile`には`TARGET_CPU = WASM`、`COMPILER = em++`、WASM向けEmscripten linker option、`yaneuraou.js`出力経路が存在する。
- 同MakefileのWASM設定はPthreadsや大きいInitial/Maximum memoryを含む。これをそのままSmartphone最適値とは扱わない。
- 公式READMEはEngine source licenseをGPLv3としている一方、Evaluation Function/Modelは別途確認が必要。NNUE等の任意WeightをEngine本体と同一Licenseと推定しない。

## 採用Engine

- Component: Shogi Reflection Local Engine
- Version: 1.0.0
- Source: `ReflectionLocalEngineWorker.js`
- Adapter: `ReflectionLocalEngineAdapter.js`
- Worker source SHA-256: `86e9e5975347f3d511d9143304b74f8d332610c2fcb856e4407c640861219dc8`
- Adapter SHA-256: `378274d8a6cee9aedc331fbf7e1b7dcaa6503aa3bd0bad76fdada8c29f2d22fc`
- License: existing Application MIT License
- Copyright: `Shogi Reflection Interlude contributors`
- Evaluation Model: `Material + mobility + king-safety heuristic`
- Evaluation Model Version: 1.0.0
- External Weight: none
- Network: none
- Runtime: Browser classic Web Worker

## Smartphone適性

設計上の優先順位は Stability → Memory → Responsiveness → Cancel → Battery → Thermal → Candidate品質 → 最大棋力。標準Presetは1 thread、低い探索Depth/Nodes/Time、最大解析手数を持つ。これらは**保守的な初期値**であり、Physical iPhoneで最適値と実証したものではない。

## Known Limitation

1. 強豪将棋Engine相当の棋力を保証しない。
2. 評価はMaterial中心の軽量heuristicで、序盤・駒組み・長い読みを正確に理解できない場合がある。
3. 打ち歩詰め等、競技Engine級の全Rule最適化・探索最適化を目的としていない。
4. Candidateは「考え直す入口」であり、重要局面の自動確定には使わない。
5. Physical iPhoneのBattery/Thermal/Worker memoryは未測定。

## 将来差し替え

`AnalyzeGame`は`ShogiEnginePort`だけへ依存する。YaneuraOu WASMまたはDesktop Native USIを導入するときはAdapter/Transportより外側だけを差し替え、Replay、Candidate Domain、GameReview Domainを作り直さない。
