# Shogi Reflection Interlude — Ver.1.8 Challenge

## Challenge

ユーザー提供のVer.1.8 BaselineをSource of Truthとして、既存Architectureを壊さず次を成立させる。

1. Real YaneuraOuを`ShogiEnginePort`の外側へ接続できる構造にする。
2. YaneuraOu V9.00 / MATERIAL_LEVEL=1 / WASM buildを再現可能に固定する。
3. Good Candidate最大5 + Bad Candidate最大5にする。
4. Bad Candidateで実戦手 vs Engine推奨手を比較できるようにする。
5. Candidateの「局面を見る」だけReplay盤面まで自動Scrollする。
6. Candidate専用Replay/KeyPosition Domainを作らない。
7. Engineの評価と本人のFACT/INTERPRETATION/HYPOTHESISを混同しない。
8. Smartphoneでは最大棋力よりStability/Memory/Responsiveness/Cancelを優先する。
9. Engine/Weight/WASM/ToolchainのLicenseをArchitecture Gateとして扱う。
10. Real YaneuraOu WASMを実行できなければ正式完成と呼ばない。

## Current Gate Result

- Candidate/UI/Replay/Scroll/USI/Resource/Fallback/License docs: **implemented and tested**
- YaneuraOu official-source WASM build: **BLOCKED — Emscripten unavailable in current environment**
- Real YaneuraOu WASM E2E: **NOT RUN**
- Formal Ver.1.8 completion: **NOT ACHIEVED**

## Non-goals

- Engine最善手を唯一の正解として覚えさせること
- AIによるFACT/INTERPRETATION/HYPOTHESIS自動生成
- Candidateの自動KeyPosition登録
- STEP8追加
- 出所不明prebuilt binary / NNUE / 水匠WeightのBundling
- Physical iPhone性能を未測定のまま保証すること
