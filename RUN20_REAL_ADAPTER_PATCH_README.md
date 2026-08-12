# Shogi Reflection Ver.1.8.3 — Run #20 Real Adapter Integration Gate

## 目的

Run #19で成立したReal YaneuraOu WASM Runtimeを、既存Shogi Reflection Architectureへ一段だけ戻します。

今回の中心は新機能追加ではありません。

```text
ShogiEnginePort
↓
YaneuraOuWasmAdapter
↓
BrowserWorkerUsiTransport
↓
production YaneuraOuWasmWorkerBootstrap.js
↓
Real YaneuraOu WASM
```

を実際のBrowserで通します。

## 解析対象

平手初期局面1局面のみ。

設定：

- Threads=1
- Hash=16MB
- MultiPV=2
- go nodes 5000

確認：

- initialize
- Real engine identity
- Domain Position → SFEN
- evaluation CP/MATE
- bestMove
- depth
- nodes
- time
- MultiPV rank 1 / 2
- PV
- dispose / quit

## 既存Application

ProductionのAdapter / Transport / Position Mapper / Domain Modelは変更しません。
Run #20は検証Harnessと独立Workflowのみ追加します。

## Formal Status

NOT FORMAL。

成功後もSample KIF full-ply、Evaluation Graph、Good/Bad Candidate、Replay、KeyPosition、STEP4、Cancel/Re-analysis、Formal ZIP Gateが残ります。
