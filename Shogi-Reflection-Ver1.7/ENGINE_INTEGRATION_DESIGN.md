# ENGINE_INTEGRATION_DESIGN — Ver.1.7 Addendum

## UI位置
Ver.1.7ではEngine Analysis UIをSTEP4からSTEP3「棋譜再現」へ移す。Architecture自体はVer.1.6を維持する。

```text
STEP3 Browser UI
  -> AnalyzeGame
  -> ShogiEnginePort
  -> Engine Adapter
  -> Engine
```

`AnalyzeGame`、`ShogiEnginePort`、USI Adapter、Evaluation Normalization、EngineAnalysisRepositoryの責務は変更しない。

## Candidate接続
`局面を見る`はCandidateのplyを既存`ShogiReplayController.jump()`へ渡す。Candidate専用Boardは作らない。`重要局面へ追加`はReplayを同plyへ合わせた後、既存`KeyPositionReplayController` / `AddCurrentPositionToKeyPosition`へ接続する。

## Optional Dependency
実Engine未設定時は`BrowserEngineProvider`がGraceful Degradationを返す。GameReviewの保存やReplayはEngine Repositoryへ依存しない。

## Storage
Engine AnalysisはGameReviewとは別の既存Storeを使う。Ver.1.7のUI位置変更だけを理由とするschema migrationは行わない。

---

# ENGINE INTEGRATION DESIGN — Ver.1.6

## 1. Purpose

Engineを「Applicationの一部」ではなく「交換可能な外部能力」として扱う。
AI Advice Layerはこの境界へ入れない。

## 2. Architecture

```text
Browser UI
  |
  v
AnalyzeGame Application Service
  |
  v
ShogiEnginePort
  |
  +-----------------------------+
  |                             |
  v                             v
YaneuraOuEngineAdapter      Future Engine Adapter
  |
  v
UsiEngineAdapter
  |
  +-----------------------------+
  |                             |
  v                             v
BrowserWorkerUsiTransport   NodeChildProcessUsiTransport
  |                             |
  v                             v
WASM/Worker Engine          Local native USI Engine
  |
  v
Evaluation Model (external)
```

Testだけは `MockShogiEngineAdapter` をPortへ接続する。

## 3. Port

`ShogiEnginePort` が要求する最小Method:

- `initialize()`
- `analyzePosition()`
- `cancelAnalysis()`
- `getEngineInfo()`
- `dispose()`

Application Serviceは `usi`、`isready`、`position`、`go`、`score cp`、`score mate`、`MultiPV` commandを直接生成しない。

## 4. Input

Application側Input:

- Game ID
- `PositionHistory`
- Player Side
- Analysis Settings preset / generic settings
- Abort signal
- Progress callback

Positionは既存Replay Domainの `ShogiPosition` をSource of Truthとして使う。
`UsiPositionMapper` がSFEN／USI moveへ変換する。

## 5. Output

Engine AdapterからApplicationへ返すResultはEngine raw textではなく、次の独立Objectへ変換する。

- evaluation
- bestMove
- candidateMoves
- depth
- nodes
- multiPv
- analysisTime

`AnalyzeGame` がさらにGame-level resultへまとめる。

- gameId
- ply
- moveNumber
- sideToMove
- actualMove
- bestMove
- candidateMoves
- evaluationBefore / After / Delta
- engine metadata
- evaluation model metadata
- settings
- analyzedAt
- schemaVersion

## 6. Error Boundary

`EngineErrors.js` に次を定義する。

- ENGINE_NOT_FOUND
- ENGINE_INITIALIZATION_FAILED
- UNSUPPORTED_VERSION
- INVALID_RESPONSE
- TIMEOUT
- ANALYSIS_CANCELLED
- EVALUATION_FILE_MISSING
- ENGINE_CRASH
- UNSUPPORTED_BROWSER
- ANALYSIS_PARTIAL_RESULT

画面表示は日本語。
Engine未設定はApplication全体のFatal Errorにしない。

## 7. Cancel

Browser UIはAbortControllerと `AnalyzeGame.cancel()` を利用する。
Engine Adapterは `cancelAnalysis()` で現在探索を止める責務を持つ。
画面切替時も不要解析を残さない。

## 8. Version Metadata

最低限保存:

- engineName
- engineVersion
- evaluationModel
- evaluationModelVersion
- adapter
- analysisSettings
- analyzedAt
- schemaVersion

Engine更新後も古い解析結果の出所を判別できる。

## 9. Re-analysis

解析RepositoryはGameごとにHistory配列を保持し、新解析結果をappendする。
最新結果はUIへ表示するが、以前の解析結果を自動破棄しない。
詳細は `ENGINE_REANALYSIS_DESIGN.md`。

## 10. Persistence

GameReview Domain / Repository / Backup schemaへEngine fieldsを追加しない。
Engine Analysis専用:

- `EngineAnalysisRepository`
- `EngineAnalysisSnapshotService`
- `EngineAnalysisPersistenceCoordinator`
- `LocalStorageEngineAnalysisStore`

LocalStorage key:

`shogi-reflection-interlude.engine-analyses.v1`

既存Game backup schema version 1は変更しない。

## 11. Backup / Restore Decision

Ver.1.6では既存「Game Review Backup」にEngine Analysis cacheを**含めない**。
理由:

- 旧Backup互換を完全維持する。
- Engine結果は再生成可能なReference Data。
- Engine LicenseやModel Versionの巨大DataをGameReviewへ混入させない。

将来必要なら、Engine Analysis専用Backup Formatを別機能として追加する。

## 12. Security

Native Process:

- absolute engine path required
- shell=false
- Application inputから任意Shell commandを構築しない
- executable verification/hashは将来Installed Appで追加候補

Browser:

- Worker URLはApplicationに埋め込まず明示設定する
- 本ZIPは外部WASMを自動Downloadしない
- remote arbitrary scriptを既定で読み込まない

## 13. Test Strategy

Unit:

- Port contract
- USI parsing
- SFEN / move mapping
- Evaluation normalization
- Delta / mate transitions
- Ranking
- Metadata
- Re-analysis persistence
- Initialization / analysis / cancel error
- Engine missing

Browser:

- Explicit Mock Engine only
- analysis status/progress
- candidates
- candidate -> replay
- candidate -> KeyPosition
- cancel
- fixed grid / replay scroll regression

Real Engine:

- current execution environmentではBinaryを取得・実行できなかったため未確認。
- Mock resultをReal Engine resultとして記録しない。
