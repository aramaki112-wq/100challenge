# DAY30 Production Plan Diagnosis

100アプリチャレンジ DAY30の正式GitHub説明書です。

## 正式テーマ

**Production Plan Diagnosis — 生産計画診断・制約分析・実行可能性評価System**

DAY29が計算した設備・人員・Skill・Assignment制約付きCapacityを読み取り、
人が作成したProduction Planが現実条件で成立するかを診断します。

```text
DAY29 Capacity Context
設備・人員・Skill・Calendar・Assignment・Capacity Rule
        ↓
Capacity Snapshot
        ↓
DAY30 Plan Diagnosis Context
Production Plan・Version・Planned Operation
        ↓
Assumption・Routing・Model Coverage
        ↓
PlanDiagnosisEngine
        ↓
FEASIBLE / PARTIALLY_FEASIBLE / INFEASIBLE / UNKNOWN
        ↓
Constraint Finding・Assumption Finding・Next Check
        ↓
Scenario比較・再診断・Backup
```

---

## 1. このApplicationが解決する問題

生産計画は、計画数量が入力されているだけでは実行可能とは言えません。

- 設備時間が足りるか
- 同じCapacityを複数の計画へ二重使用していないか
- Worker・Skill・Assignment条件が成立しているか
- 適用するCapacity Ruleを一意に決められるか
- 前工程と後工程の順序が成立しているか
- 材料到着や設備復旧などの前提が確認済みか
- 診断後にPlanやCapacityが変更されていないか

DAY30は、これらを分離して診断し、単一の「能力不足」に丸めず理由を返します。

---

## 2. 最重要原則

### 2.1 無理なものは無理と言う

確認済みの不成立条件がある場合、未確認事項が残っていても`INFEASIBLE`を`UNKNOWN`へ弱めません。

### 2.2 分からないものを0にしない

```text
availableMinutes = 0
→ 利用可能時間0分と確認済み

availableMinutes = null
→ 判断不能
```

`UNKNOWN`の実行可能数量や不足数量は`null`です。0へ自動変換しません。

### 2.3 計画と診断結果を分ける

```text
PlannedOperation
＝人が作成した計画

OperationDiagnosisResult
＝計画を評価したDerived Result
```

診断結果をPlanned Operationへ書き戻しません。

### 2.4 見込みと確認済みを分ける

Assumptionは次を区別します。

```text
UNKNOWN   未確認
EXPECTED  成立見込み
CONFIRMED 根拠付きで確認済み
REJECTED  不成立確認済み
EXPIRED   以前の判断が期限切れ
```

`EXPECTED`を`CONFIRMED`として扱いません。

### 2.5 Solverは助言層

本Applicationは自動的に最適計画を確定しません。Scenario差、制約理由、改善余地を人へ返す判断支援Systemです。

---

## 3. 診断Status

| Code | 日本語 | 意味 |
|---|---|---|
| `FEASIBLE` | 実行可能 | 現在Model化・確認できる範囲で計画数量を実行できる |
| `PARTIALLY_FEASIBLE` | 一部実行可能 | 一部数量・時間だけ成立する |
| `INFEASIBLE` | 実行不可能 | 確認済みの不成立条件がある |
| `UNKNOWN` | 判断不能 | 判断に必要なData・Rule・前提が不足している |

診断Statusとは別に、Result Validityを保持します。

| Code | 日本語 | 意味 |
|---|---|---|
| `CURRENT` | 最新条件で有効 | 診断時点と現在のRevisionが一致する |
| `STALE` | 再診断が必要 | 診断後に影響Dataが変更された |
| `INVALID` | 使用不可 | 比較対象またはRevision構造が不整合 |

---

## 4. 主な機能

### Production Plan

- Production Plan作成
- Plan Version管理
- `DRAFT / REVIEW / APPROVED / SUPERSEDED / ARCHIVED`
- TIME・SHIFT・DAY粒度のPlanned Operation
- 数量・設備・日付・Priority・能力条件属性

### Capacity診断

- DAY29 Capacity Snapshot読込
- Capacity Ledgerによる二重使用防止
- HOUR・SHIFT・DAY基準の必要時間計算
- 実行可能数量・不足数量の算出
- Capacity Ruleの優先順位・競合・未登録検出

### Assumption・Routing・Coverage

- Assumptionの状態・Evidence・Validity管理
- Scenarioへの明示的Attach／Detach
- 前後工程の順序診断
- DIRECT_MODEL・ASSUMPTION・UNMODELEDの分離

### Explainability

- Constraint Finding
- Assumption Finding
- Next Check
- Plan全体Diagnosis Summary
- Operation別詳細
- 要対応項目の優先順表示

### Scenario比較

- BASE・COMPARISON・EXPERIMENT
- 実行可能数量差
- 不足数量差
- 不足時間差
- Operation Status変化
- `IMPROVED / WORSENED / UNCHANGED / MIXED / UNCERTAIN / NOT_COMPARABLE`

### Import・保存

- Planned Operation CSV
- Assumption CSV
- Diagnosis Scenario CSV
- Scenario–Assumption Relation CSV
- DAY29外部診断Data JSON
- Import PreviewとAtomic Commit
- Browser LocalStorage
- Backup JSON・Restore
- Excel入力TemplateからJSON生成

---

## 5. Demoで確認できること

Demoには、同じ設備の420分を二つのOperationで使用するPlanがあります。

```text
Operation 1
必要時間 360分
割当時間 360分

Operation 2
必要時間 180分
残Capacity 60分
割当時間 60分
不足時間 120分
```

基準ScenarioではPlan全体が`PARTIALLY_FEASIBLE`になります。

残業2時間追加Scenarioでは利用可能時間が540分になり、Plan全体が`FEASIBLE`になります。

```text
実行可能数量差 +20本
不足数量差     -20本
不足時間差     -120分
```

---

## 6. 実行方法

### Browser Application

VS CodeでこのFolderを開き、Live ServerなどのLocal HTTP Serverから`index.html`を開きます。

ES Moduleを使用するため、HTMLを直接Double ClickするよりLocal Serverを推奨します。

### Automated Test

```bash
npm test
```

正式検証値は`TEST_RESULT.txt`を参照してください。

### Static Verification

```bash
npm run check
```

次を検証します。

- JavaScript／MJS構文
- Relative Import Path
- `index.html`から参照するFile
- GitHub正式File
- Obsidian正式成果物7点

---

## 7. 最初に読むManual

1. `DAY30_日本語クイックスタート_正式版.docx`
2. `DAY30_日本語詳細ユーザーマニュアル_正式版.docx`
3. `DAY30_Error・Troubleshooting手順書_正式版.docx`
4. `DAY30_MANUAL_INDEX.md`
5. `BROWSER_CSV_IMPORT_GUIDE.md`
6. `BROWSER_PERSISTENCE_BACKUP_GUIDE.md`
7. `DAY29_TO_DAY30_EXTERNAL_DATA_EXPORT_GUIDE.md`

日本語Word版を正式Manualとし、Status Code、Error Code、CSV Headerなど実装との照合に必要な英語には日本語の意味と対処を併記しています。

---

## 8. Excelから外部Dataを準備する

`DAY30_外部診断Data入力Template.xlsx`へ入力し、各Sheetを指定File名のCSV UTF-8として保存します。

```bash
node BuildDiagnosisExecutionDataJson.js \
  --input-dir ./external-data-csv \
  --output ./diagnosis-execution-data.json
```

生成したJSONをDashboardでPreviewし、保存後に診断を実行します。

Excelは入力と一次確認、JavaScriptは正式なDomain検証とJSON生成を担当します。

---

## 9. Architecture

```text
Presentation
DiagnosisDashboardDomRenderer
DiagnosisBrowserApplication
DiagnosisBrowserController
        ↓
Application
RunPlanDiagnosis
Read Application Services
Import Preview / Commit
Persistence Coordinator
        ↓
Domain
ProductionPlan / Version / PlannedOperation
Assumption / DiagnosisScenario
Capacity Ledger / Rule Resolver
Routing / Coverage / Status Decider
Diagnosis Result / Summary / Comparison
        ↓
Ports
Repository Contracts
DiagnosisReadModel
DiagnosisExecutionDataProvider
        ↓
Adapters
InMemory Repositories
RepositoryDiagnosisReadModel
LocalStorage Snapshot Store
CSV / JSON Adapter
```

依存は外側から内側へ向けます。DomainはDOM、LocalStorage、CSV File APIへ依存しません。

---

## 10. 決定論と再現性

Operationは入力配列順ではなく、次のRuleで並べます。

```text
TIME
↓
SHIFT
↓
DAY
↓
Operation Priority
↓
Order Priority
↓
Due Date
↓
Planned Start Time
↓
Routing Sequence
↓
Planned Operation ID
```

同じInput・Version・Ruleから同じ診断結果を返すことを目標とします。

---

## 11. Test

主なTest対象：

- Entity不変条件
- Event原子性
- Capacity二重使用防止
- Rule解決
- Assumption状態遷移
- Routing順序
- Model Coverage
- Status決定
- Result集計
- Stale／Invalid判定
- Repository Contract
- Transaction Rollback
- Import Preview／Commit
- Browser Controller／DOM Renderer
- Backup／Restore
- Scenario比較
- End-to-End Acceptance
- 共通Catalog Integrity

---

## 12. Known Limitations

- 数理最適化による自動計画確定は行わない
- AS/400、Flexsche、PLC、Sensorへ直接接続しない
- Cloud Database・認証・複数User同時編集は未対応
- External Capacity・MasterはJSON Package経由
- Model化していない条件は`UNMODELED`として残す
- Scenario差は因果効果を単独で証明しない
- Browser保存はLocalStorageを使用する

---

## 13. File構成方針

JavaScriptとTestはDAY30 Folder直下へ並列配置します。

```text
index.html
style.css
main.js
Domain.js
ApplicationService.js
Adapter.js
*.test.js
README.md
challenge.md
```

最終Formal Packageでは、GitHub、Obsidian、Manual、Excel、Template、Verificationを別Folderへ整理します。

---

## 14. License

MIT License。詳細は`LICENSE`を参照してください。
