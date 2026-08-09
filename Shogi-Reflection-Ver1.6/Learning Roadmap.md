# Learning Roadmap — Shogi Reflection after Ver.1.6

## 現在地点

Ver.1.6で学んだ中心テーマ:

- Port / Adapter
- 外部Process境界
- USI
- SFEN
- Evaluation Perspective
- Mate Type
- Rule-based Ranking
- Re-analysis
- Version Metadata
- Graceful Degradation
- License Boundary

## 次の学習候補 1 — Real Engine Integration Validation

最優先で、利用者環境に合わせた実Engine接続をReference KIFで確認する。

- YaneuraOu binaryの正規入手
- 評価FileのLicense確認
- Desktop Process test
- Browser WASM testを行うならWorker化
- FAST/STANDARD/DETAILEDの実測
- Smartphone実機熱/Battery/Memory

これはAI Adviceより前に行ってもよい。

## 次の学習候補 2 — AI Advice Layer

Engineが選んだ局面について:

- なぜ問題だった可能性があるか
- 相手の狙い
- 見落とした観点
- 良かった受け/我慢
- 別の考え方

を自然言語で説明する。

Rule:

- AIはEngine scoreと本人の記述を分離
- FACT/INTERPRETATION/HYPOTHESISを上書きしない
- AI hallucinationをEngine factとして扱わない

## 次の学習候補 3 — 振り返り問題

KeyPosition Snapshotから:

- 次の一手
- 方針選択
- 相手の狙い
- 玉の安全確認

等の自分専用問題を作る。

## 次の学習候補 4 — 振り返り対局 / Spaced Repetition

3日後、1週間後、1か月後などに重要局面を再提示。
学習記録とEngine再解析のVersion差を分離する。

## 次の学習候補 5 — Installed App

比較対象:

- PWA
- Tauri
- Electron
- Native Wrapper

Engine連携面ではnative Processを安全に管理できる方式を重点評価する。
