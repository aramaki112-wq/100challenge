# DAY30 Manual Index

DAY30を初めて利用するときは、次の順序で参照してください。

## 1. 最初に読む

1. `DAY30_日本語クイックスタート_正式版.docx`
2. `DAY30_日本語詳細ユーザーマニュアル_正式版.docx`
3. `DAY30_Error・Troubleshooting手順書_正式版.docx`

## 2. 入力・日常運用で使うExcel

- `DAY30_外部診断Data入力Template.xlsx`
  - DAY29由来のCapacity・Master・Ruleを準備する入力用Workbook
- `DAY30_運用チェック・再診断記録.xlsx`
  - 診断前後のCheck、診断履歴、再診断、Scenario比較、Import、Backup、Error対応の記録用Workbook

## 3. Status・Error・設計用Catalog

- `DAY30_CATALOG_INDEX.md`
- `DAY30_Status_Code_Catalog.md`
- `DAY30_Error_Catalog.md`
- `DAY30_Domain_Catalog.md`
- `DAY30_Domain_Event_Catalog.md`

## 4. Input Template

- `planned-operations-template.csv`
- `assumptions-template.csv`
- `diagnosis-scenarios-template.csv`
- `scenario-assumption-relations-template.csv`
- `diagnosis-execution-data-template.json`
- `external-data-settings.csv`
- `external-capacity-buckets.csv`
- `external-equipments.csv`
- `external-orders.csv`
- `external-routing-operations.csv`
- `external-shifts.csv`
- `external-capacity-rules.csv`
- `external-operation-factories.csv`
- `external-revisions.csv`

## 5. 操作別Markdown Guide

- `BROWSER_QUICK_START.md`
- `BROWSER_CSV_IMPORT_GUIDE.md`
- `BROWSER_PERSISTENCE_BACKUP_GUIDE.md`
- `DAY29_TO_DAY30_EXTERNAL_DATA_EXPORT_GUIDE.md`
- `EXCEL_EXTERNAL_DATA_INPUT_GUIDE.md`
- `PLANNED_OPERATION_CSV_IMPORT_GUIDE.md`
- `ASSUMPTION_CSV_IMPORT_GUIDE.md`
- `DIAGNOSIS_SCENARIO_CSV_IMPORT_GUIDE.md`
- `SCENARIO_ASSUMPTION_RELATION_CSV_IMPORT_GUIDE.md`
- `DIAGNOSIS_EXECUTION_DATA_JSON_IMPORT_GUIDE.md`
- `SCENARIO_COMPARISON_GUIDE.md`

## 6. 検証結果

- `DAY30_EndToEnd_Acceptance_Report.md`
- `TEST_RESULT.txt`
- `STATIC_VERIFICATION_RESULT.txt`

## 正本の責任分担

```text
JavaScript：診断Logic、Domain Rule、正式検証の正本
Excel：入力、一次Check、運用履歴の記録
Word：操作、判断、復旧手順の正式Manual
Markdown：設計、Catalog、保管、差分管理
```
