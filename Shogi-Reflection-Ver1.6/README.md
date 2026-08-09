# Shogi Reflection Ver.1.6

将棋の棋譜を保存し、Replayし、自分で重要局面を振り返るためのBrowser Application。
Ver.1.6では、**Engineが振り返る価値のある局面候補を見つけるLayer**を追加した。

## Ver.1.6の原則

- Engineは答えを押し付けない。
- Engine Candidateを自動でKeyPositionへ登録しない。
- FACT / INTERPRETATION / HYPOTHESISは本人が書く。
- Engineが無くても既存機能を利用できる。
- 特定のYaneuraOu／Suisho VersionへApplicationを密結合しない。
- Engine LicenseとApplication Licenseを分離する。

## 7 Steps

1. STEP1 棋譜登録
2. STEP2 対局情報
3. STEP3 棋譜再現
4. STEP4 重要局面
5. STEP5 振り返り
6. STEP6 次局の観察テーマ／実行Rule
7. STEP7 最終レポート

## Quick Start

```bash
python3 -m http.server 8000
```

`http://localhost:8000/` を開く。

## Test

```bash
npm test
npm run check
python3 browser_verify.py
```

Browser Verificationは390×844 ChromiumでVerification Mock Engineを明示利用する。
Mockは棋力を持たず、実局解析用ではない。

## Engine Architecture

```text
Browser UI
  -> AnalyzeGame
  -> ShogiEnginePort
  -> YaneuraOuEngineAdapter
  -> UsiEngineAdapter
  -> Transport
  -> External Engine / Evaluation Model
```

Application ServiceはUSI commandを直接扱わない。

## Engine Setup

本ZIPはEngine Binary、WASM Worker、水匠、NNUE/SFNN評価Fileを同梱しない。
未設定時は手動振り返りを利用する。

開発者用のBrowser差替え点:

```js
window.ShogiReflectionEngineProvider = {
  async createEngine() {
    return myAdapter;
  }
};
```

または起動前に:

```js
window.SHOGI_REFLECTION_ENGINE_WORKER_URL = "/engine/usi-worker.js";
window.SHOGI_REFLECTION_ENGINE_METADATA = {
  engineVersion: "...",
  evaluationModel: "...",
  evaluationModelVersion: "..."
};
```

## Verification Mock

`?engine=mock` はBrowser Test用途のみ。
画面に `Verification Mock Engine` と明示される。

## Storage

GameReview:
- 既存LocalStorage / Backup schemaを維持。

Engine Analysis:
- separate key `shogi-reflection-interlude.engine-analyses.v1`
- re-analysis historyを保持
- 既存Game Backupには含めない

## License

Applicationの既存 `LICENSE` は変更していない。
Engine/評価Modelは別License。
詳細は:

- `ENGINE_LICENSE_AUDIT.md`
- `ENGINE_FEASIBILITY_AUDIT.md`

## Important Documents

- `Ver.1.6操作手順書.md`
- `ENGINE_INTEGRATION_DESIGN.md`
- `ENGINE_CANDIDATE_SELECTION_DESIGN.md`
- `ENGINE_REANALYSIS_DESIGN.md`
- `ENGINE_UPDATE_GUIDE.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `COMPLETION_REPORT.md`
