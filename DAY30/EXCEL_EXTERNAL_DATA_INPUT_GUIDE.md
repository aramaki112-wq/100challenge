# DAY30 外部診断Data Excel入力手順書

## 1. 対象File

`DAY30_外部診断Data入力Template.xlsx`

このWorkbookは、DAY29由来のCapacity・設備・Order・Routing・能力RuleをDAY30へ渡すための入力補助です。

## 2. Workbook構成

| Sheet | 内容 | CSV File名 |
|---|---|---|
| `00_使い方` | 全体手順・重要Rule | CSV出力しない |
| `01_入力チェック` | 行数・必須項目欠落・Revision確認 | CSV出力しない |
| `settings` | Scenario・対象月・基準時間 | `external-data-settings.csv` |
| `capacity-buckets` | 日別・Shift別Capacity | `external-capacity-buckets.csv` |
| `equipments` | 設備Master | `external-equipments.csv` |
| `orders` | Order属性・納期・優先度 | `external-orders.csv` |
| `routing-operations` | 工程順序Master | `external-routing-operations.csv` |
| `shifts` | Shift順序 | `external-shifts.csv` |
| `capacity-rules` | 設備処理能力Rule | `external-capacity-rules.csv` |
| `operation-factories` | Planned Operationと工場の対応 | `external-operation-factories.csv` |
| `revisions` | Capacity・外部Input Revision | `external-revisions.csv` |

## 3. 入力方法

1. Sample行を自社Dataへ置き換えます。
2. 黄色Cellへ入力します。
3. Header行は変更しません。
4. Statusや単位はPull-downから選択します。
5. `01_入力チェック`で「要修正」がないことを確認します。
6. `CAPACITY_SOURCE Revision件数`が1件以上であることを確認します。

## 4. 0分と空欄

`capacity-buckets`の`availableMinutes`は、意味を分けます。

```text
0
＝利用可能時間が0分と確認済み

空欄
＝利用可能時間を判断できない
```

空欄を0へ置き換えないでください。

## 5. CSV保存

各Data Sheetを一つずつ開き、次の形式で保存します。

```text
CSV UTF-8（コンマ区切り）
```

正式File名は`00_使い方`または`01_入力チェック`で確認できます。

Excelから複数Sheetを一度にCSV保存することはできないため、9Sheetを個別に保存します。

## 6. JSON変換

CSVを同じFolderへ保存した後、VS Code Terminalで実行します。

```bash
node BuildDiagnosisExecutionDataJson.js \
  --input-dir ./external-data-csv \
  --output ./diagnosis-execution-data.json
```

正式なDomain検証に成功した場合だけJSONが生成されます。

## 7. DAY30へ取込

1. Dashboardの`DAY29外部Data JSONを取り込む`を開きます。
2. JSONを選択します。
3. Scenario・対象月・Bucket数・Master件数を確認します。
4. Preview内容を保存します。
5. 対象Scenarioを再診断します。

## 8. Excel CheckとJavaScript Checkの違い

```text
Excel
＝入力漏れ、件数、選択肢の一次確認

JavaScript
＝Header、型、Status整合性、重複、Domain Ruleの正式確認
```

Excelで「OK」でも、Domain上矛盾するDataはJavaScriptが拒否します。
