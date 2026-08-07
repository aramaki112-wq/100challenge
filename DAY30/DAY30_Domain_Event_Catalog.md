# DAY30 Domain Event Catalog

Domain Eventは、Entityの重要な状態変更を監査可能な履歴として表します。Repository Transactionが成功した後に外部Publishする前提です。

| Aggregate | Event Type | 発生契機 | 診断への主な影響 |
|---|---|---|---|
| `ProductionPlan` | `PRODUCTION_PLAN_CREATED` | 新規作成 | Planの利用可否へ影響します。 |
| `ProductionPlan` | `PRODUCTION_PLAN_RENAMED` | 名称変更 | 監査履歴として保持し、必要に応じて表示・追跡に使用します。 |
| `ProductionPlan` | `PRODUCTION_PLAN_DESCRIPTION_CHANGED` | 説明変更 | 監査履歴として保持し、必要に応じて表示・追跡に使用します。 |
| `ProductionPlan` | `PRODUCTION_PLAN_NOTE_CHANGED` | 備考変更 | 監査履歴として保持し、必要に応じて表示・追跡に使用します。 |
| `ProductionPlan` | `PRODUCTION_PLAN_ACTIVATED` | 有効化 | Planの利用可否へ影響します。 |
| `ProductionPlan` | `PRODUCTION_PLAN_DEACTIVATED` | 無効化 | Planの利用可否へ影響します。 |
| `ProductionPlanVersion` | `PLAN_VERSION_CREATED` | 新規作成 | Plan Versionの状態または内容へ影響し、診断可否・STALE判定に関係します。 |
| `ProductionPlanVersion` | `PLAN_VERSION_RENAMED` | 名称変更 | Plan Versionの状態または内容へ影響し、診断可否・STALE判定に関係します。 |
| `ProductionPlanVersion` | `PLAN_VERSION_NOTE_CHANGED` | 備考変更 | 監査履歴として保持し、必要に応じて表示・追跡に使用します。 |
| `ProductionPlanVersion` | `PLAN_VERSION_SUBMITTED_FOR_REVIEW` | 確認依頼 | Plan Versionの状態または内容へ影響し、診断可否・STALE判定に関係します。 |
| `ProductionPlanVersion` | `PLAN_VERSION_RETURNED_TO_DRAFT` | 下書きへ差戻し | Plan Versionの状態または内容へ影響し、診断可否・STALE判定に関係します。 |
| `ProductionPlanVersion` | `PLAN_VERSION_APPROVED` | 承認 | Plan Versionの状態または内容へ影響し、診断可否・STALE判定に関係します。 |
| `ProductionPlanVersion` | `PLAN_VERSION_SUPERSEDED` | 後継Versionによる置換 | Plan Versionの状態または内容へ影響し、診断可否・STALE判定に関係します。 |
| `ProductionPlanVersion` | `PLAN_VERSION_ARCHIVED` | 保管 | Plan Versionの状態または内容へ影響し、診断可否・STALE判定に関係します。 |
| `PlannedOperation` | `PLANNED_OPERATION_ADDED` | 計画工程追加 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `PlannedOperation` | `PLANNED_OPERATION_RESCHEDULED` | 計画日・Shift・時刻の変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `PlannedOperation` | `PLANNED_OPERATION_QUANTITY_CHANGED` | 計画数量変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `PlannedOperation` | `PLANNED_OPERATION_EQUIPMENT_CHANGED` | 使用設備変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `PlannedOperation` | `PLANNED_OPERATION_PRIORITY_CHANGED` | 優先度変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `PlannedOperation` | `PLANNED_OPERATION_CAPACITY_CONDITIONS_CHANGED` | 能力Rule照合条件変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `PlannedOperation` | `PLANNED_OPERATION_NOTE_CHANGED` | 備考変更 | 監査履歴として保持し、必要に応じて表示・追跡に使用します。 |
| `Assumption` | `ASSUMPTION_REGISTERED` | 前提条件登録 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `Assumption` | `ASSUMPTION_MARKED_EXPECTED` | 成立見込みへ変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `Assumption` | `ASSUMPTION_CONFIRMED` | 成立確認 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `Assumption` | `ASSUMPTION_REJECTED` | 不成立確認 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `Assumption` | `ASSUMPTION_EXPIRED` | 期限切れ | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `Assumption` | `ASSUMPTION_REOPENED` | 再確認開始 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `Assumption` | `ASSUMPTION_OWNER_CHANGED` | 確認担当変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `Assumption` | `ASSUMPTION_BLOCKING_CHANGED` | 成立阻害Flag変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `Assumption` | `ASSUMPTION_EVIDENCE_UPDATED` | 根拠更新 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `Assumption` | `ASSUMPTION_VALIDITY_CHANGED` | 有効期間変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `Assumption` | `ASSUMPTION_DESCRIPTION_CHANGED` | 説明変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `Assumption` | `ASSUMPTION_NOTE_CHANGED` | 備考変更 | 監査履歴として保持し、必要に応じて表示・追跡に使用します。 |
| `DiagnosisScenario` | `DIAGNOSIS_SCENARIO_CREATED` | 新規作成 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `DiagnosisScenario` | `DIAGNOSIS_SCENARIO_RENAMED` | 名称変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `DiagnosisScenario` | `DIAGNOSIS_SCENARIO_PLAN_VERSION_CHANGED` | 対象Plan Version変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `DiagnosisScenario` | `DIAGNOSIS_SCENARIO_CAPACITY_SCENARIO_CHANGED` | Capacity Scenario変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `DiagnosisScenario` | `DIAGNOSIS_SCENARIO_BASE_SCENARIO_CHANGED` | 比較元Scenario変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `DiagnosisScenario` | `DIAGNOSIS_SCENARIO_DESCRIPTION_CHANGED` | 説明変更 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `DiagnosisScenario` | `DIAGNOSIS_SCENARIO_NOTE_CHANGED` | 備考変更 | 監査履歴として保持し、必要に応じて表示・追跡に使用します。 |
| `DiagnosisScenario` | `DIAGNOSIS_SCENARIO_ACTIVATED` | 有効化 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `DiagnosisScenario` | `DIAGNOSIS_SCENARIO_DEACTIVATED` | 無効化 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `DiagnosisScenario` | `DIAGNOSIS_SCENARIO_ARCHIVED` | 保管 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `ScenarioAssumptionRelation` | `DIAGNOSIS_SCENARIO_ASSUMPTION_ATTACHED` | Assumption接続 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `ScenarioAssumptionRelation` | `DIAGNOSIS_SCENARIO_ASSUMPTION_DETACHED` | Assumption切離し | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `ScenarioAssumptionRelation` | `DIAGNOSIS_SCENARIO_ASSUMPTION_REATTACHED` | Assumption再接続 | 診断入力Revisionを更新し、既存ResultをSTALEにする候補です。 |
| `ScenarioAssumptionRelation` | `DIAGNOSIS_SCENARIO_ASSUMPTION_NOTE_CHANGED` | 備考変更 | 監査履歴として保持し、必要に応じて表示・追跡に使用します。 |

## Event運用Rule

- Event記録に失敗した場合、Entityの状態も変更しません。
- `occurredAt`と`recordedAt`を分けます。
- 同一Event IDの重複を拒否します。
- `causationId`の自己参照を拒否します。
- External PublishはRepository保存成功後に行います。
