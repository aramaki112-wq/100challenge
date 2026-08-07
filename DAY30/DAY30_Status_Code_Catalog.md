# DAY30 Status・Code Catalog

> Source of Truth: `DiagnosisCodes.js`

このCatalogは、実装で使用する正式Codeを日本語で参照するための資料です。Code自体は変更せず、日本語の意味を併記します。

## 重要な読取Rule

- `UNKNOWN` は0や実行不可能ではありません。判断材料が不足している状態です。
- `EXPECTED` は `CONFIRMED` ではありません。
- Diagnosis StatusとResult Validityは別の軸です。
- 数量単位が異なる場合は自動換算しません。

## ACTOR_TYPE / 実行者種類

実行者種類に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `USER` | 利用者 | 「利用者」を表す正式Codeです。 |
| `SYSTEM` | システム | 「システム」を表す正式Codeです。 |
| `IMPORT` | 取込 | 「取込」を表す正式Codeです。 |
| `EXTERNAL_ADAPTER` | 外部Adapter | 「外部Adapter」を表す正式Codeです。 |

## ASSUMPTION_CONFIDENCE / 前提条件確信度

前提条件確信度に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `HIGH` | 高 | 「高」を表す正式Codeです。 |
| `MEDIUM` | 中 | 「中」を表す正式Codeです。 |
| `LOW` | 低 | 「低」を表す正式Codeです。 |

## ASSUMPTION_EFFECTIVE_STATUS / 前提条件有効状態

前提条件有効状態に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `UNKNOWN` | 判断不能 | 情報不足・前提未確認・Model外などにより、成立性を断定できない状態です。 |
| `EXPECTED` | 成立見込み | 成立する見込みはあるものの、根拠をもって確認済みではない状態です。 |
| `EFFECTIVE_CONFIRMED` | 有効確認済み | 「有効確認済み」を表す正式Codeです。 |
| `REJECTED` | 不成立確認 | 前提条件が成立しないことを根拠付きで確認した状態です。 |
| `EXPIRED` | 期限切れ | 以前の確認結果または見込みが有効期限を過ぎた状態です。 |
| `OUTSIDE_VALIDITY` | Outside有効性 | 「Outside有効性」を表す正式Codeです。 |

## ASSUMPTION_EVIDENCE_TYPE / 前提条件根拠種類

前提条件根拠種類に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `SYSTEM_RECORD` | システムRecord | 「システムRecord」を表す正式Codeです。 |
| `DOCUMENT` | 文書 | 「文書」を表す正式Codeです。 |
| `EMAIL` | Email | 「Email」を表す正式Codeです。 |
| `INTERVIEW` | 聞取り | 「聞取り」を表す正式Codeです。 |
| `OBSERVATION` | 観測 | 「観測」を表す正式Codeです。 |
| `CALCULATION` | 計算 | 「計算」を表す正式Codeです。 |
| `EXTERNAL_CONFIRMATION` | 外部確認 | 「外部確認」を表す正式Codeです。 |
| `OTHER` | その他 | 「その他」を表す正式Codeです。 |

## ASSUMPTION_IMPACT_LEVEL / 前提条件影響水準

前提条件影響水準に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `CRITICAL` | 重大 | 「重大」を表す正式Codeです。 |
| `HIGH` | 高 | 「高」を表す正式Codeです。 |
| `MEDIUM` | 中 | 「中」を表す正式Codeです。 |
| `LOW` | 低 | 「低」を表す正式Codeです。 |

## ASSUMPTION_RESOLUTION_STATUS / 前提条件解決状態

前提条件解決状態に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `SATISFIED` | 成立 | 「成立」を表す正式Codeです。 |
| `UNRESOLVED` | Unresolved | 「Unresolved」を表す正式Codeです。 |
| `REJECTED` | 不成立確認 | 前提条件が成立しないことを根拠付きで確認した状態です。 |
| `CONFLICT` | Conflict | 「Conflict」を表す正式Codeです。 |
| `NOT_APPLICABLE` | NotApplicable | 「NotApplicable」を表す正式Codeです。 |

## ASSUMPTION_STATUS / 前提条件の状態

未確認の前提条件を事実と分離して管理する状態です。EXPECTEDはCONFIRMEDではありません。

| Code | 日本語 | 説明 |
|---|---|---|
| `UNKNOWN` | 判断不能 | 情報不足・前提未確認・Model外などにより、成立性を断定できない状態です。 |
| `EXPECTED` | 成立見込み | 成立する見込みはあるものの、根拠をもって確認済みではない状態です。 |
| `CONFIRMED` | 確認済み | 根拠・確認者・確認日時をもって成立を確認した状態です。 |
| `REJECTED` | 不成立確認 | 前提条件が成立しないことを根拠付きで確認した状態です。 |
| `EXPIRED` | 期限切れ | 以前の確認結果または見込みが有効期限を過ぎた状態です。 |

## ASSUMPTION_TARGET_TYPE / 前提条件対象種類

前提条件対象種類に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `PRODUCTION_PLAN` | Production計画 | 「Production計画」を表す正式Codeです。 |
| `PLAN_VERSION` | 計画版 | 「計画版」を表す正式Codeです。 |
| `PLANNED_OPERATION` | Planned工程計画 | 「Planned工程計画」を表す正式Codeです。 |
| `ORDER` | 受注 | 「受注」を表す正式Codeです。 |
| `ROUTING_OPERATION` | 工程順工程計画 | 「工程順工程計画」を表す正式Codeです。 |
| `FACTORY` | 工場 | 「工場」を表す正式Codeです。 |
| `PROCESS` | Process | 「Process」を表す正式Codeです。 |
| `EQUIPMENT` | 設備 | 「設備」を表す正式Codeです。 |
| `SHIFT` | シフト | 「シフト」を表す正式Codeです。 |
| `WORKER` | 作業者 | 「作業者」を表す正式Codeです。 |
| `SKILL` | 技能 | 「技能」を表す正式Codeです。 |
| `MATERIAL` | 材料 | 「材料」を表す正式Codeです。 |
| `TRANSPORT` | 運搬 | 「運搬」を表す正式Codeです。 |

## ASSUMPTION_TYPE / 前提条件種類

前提条件種類に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `MATERIAL_ARRIVAL` | 材料Arrival | 「材料Arrival」を表す正式Codeです。 |
| `PREVIOUS_OPERATION_COMPLETION` | Previous工程計画Completion | 「Previous工程計画Completion」を表す正式Codeです。 |
| `EQUIPMENT_AVAILABILITY` | 設備利用可否 | 「設備利用可否」を表す正式Codeです。 |
| `WORKER_AVAILABILITY` | 作業者利用可否 | 「作業者利用可否」を表す正式Codeです。 |
| `SKILL_AVAILABILITY` | 技能利用可否 | 「技能利用可否」を表す正式Codeです。 |
| `TRANSPORT_AVAILABILITY` | 運搬利用可否 | 「運搬利用可否」を表す正式Codeです。 |
| `QUALITY_RELEASE` | 品質Release | 「品質Release」を表す正式Codeです。 |
| `STORAGE_SPACE` | StorageSpace | 「StorageSpace」を表す正式Codeです。 |
| `OUTSOURCING_AVAILABILITY` | Outsourcing利用可否 | 「Outsourcing利用可否」を表す正式Codeです。 |
| `INFORMATION_FRESHNESS` | InformationFreshness | 「InformationFreshness」を表す正式Codeです。 |
| `OTHER` | その他 | 「その他」を表す正式Codeです。 |

## CAPACITY_BASELINE / 能力基準

能力基準に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `AVAILABLE_CAPACITY` | 利用可能能力 | 「利用可能能力」を表す正式Codeです。 |
| `REMAINING_AFTER_BASELINE` | RemainingAfter基準 | 「RemainingAfter基準」を表す正式Codeです。 |

## CAPACITY_RATE_BASIS / 能力能力率基準

能力能力率基準に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `HOUR` | 時間 | 「時間」を表す正式Codeです。 |
| `SHIFT` | シフト | 「シフト」を表す正式Codeです。 |
| `DAY` | 日 | 「日」を表す正式Codeです。 |

## CAPACITY_RESOURCE_STATUS / 能力資源状態

能力資源状態に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `SATISFIED` | 成立 | 「成立」を表す正式Codeです。 |
| `PARTIALLY_SATISFIED` | 一部成立 | 「一部成立」を表す正式Codeです。 |
| `UNSATISFIED` | 不成立 | 「不成立」を表す正式Codeです。 |
| `UNKNOWN` | 判断不能 | 情報不足・前提未確認・Model外などにより、成立性を断定できない状態です。 |

## CAPACITY_RULE_RESOLUTION_STATUS / 能力ルール解決状態

能力ルール解決状態に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `RESOLVED` | Resolved | 「Resolved」を表す正式Codeです。 |
| `NOT_FOUND` | NotFound | 「NotFound」を表す正式Codeです。 |
| `CONFLICT` | Conflict | 「Conflict」を表す正式Codeです。 |

## CAPACITY_RULE_SOURCE / 能力ルール出所

能力ルール出所に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `OPERATION_OVERRIDE` | 工程計画Override | 「工程計画Override」を表す正式Codeです。 |
| `ORDER_ATTRIBUTE` | 受注Attribute | 「受注Attribute」を表す正式Codeです。 |
| `DEFAULT_RULE` | 標準ルール | 「標準ルール」を表す正式Codeです。 |
| `NOT_FOUND` | NotFound | 「NotFound」を表す正式Codeです。 |
| `CONFLICT` | Conflict | 「Conflict」を表す正式Codeです。 |

## CAPACITY_STATUS / 能力判定状態

能力だけを見た成立状態です。最終診断状態とは別に保持します。

| Code | 日本語 | 説明 |
|---|---|---|
| `FEASIBLE` | 実行可能 | 必要条件が成立し、計画数量を実行可能と判断できる状態です。 |
| `PARTIALLY_FEASIBLE` | 一部実行可能 | 計画数量の一部だけ実行可能と判断できる状態です。 |
| `INFEASIBLE` | 実行不可能 | 確認済みの制約により、計画どおりには実行できない状態です。 |
| `UNKNOWN` | 判断不能 | 情報不足・前提未確認・Model外などにより、成立性を断定できない状態です。 |

## CONDITION_COVERAGE_TYPE / 条件網羅範囲種類

条件網羅範囲種類に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `DIRECT_MODEL` | 直接モデル | 「直接モデル」を表す正式Codeです。 |
| `ASSUMPTION` | 前提条件 | 「前提条件」を表す正式Codeです。 |
| `UNMODELED` | 未モデル化 | 「未モデル化」を表す正式Codeです。 |

## CONSTRAINT_CATEGORY / 制約区分

制約区分に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `CAPACITY` | 能力 | 「能力」を表す正式Codeです。 |
| `EQUIPMENT` | 設備 | 「設備」を表す正式Codeです。 |
| `WORKER` | 作業者 | 「作業者」を表す正式Codeです。 |
| `SKILL` | 技能 | 「技能」を表す正式Codeです。 |
| `ASSIGNMENT` | 配置 | 「配置」を表す正式Codeです。 |
| `ROUTING` | 工程順 | 「工程順」を表す正式Codeです。 |
| `ASSUMPTION` | 前提条件 | 「前提条件」を表す正式Codeです。 |
| `MATERIAL` | 材料 | 「材料」を表す正式Codeです。 |
| `TRANSPORT` | 運搬 | 「運搬」を表す正式Codeです。 |
| `QUALITY` | 品質 | 「品質」を表す正式Codeです。 |
| `MODEL_COVERAGE` | モデル網羅範囲 | 「モデル網羅範囲」を表す正式Codeです。 |
| `DATA` | データ | 「データ」を表す正式Codeです。 |
| `OTHER` | その他 | 「その他」を表す正式Codeです。 |

## CONSTRAINT_SEVERITY / 制約重大度

制約重大度に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `CRITICAL` | 重大 | 「重大」を表す正式Codeです。 |
| `HIGH` | 高 | 「高」を表す正式Codeです。 |
| `MEDIUM` | 中 | 「中」を表す正式Codeです。 |
| `LOW` | 低 | 「低」を表す正式Codeです。 |
| `INFO` | 情報 | 「情報」を表す正式Codeです。 |

## DATA_CONFIDENCE / データ確信度

データ確信度に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `A` | A | 「A」を表す正式Codeです。 |
| `B` | B | 「B」を表す正式Codeです。 |
| `C` | C | 「C」を表す正式Codeです。 |
| `D` | D | 「D」を表す正式Codeです。 |

## DIAGNOSIS_GRANULARITY / 診断粒度

診断粒度に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `DAY` | 日 | 「日」を表す正式Codeです。 |
| `SHIFT` | シフト | 「シフト」を表す正式Codeです。 |
| `TIME` | 時刻 | 「時刻」を表す正式Codeです。 |
| `UNAVAILABLE` | 利用不可 | 「利用不可」を表す正式Codeです。 |

## DIAGNOSIS_SCENARIO_CATEGORY / 診断シナリオ区分

基準、比較、実験、保管済みScenarioを区別します。

| Code | 日本語 | 説明 |
|---|---|---|
| `BASE` | 基準 | 「基準」を表す正式Codeです。 |
| `COMPARISON` | 比較 | 「比較」を表す正式Codeです。 |
| `EXPERIMENT` | 実験 | 「実験」を表す正式Codeです。 |
| `ARCHIVED` | 保管 | 「保管」を表す正式Codeです。 |

## DIAGNOSIS_STATUS / 診断状態

計画の成立性を表す最終状態です。UNKNOWNを0やINFEASIBLEへ置き換えません。

| Code | 日本語 | 説明 |
|---|---|---|
| `FEASIBLE` | 実行可能 | 必要条件が成立し、計画数量を実行可能と判断できる状態です。 |
| `PARTIALLY_FEASIBLE` | 一部実行可能 | 計画数量の一部だけ実行可能と判断できる状態です。 |
| `INFEASIBLE` | 実行不可能 | 確認済みの制約により、計画どおりには実行できない状態です。 |
| `UNKNOWN` | 判断不能 | 情報不足・前提未確認・Model外などにより、成立性を断定できない状態です。 |

## EQUIPMENT_AVAILABILITY_STATUS / 設備利用可否状態

設備利用可否状態に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `AVAILABLE` | 利用可能 | 「利用可能」を表す正式Codeです。 |
| `UNAVAILABLE` | 利用不可 | 「利用不可」を表す正式Codeです。 |
| `UNKNOWN` | 判断不能 | 情報不足・前提未確認・Model外などにより、成立性を断定できない状態です。 |

## FIELD_IMPACT_CLASSIFICATION / 項目影響区分

項目影響区分に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `DIAGNOSIS_AFFECTING` | 診断Affecting | 「診断Affecting」を表す正式Codeです。 |
| `PRESENTATION_ONLY` | 表示Only | 「表示Only」を表す正式Codeです。 |
| `AUDIT_ONLY` | 監査Only | 「監査Only」を表す正式Codeです。 |

## FINDING_CONFIRMATION_STATUS / 所見確認状態

所見確認状態に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `CONFIRMED` | 確認済み | 根拠・確認者・確認日時をもって成立を確認した状態です。 |
| `INFERRED` | 推定 | 「推定」を表す正式Codeです。 |
| `POSSIBLE` | 可能性 | 「可能性」を表す正式Codeです。 |
| `UNKNOWN` | 判断不能 | 情報不足・前提未確認・Model外などにより、成立性を断定できない状態です。 |

## FINDING_SOURCE_TYPE / 所見出所種類

所見出所種類に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `CAPACITY_ALLOCATION` | 能力Allocation | 「能力Allocation」を表す正式Codeです。 |
| `CAPACITY_RULE` | 能力ルール | 「能力ルール」を表す正式Codeです。 |
| `ROUTING_DIAGNOSIS` | 工程順診断 | 「工程順診断」を表す正式Codeです。 |
| `ASSUMPTION_RESOLUTION` | 前提条件解決 | 「前提条件解決」を表す正式Codeです。 |
| `MODEL_COVERAGE` | モデル網羅範囲 | 「モデル網羅範囲」を表す正式Codeです。 |
| `CONFIRMED_CONSTRAINT` | 確認済み制約 | 「確認済み制約」を表す正式Codeです。 |
| `DATA_VALIDATION` | データValidation | 「データValidation」を表す正式Codeです。 |
| `OTHER` | その他 | 「その他」を表す正式Codeです。 |

## ID_NAMESPACE / ID名前空間

ID名前空間に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `PRODUCTION_PLAN` | Production計画 | 「Production計画」を表す正式Codeです。 |
| `PLAN_VERSION` | 計画版 | 「計画版」を表す正式Codeです。 |
| `PLANNED_OPERATION` | Planned工程計画 | 「Planned工程計画」を表す正式Codeです。 |
| `ASSUMPTION` | 前提条件 | 「前提条件」を表す正式Codeです。 |
| `DIAGNOSIS_SCENARIO` | 診断シナリオ | 「診断シナリオ」を表す正式Codeです。 |
| `IMPORT_BATCH` | 取込一括処理 | 「取込一括処理」を表す正式Codeです。 |
| `EVENT` | Event | 「Event」を表す正式Codeです。 |
| `CORRELATION` | Correlation | 「Correlation」を表す正式Codeです。 |
| `CAPACITY_ALLOCATION` | 能力Allocation | 「能力Allocation」を表す正式Codeです。 |
| `CONSTRAINT_FINDING` | 制約所見 | 「制約所見」を表す正式Codeです。 |
| `ASSUMPTION_FINDING` | 前提条件所見 | 「前提条件所見」を表す正式Codeです。 |
| `NEXT_CHECK` | 次確認 | 「次確認」を表す正式Codeです。 |
| `OPERATION_DIAGNOSIS_RESULT` | 工程計画診断結果 | 「工程計画診断結果」を表す正式Codeです。 |
| `DIAGNOSIS_SUMMARY` | 診断Summary | 「診断Summary」を表す正式Codeです。 |
| `DIAGNOSIS_RESULT` | 診断結果 | 「診断結果」を表す正式Codeです。 |

## IMPORT_BATCH_STATUS / 取込一括処理状態

取込一括処理状態に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `RECEIVED` | Received | Import処理で「Received」として扱う正式Codeです。 |
| `PARSING` | Parsing | Import処理で「Parsing」として扱う正式Codeです。 |
| `PREVIEWED` | Previewed | Import処理で「Previewed」として扱う正式Codeです。 |
| `COMMIT_READY` | CommitReady | Import処理で「CommitReady」として扱う正式Codeです。 |
| `COMMITTED` | Committed | Import処理で「Committed」として扱う正式Codeです。 |
| `REJECTED` | 不成立確認 | 前提条件が成立しないことを根拠付きで確認した状態です。 |
| `EXPIRED` | 期限切れ | 以前の確認結果または見込みが有効期限を過ぎた状態です。 |

## IMPORT_ISSUE_CODE / 取込問題Code

取込問題Codeに使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `EMPTY_FILE` | EmptyFile | Import処理で「EmptyFile」として扱う正式Codeです。 |
| `CSV_PARSE_FAILED` | CSVParseFailed | Import処理で「CSVParseFailed」として扱う正式Codeです。 |
| `REQUIRED_HEADER_MISSING` | RequiredHeaderMissing | Import処理で「RequiredHeaderMissing」として扱う正式Codeです。 |
| `UNKNOWN_HEADER` | 判断不能Header | Import処理で「判断不能Header」として扱う正式Codeです。 |
| `DUPLICATE_HEADER` | 重複Header | Import処理で「重複Header」として扱う正式Codeです。 |
| `COLUMN_COUNT_MISMATCH` | ColumnCountMismatch | Import処理で「ColumnCountMismatch」として扱う正式Codeです。 |
| `REQUIRED_VALUE_MISSING` | Required値Missing | Import処理で「Required値Missing」として扱う正式Codeです。 |
| `INVALID_VALUE` | 使用不可値 | Import処理で「使用不可値」として扱う正式Codeです。 |
| `DUPLICATE_ROW_ID` | 重複RowID | Import処理で「重複RowID」として扱う正式Codeです。 |
| `TARGET_VERSION_MISMATCH` | 対象版Mismatch | Import処理で「対象版Mismatch」として扱う正式Codeです。 |
| `TARGET_VERSION_NOT_FOUND` | 対象版NotFound | Import処理で「対象版NotFound」として扱う正式Codeです。 |
| `TARGET_VERSION_NOT_EDITABLE` | 対象版NotEditable | Import処理で「対象版NotEditable」として扱う正式Codeです。 |
| `EXISTING_ENTITY_VERSION_MISMATCH` | ExistingEntity版Mismatch | Import処理で「ExistingEntity版Mismatch」として扱う正式Codeです。 |
| `EXISTING_ENTITY_SCOPE_MISMATCH` | ExistingEntityScopeMismatch | Import処理で「ExistingEntityScopeMismatch」として扱う正式Codeです。 |
| `TARGET_CONTEXT_MISMATCH` | 対象ContextMismatch | Import処理で「対象ContextMismatch」として扱う正式Codeです。 |
| `BASE_SCENARIO_NOT_FOUND` | 基準シナリオNotFound | Import処理で「基準シナリオNotFound」として扱う正式Codeです。 |
| `ENTITY_VALIDATION_FAILED` | EntityValidationFailed | Import処理で「EntityValidationFailed」として扱う正式Codeです。 |
| `EXISTING_ENTITY_UPDATE` | ExistingEntity更新 | Import処理で「ExistingEntity更新」として扱う正式Codeです。 |
| `UNCHANGED_ROW` | 変更なしRow | Import処理で「変更なしRow」として扱う正式Codeです。 |

## IMPORT_ISSUE_SEVERITY / 取込問題重大度

取込問題重大度に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `ERROR` | エラー | 入力または整合性に問題があり、Commitできません。 |
| `WARNING` | 警告 | Import処理で「警告」として扱う正式Codeです。 |
| `INFO` | 情報 | Import処理で「情報」として扱う正式Codeです。 |

## IMPORT_PREVIEW_STATUS / 取込事前確認状態

CSV Import時の各行の予定処理を表します。ERRORがある場合はCommitできません。

| Code | 日本語 | 説明 |
|---|---|---|
| `ADD` | 追加 | 新規Entityとして追加する予定です。 |
| `UPDATE` | 更新 | 既存Entityを更新する予定です。内容を確認してからCommitします。 |
| `UNCHANGED` | 変更なし | 既存Dataと同一で、書込みを行いません。 |
| `DUPLICATE` | 重複 | 同一IDまたは一意Keyが重複しています。修正が必要です。 |
| `ERROR` | エラー | 入力または整合性に問題があり、Commitできません。 |
| `WARNING` | 警告 | Import処理で「警告」として扱う正式Codeです。 |

## MODEL_COVERAGE_STATUS / モデル網羅状態

必要条件をSystemがどこまで直接判定できるかを表します。

| Code | 日本語 | 説明 |
|---|---|---|
| `MODELED` | モデル化済み | 「モデル化済み」を表す正式Codeです。 |
| `PARTIALLY_MODELED` | 一部モデル化済み | 「一部モデル化済み」を表す正式Codeです。 |
| `UNMODELED` | 未モデル化 | 「未モデル化」を表す正式Codeです。 |

## NEXT_CHECK_PRIORITY / 次確認優先度

次確認優先度に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `CRITICAL` | 重大 | 「重大」を表す正式Codeです。 |
| `HIGH` | 高 | 「高」を表す正式Codeです。 |
| `NORMAL` | Normal | 「Normal」を表す正式Codeです。 |
| `LOW` | 低 | 「低」を表す正式Codeです。 |

## NEXT_CHECK_SOURCE_TYPE / 次確認出所種類

次確認出所種類に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `CONSTRAINT_FINDING` | 制約所見 | 「制約所見」を表す正式Codeです。 |
| `ASSUMPTION_FINDING` | 前提条件所見 | 「前提条件所見」を表す正式Codeです。 |
| `MODEL_COVERAGE` | モデル網羅範囲 | 「モデル網羅範囲」を表す正式Codeです。 |
| `DIAGNOSIS_RESULT` | 診断結果 | 「診断結果」を表す正式Codeです。 |
| `OTHER` | その他 | 「その他」を表す正式Codeです。 |

## NEXT_CHECK_STATUS / 次確認状態

診断後に必要な確認Actionの進捗状態です。

| Code | 日本語 | 説明 |
|---|---|---|
| `OPEN` | 未着手 | 「未着手」を表す正式Codeです。 |
| `IN_PROGRESS` | InProgress | 「InProgress」を表す正式Codeです。 |
| `COMPLETED` | 完了 | 「完了」を表す正式Codeです。 |
| `NOT_REQUIRED` | NotRequired | 「NotRequired」を表す正式Codeです。 |
| `CANNOT_CONFIRM` | CannotConfirm | 「CannotConfirm」を表す正式Codeです。 |

## NEXT_CHECK_TYPE / 次確認種類

次確認種類に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `CONFIRM_ASSUMPTION` | Confirm前提条件 | 「Confirm前提条件」を表す正式Codeです。 |
| `VERIFY_CAPACITY_DATA` | Verify能力データ | 「Verify能力データ」を表す正式Codeです。 |
| `RESOLVE_CAPACITY_RULE` | Resolve能力ルール | 「Resolve能力ルール」を表す正式Codeです。 |
| `VERIFY_ROUTING` | Verify工程順 | 「Verify工程順」を表す正式Codeです。 |
| `REGISTER_MISSING_OPERATION` | RegisterMissing工程計画 | 「RegisterMissing工程計画」を表す正式Codeです。 |
| `RESOLVE_MODEL_GAP` | ResolveモデルGap | 「ResolveモデルGap」を表す正式Codeです。 |
| `CORRECT_PLAN` | Correct計画 | 「Correct計画」を表す正式Codeです。 |
| `OTHER` | その他 | 「その他」を表す正式Codeです。 |

## OPERATION_COMPARISON_OUTCOME / 工程別比較結果

工程別比較結果に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `IMPROVED` | Improved | 比較先で不足・Statusなどが改善しています。 |
| `WORSENED` | Worsened | 比較先で不足・Statusなどが悪化しています。 |
| `UNCHANGED` | 変更なし | 既存Dataと同一で、書込みを行いません。 |
| `MIXED` | Mixed | 改善と悪化が同時に存在します。 |
| `UNCERTAIN` | Uncertain | UNKNOWNを含むため、改善・悪化を断定できません。 |
| `ADDED` | 追加 | 「追加」を表す正式Codeです。 |
| `REMOVED` | Removed | 「Removed」を表す正式Codeです。 |

## OPERATION_STATUS_REASON / 工程診断の主理由

工程診断の主理由に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `ALL_CONDITIONS_SATISFIED` | AllConditions成立 | 工程診断の主理由が「AllConditions成立」であることを示します。 |
| `CAPACITY_PARTIAL` | 能力Partial | 工程診断の主理由が「能力Partial」であることを示します。 |
| `BLOCKING_ASSUMPTION_REJECTED` | 成立阻害前提条件不成立確認 | 工程診断の主理由が「成立阻害前提条件不成立確認」であることを示します。 |
| `CONFIRMED_CONSTRAINT` | 確認済み制約 | 工程診断の主理由が「確認済み制約」であることを示します。 |
| `ROUTING_INVALID` | 工程順使用不可 | 工程診断の主理由が「工程順使用不可」であることを示します。 |
| `CAPACITY_INFEASIBLE` | 能力実行不可能 | 工程診断の主理由が「能力実行不可能」であることを示します。 |
| `ASSUMPTION_CONFLICT` | 前提条件Conflict | 工程診断の主理由が「前提条件Conflict」であることを示します。 |
| `BLOCKING_ASSUMPTION_UNRESOLVED` | 成立阻害前提条件Unresolved | 工程診断の主理由が「成立阻害前提条件Unresolved」であることを示します。 |
| `CAPACITY_UNKNOWN` | 能力判断不能 | 工程診断の主理由が「能力判断不能」であることを示します。 |
| `ROUTING_UNKNOWN` | 工程順判断不能 | 工程診断の主理由が「工程順判断不能」であることを示します。 |
| `MODEL_COVERAGE_UNKNOWN` | モデル網羅範囲判断不能 | 工程診断の主理由が「モデル網羅範囲判断不能」であることを示します。 |

## PLAN_VERSION_STATUS / 計画版状態

Production Plan Versionのライフサイクルを表します。承認後は編集せず、新しいVersionを作成します。

| Code | 日本語 | 説明 |
|---|---|---|
| `DRAFT` | 下書き | 「下書き」を表す正式Codeです。 |
| `REVIEW` | 確認中 | 「確認中」を表す正式Codeです。 |
| `APPROVED` | 承認 | 「承認」を表す正式Codeです。 |
| `SUPERSEDED` | 置換済み | 「置換済み」を表す正式Codeです。 |
| `ARCHIVED` | 保管 | 「保管」を表す正式Codeです。 |

## QUANTITY_UNIT / 数量単位

計画数量と能力Ruleの数量単位です。異なる単位を自動変換しません。

| Code | 日本語 | 説明 |
|---|---|---|
| `PIECE` | 本 | 「本」を表す正式Codeです。 |
| `KILOGRAM` | kg | 「kg」を表す正式Codeです。 |
| `LOT` | ロット | 「ロット」を表す正式Codeです。 |

## RESULT_VALIDITY_STATUS / 診断結果の有効性

保存済み診断結果が現在も利用できるかを表します。診断Statusとは独立しています。

| Code | 日本語 | 説明 |
|---|---|---|
| `CURRENT` | 最新条件で有効 | 診断時点と現在の診断影響Dataが一致し、結果を利用できる状態です。 |
| `STALE` | 旧条件 | 診断後に影響Dataが変更され、再診断が必要な状態です。 |
| `INVALID` | 使用不可 | 対象やRevisionの整合性が崩れ、診断結果を使用してはいけない状態です。 |

## REVISION_CHANGE_TYPE / 改訂番号変更種類

改訂番号変更種類に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `VALUE_CHANGED` | 値変更 | 「値変更」を表す正式Codeです。 |
| `KEY_ADDED` | Key追加 | 「Key追加」を表す正式Codeです。 |
| `KEY_REMOVED` | KeyRemoved | 「KeyRemoved」を表す正式Codeです。 |
| `REVISION_REGRESSION` | 改訂番号Regression | 「改訂番号Regression」を表す正式Codeです。 |
| `IDENTITY_CHANGED` | Identity変更 | 「Identity変更」を表す正式Codeです。 |

## REVISION_SOURCE_TYPE / 改訂番号出所種類

改訂番号出所種類に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `CAPACITY_SOURCE` | 能力出所 | 「能力出所」を表す正式Codeです。 |
| `DIAGNOSIS_INPUT` | 診断Input | 「診断Input」を表す正式Codeです。 |
| `SOURCE_IDENTITY` | 出所Identity | 「出所Identity」を表す正式Codeです。 |

## ROUTING_CHECK_DIRECTION / 工程順確認方向

工程順確認方向に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `PREVIOUS` | Previous | 「Previous」を表す正式Codeです。 |
| `NEXT` | 次 | 「次」を表す正式Codeです。 |

## ROUTING_CHECK_REASON / 工程順確認理由

工程順確認理由に使用する正式Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `PREVIOUS_OPERATION_ON_EARLIER_DATE` | Previous工程計画OnEarlier日付 | 「Previous工程計画OnEarlier日付」を表す正式Codeです。 |
| `PREVIOUS_OPERATION_PLANNED_AFTER_CURRENT` | Previous工程計画PlannedAfter最新条件で有効 | 「Previous工程計画PlannedAfter最新条件で有効」を表す正式Codeです。 |
| `PREVIOUS_OPERATION_ENDS_BEFORE_CURRENT` | Previous工程計画EndsBefore最新条件で有効 | 「Previous工程計画EndsBefore最新条件で有効」を表す正式Codeです。 |
| `PREVIOUS_OPERATION_OVERLAPS_CURRENT` | Previous工程計画Overlaps最新条件で有効 | 「Previous工程計画Overlaps最新条件で有効」を表す正式Codeです。 |
| `PREVIOUS_SHIFT_BEFORE_CURRENT` | PreviousシフトBefore最新条件で有効 | 「PreviousシフトBefore最新条件で有効」を表す正式Codeです。 |
| `PREVIOUS_SHIFT_AFTER_CURRENT` | PreviousシフトAfter最新条件で有効 | 「PreviousシフトAfter最新条件で有効」を表す正式Codeです。 |
| `NEXT_OPERATION_ON_LATER_DATE` | 次工程計画OnLater日付 | 「次工程計画OnLater日付」を表す正式Codeです。 |
| `NEXT_OPERATION_PLANNED_BEFORE_CURRENT` | 次工程計画PlannedBefore最新条件で有効 | 「次工程計画PlannedBefore最新条件で有効」を表す正式Codeです。 |
| `NEXT_OPERATION_STARTS_AFTER_CURRENT` | 次工程計画StartsAfter最新条件で有効 | 「次工程計画StartsAfter最新条件で有効」を表す正式Codeです。 |
| `NEXT_OPERATION_OVERLAPS_CURRENT` | 次工程計画Overlaps最新条件で有効 | 「次工程計画Overlaps最新条件で有効」を表す正式Codeです。 |
| `NEXT_SHIFT_AFTER_CURRENT` | 次シフトAfter最新条件で有効 | 「次シフトAfter最新条件で有効」を表す正式Codeです。 |
| `NEXT_SHIFT_BEFORE_CURRENT` | 次シフトBefore最新条件で有効 | 「次シフトBefore最新条件で有効」を表す正式Codeです。 |
| `SAME_DAY_SEQUENCE_UNCONFIRMED` | Same日SequenceUnconfirmed | 「Same日SequenceUnconfirmed」を表す正式Codeです。 |
| `ADJACENT_OPERATION_NOT_PLANNED` | Adjacent工程計画NotPlanned | 「Adjacent工程計画NotPlanned」を表す正式Codeです。 |
| `ROUTING_DEFINITION_NOT_FOUND` | 工程順DefinitionNotFound | 「工程順DefinitionNotFound」を表す正式Codeです。 |

## ROUTING_STATUS / 工程順状態

前工程・後工程の順序が成立しているかを表します。

| Code | 日本語 | 説明 |
|---|---|---|
| `VALID` | 有効 | 「有効」を表す正式Codeです。 |
| `INVALID` | 使用不可 | 対象やRevisionの整合性が崩れ、診断結果を使用してはいけない状態です。 |
| `UNKNOWN` | 判断不能 | 情報不足・前提未確認・Model外などにより、成立性を断定できない状態です。 |
| `NOT_APPLICABLE` | NotApplicable | 「NotApplicable」を表す正式Codeです。 |

## SCENARIO_COMPARISON_OUTCOME / シナリオ比較結果

Scenario間の結果差を示します。因果効果の証明ではありません。

| Code | 日本語 | 説明 |
|---|---|---|
| `IMPROVED` | Improved | 比較先で不足・Statusなどが改善しています。 |
| `WORSENED` | Worsened | 比較先で不足・Statusなどが悪化しています。 |
| `UNCHANGED` | 変更なし | 既存Dataと同一で、書込みを行いません。 |
| `MIXED` | Mixed | 改善と悪化が同時に存在します。 |
| `UNCERTAIN` | Uncertain | UNKNOWNを含むため、改善・悪化を断定できません。 |
| `NOT_COMPARABLE` | NotComparable | INVALIDなどにより正式な比較ができません。 |

## STALE_REASON_CODE / 旧条件化の理由

診断後にどの入力条件が変わったかを示す理由Codeです。

| Code | 日本語 | 説明 |
|---|---|---|
| `DIAGNOSIS_SCENARIO_CHANGED` | 診断シナリオ変更 | 診断シナリオ変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `PLAN_VERSION_CHANGED` | 計画版変更 | 計画版変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `CAPACITY_SCENARIO_CHANGED` | 能力シナリオ変更 | 能力シナリオ変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `TARGET_MONTH_CHANGED` | 対象Month変更 | 対象Month変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `CAPACITY_REVISION_CHANGED` | 能力改訂番号変更 | 能力改訂番号変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `CALENDAR_REVISION_CHANGED` | カレンダー改訂番号変更 | カレンダー改訂番号変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `ASSIGNMENT_REVISION_CHANGED` | 配置改訂番号変更 | 配置改訂番号変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `CAPACITY_RULE_REVISION_CHANGED` | 能力ルール改訂番号変更 | 能力ルール改訂番号変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `EQUIPMENT_REVISION_CHANGED` | 設備改訂番号変更 | 設備改訂番号変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `WORKER_REVISION_CHANGED` | 作業者改訂番号変更 | 作業者改訂番号変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `SKILL_REVISION_CHANGED` | 技能改訂番号変更 | 技能改訂番号変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `PLANNED_OPERATION_CHANGED` | Planned工程計画変更 | Planned工程計画変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `ASSUMPTION_CHANGED` | 前提条件変更 | 前提条件変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `ROUTING_CHANGED` | 工程順変更 | 工程順変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `MODEL_COVERAGE_CHANGED` | モデル網羅範囲変更 | モデル網羅範囲変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `DIAGNOSIS_INPUT_REVISION_CHANGED` | 診断Input改訂番号変更 | 診断Input改訂番号変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `CAPACITY_SOURCE_REVISION_CHANGED` | 能力出所改訂番号変更 | 能力出所改訂番号変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `SOURCE_REVISION_SCHEMA_CHANGED` | 出所改訂番号Schema変更 | 出所改訂番号Schema変更により、保存済み診断結果を再評価する必要があることを示します。 |
| `SOURCE_REVISION_REGRESSION` | 出所改訂番号Regression | 出所改訂番号Regressionにより、保存済み診断結果を再評価する必要があることを示します。 |
