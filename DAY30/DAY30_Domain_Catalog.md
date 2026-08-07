# DAY30 Domain Catalog

DAY30を構成する主要なDomain Object・Service・境界を、責任と不変条件で整理します。

| 区分 | 名前 | 責任 | Source File | 重要な不変条件・注意 |
|---|---|---|---|---|
| Entity | `ProductionPlan` | 対象月とPrimary Factoryを持つ生産計画の識別単位 | `ProductionPlan.js` | 対象月とPrimary Factoryは作成後に変更しない。Active状態を管理する。 |
| Entity | `ProductionPlanVersion` | Production Planの編集・承認単位 | `ProductionPlanVersion.js` | APPROVED以降は編集不可。変更時は新Versionを作る。 |
| Entity | `PlannedOperation` | 設備・日付・数量を持つ一つの計画工程 | `PlannedOperation.js` | 診断結果を内部へ書き戻さない。時間範囲・数量単位を厳格に検証する。 |
| Entity | `Assumption` | 材料到着や設備復旧などの未確認条件 | `Assumption.js` | EXPECTEDとCONFIRMEDを分離する。REJECTEDは根拠必須。 |
| Entity | `DiagnosisScenario` | Plan VersionとCapacity Scenarioを結ぶ診断条件 | `DiagnosisScenario.js` | BASEは比較元を持たない。COMPARISONは比較元と変更概要が必要。 |
| Relation | `ScenarioAssumptionRelation` | ScenarioへAssumptionを明示接続する関係 | `ScenarioAssumptionRelation.js` | 切離してもAssumption本体を削除しない。 |
| Value Object | `CapacityBucket` | 設備・日付・Shift単位の利用可能能力 | `CapacityBucket.js` | 0分とnullを分ける。Statusと分数の矛盾を拒否する。 |
| Value Object | `CapacitySnapshot` | DAY29由来のCapacity Bucket集合 | `CapacitySnapshot.js` | 読取専用。Bucket一意Keyの重複を拒否する。 |
| Runtime Object | `CapacityLedger` | 一回の診断中にCapacityの残量を管理する台帳 | `CapacityLedger.js` | 同じCapacityを二重使用しない。永続保存しない。 |
| Result | `CapacityAllocation` | 一回の能力割当結果 | `CapacityAllocation.js` | 要求・割当・不足・残量の整合性を保持する。 |
| Result | `ConstraintFinding` | 確認できた制約と不足の説明 | `ConstraintFinding.js` | 必要量・利用可能量・不足量を整合させる。 |
| Result | `AssumptionFinding` | Assumptionが診断へ与えた影響 | `AssumptionFinding.js` | SATISFIEDにできるのは有効なCONFIRMEDだけ。 |
| Result | `NextCheck` | 次に誰が何を確認するかを表すAction | `NextCheck.js` | 完了・確認不能には結果と担当記録が必要。 |
| Result | `OperationDiagnosisResult` | 一つのPlanned Operationの総合診断 | `OperationDiagnosisResult.js` | Capacity数量と最終数量を分け、UNKNOWN数量はnullにする。 |
| Result | `DiagnosisSummary` | Plan全体のStatus・数量・時間・Action集計 | `DiagnosisSummary.js` | INFEASIBLEをUNKNOWNで弱めない。単位別に数量を集計する。 |
| Result | `DiagnosisResult` | 一回の正式な診断実行記録 | `DiagnosisResult.js` | Result ValidityとRevisionを保持し、不変とする。 |
| Service | `CapacityRuleResolver` | 適用する能力Ruleを一件に解決する | `CapacityRuleResolver.js` | RuleなしとRule競合を推測で解決しない。 |
| Service | `RequiredTimeCalculator` | 計画数量を必要時間へ変換する | `RequiredTimeCalculator.js` | 不足を過小評価しないよう分単位で切り上げる。 |
| Service | `ExecutableQuantityCalculator` | 割当時間を実行可能数量へ戻す | `ExecutableQuantityCalculator.js` | 実行可能量を過大表示しないよう安全側へ切り捨てる。 |
| Service | `CapacityAllocationService` | 粒度に応じCapacityを割り当てる | `CapacityAllocationService.js` | TIME・SHIFT・DAYの順序とLedger残量を守る。 |
| Service | `AssumptionResolver` | 対象Operationに有効な前提条件を統合する | `AssumptionResolver.js` | 未接続Assumptionを自動採用しない。競合はCONFLICTにする。 |
| Service | `RoutingDiagnosisService` | 前後工程の順序を診断する | `RoutingDiagnosisService.js` | 同日で順序情報がなければUNKNOWNにする。 |
| Service | `ModelCoverageEvaluator` | 直接判定・前提依存・Model外を分ける | `ModelCoverageEvaluator.js` | Model外条件を問題なしとして扱わない。 |
| Service | `OperationStatusDecider` | Capacity・Assumption等から最終Statusを決める | `OperationStatusDecider.js` | 確定INFEASIBLEを未確認事項でUNKNOWNへ弱めない。 |
| Engine | `PlanDiagnosisEngine` | 全Serviceを決定的な順序で接続する診断Engine | `PlanDiagnosisEngine.js` | 入力順に依存せず、PlannedOperationを変更しない。 |
| Application | `RunPlanDiagnosis` | Repository読込・Engine実行・Result保存のUse Case | `RunPlanDiagnosis.js` | 診断中のSource変更を検出し、Transactionで保存する。 |
| Read Model | `RepositoryDiagnosisReadModel` | 画面用の変更不能な参照Dataを作る | `RepositoryDiagnosisReadModel.js` | Domain Entityを画面へ直接渡さない。 |
| Presentation | `DiagnosisBrowserController` | Plan選択・Scenario選択・診断実行を制御 | `DiagnosisBrowserController.js` | 古い非同期応答を画面へ反映しない。 |
| Presentation | `DiagnosisDashboardDomRenderer` | Dashboard状態をHTMLへ描画する | `DiagnosisDashboardDomRenderer.js` | 文字列をEscapeし、UNKNOWNとValidityを明示する。 |
| Infrastructure | `InMemoryDiagnosisRepositories` | DAY30 Entityを保存するInMemory Repository群 | `InMemoryDiagnosisRepositories.js` | addとsaveを分け、一意Keyを守る。 |
| Infrastructure | `InMemoryRepositoryTransactionManager` | 複数Repository更新の原子性を守る | `InMemoryRepositoryTransactionManager.js` | 途中失敗時はRevisionを含めRollbackする。 |
| Infrastructure | `DiagnosisApplicationSnapshotService` | DAY30本体と外部DataをBackupへまとめる | `DiagnosisApplicationSnapshotService.js` | Schema Versionを持ち、旧Backup互換を管理する。 |

## 読む順番

1. `ProductionPlan`、`ProductionPlanVersion`、`PlannedOperation`で計画を理解する。
2. `CapacitySnapshot`、`CapacityLedger`で現実能力と二重使用防止を理解する。
3. `Assumption`、`RoutingDiagnosisService`、`ModelCoverageEvaluator`で判断不能の理由を理解する。
4. `OperationStatusDecider`、`OperationDiagnosisResult`、`DiagnosisResult`で最終判定を理解する。
5. `RunPlanDiagnosis`、Read Model、Browser ControllerでUse Caseと画面境界を理解する。
