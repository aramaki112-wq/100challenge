# Ver.1.7 Learning Roadmap

## 今回学ぶこと
1. **Flow Design** — 正しい機能を正しい思考順序へ置く。
2. **Application Service再利用** — Candidateから既存Replay/KeyPositionへ接続し、Domainを増やしすぎない。
3. **Graceful Degradation** — EngineをOptional Dependencyとして扱う。
4. **Presentation Isolation** — SVG/CSS品質改善をDomain変更へ波及させない。
5. **Regression Thinking** — Fixed GridやScrollなど一度解決した問題を再発させない。
6. **Visual Verification** — DOM TestとScreenshot目視を分ける。
7. **Release Verification** — 作業FolderだけでなくZIP展開物をSourceとして最後に再試験する。

## 次Versionへ持ち越す学習候補
- 実Engine Runtime導入時のMobile/PC Adapter分離
- 解析Jobの中断・再開・省電力設計
- 実機でのBattery / Thermal / Memory計測
- Candidate説明をAI Advice Layerへ接続する場合の責務分離
- 外部USI Engine設定をPC向けに提供する場合のUX

---

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
