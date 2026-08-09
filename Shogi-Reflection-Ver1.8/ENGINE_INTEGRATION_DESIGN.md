# ENGINE_INTEGRATION_DESIGN — Ver.1.8

## 1. Goal

EngineをApplicationの必須Dependencyにせず、Browser内の実解析を`ShogiEnginePort`の外側へ差し込む。Engineは「重要局面の決定者」ではなく候補提示者である。

## 2. Runtime Architecture

```text
BrowserEngineAnalysisView
        ↓
     AnalyzeGame
        ↓
   ShogiEnginePort
        ↓
ReflectionLocalEngineAdapter
        ↓
BrowserWorkerUsiTransport
        ↓
ReflectionLocalEngineWorker.js
```

既存の`YaneuraOuEngineAdapter`も保持する。Domain/Applicationから特定Engine名、WASM、NNUEを参照しない。

## 3. Provider Resolution

`BrowserEngineProvider.resolveBrowserEngine()`は以下の順でEngineを解決する。

1. `ShogiReflectionEngineProvider.createEngine()`が明示されていれば外部Provider
2. verification flag/queryがあればMock（test専用）
3. `SHOGI_REFLECTION_ENGINE_WORKER_URL`があれば外部USI Worker + YaneuraOu-compatible Adapter
4. 通常はfirst-party `ReflectionLocalEngineAdapter`
5. Worker APIがなければ`ENGINE_NOT_FOUND`

Mockを正式Runtime defaultへしない。

## 4. USI Boundary

`UsiEngineAdapter`が以下を担当する。

- `usi` / `usiok`
- `isready` / `readyok`
- `setoption Threads`
- `setoption USI_Hash`
- `setoption MultiPV`
- `position sfen ...`
- `go depth/nodes/movetime`
- `info score cp/mate ... pv`
- `bestmove`
- `stop`

`AnalyzeGame`はUSI文字列を知らない。

## 5. Local Engine

`ReflectionLocalEngineWorker.js`はSFENをparseし、盤面/持駒を内部Stateへ変換する。基本的な合法手候補、成り、駒打ち、二歩、王手放置除外を処理し、Material +簡易King Safetyを評価する。短い2-ply searchでbestmove/MultiPVを生成する。

目的は高棋力ではなく、振り返り候補の入口をLocalで提供し、将来強いEngineへ差し替えられる実Integrationを成立させること。

## 6. Position History Reuse

棋譜再現は二重実装しない。

```text
KIF
 ↓
PositionHistoryBuilder
 ↓
PositionHistory
 ↓
AnalyzeGame
 ↓
UsiPositionMapper
 ↓
Engine
```

各plyのbefore/after evaluationを既存`EvaluationNormalizer`で本人視点へ統一し、既存`EvaluationDelta`/`EngineCandidateSelector`へ渡す。

## 7. Evaluation Types / Mate

Engine result layerはCP/MATE/UNKNOWNを維持する。Mateを巨大なcentipawnへ潰さない。Transport/parse errorはEngine Errorとして候補計算から分離する。

## 8. Resource Policy

- Threads: 1
- Hash setting: 16MB standard（Local engineはTT未実装のためcompatibility metadata）
- Depth: 2
- Nodes/Time: conservative preset
- Max plies: FAST 160 / STANDARD 200 / DETAILED 240
- Cancel: `AnalyzeGame.cancel()` → Adapter `stop` → Worker termination
- Timeout: Adapter wait timeout
- Crash: Worker error → `ENGINE_CRASH`
- Missing Worker: graceful failure
- Browser reload: in-progress Workerは破棄、完了済み結果だけPersistence対象
- Background: `visibilitychange`でactive analysisをcancel
- Low memory: reliable browser signalがないため、事前BudgetとWorker error handlingで防御

これらはPhysical iPhoneで最適と実証した値ではない。

## 9. Main Thread

探索はclassic Web Workerで行う。UI側はprogress message/renderだけを処理し、長時間Search loopをMain Threadで実行しない。Local Worker searchはroot move間でyieldし`stop` messageを受信可能にする。

## 10. Candidate → Replay

Candidate Cardの`data-engine-replay-ply`は`ShogiReplayController.jump(ply)`を呼ぶだけ。Candidate専用Replay State/Boardを作らない。ReplayScrollPolicyはMove List Container内だけを追従させる。

## 11. Candidate → KeyPosition

Candidate Addは対象plyへReplayをjumpした後、既存`addCurrentReplayPositionToKeyPosition()`へ渡す。Engine専用KeyPosition Entityを作らない。FACT/INTERPRETATION/HYPOTHESISは空欄のまま。

## 12. Graceful Degradation

Engine initialization/analysisが失敗してもGameReview/Replay/Manual KeyPosition/Markdown/Observation Card/Backup/Restoreは停止しない。Engine ViewだけがFAILED/NOT_AVAILABLEを表示する。

## 13. Re-analysis / Metadata

解析結果にはEngine name/version、evaluation model/version、settings、date、schema versionを保存する。Engine Analysis schemaはVer.1.7互換の`1`を維持し、Ver.1.8追加情報はOptional metadataとして保存する。

## 14. Security / Privacy

Local Engineには`fetch`等のNetwork送信処理を実装しない。KIFを外部へUploadしない。Third-party remote Engine APIはVer.1.8 formal baselineでは使用しない。

## 15. YaneuraOu Swap Path

将来、License/Build/Evaluation Gateを通したWASMを採用する場合:

```text
ReflectionLocalEngineAdapter
    ↓ replace adapter only
YaneuraOuEngineAdapter
    ↓
BrowserWorkerUsiTransport
    ↓
Audited WASM/Worker
```

Replay DomainやCandidate Domainを変更しない。
