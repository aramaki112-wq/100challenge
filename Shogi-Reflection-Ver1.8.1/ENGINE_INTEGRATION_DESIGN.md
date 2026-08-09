# ENGINE_INTEGRATION_DESIGN — Ver.1.8

## Architecture Boundary

```text
Browser UI
  ↓
AnalyzeGame / Engine Application Service
  ↓
ShogiEnginePort
  ↓
USI-compatible Engine Adapter
  ↓
YaneuraOuWasmAdapter
  ↓
BrowserWorkerUsiTransport
  ↓
YaneuraOuWasmWorkerBootstrap
  ↓
YaneuraOu WASM
```

Application/Domainは `YaneuraOu`, `WASM`, `MATERIAL`, `NNUE`, `水匠` を直接参照しない。

## Runtime Resolution

1. Explicit Provider override
2. Mock/Development override
3. Explicit external USI Worker
4. `engine-manifest.json.available === true` の検証済みBundled YaneuraOu WASM
5. ReflectionLocalEngine fallback

Primaryのinitialize失敗時だけFallbackを許可する。棋譜解析途中でEngineを混ぜると評価基準が混在するため、途中切替はしない。

## USI

Parser/Adapterの責任として以下を扱う。

- `usi` / `usiok`
- advertised optionの取得
- `setoption`
- `isready` / `readyok`
- `usinewgame`
- `position sfen ...`
- `go depth/nodes/movetime`
- `info score cp`
- `info score mate`
- `info multipv`
- `info depth/nodes/time/pv`
- `bestmove`
- `stop`
- `quit`
- timeout / worker crash

`info` parserはtokenの絶対順序に依存しすぎない。PV後に別info keywordが現れる場合はPVをそこで打ち切る。

## Evaluation Flow

各実戦plyについて利用者本人が指した手だけをCandidate対象にする。

```text
Position Before
→ Engine analysis
→ Best Move + Best Evaluation + short PV
→ Actual Move
→ Position After
→ Engine analysis of actual result
→ normalize both to user perspective
→ Best-vs-Actual difference
→ Candidate Ranking
```

`evaluationBefore` は互換性のため残すが、Ver.1.8 UIでは「指す前の局面から得られたEngine Best Evaluation」として解釈する。`evaluationAfter` は実戦手後局面の評価。新規に `bestEvaluation`, `actualEvaluation`, `bestMoveDifferenceCp`, `bestMovePv` を持てる。

## Mate

CPへ巨大値変換しない。Mate/Mated/Unknown/Errorを別typeとして保持し、Candidate RankingではMate transitionへ専用priorityを与える。

## Cancel

```text
Cancel button
→ Application Service abort
→ Adapter stop
→ Transport/Worker
→ Engine stop
→ timeout/crash時はWorker terminate
→ 再解析可能状態
```

Pageがbackgroundへ移行した場合もresource safetyのためactive analysisを停止する。

## Privacy

棋譜解析はBrowser内Local Engineを前提とする。今回追加したEngine codeは棋譜を外部解析Serverへ送信しない。公式Source取得やBuild Toolchain取得は開発時Networkであり、対局解析時Networkとは分離する。

## Current Real Engine Gate

Adapter境界までは実装済みだが、公式YaneuraOu WASM binary自体はこの成果物に存在しない。従ってReal YaneuraOu E2Eは未達。
