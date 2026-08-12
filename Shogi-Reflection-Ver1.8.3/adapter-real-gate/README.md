# Run #20 — YaneuraOu Real Adapter Integration Gate

このGateはFull Application E2Eではありません。

目的は、Run #19で成立したReal YaneuraOu WASM Runtimeを、完成済みのShogi Reflection Engine Architectureへ一段だけ戻すことです。

検証経路：

```text
InitialShogiPositionFactory
        ↓
ShogiEnginePort contract
        ↓
YaneuraOuWasmAdapter
        ↓
YaneuraOuEngineAdapter / UsiEngineAdapter
        ↓
BrowserWorkerUsiTransport
        ↓
YaneuraOuWasmWorkerBootstrap.js（既存production bootstrapのbyte-identical copy）
        ↓
Real YaneuraOu V9.00 MATERIAL WASM
```

1局面（平手初期局面）のみを解析し、以下を確認します。

- Real initialize / usiok / readyok
- `UsiPositionMapper`による実Domain Position → SFEN変換
- `setoption Threads / USI_Hash / MultiPV`
- `position sfen ...`
- `go nodes 5000`
- Evaluation（CPまたはMATE）
- Best Move
- depth / nodes / time
- MultiPV=2
- Candidate rank 1 / 2
- PV
- dispose / quit

## 重要

このGateが緑でもVer.1.8.3 Formal Completionではありません。

次の段階で、Sample KIF全ply、Evaluation Graph、Good/Bad Candidate、Replay、KeyPosition、STEP4、Cancel/Re-analysisへ接続します。
