# DAY30 Browser CSV取込総合手順書

## 1. 対応CSV

Dashboardは次の四種類を、Preview後に保存します。

1. Planned Operation CSV
2. Assumption CSV
3. Diagnosis Scenario CSV
4. Scenario–Assumption Relation CSV

すべて次の共通手順です。

```text
CSV Fileを選択
↓
Header・入力値・参照関係を検証
↓
ADD／UPDATE／UNCHANGED／ERRORを確認
↓
Error 0件の場合だけ保存
↓
Transaction Commit
↓
Dashboard再読込
↓
必要に応じて再診断
```

File選択だけではRepositoryへ保存されません。

## 2. 推奨Import順

```text
Planned Operation
↓
Assumption
↓
Diagnosis Scenario
↓
Scenario–Assumption Relation
```

参照先を先に登録してからRelationを接続します。

## 3. Preview Status

| Status | 意味 | 次の行動 |
|---|---|---|
| ADD | 新規登録 | 内容を確認して保存 |
| UPDATE | 既存Entityを更新 | 変更点を重点確認 |
| UNCHANGED | 保存済みDataと同じ | 書込不要 |
| DUPLICATE | CSV内でIDまたは複合Key重複 | 行を統合・修正 |
| ERROR | 入力、Header、Version、参照に問題 | Error一覧を修正 |

## 4. 共通Error対応

### IMPORT_STALE_PREVIEW

Preview後にRepositoryが変更されています。Previewをクリアし、最新CSVで作り直します。

### IMPORT_COMMIT_NOT_ALLOWED

Previewがない、またはErrorが残っています。Error件数を0にします。

### TARGET_VERSION_MISMATCH

Dashboardで選択したPlan VersionとCSVの対象が一致していません。

### CSV Fileを読めない

Excelから`CSV UTF-8（コンマ区切り）`で保存し直します。

## 5. 個別手順書

- `PLANNED_OPERATION_CSV_IMPORT_GUIDE.md`
- `ASSUMPTION_CSV_IMPORT_GUIDE.md`
- `DIAGNOSIS_SCENARIO_CSV_IMPORT_GUIDE.md`
- `SCENARIO_ASSUMPTION_RELATION_CSV_IMPORT_GUIDE.md`

## 6. 保存後の注意

CSV ImportはData登録であり、実行可能性の証明ではありません。

```text
Import成功
≠
計画成立
```

保存後に診断を実行し、Diagnosis Status、Validity、Finding、Next Checkを確認してください。

