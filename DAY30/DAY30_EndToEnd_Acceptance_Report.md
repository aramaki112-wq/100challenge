# DAY30 End-to-End Acceptance Test Report

## 1. 目的

DAY30 Production Plan Diagnosis Systemについて、利用者が実際に行う主要操作を、Browser Applicationの公開境界から最後まで通して確認する。

単一ClassのUnit Testではなく、次の接続を対象とする。

```text
Browser Application
→ Controller
→ Application Service
→ Domain Engine
→ Repository
→ Read Model
→ Dashboard View Model
→ Backup／Restore
```

## 2. 実行条件

- 対象：DAY30 Phase4-35
- 実行Command：`npm test`
- 対象月：2026-08
- Demo Plan：`PLAN-DEMO`
- Plan Version：`PV-DEMO-1`
- 基準Scenario：`DGS-DEMO-BASE`
- 比較Scenario：`DGS-DEMO-OT`

## 3. Acceptance Case

| ID | 確認内容 | 期待結果 |
|---|---|---|
| AC-01 | Demo起動 | Plan・Version・基準Scenarioが選択され、未診断状態から開始できる |
| AC-02 | 基準Scenario診断 | 420分を二重使用せず、全体が`PARTIALLY_FEASIBLE`、不足120分となる |
| AC-03 | 比較Scenario診断 | 540分で全量成立し、比較Outcomeが`IMPROVED`、不足時間差が-120分となる |
| AC-04 | Assumption・Relation取込 | Preview確認後に両EntityをAtomic Commitできる |
| AC-05 | 未確認前提の診断 | blocking `UNKNOWN`を0や不成立へ変換せず、最終Statusを`UNKNOWN`にする |
| AC-06 | Backup作成 | Schema Version 2へDAY30本体と外部Read Dataを同時保存する |
| AC-07 | Backup復元 | Result・Assumption・Relation・外部Dataを復元し、Dashboardから再利用できる |
| AC-08 | 壊れたBackup | 復元を拒否し、現在Dataを変更しない |

## 4. 主要な期待値

### 基準Scenario

```text
計画必要時間：540分
利用可能時間：420分
不足時間：120分
計画数量：90本
最終実行可能数量：70本
不足数量：20本
全体Status：PARTIALLY_FEASIBLE
```

### 残業2時間追加Scenario

```text
計画必要時間：540分
利用可能時間：540分
不足時間：0分
最終実行可能数量：90本
全体Status：FEASIBLE
比較Outcome：IMPROVED
```

### 未確認blocking Assumption

```text
Assumption Status：UNKNOWN
Assumption Resolution：UNRESOLVED
最終Status：UNKNOWN
最終実行可能数量：null
最終不足数量：null
```

`null`を0へ変換しないことを正式な合格条件とする。

## 5. 合格条件

- AC-01からAC-08がすべて成功する
- 既存Unit／Integration Testを含む全Testが0件失敗である
- 完成ZIPを別Folderへ展開しても全Testが同じ結果になる
- `TEST_RESULT.txt`へ全体Test結果を保存する

## 6. 実行結果

```text
End-to-End Acceptance Case：8件
全Test：709件
成功：709件
失敗：0件
```

## 7. 判定

**合格**

AC-01からAC-08までの全Caseと、既存Unit／Integration Testを含む709件がすべて成功した。正式な実行Logは`TEST_RESULT.txt`に保存した。
