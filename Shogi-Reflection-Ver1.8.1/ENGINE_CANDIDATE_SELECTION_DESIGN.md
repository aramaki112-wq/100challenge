# ENGINE_CANDIDATE_SELECTION_DESIGN — Ver.1.8

## Purpose

Candidate Rankingは「Engine最善手ランキング」ではなく、本人がReplayで考え直す価値のある局面を少数に絞る。

## Groups

### 良かった手

最大5件。基準を満たさない場合は0〜4件でもよい。

- Engine Best Moveと一致し、推奨評価を大きく損ねていない
- 本人視点の評価が大きく改善
- 詰まされる状態を逃れた
- 詰み筋を生じさせた
- 形勢帯を有利側へ動かした等

### 考え直したい手

最大5件。基準を満たさない場合は0〜4件でもよい。

- Best EvaluationとActual Evaluationの差が大きい
- Engine Best Moveと実戦手が違い、差がreview threshold以上
- 優勢→互角/劣勢等の重要な形勢帯変化
- Mate lost / mated created

合計最大10件。UIに「基準を満たす候補のみ表示しています」を表示し、5件を埋めるための水増しをしない。

## Duplicate Suppression

同一Good/Bad group内で近接ply（default 3 ply以内）が同一swingを表している場合、ranking scoreが高いものを優先する。連続した数手を同じ理由で並べない。

## Bad Candidate Reference

最低限表示:

- 手数
- 実戦手
- 指す前の評価
- 実戦後評価
- Engine推奨
- 推奨手評価
- 実戦手との差
- 短いPV

内部Dataは第2・第3候補を持てるArchitectureを維持するが、SMARTPHONE_SAFE defaultはMultiPV=1。

## Good Candidate Reference

- 手数
- 実戦手
- 指す前
- 指した後
- 改善・差
- Engine推奨
- Engine最善候補との一致有無

## Wording

「唯一の正解」と表示しない。`Engine推奨`, `最善候補`, `より良かった可能性のある手` を使用する。

## Human Decision Boundary

CandidateはKeyPositionへ自動登録しない。

```text
Candidate
→ [局面を見る]
→ existing Replay jump
→ Board auto scroll (この操作だけReplay Scroll Policyの例外)
→ 実戦手 vs Engine推奨を本人が比較
→ 必要なら [重要局面へ追加]
→ STEP4でFACT / INTERPRETATION / HYPOTHESISを本人が記入
```

Engine情報をFACT/INTERPRETATION/HYPOTHESISやObservation Cardへ自動転記しない。
