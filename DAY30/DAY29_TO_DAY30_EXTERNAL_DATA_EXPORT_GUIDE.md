# DAY29→DAY30 外部診断Data作成手順書

## 1. 目的

DAY29で確定したCapacityとMasterを、DAY30のProduction Plan Diagnosisへ渡すための正式JSONを作成します。

```text
Excel入力Template
↓
各入力SheetをCSVとして保存
↓
JavaScriptでDomain検証
↓
DAY30外部Data JSONを生成
↓
DAY30 DashboardでPreview
↓
保存・再診断
```

Excelは入力・一次確認の道具です。JSONの正当性はJavaScript側のDomain Ruleで最終確認します。

## 2. 必要File

同じFolderへ次の9Fileを保存します。

| File | 内容 |
|---|---|
| `external-data-settings.csv` | Scenario、対象月、基準時間 |
| `external-capacity-buckets.csv` | 日別・Shift別Capacity |
| `external-equipments.csv` | 設備Master |
| `external-orders.csv` | Order属性・納期・優先度 |
| `external-routing-operations.csv` | 工程順序Master |
| `external-shifts.csv` | Shift順序 |
| `external-capacity-rules.csv` | 設備処理能力Rule |
| `external-operation-factories.csv` | Planned Operationと工場の対応 |
| `external-revisions.csv` | Source Revision |

## 3. ExcelからCSVへ保存

1. 対象Sheetを開きます。
2. `名前を付けて保存`を選びます。
3. File形式を`CSV UTF-8（コンマ区切り）`にします。
4. 上表の正式File名で保存します。
5. Excelの「選択したSheetだけ保存される」という警告は、対象Sheetを確認して続行します。
6. 9Sheetすべてを同じFolderへ保存します。

Header名と順序は変更しないでください。

## 4. JSONを作成

VS Code TerminalでDAY30 Folderを開き、次を実行します。

```bash
node BuildDiagnosisExecutionDataJson.js \
  --input-dir ./external-data-csv \
  --output ./diagnosis-execution-data.json
```

日時を固定して再現したい場合：

```bash
node BuildDiagnosisExecutionDataJson.js \
  --input-dir ./external-data-csv \
  --output ./diagnosis-execution-data.json \
  --exported-at 2026-08-02T09:30:00+09:00
```

## 5. 成功時

```text
JSONを作成しました
Scenario
対象月
Capacity Bucket件数
```

が表示されます。

## 6. DAY30へ取込

1. DAY30 Dashboardを開きます。
2. `DAY29外部Data JSONを取り込む`を開きます。
3. 作成したJSONを選択します。
4. Scenario、対象月、Bucket数、Master件数を確認します。
5. `Preview内容を保存`を押します。
6. 対象Diagnosis Scenarioを選択します。
7. `診断を実行`します。

## 7. 重要な入力Rule

### 0分と空欄

```text
availableMinutes = 0
→ 利用可能時間が0分と確認済み

availableMinutes = 空欄
→ 利用可能時間を判断できない
```

空欄を0へ置き換えないでください。

### Status

設備：`AVAILABLE / UNAVAILABLE / UNKNOWN`

Worker・Skill・Assignment：
`SATISFIED / PARTIALLY_SATISFIED / UNSATISFIED / UNKNOWN`

### Capacity Rule Source

```text
OPERATION_OVERRIDE
ORDER_ATTRIBUTE
DEFAULT_RULE
```

### Revision

`CAPACITY_SOURCE`を最低1件登録します。CalendarやAssignmentが変わった場合は、対応するRevisionを増やします。

## 8. Error時の確認順

1. Error Codeを確認します。
2. Header名と順序を確認します。
3. 行番号と対象Columnを確認します。
4. `availableMinutes`とStatusの矛盾を確認します。
5. Capacity RuleのSourceと条件を確認します。
6. Revisionの重複・不足を確認します。
7. CSVを修正してJSONを再作成します。

## 9. 責任分担

```text
Excel
＝入力しやすくする・入力漏れを見つける

CSV変換Service
＝型変換・Header検証・Domain Object生成

DAY30 Dashboard
＝保存前Preview・正式取込・診断
```
