---
title: "DAY30 Design Handbook"
type: design-handbook
day: 30
status: formal-draft
created: 2026-08-02
tags:
  - 100アプリチャレンジ
  - Design-Handbook
  - Production-Plan-Diagnosis
---

# DAY30 Design Handbook

## STEP01｜PlanとRealityを分ける

### 目的
Production Plan、Available Capacity、Feasible Production、Actual Productionを別概念として扱う。

### 理由
計画を現実能力と混同すると、計画したことが実行可能であるように見えるため。

### コード
- `ProductionPlan.js`
- `ProductionPlanVersion.js`
- `PlannedOperation.js`
- `CapacitySnapshot.js`
- `DiagnosisResult.js`

### 設計者のひとこと
計画は入力であり、診断結果ではない。

### チェックポイント
- PlanへDiagnosis Statusを書き戻していないか
- DAY29 CapacityをDAY30で再計算していないか

### 次へ進む条件
Plan VersionとCapacity Scenarioを独立して選択できる。

---

## STEP02｜不明を0にしない

### 目的
確認済み0と判断不能nullを区別する。

### 理由
情報不足を設備停止・能力0と誤診断しないため。

### コード
- `CapacityBucket.js`
- `CapacitySnapshot.js`
- `OperationDiagnosisResult.js`

### 設計者のひとこと
0は観測結果、nullは観測不足である。

### チェックポイント
- `availableMinutes=null`を0へ変換していないか
- UNKNOWNの数量を0表示していないか

### 次へ進む条件
UNKNOWN時の数量と不足がnullになるTestが成功する。

---

## STEP03｜Capacityを一度だけ使う

### 目的
同じ設備時間の二重使用を防ぐ。

### 理由
Operation単体を個別評価すると、同じCapacityを何度も使えるため。

### コード
- `CapacityLedger.js`
- `CapacityAllocation.js`
- `CapacityAllocationService.js`

### 設計者のひとこと
能力は合計値ではなく、消費される時間資源である。

### チェックポイント
- 総割当時間が利用可能時間を超えていないか
- 部分割当と不足時間を返しているか

### 次へ進む条件
420分へ360分と180分を要求し、二件目が60分割当になる。

---

## STEP04｜数量と時間を往復する

### 目的
計画数量を必要時間へ、割当時間を実行可能数量へ変換する。

### 理由
Capacityの内部正本を時間として統一するため。

### コード
- `RequiredTimeCalculator.js`
- `ExecutableQuantityCalculator.js`
- `CapacityCalculationUtils.js`

### 設計者のひとこと
必要時間は切り上げ、実行可能数量は安全側へ切り捨てる。

### チェックポイント
- PIECE／LOTを整数として扱っているか
- KILOGRAM精度を過大表示していないか
- 単位不一致を拒否しているか

### 次へ進む条件
HOUR・SHIFT・DAY基準を同じ考え方で説明できる。

---

## STEP05｜Capacity Ruleを一件に解決する

### 目的
Operationへ適用する能力Ruleを再現可能に決める。

### 理由
標準品と難加工品を一つの固定能力値で計算しないため。

### コード
- `CapacityRuleResolver.js`

### 設計者のひとこと
Ruleがないときは能力0ではなくUNKNOWNである。

### チェックポイント
- Override→属性Rule→Defaultの順か
- 同順位競合を黙って選んでいないか

### 次へ進む条件
RESOLVED、NOT_FOUND、CONFLICTを区別できる。

---

## STEP06｜Assumptionを事実から分ける

### 目的
見込み・確認済み・不成立・期限切れを管理する。

### 理由
「できる予定」を「できる事実」として扱わないため。

### コード
- `Assumption.js`
- `ScenarioAssumptionRelation.js`
- `AssumptionResolver.js`

### 設計者のひとこと
Evidenceなしの確信は、System上の事実ではない。

### チェックポイント
- EXPECTEDへConfidenceがあるか
- CONFIRMEDへ確認者・日時があるか
- REJECTEDへEvidenceがあるか
- Relationなしで自動適用していないか

### 次へ進む条件
blocking EXPECTEDで最終StatusがUNKNOWNになる。

---

## STEP07｜RoutingとModel Coverageを分ける

### 目的
工程順序違反と、Systemが判断できない条件を別に表現する。

### 理由
順序逆転とData不足を同じErrorにしないため。

### コード
- `RoutingDiagnosisService.js`
- `ModelCoverageEvaluator.js`

### 設計者のひとこと
見えないものを、見えたことにしない。

### チェックポイント
- 明確な日付逆転はINVALIDか
- 同日で順序情報がなければUNKNOWNか
- UNMODELEDを係数へ変換していないか

### 次へ進む条件
DIRECT_MODEL、ASSUMPTION、UNMODELEDを説明できる。

---

## STEP08｜最終Statusを決める

### 目的
Capacity、Assumption、Routing、Coverageを一つのStatusへ統合する。

### 理由
単一軸だけで現実成立を断定しないため。

### コード
- `OperationStatusDecider.js`

### 設計者のひとこと
確定した無理を弱めず、未確認を確定へ昇格させない。

### チェックポイント
- confirmed blocking failureが最優先か
- UNKNOWNがINFEASIBLEを上書きしていないか
- Capacity partialが最終partialになる条件は正しいか

### 次へ進む条件
代表Caseを手計算で説明できる。

---

## STEP09｜理由と次の行動を返す

### 目的
StatusだけでなくFindingとNext Checkを生成する。

### 理由
利用者が次に確認・修正する対象へ進めるようにするため。

### コード
- `ConstraintFinding.js`
- `AssumptionFinding.js`
- `NextCheck.js`

### 設計者のひとこと
診断の価値は、赤色表示ではなく次の行動へ接続できることにある。

### チェックポイント
- 必要・利用可能・不足の整合性があるか
- Ownerと期限を持てるか
- 完了・確認不能理由を残せるか

### 次へ進む条件
UNKNOWNから確認Actionを作れる。

---

## STEP10｜Resultを固定し、Validityを分ける

### 目的
診断時点の結果を保存し、現在も有効か別に評価する。

### 理由
過去の判断を壊さず、条件変更後の再診断必要性を示すため。

### コード
- `DiagnosisResult.js`
- `StaleReasonDetector.js`
- `DiagnosisResultValidityEvaluator.js`

### 設計者のひとこと
当時正しかった結果と、今も使える結果は同じではない。

### チェックポイント
- 元Resultを変更していないか
- Revision後退をINVALIDとしているか
- Schema変更を検出しているか

### 次へ進む条件
CURRENT、STALE、INVALIDの違いを説明できる。

---

## STEP11｜保存をContractとTransactionで守る

### 目的
複数Entityを一括保存し、途中失敗時にRollbackする。

### 理由
Planだけ保存されOperationが欠ける状態を防ぐため。

### コード
- `DiagnosisRepositoryContracts.js`
- `InMemoryDiagnosisRepositories.js`
- `InMemoryRepositoryTransactionManager.js`

### 設計者のひとこと
保存の成功は、関連Data全体の成功である。

### チェックポイント
- addとsaveを分けているか
- Version番号重複を防いでいるか
- RevisionもRollbackされるか

### 次へ進む条件
途中Errorで全Repositoryが元へ戻る。

---

## STEP12｜Use Caseへ接続する

### 目的
RepositoryからDataを読み、Engineを実行し、Resultを保存する。

### 理由
UIがDomain Objectを直接組み立てないため。

### コード
- `RunPlanDiagnosis.js`
- `DiagnosisExecutionDataProvider.js`
- `InMemoryDiagnosisExecutionDataProvider.js`

### 設計者のひとこと
一回の診断を、一つのApplication Serviceとして扱う。

### チェックポイント
- 実行中のSource変更を検出するか
- ScenarioとCapacity Snapshotが一致するか
- Result保存がTransaction内か

### 次へ進む条件
Scenario IDだけで正式診断を実行できる。

---

## STEP13｜Read ModelとBrowserへ渡す

### 目的
画面専用Dataと操作StateをDomainから分離する。

### 理由
DOM、選択状態、非同期制御をDomainへ持ち込まないため。

### コード
- `RepositoryDiagnosisReadModel.js`
- `DiagnosisDashboardViewModel.js`
- `DiagnosisBrowserController.js`
- `DiagnosisDashboardDomRenderer.js`

### 設計者のひとこと
画面は結果を見せるが、結果の意味を決めない。

### チェックポイント
- 画面Dataが変更不能か
- 古い非同期Responseを無視するか
- Empty Stateを区別するか

### 次へ進む条件
Plan選択から詳細表示までControllerで追える。

---

## STEP14｜ImportとBackupを非破壊にする

### 目的
外部DataをPreview後に原子的保存し、復元失敗で現在Dataを壊さない。

### 理由
実務Dataの取込・移行・復旧を安全にするため。

### コード
- `PreviewPlannedOperationCsvImport.js`
- `CommitPlannedOperationCsvImport.js`
- `DiagnosisApplicationSnapshotService.js`
- `DiagnosisBackupController.js`

### 設計者のひとこと
取込は「読む」と「確定する」を分ける。

### チェックポイント
- Stale Previewを拒否するか
- Error 1件で全件Rollbackするか
- 壊れたBackupで現在Dataを保持するか

### 次へ進む条件
Import・Backup・RestoreのAcceptance Testが成功する。

---

## STEP15｜Scenario差を観測する

### 目的
基準条件と変更条件の結果差を同じKPIで比較する。

### 理由
対策がどの不足へ効いたかを観測するため。

### コード
- `ScenarioComparison.js`

### 設計者のひとこと
差分は原因の証明ではなく、次の仮説を作る材料である。

### チェックポイント
- UNKNOWNを改善と断定していないか
- INVALIDを比較していないか
- Operation単位の変化を追えるか

### 次へ進む条件
基準420分と残業追加540分の差を説明できる。
