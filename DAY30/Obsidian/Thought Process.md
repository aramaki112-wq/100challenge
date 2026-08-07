---
title: "DAY30 Thought Process"
type: thought-process
day: 30
status: formal-draft
created: 2026-08-02
tags:
  - 100アプリチャレンジ
  - Thought-Process
  - Diagnosis
---

# DAY30 Thought Process

## 1. 出発点

生産計画の問題は、計画数量と設備能力を単純比較するだけでは解けません。

最初の問いは次でした。

> 現状ではできない計画を、なぜ「できる」と表現してしまうのか。

## 2. 最初に疑った単純Model

```text
計画数量 <= 月間能力
```

この式では、次を失います。

- 日・Shift別の偏り
- 同じCapacityの競合
- Worker・Skill・Assignment
- 前工程順序
- 材料・運搬・設備復旧
- 未確認Data
- Rule未登録
- 診断後の条件変更

## 3. DAY29を作り直さない

DAY29はCapacityを計算します。
DAY30へ同じ計算を複製すると、二つの正本ができます。

そこで、DAY29の結果を`CapacitySnapshot`として受け取る境界を作りました。

## 4. 0とnullの分離

最も重要な判断の一つです。

```text
0 = ないことを確認済み
null = 分からない
```

この違いを維持することで、情報不足を設備停止と誤診断しません。

## 5. Capacityの二重使用

複数Operationを個別に診断すると、同じ420分を何度も使う問題が起きます。

そこで、一回の診断Runに`CapacityLedger`を作り、割当後の残りを保持しました。

## 6. Assumptionをどこへ置くか

Planへ埋め込むと、見込みが計画事実に見えます。
Capacityへ埋め込むと、設備能力と材料到着が混ざります。

独立Entityとして、状態、Evidence、期限、Owner、blockingを保持しました。

## 7. Status優先順位

未確認事項があると何でもUNKNOWNにすると、確認済みの不成立が隠れます。

そのため、判定順は概ね次です。

```text
確認済みblocking不成立
Routing INVALID
Capacity INFEASIBLE
↓
Assumption CONFLICT／未確認
Capacity UNKNOWN
Routing UNKNOWN
UNMODELED
↓
PARTIALLY_FEASIBLE
↓
FEASIBLE
```

## 8. Diagnosis Resultを保存する理由

当時の判断を残し、後から条件が変わったことを追跡するためです。

ただし、Resultを現在も有効とみなすかは別問題なので、`Result Validity`を分離しました。

## 9. Revision Schema変更

Revision項目の追加・削除は、単なる値変更ではありません。
古い診断が新しい条件を考慮したか証明できないため`INVALID`としました。

## 10. Importの判断

CSVを選択した瞬間に保存すると、Error行と正常行が混在します。

```text
Parse
↓
Preview
↓
Issue確認
↓
Commit
```

に分け、CommitはTransactionで原子的に実行します。

## 11. Excelの責任

Excelに正式診断式を複製すると、JavaScriptと異なる答えが生まれます。

Excelは入力しやすさと一次Check、JavaScriptはDomain検証と診断を担当します。

## 12. UIの判断

最初から全Dataを見せると理解できません。

```text
Planを選ぶ
Scenarioを選ぶ
全体Statusを見る
Operation詳細を見る
Action Itemを見る
```

の順にしました。

## 13. Scenario比較の注意

条件変更と結果差が同時に観測されても、因果効果が証明されたとは限りません。

変更条件を一つに近づけ、他のRevisionが同じか確認し、再現を試す必要があります。

## 14. 実装途中の不整合から学んだこと

共通Code CatalogやError Catalogの欠落により、部分Testだけでは成功に見える問題が起きました。

そこで、全Test再実行と`SharedCatalogIntegrity.test.js`を追加しました。

## 15. 最終的な設計思想

```text
Observation
↓
Plan
↓
Reality Context
↓
Diagnosis
↓
Explanation
↓
Action
↓
Re-observation
```

DAY30は計画を作るSystemではなく、計画を現実条件へ問い直すSystemです。
