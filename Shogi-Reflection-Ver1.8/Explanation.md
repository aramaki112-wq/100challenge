# Ver.1.8 Explanation — Real Engine Integration・License Gate・STEP3 UI改善

## 今回の変更

Ver.1.8はVer.1.7のEngine Port/Adapter設計を作り直さず、Portの外側へfirst-party Real Local Engineを差し込んだ。これによりBrowser内で実際のSFEN局面を評価し、棋譜全体の評価値変化から振り返り候補を生成できる。

同時にSTEP3の思考順序を改善した。Engine PanelをReplay Boardより前へ置き、まず解析して見る価値のある局面を知り、その後に既存Replay盤で確認する。盤面反転はReplay Navigation内へ移動し、390px前後ではWrapする。

## Real EngineとMockの違い

Verification MockはArchitecture/UI Test用に残すが、正式Runtime defaultではない。標準Engineは`ReflectionLocalEngineWorker.js`で、局面解析・合法手候補・簡易探索・評価・bestmove/MultiPVをWorker内で実行する。

## なぜYaneuraOuを直接同梱しなかったか

やねうら王は強力な候補で、公式SourceにUSI/MultiPV/WASM build pathがある。しかし今回、公式SourceからWASMを再現BuildできるEmscripten環境を用意できず、具体的Evaluation Weightの再配布条件も組合せ単位で固定できなかった。

「動きそうなprebuilt binaryを拾って入れる」ことはLicense Gateと再現性を壊す。そこでVer.1.8では権利が明確なfirst-party baselineを採用し、YaneuraOu Adapter境界を残した。

## Evaluation Flow

```text
Position History
 → Engine raw evaluation
 → Evaluation Normalization（本人視点）
 → before/after delta
 → Candidate Ranking
 → Candidate Card
```

MateはCPへ潰さず別typeとして扱う。

## Human-in-the-loop

CandidateはEngineの判決ではない。本人がReplayで盤面を確認し、必要なものだけ既存KeyPositionへ追加する。FACT/INTERPRETATION/HYPOTHESIS、Observation Theme、Execution RuleをEngineが自動記入しない。

## Resource Safety

標準Presetは1 thread、低Depth/Nodes/Time、最大解析plyを持つ。Background移行ではCancelする。Main Threadで長い探索Loopを回さない。Physical iPhoneでBattery/thermalを実測していないため「最適」「軽い」と断言しない。

## Storage Compatibility

GameReview/Backup schemaを変更しない。Engine Analysis schemaもVer.1.7の1を維持し、追加情報はOptional metadata。巨大探索Treeは保存しない。

## License as Architecture

外部Engine本体、WASM toolchain、Evaluation File、Weightを別Componentとして監査する。Current formal ZIPにはthird-party Engine/Weightを同梱しないため既存MIT Licenseを変更していない。
