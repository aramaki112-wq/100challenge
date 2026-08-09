# Ver.1.8 Learning Roadmap

## 今回学ぶこと

1. **Interface First** — 実装前にPortを固定し、Engine差替えをDomain変更から分離する。
2. **Worker Boundary** — CPU負荷の高い処理をUI Threadから分離する。
3. **Protocol Adapter** — USI文字列をApplication Serviceへ漏らさない。
4. **Evaluation Perspective** — 数値の符号より「誰視点か」を先に統一する。
5. **Human-in-the-loop** — Engine Candidateと本人の重要局面を分離する。
6. **Resource Budget** — Smartphoneでは最強設定より継続利用可能な上限を設計する。
7. **Graceful Degradation** — Optional Engineが落ちてもApplication本体を生かす。
8. **License Architecture** — Engine/Weight/WASM/ToolchainをDependency Gateとして監査する。
9. **Reproducible Build** — BinaryをSource/Version/Build/Hashまで追跡する。
10. **Real vs Mock Verification** — Test Doubleの証拠範囲を正しく表現する。

## 次Version候補

### 1. Audited YaneuraOu WASM Prototype
- Emscripten version pin
- official source commit pin
- material-only/権利明確evaluation候補調査
- smartphone memory test
- pthread/cross-origin isolation要件確認
- corresponding source package prototype

### 2. Physical iPhone Resource Profiling
- initialization time
- 30/60/100-ply analysis
- memory pressure
- battery consumption
- thermal state
- background/foreground recovery

### 3. Candidate Quality Evaluation
- 同一KIFをLocal Baselineと強いDesktop USI Engineで比較
- Candidate overlap
- missed critical positions
- false-positive review candidates
- good-move candidate usefulness

### 4. Desktop Engine Connector
- Native USI process isolation
- user-selected external engine
- version/hash metadata
- engine-specific settingsをUIへ漏らさないpreset layer

### 5. AI Advice Layer
Engine Analysisとは別Layerとして、本人が選んだKeyPositionの説明補助を検討する。FACT/INTERPRETATION/HYPOTHESISを勝手に確定しない原則を維持する。
