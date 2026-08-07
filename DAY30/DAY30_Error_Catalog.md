# DAY30 Error Catalog

> Source of Truth: `DiagnosisErrors.js`

Error Codeを、日本語の意味・利用者が行う対処とともに整理します。画面に表示されたCodeは変更せず、このCatalogで意味を確認します。

## 最初に確認する重要Error

| Error Code | 意味 | 対処 |
|---|---|---|
| `IMPORT_STALE_PREVIEW` | 取込Preview後に元Dataが変更されています。 | CSVを選び直し、最新状態でPreviewを再作成します。 |
| `IMPORT_TARGET_VERSION_NOT_EDITABLE` | 選択したPlan Versionは承認済み等で編集できません。 | 新しいDRAFT Versionを作成し、CSVのplanVersionIdを合わせます。 |
| `CAPACITY_RULE_NOT_FOUND` | 対象Operationへ適用できる能力Ruleがありません。 | 設備・有効期間・数量単位・条件属性を確認し、Ruleを登録します。 |
| `CAPACITY_RULE_CONFLICT` | 同順位・同具体性の能力Ruleが複数あります。 | 優先度または条件を見直し、一件に解決できる状態へ修正します。 |
| `CAPACITY_UNIT_MISMATCH` | 計画数量単位と能力Ruleの数量単位が一致しません。 | 正式な単位変換Ruleを用意するか、同じ単位のRuleを使用します。 |
| `DIAGNOSIS_SOURCE_CHANGED_DURING_EXECUTION` | 診断中にPlanや外部Dataが変更されました。 | 変更完了後、最新Dataから診断をやり直します。 |
| `READ_MODEL_INTEGRITY_ERROR` | 参照先Entityが欠落するなど、保存Dataの関連が壊れています。 | Plan・Scenario・Assumption・Relationの参照IDを確認し、Backupからの復元も検討します。 |
| `EXTERNAL_DATA_IMPORT_STALE_PREVIEW` | 外部Data Preview後に現在Dataが変更されました。 | 外部JSONを再選択し、Previewからやり直します。 |
| `UNSUPPORTED_BACKUP_SCHEMA_VERSION` | このApplicationが対応していないBackup形式です。 | 対応VersionのDAY30で開くか、移行手順を確認します。 |
| `PERSISTENCE_RESTORE_FAILED` | Browser保存Dataの復元に失敗しました。 | 現在Dataは保持されます。Backup JSONとSchema Versionを確認します。 |
| `SCENARIO_COMPARISON_NOT_AVAILABLE` | 比較元・比較先の診断結果がそろっていません。 | 両Scenarioを診断してから比較します。 |

## 全Error Code

| No. | 区分 | Error Code | 日本語の意味 | 推奨対処 |
|---:|---|---|---|---|
| 1 | 入力・状態不正 | `INVALID_ARGUMENT` | Argumentが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 2 | 入力・状態不正 | `INVALID_CODE_VALUE` | Code値が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 3 | 入力・状態不正 | `INVALID_NON_EMPTY_STRING` | NonEmptyStringが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 4 | 入力・状態不正 | `INVALID_BOOLEAN` | 真偽値が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 5 | 入力・状態不正 | `INVALID_POSITIVE_INTEGER` | PositiveIntegerが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 6 | 入力・状態不正 | `INVALID_NON_NEGATIVE_INTEGER` | NonNegativeIntegerが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 7 | 入力・状態不正 | `INVALID_FINITE_NUMBER` | Finite番号が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 8 | 入力・状態不正 | `INVALID_ARRAY` | 配列が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 9 | 入力・状態不正 | `INVALID_PLAIN_OBJECT` | Plainオブジェクトが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 10 | 入力・状態不正 | `INVALID_PLAN_ID` | 計画IDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 11 | 入力・状態不正 | `INVALID_PLAN_VERSION_ID` | 計画版IDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 12 | 入力・状態不正 | `INVALID_PLANNED_OPERATION_ID` | Planned工程計画IDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 13 | 入力・状態不正 | `INVALID_ASSUMPTION_ID` | 前提条件IDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 14 | 入力・状態不正 | `INVALID_DIAGNOSIS_SCENARIO_ID` | 診断シナリオIDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 15 | 入力・状態不正 | `INVALID_TARGET_MONTH` | 対象Monthが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 16 | 入力・状態不正 | `INVALID_DATE` | 日付が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 17 | 入力・状態不正 | `INVALID_TIME` | 時刻が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 18 | 入力・状態不正 | `INVALID_DATE_TIME` | 日付時刻が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 19 | 入力・状態不正 | `INVALID_TIME_RANGE` | 時刻Rangeが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 20 | 共通・Domain | `INCOMPLETE_TIME_RANGE` | Incomplete時刻Rangeを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 21 | 入力・状態不正 | `INVALID_PLAN_VERSION_STATUS` | 計画版状態が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 22 | 入力・状態不正 | `INVALID_PLAN_VERSION_TRANSITION` | 計画版Transitionが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 23 | 共通・Domain | `PLAN_VERSION_NOT_EDITABLE` | 計画版NotEditableを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 24 | 共通・Domain | `SOURCE_VERSION_SELF_REFERENCE` | 出所版SelfReferenceを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 25 | 入力・状態不正 | `INVALID_PLANNED_QUANTITY` | Planned数量が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 26 | 入力・状態不正 | `INVALID_QUANTITY_UNIT` | 数量単位が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 27 | 入力・状態不正 | `INVALID_PRIORITY` | 優先度が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 28 | 入力・状態不正 | `INVALID_ASSUMPTION_STATUS` | 前提条件の状態が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 29 | 入力・状態不正 | `INVALID_ASSUMPTION_TRANSITION` | 前提条件Transitionが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 30 | 共通・Domain | `CONFIRMED_AT_REQUIRED` | 確認済みAtRequiredを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 31 | 共通・Domain | `REJECTED_AT_REQUIRED` | 不成立確認AtRequiredを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 32 | 入力・状態不正 | `INVALID_VALIDITY_PERIOD` | 有効性Periodが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 33 | 入力・状態不正 | `INVALID_DIAGNOSIS_SCENARIO` | 診断シナリオが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 34 | 入力・状態不正 | `INVALID_CAPACITY_BASELINE` | 能力基準が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 35 | 未対応 | `UNSUPPORTED_CAPACITY_BASELINE` | 能力基準は現在のVersionでは対応していません。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 36 | 共通・Domain | `BASE_SCENARIO_SELF_REFERENCE` | 基準シナリオSelfReferenceを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 37 | 共通・Domain | `COMPARISON_BASE_REQUIRED` | 比較基準Requiredを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 38 | 共通・Domain | `CHANGE_SUMMARY_REQUIRED` | 変更SummaryRequiredを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 39 | Capacity | `CAPACITY_RULE_NOT_FOUND` | 対象Operationへ適用できる能力Ruleがありません。 | 設備・有効期間・数量単位・条件属性を確認し、Ruleを登録します。 |
| 40 | Capacity | `CAPACITY_RULE_CONFLICT` | 同順位・同具体性の能力Ruleが複数あります。 | 優先度または条件を見直し、一件に解決できる状態へ修正します。 |
| 41 | Capacity | `CAPACITY_UNIT_MISMATCH` | 計画数量単位と能力Ruleの数量単位が一致しません。 | 正式な単位変換Ruleを用意するか、同じ単位のRuleを使用します。 |
| 42 | Capacity | `CAPACITY_BUCKET_NOT_FOUND` | 能力Bucketが見つかりません。 | Capacity Bucket、Rule、単位、利用可能時間、設備・Shiftを確認します。 |
| 43 | Capacity | `CAPACITY_ALLOCATION_EXCEEDED` | 能力AllocationExceededを示すErrorです。 | Capacity Bucket、Rule、単位、利用可能時間、設備・Shiftを確認します。 |
| 44 | 診断実行 | `DIAGNOSIS_SOURCE_INCONSISTENT` | 診断出所Inconsistentを示すErrorです。 | Scenario、Plan Version、外部Data、Revisionの一致を確認して再診断します。 |
| 45 | 診断実行 | `DIAGNOSIS_SOURCE_CHANGED_DURING_EXECUTION` | 診断中にPlanや外部Dataが変更されました。 | 変更完了後、最新Dataから診断をやり直します。 |
| 46 | 共通・Domain | `READ_MODEL_INTEGRITY_ERROR` | 参照先Entityが欠落するなど、保存Dataの関連が壊れています。 | Plan・Scenario・Assumption・Relationの参照IDを確認し、Backupからの復元も検討します。 |
| 47 | Repository | `ENTITY_NOT_FOUND` | Entityが見つかりません。 | 対象Entityの存在と参照IDを確認します。必要に応じてBackupから復元します。 |
| 48 | Repository | `REPOSITORY_CONTRACT_VIOLATION` | 保存庫ContractViolationを示すErrorです。 | 対象Entityの存在と参照IDを確認します。必要に応じてBackupから復元します。 |
| 49 | CSV Import | `IMPORT_VALIDATION_FAILED` | 取込Validationに失敗しました。 | 行番号・Column・Issue Codeを確認し、CSV修正後にPreviewからやり直します。 |
| 50 | CSV Import | `IMPORT_STALE_PREVIEW` | 取込Preview後に元Dataが変更されています。 | CSVを選び直し、最新状態でPreviewを再作成します。 |
| 51 | CSV Import | `IMPORT_COMMIT_NOT_ALLOWED` | 取込CommitNotAllowedを示すErrorです。 | 行番号・Column・Issue Codeを確認し、CSV修正後にPreviewからやり直します。 |
| 52 | CSV Import | `IMPORT_TRANSACTION_FAILED` | 取込一括保存に失敗しました。 | 行番号・Column・Issue Codeを確認し、CSV修正後にPreviewからやり直します。 |
| 53 | 入力・状態不正 | `INVALID_CSV_TEXT` | CSV文字列が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 54 | CSV Import | `CSV_PARSE_ERROR` | CSVParseエラーを示すErrorです。 | 行番号・Column・Issue Codeを確認し、CSV修正後にPreviewからやり直します。 |
| 55 | CSV Import | `CSV_HEADER_VALIDATION_FAILED` | CSVHeaderValidationに失敗しました。 | 行番号・Column・Issue Codeを確認し、CSV修正後にPreviewからやり直します。 |
| 56 | 入力・状態不正 | `INVALID_IMPORT_BATCH_ID` | 取込一括処理IDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 57 | 入力・状態不正 | `INVALID_IMPORT_PREVIEW` | 取込事前確認が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 58 | 入力・状態不正 | `INVALID_IMPORT_ROW` | 取込Rowが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 59 | CSV Import | `IMPORT_TARGET_VERSION_MISMATCH` | 取込対象版Mismatchを示すErrorです。 | 行番号・Column・Issue Codeを確認し、CSV修正後にPreviewからやり直します。 |
| 60 | CSV Import | `IMPORT_TARGET_VERSION_NOT_FOUND` | 取込対象版が見つかりません。 | 行番号・Column・Issue Codeを確認し、CSV修正後にPreviewからやり直します。 |
| 61 | CSV Import | `IMPORT_TARGET_VERSION_NOT_EDITABLE` | 選択したPlan Versionは承認済み等で編集できません。 | 新しいDRAFT Versionを作成し、CSVのplanVersionIdを合わせます。 |
| 62 | 画面 | `PRESENTATION_TARGET_NOT_FOUND` | 表示対象が見つかりません。 | 画面を再読込し、選択中Plan・Scenarioと表示対象IDを確認します。 |
| 63 | 入力・状態不正 | `INVALID_DASHBOARD_VIEW_MODEL` | DashboardViewモデルが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 64 | 入力・状態不正 | `INVALID_DASHBOARD_SELECTION` | DashboardSelectionが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 65 | 入力・状態不正 | `INVALID_DIAGNOSIS_BROWSER_CONTROLLER` | 診断BrowserControllerが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 66 | 入力・状態不正 | `INVALID_DIAGNOSIS_DOM_RENDERER` | 診断DomRendererが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 67 | 入力・状態不正 | `INVALID_PLANNED_OPERATION_CSV_IMPORT_CONTROLLER` | Planned工程計画CSV取込Controllerが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 68 | 入力・状態不正 | `INVALID_ENTITY_CSV_IMPORT_CONTROLLER` | EntityCSV取込Controllerが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 69 | 診断実行 | `DIAGNOSIS_DOM_ROOT_NOT_FOUND` | 診断DomRootが見つかりません。 | Scenario、Plan Version、外部Data、Revisionの一致を確認して再診断します。 |
| 70 | 共通・Domain | `STALE_PRESENTATION_REQUEST` | 旧条件表示Requestを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 71 | 未対応 | `UNSUPPORTED_ROUTE` | Routeは現在のVersionでは対応していません。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 72 | Capacity | `CAPACITY_ALLOCATION_TARGET_AMBIGUOUS` | 能力Allocation対象Ambiguousを示すErrorです。 | Capacity Bucket、Rule、単位、利用可能時間、設備・Shiftを確認します。 |
| 73 | Capacity | `CAPACITY_LEDGER_NOT_FOUND` | 能力Ledgerが見つかりません。 | Capacity Bucket、Rule、単位、利用可能時間、設備・Shiftを確認します。 |
| 74 | 診断実行 | `DIAGNOSIS_SCENARIO_ALREADY_ACTIVE` | 診断シナリオAlreadyActiveを示すErrorです。 | Scenario、Plan Version、外部Data、Revisionの一致を確認して再診断します。 |
| 75 | 診断実行 | `DIAGNOSIS_SCENARIO_ALREADY_INACTIVE` | 診断シナリオAlreadyInactiveを示すErrorです。 | Scenario、Plan Version、外部Data、Revisionの一致を確認して再診断します。 |
| 76 | 診断実行 | `DIAGNOSIS_SCENARIO_ARCHIVED` | 診断シナリオ保管を示すErrorです。 | Scenario、Plan Version、外部Data、Revisionの一致を確認して再診断します。 |
| 77 | 重複 | `DUPLICATE_CAPACITY_ALLOCATION` | 能力Allocationが重複しています。 | 重複IDまたは一意Keyを確認し、どちらを残すか決めて修正します。 |
| 78 | 重複 | `DUPLICATE_CAPACITY_BUCKET` | 能力Bucketが重複しています。 | 重複IDまたは一意Keyを確認し、どちらを残すか決めて修正します。 |
| 79 | 重複 | `DUPLICATE_DOMAIN_EVENT` | ドメインEventが重複しています。 | 重複IDまたは一意Keyを確認し、どちらを残すか決めて修正します。 |
| 80 | 重複 | `DUPLICATE_ID_PREFIX` | IDPrefixが重複しています。 | 重複IDまたは一意Keyを確認し、どちらを残すか決めて修正します。 |
| 81 | 重複 | `DUPLICATE_OPERATION_DIAGNOSIS_RESULT` | 工程計画診断結果が重複しています。 | 重複IDまたは一意Keyを確認し、どちらを残すか決めて修正します。 |
| 82 | 共通・Domain | `EVENT_CAUSATION_SELF_REFERENCE` | EventCausationSelfReferenceを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 83 | 入力・状態不正 | `INVALID_ASSUMPTION_CONFIDENCE` | 前提条件確信度が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 84 | 入力・状態不正 | `INVALID_ASSUMPTION_EVIDENCE` | 前提条件根拠が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 85 | 入力・状態不正 | `INVALID_ASSUMPTION_FINDING` | 前提条件所見が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 86 | 入力・状態不正 | `INVALID_ASSUMPTION_IMPACT_LEVEL` | 前提条件影響水準が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 87 | 入力・状態不正 | `INVALID_ASSUMPTION_RESOLUTION` | 前提条件解決が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 88 | 入力・状態不正 | `INVALID_ASSUMPTION_STATE` | 前提条件Stateが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 89 | 入力・状態不正 | `INVALID_ASSUMPTION_TARGET` | 前提条件対象が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 90 | 入力・状態不正 | `INVALID_ASSUMPTION_TEXT` | 前提条件文字列が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 91 | 入力・状態不正 | `INVALID_ASSUMPTION_TYPE` | 前提条件種類が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 92 | 入力・状態不正 | `INVALID_CAPACITY_ALLOCATION` | 能力Allocationが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 93 | 入力・状態不正 | `INVALID_CAPACITY_ALLOCATION_REQUEST` | 能力AllocationRequestが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 94 | 入力・状態不正 | `INVALID_CAPACITY_BUCKET` | 能力Bucketが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 95 | 入力・状態不正 | `INVALID_CAPACITY_BUCKET_STATE` | 能力BucketStateが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 96 | 入力・状態不正 | `INVALID_CAPACITY_LEDGER` | 能力Ledgerが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 97 | 入力・状態不正 | `INVALID_CAPACITY_MULTIPLIER` | 能力倍率が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 98 | 入力・状態不正 | `INVALID_CAPACITY_REASON_CODE` | 能力理由Codeが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 99 | 入力・状態不正 | `INVALID_CAPACITY_RULE` | 能力ルールが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 100 | 入力・状態不正 | `INVALID_CAPACITY_SCENARIO_ID` | 能力シナリオIDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 101 | 入力・状態不正 | `INVALID_CAPACITY_SNAPSHOT` | 能力Snapshotが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 102 | 入力・状態不正 | `INVALID_CAPACITY_VALUE` | 能力値が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 103 | 入力・状態不正 | `INVALID_CONFIRMED_CONSTRAINT` | 確認済み制約が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 104 | 入力・状態不正 | `INVALID_CONSTRAINT_FINDING` | 制約所見が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 105 | 入力・状態不正 | `INVALID_DIAGNOSIS_ENGINE` | 診断Engineが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 106 | 入力・状態不正 | `INVALID_DIAGNOSIS_RESULT` | 診断結果が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 107 | 入力・状態不正 | `INVALID_DIAGNOSIS_SCENARIO_CATEGORY` | 診断シナリオ区分が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 108 | 入力・状態不正 | `INVALID_DIAGNOSIS_SCENARIO_NAME` | 診断シナリオ名称が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 109 | 入力・状態不正 | `INVALID_DIAGNOSIS_SCENARIO_STATE` | 診断シナリオStateが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 110 | 入力・状態不正 | `INVALID_DIAGNOSIS_SCENARIO_TEXT` | 診断シナリオ文字列が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 111 | 入力・状態不正 | `INVALID_DIAGNOSIS_SUMMARY` | 診断Summaryが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 112 | 入力・状態不正 | `INVALID_SCENARIO_COMPARISON` | シナリオ比較が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 113 | 共通・Domain | `SCENARIO_COMPARISON_NOT_AVAILABLE` | 比較元・比較先の診断結果がそろっていません。 | 両Scenarioを診断してから比較します。 |
| 114 | 入力・状態不正 | `INVALID_DOMAIN_EVENT` | ドメインEventが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 115 | 入力・状態不正 | `INVALID_DOMAIN_EVENT_COLLECTOR` | ドメインEventCollectorが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 116 | 入力・状態不正 | `INVALID_EQUIPMENT_ID` | 設備IDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 117 | 入力・状態不正 | `INVALID_EVENT_ACTOR` | Event実行者が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 118 | 入力・状態不正 | `INVALID_EVENT_DATA` | Eventデータが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 119 | 入力・状態不正 | `INVALID_EVENT_ID` | EventIDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 120 | 入力・状態不正 | `INVALID_EVENT_TIME_ORDER` | Event時刻受注が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 121 | 入力・状態不正 | `INVALID_EVENT_TYPE` | Event種類が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 122 | 入力・状態不正 | `INVALID_EVENT_VERSION` | Event版が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 123 | 入力・状態不正 | `INVALID_FACTORY_ID` | 工場IDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 124 | 入力・状態不正 | `INVALID_FINDING_METRICS` | 所見Metricsが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 125 | 入力・状態不正 | `INVALID_FINDING_SOURCE` | 所見出所が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 126 | 入力・状態不正 | `INVALID_GENERATED_ID` | GeneratedIDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 127 | 入力・状態不正 | `INVALID_ID_COUNTER` | IDCounterが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 128 | 入力・状態不正 | `INVALID_ID_NAMESPACE` | ID名前空間が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 129 | 入力・状態不正 | `INVALID_ID_PREFIX` | IDPrefixが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 130 | 入力・状態不正 | `INVALID_MODEL_CONDITION` | モデル条件が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 131 | 入力・状態不正 | `INVALID_MODEL_COVERAGE_EVALUATION` | モデル網羅範囲Evaluationが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 132 | 入力・状態不正 | `INVALID_NEXT_CHECK` | 次確認が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 133 | 入力・状態不正 | `INVALID_NEXT_CHECK_STATE` | 次確認Stateが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 134 | 入力・状態不正 | `INVALID_OPERATION_CONDITION` | 工程計画条件が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 135 | 入力・状態不正 | `INVALID_OPERATION_DIAGNOSIS_RESULT` | 工程計画診断結果が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 136 | 入力・状態不正 | `INVALID_OPERATION_DIMENSION` | 工程計画Dimensionが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 137 | 入力・状態不正 | `INVALID_OPERATION_STATUS_DECISION` | 工程計画状態Decisionが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 138 | 入力・状態不正 | `INVALID_ORDER_ID` | 受注IDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 139 | 入力・状態不正 | `INVALID_PLANNED_OPERATION_TEXT` | Planned工程計画文字列が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 140 | 入力・状態不正 | `INVALID_PLAN_NAME` | 計画名称が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 141 | 入力・状態不正 | `INVALID_PLAN_VERSION_NAME` | 計画版名称が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 142 | 入力・状態不正 | `INVALID_PLAN_VERSION_NUMBER` | 計画版番号が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 143 | 入力・状態不正 | `INVALID_PLAN_VERSION_STATE` | 計画版Stateが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 144 | 入力・状態不正 | `INVALID_PLAN_VERSION_TEXT` | 計画版文字列が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 145 | 入力・状態不正 | `INVALID_PRIMARY_FACTORY_ID` | 主工場IDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 146 | 入力・状態不正 | `INVALID_PRODUCTION_PLAN_TEXT` | Production計画文字列が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 147 | 入力・状態不正 | `INVALID_QUANTITY_PRECISION` | 数量Precisionが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 148 | 入力・状態不正 | `INVALID_RESULT_VALIDITY` | 結果有効性が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 149 | 入力・状態不正 | `INVALID_ROUTING_DEFINITION` | 工程順Definitionが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 150 | 入力・状態不正 | `INVALID_ROUTING_DIAGNOSIS` | 工程順診断が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 151 | 入力・状態不正 | `INVALID_ROUTING_OPERATION_ID` | 工程順工程計画IDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 152 | 入力・状態不正 | `INVALID_SCENARIO_ASSUMPTION_RELATION` | シナリオ前提条件Relationが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 153 | 入力・状態不正 | `INVALID_SHIFT_ID` | シフトIDが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 154 | 入力・状態不正 | `INVALID_SHIFT_SEQUENCE` | シフトSequenceが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 155 | 入力・状態不正 | `INVALID_SOURCE_REVISION` | 出所改訂番号が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 156 | 入力・状態不正 | `INVALID_STANDARD_DURATION` | StandardDurationが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 157 | 共通・Domain | `PRODUCTION_PLAN_ALREADY_ACTIVE` | Production計画AlreadyActiveを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 158 | 共通・Domain | `PRODUCTION_PLAN_ALREADY_INACTIVE` | Production計画AlreadyInactiveを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 159 | 共通・Domain | `REPLACEMENT_VERSION_SELF_REFERENCE` | Replacement版SelfReferenceを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |
| 160 | 入力・状態不正 | `INVALID_STALE_REASON_DETECTION` | 旧条件理由Detectionが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 161 | 入力・状態不正 | `INVALID_RESULT_VALIDITY_EVALUATION` | 結果有効性Evaluationが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 162 | 入力・状態不正 | `INVALID_REVISION_IMPACT_MAP` | 改訂番号影響Mapが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 163 | 入力・状態不正 | `INVALID_CURRENT_DIAGNOSIS_SOURCE` | 最新条件で有効診断出所が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 164 | 入力・状態不正 | `INVALID_REPOSITORY` | 保存庫が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 165 | 入力・状態不正 | `INVALID_REPOSITORY_STATE` | 保存庫Stateが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 166 | 重複 | `DUPLICATE_ENTITY` | Entityが重複しています。 | 重複IDまたは一意Keyを確認し、どちらを残すか決めて修正します。 |
| 167 | 重複 | `DUPLICATE_UNIQUE_KEY` | UniqueKeyが重複しています。 | 重複IDまたは一意Keyを確認し、どちらを残すか決めて修正します。 |
| 168 | 入力・状態不正 | `INVALID_DIAGNOSIS_EXECUTION_DATA` | 診断Executionデータが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 169 | 入力・状態不正 | `INVALID_DIAGNOSIS_EXECUTION_DATA_PROVIDER` | 診断ExecutionデータProviderが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 170 | 入力・状態不正 | `INVALID_RUN_PLAN_DIAGNOSIS` | Run計画診断が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 171 | 診断実行 | `DIAGNOSIS_EXECUTION_NOT_ALLOWED` | 診断ExecutionNotAllowedを示すErrorです。 | Scenario、Plan Version、外部Data、Revisionの一致を確認して再診断します。 |
| 172 | 入力・状態不正 | `INVALID_REPOSITORY_SNAPSHOT` | 保存庫Snapshotが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 173 | 入力・状態不正 | `INVALID_BACKUP_DOCUMENT` | バックアップ文書が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 174 | 保存・Backup・復元 | `UNSUPPORTED_BACKUP_SCHEMA_VERSION` | このApplicationが対応していないBackup形式です。 | 対応VersionのDAY30で開くか、移行手順を確認します。 |
| 175 | 保存・Backup・復元 | `PERSISTENCE_STORAGE_ERROR` | 永続保存Storageエラーを示すErrorです。 | 現在Dataを上書きせず、Backup形式と参照整合性を確認して再実行します。 |
| 176 | 保存・Backup・復元 | `PERSISTENCE_RESTORE_FAILED` | Browser保存Dataの復元に失敗しました。 | 現在Dataは保持されます。Backup JSONとSchema Versionを確認します。 |
| 177 | 入力・状態不正 | `INVALID_DIAGNOSIS_EXECUTION_DATA_SNAPSHOT` | 診断ExecutionデータSnapshotが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 178 | 入力・状態不正 | `INVALID_DIAGNOSIS_EXECUTION_DATA_SNAPSHOT_SERVICE` | 診断ExecutionデータSnapshotServiceが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 179 | 入力・状態不正 | `INVALID_EXTERNAL_DATA_DOCUMENT` | 外部データ文書が正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 180 | 外部Data | `UNSUPPORTED_EXTERNAL_DATA_SCHEMA_VERSION` | 外部データSchema版は現在のVersionでは対応していません。 | JSON Schema、対象月、Capacity Scenario、Revision、Master参照を確認します。 |
| 181 | 重複 | `DUPLICATE_DIAGNOSIS_EXECUTION_DATA` | 診断Executionデータが重複しています。 | 重複IDまたは一意Keyを確認し、どちらを残すか決めて修正します。 |
| 182 | 外部Data | `EXTERNAL_DATA_RESTORE_FAILED` | 外部データ復元に失敗しました。 | JSON Schema、対象月、Capacity Scenario、Revision、Master参照を確認します。 |
| 183 | 外部Data | `EXTERNAL_DATA_IMPORT_STALE_PREVIEW` | 外部Data Preview後に現在Dataが変更されました。 | 外部JSONを再選択し、Previewからやり直します。 |
| 184 | 外部Data | `EXTERNAL_DATA_IMPORT_COMMIT_NOT_ALLOWED` | 外部データ取込CommitNotAllowedを示すErrorです。 | JSON Schema、対象月、Capacity Scenario、Revision、Master参照を確認します。 |
| 185 | 入力・状態不正 | `INVALID_EXTERNAL_DATA_IMPORT_CONTROLLER` | 外部データ取込Controllerが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 186 | 入力・状態不正 | `INVALID_EXTERNAL_DATA_EXPORT_SERVICE` | 外部データExportServiceが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 187 | 外部Data | `EXTERNAL_DATA_EXPORT_FAILED` | 外部データExportに失敗しました。 | JSON Schema、対象月、Capacity Scenario、Revision、Master参照を確認します。 |
| 188 | 入力・状態不正 | `INVALID_EXTERNAL_DATA_CSV_BUNDLE` | 外部データCSVBundleが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 189 | 入力・状態不正 | `INVALID_EXTERNAL_DATA_CSV_BUNDLE_BUILDER` | 外部データCSVBundleBuilderが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 190 | 外部Data | `EXTERNAL_DATA_CSV_BUNDLE_VALIDATION_FAILED` | 外部データCSVBundleValidationに失敗しました。 | JSON Schema、対象月、Capacity Scenario、Revision、Master参照を確認します。 |
| 191 | 入力・状態不正 | `INVALID_APPLICATION_SNAPSHOT_SERVICE` | アプリケーションSnapshotServiceが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 192 | 保存・Backup・復元 | `APPLICATION_SNAPSHOT_ROLLBACK_FAILED` | アプリケーションSnapshotRollbackに失敗しました。 | 現在Dataを上書きせず、Backup形式と参照整合性を確認して再実行します。 |
| 193 | 入力・状態不正 | `INVALID_PERSISTENCE_COORDINATOR` | 永続保存Coordinatorが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 194 | 入力・状態不正 | `INVALID_BACKUP_CONTROLLER` | バックアップControllerが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 195 | 入力・状態不正 | `INVALID_TRANSACTION_MANAGER` | 一括保存Managerが正式な入力・状態条件を満たしていません。 | 対象Field、Status、参照ID、必須項目を確認し、正式条件へ修正します。 |
| 196 | Transaction | `TRANSACTION_ALREADY_ACTIVE` | 一括保存AlreadyActiveを示すErrorです。 | 部分保存はされていません。原因を修正して処理全体を再実行します。 |
| 197 | Transaction | `TRANSACTION_ROLLBACK_FAILED` | 一括保存Rollbackに失敗しました。 | 部分保存はされていません。原因を修正して処理全体を再実行します。 |
| 198 | 共通・Domain | `UNEXPECTED_ERROR` | 予期しないエラーを示すErrorです。 | Errorのcontextと対象Fieldを確認し、原因を修正して再実行します。 |

## Error対応の基本順序

1. Error Codeと対象Fieldを確認する。
2. 現在選択中のPlan Version・Scenario・対象月を確認する。
3. Previewがある処理はPreviewからやり直す。
4. Transaction失敗では部分保存されていないことを確認する。
5. 復元Errorでは現在Dataを上書きせず、BackupのApplication ID・Schema Version・参照整合性を確認する。
6. 修正後に再診断し、Result Validityが`CURRENT`になったことを確認する。
