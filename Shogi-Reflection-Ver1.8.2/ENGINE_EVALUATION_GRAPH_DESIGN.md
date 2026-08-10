# ENGINE_EVALUATION_GRAPH_DESIGN — Ver.1.8.2

更新日: 2026-08-09

## 目的

評価値グラフは「数値を見るためのChart」ではなく、**対局全体から振り返るべき局面へ移動する地図**として扱う。

```text
AnalyzeGame evaluationTimeline
  ↓
EngineEvaluationGraphModel
  ↓
EngineEvaluationGraphView (SVG)
  ↓
Good / Bad / KeyPosition / Mate marker
  ↓
existing Replay or existing STEP4 KeyPosition card
```

Graph専用Replay State、Graph専用KeyPosition Domainは作らない。

## Data Model

`AnalyzeGame`は解析済み全plyについて軽量な`evaluationTimeline`を返す。保存するのは評価型、値、depth/nodes/time、bestMove等の参照情報で、巨大Search Treeや長大PVは保存しない。

評価State:
- `CP`
- `MATE_FOR`
- `MATE_AGAINST`
- `UNKNOWN`

Mateを`+99999/-99999`へ変換しない。表示用CP clampはGraph座標だけに使い、元評価値は破壊しない。

## Perspective

縦軸は既存Evaluation Normalizationを経た**利用者本人視点**。

- `+` = 本人有利
- `0` = 互角付近
- `-` = 本人不利

Engine内部/手番側/先手固定の値を直接描画しない。

## Marker

- Good Candidate: Candidate marker
- Bad Candidate: Candidate marker
- KeyPosition: 本人が既存KeyPositionへ登録したplyだけ
- Mate: 専用marker

同一点でKeyPositionとCandidateが重なる場合は、本人が選んだKeyPosition Navigationを優先する。

## Navigation

### Candidate Marker → Replay

```text
marker
→ ShogiReplayController.jump(ply)
→ Current Move / Snapshot / Board / Move List Highlight
→ existing Replay boardへintentional scroll
```

### KeyPosition Marker → STEP4

```text
marker
→ existing KeyPosition moveNumberからcard indexを解決
→ STEP4
→ exact KeyPosition card
→ FACT field focus
```

単にSTEP4先頭へ移動しない。

## Smartphone

390pxではSVG全体をページ横幅より無理に縮めず、Graph container内だけ横Scroll可能にする。Page全体のhorizontal overflowは許可しない。常時Labelを大量表示せず、markerはbutton/focus可能なtargetにする。

## Scroll Policy

Graph Candidate Markerは「局面を見る」意思が明確なため盤面Scrollを許可する。通常Replay Navigation、Board Flip、Candidate→KeyPosition登録ではPage位置を維持する。DOM追加によるBrowser scroll anchoringもCandidate→KeyPosition時に明示的に復元する。

## Tests

- all ply
- viewer perspective
- CP / Mate / Unknown
- no CP line across Mate/Unknown
- Good / Bad / KeyPosition marker
- 0-ply KeyPosition
- Graph → Replay
- Graph → STEP4 exact card + FACT focus
- 390px no page horizontal overflow
