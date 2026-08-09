# ENGINE_CANDIDATE_SELECTION_DESIGN — Ver.1.7 Addendum

## Candidateの意味
Engine Candidateは「重要局面」ではなく「考える価値がある可能性のある局面」である。Primary CandidateをSTEP3へ提示し、本人が盤面を見て選択する。

## 表示Rule
- Primary Candidate上限5件を維持する。
- 通常長の棋譜では3〜5件を目標とする。
- 近接重複抑制や解析可能局面不足により3件未満の場合は、無理に重複候補を水増しせずUIで理由を明示する。
- `otherCandidates`はAnalysis Resultには保持するが、Ver.1.7 STEP3の主一覧には展開しない。

## 種別
- 大きく悪化した可能性
- 振り返り候補
- 良かった可能性

これらはEngineの評価変化に基づく候補分類であり、本人のFACT / INTERPRETATION / HYPOTHESISではない。

## Selection後
CandidateからKeyPositionへ追加した後は、Engine専用Domainへ変換せず通常KeyPositionとしてSTEP4で編集する。Duplicate Rule、5件上限、0手目拒否など既存Validationを再利用する。

---

# ENGINE CANDIDATE SELECTION DESIGN — Ver.1.6

## 1. Goal

Engineが「答え」を決定するのではなく、人が考える価値のある局面を3〜5件程度へ絞る。

## 2. Evaluation Normalization

Engine raw evaluationは次のPerspectiveを受理する。

- `SENTE`
- `SIDE_TO_MOVE`

Application内部では**本人視点**へNormalizeしてから比較する。

CP例:

```text
指す前: +350（本人視点）
指した後: -120（本人視点）
Delta:   -470
```

後手本人でも「本人に良い = positive」を維持する。

## 3. Delta Calculation

CP同士:

`evaluationDelta = evaluationAfter - evaluationBefore`

- positive = 改善方向
- 0 = 変化なし
- negative = 悪化方向

絶対評価値の低さではなく、**本人が指した手の前後差**を基礎にする。

## 4. Mate Handling

Mateを巨大Centipawnへ変換しない。

Transition Type:

- MATE_GAINED
- MATE_LOST
- MATED_CREATED
- MATED_ESCAPED
- MATE_DISTANCE_CHANGED
- CP_CHANGE

これにより `mate in N` と通常CPを雑に同じ数直線へ置かない。

## 5. Rule-based Thresholds

初期Rule:

- Major dropoff: CP delta <= -250
- Review candidate: CP delta <= -120
- Good candidate:
  - Best Move一致かつdelta >= -60
  - または明確なpositive swing（default +120以上）
- Mate失敗/発生は通常CPより高い重要度を与える
- 形勢Band跨ぎはScore加点

Thresholdは `EngineCandidateSelector` constructorから将来調整可能。
Machine Learningは使用しない。

## 6. Shape / Importance Bands

Rule-basedで次のような変化を補助Scoreにする。

- 優勢 → 互角
- 互角 → 劣勢
- 劣勢 → 敗勢
- 詰み発生
- 詰み逃し

評価絶対値だけで候補を選ばず、**変化した局面**を優先する。

## 7. Duplicate Suppression

同一Candidate Typeで近接する局面（default 3 ply以内）は、よりScoreの高い1件をPrimaryへ残す。
一連の崩れを第43手・45手・47手のように大量表示するのを防ぐ。

## 8. Ranking

Score構成の概念:

1. Mate transition
2. CP悪化量/改善量
3. Shape band変化
4. Best Move一致
5. 近接重複抑制

Ruleは説明可能であり、結果の理由を追跡できる。

## 9. Candidate Type

Internal:

- `MAJOR_DROPOFF`
- `REVIEW_CANDIDATE`
- `GOOD_MOVE_CANDIDATE`

UI:

- 大きく悪化した可能性
- 振り返り候補
- 良かった可能性

「悪手」「好手」と断定しない。

## 10. 3〜5件Rule

- Primary candidate上限 = 5
- 有効候補が3件以上ある場合は3〜5件を中心に提示
- 候補が2件しか無い場合、数合わせのために誤った候補を捏造しない
- 残りは「その他の候補」へ分離可能

既存KeyPositionの最大5件Ruleはそのまま維持する。

## 11. Good Position Candidate

単なる評価上昇だけで「好手」と断定しない。

候補条件:

- Engine bestMoveと実戦手が一致
- Best候補との差が小さい状態を維持
- 大きな悪化を避けた
- 不利局面から評価を戻した

UIは「良かった可能性」。理由説明は将来AI Advice Layerの責務。

## 12. False Positive

起こり得る例:

- Engineが短い探索で局面を誤評価
- 人間には非現実的な手をbestとして提示
- 評価値変動が定跡/探索揺らぎによる
- 実戦的には難しいが数値上だけ大きい

対策:

- Candidateを自動KeyPosition登録しない
- Metadata/Settingsを表示可能にする
- Re-analysis可能にする
- 本人が最終選択する

## 13. False Negative

起こり得る例:

- 数値変化は小さいが学習価値が高い判断
- 中盤の方針ミスが数手後に評価へ表れる
- Engineが見つけにくい長期的な課題

対策:

- 手動Replay + 手動KeyPositionを完全維持
- Candidateは補助であり唯一の入口にしない

## 14. User Final Selection

```text
Engine Candidate
    ↓
局面を見る
    ↓
本人が確認する
    ↓
「重要局面へ追加」
    ↓
FACT / INTERPRETATION / HYPOTHESIS
```

Engine CandidateからKeyPositionを**自動確定しない**。
