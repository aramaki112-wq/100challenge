# Shogi Reflection Ver.1.8

棋譜を保存し、Replayし、**実Local Engineが「考え直す価値がありそうな局面」を候補提示し、本人が重要局面を決める**Browser Applicationです。

Ver.1.8はVer.1.7をSource of Truthとして、大規模再構成せず次を追加しました。

- first-party Real Local Engine 1.0.0
- Browser Web WorkerでMain Threadから解析を分離
- USI-compatible Adapter/Transportを既存`ShogiEnginePort`の外側へ維持
- Position History → Evaluation →本人視点Normalize → Candidate Ranking
- Candidate → 既存Replay → 既存KeyPosition
- Analysis progress / Cancel / Re-analysis / Engine metadata
- STEP3でEngine PanelをReplay Boardより前へ移動
- Board FlipをReplay Navigationへ移動
- 390px前後でReplay操作をWrapし横scrollを回避
- License Gate / Distribution Readiness / Build Reproducibility資料

## 中心Flow

```text
KIF登録
  ↓
棋譜保存
  ↓
保存済み対局を開く
  ↓
STEP3 棋譜再現
  ↓
棋譜を解析する
  ↓
Local Web Worker Engine
  ↓
評価値変化
  ↓
振り返り候補 0〜5件
  ↓
局面を見る
  ↓
既存ReplayへJump
  ↓
本人が盤面を確認
  ↓
必要なら重要局面へ追加
  ↓
STEP4 FACT / INTERPRETATION / HYPOTHESIS
```

Engine Candidateを自動でKeyPositionへ登録しません。Engineを使わない手動Replay/重要局面追加も維持します。

## 7 STEP

1. STEP1 棋譜登録
2. STEP2 対局情報
3. STEP3 棋譜再現
4. STEP4 重要局面
5. STEP5 振り返り
6. STEP6 次局の観察テーマ／実行Rule
7. STEP7 最終レポート

STEP8は追加していません。

## Real Engine Baseline

- Engine Name: `Shogi Reflection Local Engine`
- Engine Version: `1.0.0`
- Adapter: `ReflectionLocalEngineAdapter`
- Worker: `ReflectionLocalEngineWorker.js`
- Evaluation Model: `Material + mobility + king-safety heuristic`
- Evaluation Model Version: `1.0.0`
- External Model/Weight: none
- Network upload: none
- Runtime: local Web Worker

このEngineはMockではなく、局面から合法手候補を生成し、短い探索を行う実Engineです。ただし強豪Engine級の棋力を狙ったものではありません。振り返り候補抽出の安全なBaselineであり、Candidate品質には限界があります。

## Resource Policy

標準設定はSmartphone-firstの安全側初期値です。最適値とは表現しません。

| Preset | Depth | Nodes目安 | 1局面Time目安 | MultiPV | Threads | Hash設定 | Max Plies |
|---|---:|---:|---:|---:|---:|---:|---:|
| FAST | 2 | 900 | 80ms | 2 | 1 | 16MB* | 160 |
| STANDARD | 2 | 1600 | 120ms | 3 | 1 | 16MB* | 200 |
| DETAILED | 2 | 3200 | 220ms | 3 | 1 | 24MB* | 240 |

`*` Local BaselineはTransposition Tableを実装しておらず、Hash値はAdapter互換のResource ceiling metadataです。将来USI Engineでは`USI_Hash`へ渡せます。

Background移行時は実行中解析を中止します。Reload時はWorkerも終了します。巨大探索Treeは保存しません。

## Architecture

```text
Browser UI
  ↓
AnalyzeGame
  ↓
ShogiEnginePort
  ↓
Engine Adapter
  ↓
Transport
  ↓
Engine Worker
```

Application DomainからYaneuraOu/WASM/NNUE/特定Versionを参照しません。

## YaneuraOu / WASM

YaneuraOu公式Source・LICENSE・Makefile・releaseを2026-08-09時点で一次資料確認しました。公式SourceはGPLv3で、USI/MultiPVおよびEmscripten/WASM build pathを持ちます。ただし今回の環境では公式Sourceから再現可能なWASM Buildを実行できず、具体的Evaluation WeightのDistribution Gateも確定していません。

そのためVer.1.8正式ZIPへYaneuraOu Binary/WASM/Weightを入れていません。将来は`YaneuraOuEngineAdapter`の外側だけを差し替えます。

詳細:
- `ENGINE_COMPONENT_DECISION.md`
- `ENGINE_BUILD_REPRODUCIBILITY.md`
- `ENGINE_LICENSE_AUDIT.md`
- `ENGINE_SOURCE_DISTRIBUTION_PLAN.md`
- `DISTRIBUTION_LICENSE_CHECKLIST.md`
- `THIRD_PARTY_NOTICES.md`

## 起動

`index.html`をBrowserで開きます。Module/Workerの制約があるBrowserでは、VS Code Live Server等のlocal static serverを利用してください。

## Test

```bash
npm test
npm run check
python3 browser_verify.py
python3 real_engine_browser_verify.py
python3 visual_verify.py
python3 performance_verify.py
```

`browser_verify.py`は広範なUI regressionをVerification Mockで確認します。`real_engine_browser_verify.py`は別途Actual Blob Web Worker Engineを使い、Real Engine E2Eを確認します。両者を混同しません。

## Verification Scope

- Automated: Node test
- Browser regression: Chromium / Playwright / 390×844
- Real Engine Browser: Chromium / actual Blob Web Worker / 390×844
- Visual: screenshots
- Static: imports, paths, required files, hashes
- Physical iPhone: **NOT TESTED**
- Battery/Thermal: **NOT MEASURED**
- Worker-specific memory: browser API制約により完全計測していない

## License

既存Application `LICENSE`（MIT）を変更していません。正式ZIPにはunknown-license external assetを同梱しません。
