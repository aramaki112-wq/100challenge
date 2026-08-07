---
title: "DAY30 Explanation"
aliases:
  - "DAY30 生産計画診断 解説"
type: explanation
day: 30
status: formal-draft
created: 2026-08-02
tags:
  - 100アプリチャレンジ
  - Production-Plan
  - Diagnosis
  - Factory-Digital-Twin
---

# DAY30 Explanation

## Production Plan Diagnosis

> [!purpose] 目的
> 人が作成した生産計画を、現実Capacity、確認済み前提、工程順序、Model化範囲と照合し、成立・一部成立・不成立・判断不能を理由付きで返す。

## 1. DAY30の位置

```text
DAY23 何が起き、現在どうなっているか
DAY24 誰が何をできるか
DAY25 その人はいつ働けるか
DAY26 現実にどれだけ設備を動かせるか
DAY27 負荷をどこまで消化できるか
DAY28 条件を変えると何が変わるか
DAY29 入力からCapacity・Simulationまで統合する
DAY30 人が作った計画を現実条件で診断する
```

DAY29はCapacity Context、DAY30はPlan Diagnosis Contextです。

## 2. 分離するもの

```text
Production Plan
≠ Available Capacity
≠ Feasible Production
≠ Actual Production
```

- Production Plan：人が意図した予定
- Available Capacity：設備・人員・Skill・時間がそろった能力
- Feasible Production：現在の診断条件で成立可能な数量
- Actual Production：現実に完了した数量

## 3. 四つの最終Status

### FEASIBLE

計画数量すべてが、現在Model化・確認できる条件で成立します。

### PARTIALLY_FEASIBLE

一部数量または一部時間だけ成立します。

### INFEASIBLE

確認済みの不成立条件があります。

### UNKNOWN

判断に必要なData、Rule、前提、工程関係が不足しています。

> [!warning]
> UNKNOWNは0ではありません。実行不可能とも実行可能とも断定できません。

## 4. 診断の流れ

```text
Plan Versionを選ぶ
↓
Planned Operationを決定論的に並べる
↓
Capacity Ruleを解決する
↓
数量を必要時間へ変換する
↓
Capacity Ledgerへ割り当てる
↓
実行可能数量を求める
↓
Assumptionを評価する
↓
Routingを評価する
↓
Model Coverageを評価する
↓
最終Statusを決める
↓
FindingとNext Checkを作る
↓
SummaryとDiagnosis Resultを固定する
```

## 5. Capacity Ledger

同じ設備の420分を、二つの計画へそれぞれ420分として使いません。

```text
利用可能 420分
Operation Aへ 360分
残り 60分
Operation Bへ 60分
Operation B不足 120分
```

## 6. Assumption

Assumptionは事実ではありません。

```text
材料は間に合う見込み
設備は復旧する予定
応援者を配置できる予定
```

これらを`EXPECTED`のままFEASIBLEへ使うと、現実では成立しない計画を成立と表示する危険があります。

## 7. Routing

前工程が後工程より後日に計画されていれば`INVALID`です。
同日で時刻・Shift順が分からなければ`UNKNOWN`です。

## 8. Model Coverage

- DIRECT_MODEL：Dataから直接判断
- ASSUMPTION：人の確認が必要
- UNMODELED：現在のSystemでは判断不能

数字にできない条件を、無理に能力係数へ変えません。

## 9. FindingとNext Check

Diagnosis ResultはStatusだけではありません。

```text
何が不足したか
どの程度不足したか
どのDataで確認したか
何が未確認か
誰がいつまでに確認するか
```

を保持します。

## 10. Result Validity

診断結果は時間がたつと古くなります。

- CURRENT：入力Revisionが一致
- STALE：影響Dataが変更
- INVALID：対象・Revision構造が不整合

## 11. Scenario比較

基準Scenarioと変更Scenarioを同じKPIで比較します。

ただし差分は因果効果の証明ではありません。複数条件が同時に変わっていないか確認します。

## 12. 学習の中心

> [!important]
> 計画を正解とみなすのではなく、成立条件へ分解し、確認済み・未確認・不成立・Model外を区別して説明する。
