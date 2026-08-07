---
title: "DAY30 Learning Roadmap"
type: learning-roadmap
day: 30
status: formal-draft
created: 2026-08-02
tags:
  - 100アプリチャレンジ
  - Learning-Roadmap
---

# DAY30 Learning Roadmap

## 学習方針

完成Codeを最初から暗記しません。

```text
動かす
↓
結果を観察する
↓
理由を読む
↓
関連Fileを探す
↓
TestでRuleを確認する
↓
一つだけ変更する
↓
再診断する
```

## LEVEL 1｜利用者として動かす

### 目標
Demoで基準Scenarioと残業追加Scenarioを診断できる。

### 操作
1. Browserを起動する
2. 基準Scenarioを選ぶ
3. 診断を実行する
4. 不足120分を確認する
5. 残業2時間追加Scenarioを選ぶ
6. 診断を実行する
7. 比較差を見る

### 合格基準
- [ ] PARTIALLY_FEASIBLEとFEASIBLEの違いを説明できる
- [ ] 不足時間差-120分を説明できる
- [ ] Scenario差が因果証明ではないと説明できる

## LEVEL 2｜UNKNOWNを理解する

### 目標
判断不能と実行不可能を区別する。

### 対象
- `CapacityBucket.js`
- `Assumption.js`
- `OperationStatusDecider.js`

### Exercise
blocking AssumptionをEXPECTEDへし、再診断する。

### 合格基準
- [ ] UNKNOWN数量がnullである理由を説明できる
- [ ] 0分と未確認を区別できる
- [ ] EXPECTEDをCONFIRMEDへしない理由を説明できる

## LEVEL 3｜Capacity割当を追う

### 目標
同じ420分が一度しか使われない流れを説明する。

### 対象
- `CapacityLedgerFactory.js`
- `CapacityAllocationService.js`
- `PlanDiagnosisEngine.js`

### Exercise
Operation Priorityを入れ替え、どちらへ先に割り当てられるか確認する。

### 合格基準
- [ ] requested、allocated、shortage、remainingを説明できる
- [ ] 入力配列順で結果を決めない理由を説明できる

## LEVEL 4｜AssumptionとRoutingを追う

### 目標
Capacity以外の成立条件を説明する。

### 対象
- `AssumptionResolver.js`
- `RoutingDiagnosisService.js`
- `ModelCoverageEvaluator.js`

### Exercise
同日Operationから時刻情報を外し、Routing Statusを観察する。

### 合格基準
- [ ] Routing INVALIDとUNKNOWNを区別できる
- [ ] DIRECT_MODELとUNMODELEDを区別できる

## LEVEL 5｜ResultとValidityを追う

### 目標
診断結果と現在有効性を分けて説明する。

### 対象
- `DiagnosisResult.js`
- `StaleReasonDetector.js`
- `DiagnosisResultValidityEvaluator.js`

### Exercise
Assumption Repository Revisionを変更し、STALE理由を確認する。

### 合格基準
- [ ] FEASIBLEかつSTALEが成立する理由を説明できる
- [ ] Revision後退がINVALIDになる理由を説明できる

## LEVEL 6｜Import・Transactionを追う

### 目標
PreviewとCommit、Rollbackを説明する。

### 対象
- `PreviewPlannedOperationCsvImport.js`
- `CommitPlannedOperationCsvImport.js`
- `InMemoryRepositoryTransactionManager.js`

### Exercise
CSVへ一件の不正行を追加し、全件未保存になることを確認する。

### 合格基準
- [ ] File選択だけで保存しない理由を説明できる
- [ ] Stale Previewの意味を説明できる

## LEVEL 7｜Browser Architectureを追う

### 目標
DOMからDomainまでの依存経路を図にできる。

### 対象
- `DiagnosisDashboardDomRenderer.js`
- `DiagnosisBrowserController.js`
- `DiagnosisReadApplicationServices.js`
- `RepositoryDiagnosisReadModel.js`

### 合格基準
- [ ] ControllerがRepositoryへ直接依存しない理由を説明できる
- [ ] 古い非同期Responseを無視する仕組みを説明できる

## LEVEL 8｜実務Dataで試す

### 目標
Excel→CSV→JSON→Dashboard診断を一周する。

### 使用物
- `DAY30_外部診断Data入力Template.xlsx`
- `BuildDiagnosisExecutionDataJson.js`
- `DIAGNOSIS_EXECUTION_DATA_JSON_IMPORT_GUIDE.md`

### 合格基準
- [ ] 0分と空欄を正しく入力できる
- [ ] Revisionを更新できる
- [ ] Import後に再診断できる
- [ ] Backupを作成できる

## LEVEL 9｜The Book of Designへ接続する

### Theme
- Bounded Context
- Repository Contract
- Derived Result
- Versioning
- Explainability
- Read Model
- Transaction

### 問い
- なぜDiagnosis ResultをEntityへ戻さないのか
- なぜRepositoryを交換可能にするのか
- なぜRead Modelを別にするのか
- なぜTestで不変条件を守るのか

## LEVEL 10｜Observation Handbookへ接続する

```text
Observation
↓
Difference
↓
Weak Signal
↓
Assumption
↓
Diagnosis
↓
Next Check
↓
Action
↓
Re-observation
```

### 問い
- UNKNOWNを減らすには何を観測すべきか
- STALEを検知するRevisionは何か
- 境界で失われているDataは何か
- Scenario差を因果仮説へ変えるには何を固定すべきか

## 最終合格基準

- [ ] InputからDiagnosis Resultまでの流れを図にできる
- [ ] 代表Statusを自分の言葉で説明できる
- [ ] 一つのOperationをCode上で追跡できる
- [ ] 一つのRuleをTestへ追加できる
- [ ] 実務DataをImportし、結果と注意点を記録できる
- [ ] Systemが判断しない範囲を説明できる
