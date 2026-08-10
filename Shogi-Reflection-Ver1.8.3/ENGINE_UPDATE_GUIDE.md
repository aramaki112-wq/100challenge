# ENGINE UPDATE GUIDE

## 目的

Application本体を大きく変更せず、Engine／Evaluation Modelを安全に更新する。

## 正式手順

```text
新Engine Version確認
↓
License確認
↓
Adapter Compatibility確認
↓
Engine Metadata更新
↓
Automated Test
↓
Reference KIF再解析
↓
Regression Test
↓
正式更新
```

## STEP 1 — 新Version確認

- Official Repository / Release / Wikiを確認。
- Release版とdevelopment masterを区別。
- tag/commit/dateを記録。
- 「最新版」という名称だけで採用しない。

## STEP 2 — License再監査

- Engine Source License
- Binary redistribution
- Evaluation Model License
- Commercial Use
- Bundling
- Runtime License

不明ならBundleしない。

## STEP 3 — Adapter Compatibility

最低限:

- USI handshake
- `isready`
- SFEN `position`
- analysis `go`
- `info score cp`
- `info score mate`
- MultiPV
- `bestmove`
- stop/cancel

Application ServiceへUSI差分を漏らさない。

## STEP 4 — Metadata

Engine Adapterが返す:

- engineName
- engineVersion
- evaluationModel
- evaluationModelVersion
- adapter

を正しい値へ更新する。

## STEP 5 — Automated Test

`npm test`

特に:

- Evaluation normalize
- Mate transition
- Candidate Ranking
- SFEN mapping
- USI parser
- cancel/error
- reanalysis

## STEP 6 — Reference KIF

同じReference KIFを旧/新構成で解析し:

- 正常完走
- score perspective
- candidate move format
- mate format
- MultiPV format
- crash/timeout

を比較する。

## STEP 7 — Regression

- KIF Import
- Replay
- Replay Scroll
- Fixed Grid
- Snapshot
- KeyPosition
- Backup/Restore
- Markdown Export
- Observation Card

Engine更新を理由に既存Domainを変更しない。

## STEP 8 — 正式更新

- CHANGELOGへEngine targetを記録。
- ENGINE_LICENSE_AUDITを更新。
- 実Engineで確認した範囲だけをCOMPLETION_REPORTへ書く。
- 過去解析は残し、必要なGameだけUser操作で再解析する。
