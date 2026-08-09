# Shogi Reflection Interlude — Ver.1.7 Challenge

## Challenge

Ver.1.6をSource of Truthとして、大規模再構成せず次の2点を同時に成立させる。

1. Engine解析を「重要局面を選んだ後」ではなく「振り返る局面を選ぶ前」へ配置する。
2. Fixed 9×9 Gridを一切Piece Sizeへ従属させず、駒Presentationを第三者へ見せやすい品質へ上げる。

## Constraints

- 7 Stepを増減しない。
- Engine Candidateを自動KeyPosition化しない。
- Candidate専用Replay / Candidate専用KeyPosition Domainを作らない。
- EngineをApplication全体の必須Dependencyにしない。
- GameReview / Storage schema / Backup / Restoreを壊さない。
- ReplayScrollPolicyを壊さない。
- 81升同一Size、Board Flip、Snapshotを維持。
- License不明Assetを同梱しない。
- Browser/Visual未実施項目を「確認済み」と書かない。

## Result Target

```text
STEP3 Replay
  -> Engine Analysis
  -> 3〜5 Review Candidates
  -> Jump to existing Replay
  -> User decides
  -> Add to existing KeyPosition
STEP4
  -> FACT / INTERPRETATION / HYPOTHESIS
```

駒はApplication専用SVGを採用し、外部Font File / Graphics Assetを増やさない。
