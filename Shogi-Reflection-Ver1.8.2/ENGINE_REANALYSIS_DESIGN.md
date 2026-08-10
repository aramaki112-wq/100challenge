# ENGINE RE-ANALYSIS DESIGN — Ver.1.6

## 1. Purpose

Engineや評価Modelが更新されても同じ棋譜を再解析し、過去結果を追跡可能にする。

## 2. Analysis State

Conceptual states:

- UNANALYZED
- ANALYZING
- ANALYZED
- FAILED
- CANCELLED
- REANALYZABLE

Game Statusとは別概念。

## 3. History Preservation

`EngineAnalysisRepository` はGame IDごとに解析結果配列を持つ。

```text
Game A
  analysis #1: Engine X / Model A / 2026-08-09
  analysis #2: Engine X / Model B / 2026-09-01
  analysis #3: Engine Y / Model C / 2027-01-10
```

新しい解析はappendし、古い解析を無条件に上書きしない。

## 4. Current Result

UIは最新保存ResultをCurrent Referenceとして表示する。
Buttonは「現在設定で再解析」とし、Applicationが「本当に最新版Engine」と保証していないことを明確にする。

## 5. Metadata Comparison

再解析判定で将来比較する項目:

- engineName
- engineVersion
- evaluationModel
- evaluationModelVersion
- analysisSettings
- analysisSchemaVersion

どれかが変われば「再解析価値あり」と判定できる。
Ver.1.6では自動Update checkerは実装しない。

## 6. Failure

新しい再解析が失敗しても、以前のANALYZED結果はRepositoryから破壊しない。
Cancel時も同様。

## 7. Persistence

Engine AnalysisはGameReviewとは別LocalStorageへ保存する。
既存Backup/Restore schemaは変更しない。

## 8. Future Upgrade

次段階では:

1. Configured Engine Metadata取得
2. latest stored metadataと比較
3. `REANALYZABLE` badge表示
4. Userが明示的に再解析
5. Reference KIFでRegression比較

自動で全対局を再解析しBattery/CPUを消費しない。
