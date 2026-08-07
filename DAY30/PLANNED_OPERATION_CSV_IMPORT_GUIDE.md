# DAY30 Planned Operation CSV Import Guide

## 1. 目的

Excelで作成したProduction PlanのOperation行を、DAY30へ安全に取り込むための手順です。

CSVを読み込んだ時点ではRepositoryを更新しません。必ずPreviewで内容を確認し、Errorが0件の場合だけCommitします。

```text
Excelで入力
↓
UTF-8 CSVで保存
↓
Import Preview
↓
ADD／UPDATE／UNCHANGED／ERRORを確認
↓
Commit
↓
RepositoryへTransaction保存
```

## 2. 使用するTemplate

`planned-operations-template.csv`をExcelで開き、Sample行を置き換えて使用します。

Header名は変更しないでください。未知Header、必須Header不足、同名Header重複はImport Errorになります。

## 3. 必須Column

| Column | 意味 | 例 |
|---|---|---|
| plannedOperationId | 計画工程の一意ID | POP-0001 |
| planVersionId | 取込先Plan Version | PV-0001 |
| orderId | Order ID | ORD-001 |
| routingOperationId | Routing上の工程ID | ROP-001 |
| equipmentId | 使用設備ID | EQ-001 |
| plannedDate | 計画日 | 2026-08-03 |
| plannedQuantity | 計画数量 | 60 |
| quantityUnit | 数量単位 | PIECE / KILOGRAM / LOT |

## 4. 任意Column

| Column | 意味 | 空欄時の扱い |
|---|---|---|
| shiftId | Shift ID | DAY粒度として診断 |
| plannedStartTime | 開始時刻（HH:mm） | ShiftまたはDAY粒度 |
| plannedEndTime | 終了時刻（HH:mm） | ShiftまたはDAY粒度 |
| priority | 小さい数字を優先 | 優先度なし |
| productGroup | 製品Group | Rule条件なし |
| materialGroup | 材質Group | Rule条件なし |
| dimensionGroup | 寸法Group | Rule条件なし |
| outsideDiameter | 外径 | Rule条件なし |
| wallThickness | 肉厚 | Rule条件なし |
| processingType | 加工種別 | Rule条件なし |
| difficultyClass | 難易度Class | Rule条件なし |
| operationType | Operation種別 | Rule条件なし |
| note | 備考 | 空文字 |

`plannedStartTime`と`plannedEndTime`は両方入力するか、両方空欄にしてください。片方だけの入力はErrorです。

## 5. Excelでの保存方法

1. TemplateをExcelで開きます。
2. Header行を残してDataを入力します。
3. `名前を付けて保存`を選びます。
4. File形式を`CSV UTF-8（コンマ区切り）`にします。
5. 保存後、対象Plan Versionを選択してImport Previewを実行します。

Excelが表示する「一部の機能が失われる可能性があります」という案内は、CSV保存では通常の表示です。元のExcel版も別途保存してください。

## 6. Preview Status

| Status | 意味 | Commit時の処理 |
|---|---|---|
| ADD | 同じIDが存在しない | 新規登録 |
| UPDATE | 同じIDが存在し、内容が異なる | 既存行を置換 |
| UNCHANGED | 同じID・同じ内容 | 書き込まない |
| DUPLICATE | CSV内でIDが重複 | Commit不可 |
| ERROR | 入力値・Header・対象Versionに問題 | Commit不可 |

UPDATEはWarningとして表示します。意図した変更か必ず確認してください。

## 7. Commit条件

次をすべて満たした場合だけCommitできます。

- PreviewのErrorが0件
- 対象Plan Versionが存在する
- 対象Plan VersionがDRAFTまたはREVIEW
- 全RowのplanVersionIdが選択Versionと一致する
- Preview後にPlan Version Repositoryが変わっていない
- Preview後にPlanned Operation Repositoryが変わっていない

Preview後にDataが変わった場合は`IMPORT_STALE_PREVIEW`となります。古いPreviewをそのままCommitせず、もう一度Previewしてください。

## 8. Transaction

Commit中に一件でも保存へ失敗した場合、先に登録された行もRollbackします。

```text
Row 1 ADD成功
Row 2 ADD成功
Row 3 保存失敗
↓
Row 1・Row 2も未登録へ戻す
```

一部だけ取り込まれた状態にはしません。

## 9. 主なErrorと対処

| 状況 | 対処 |
|---|---|
| Header名が違う | TemplateのHeaderへ戻す |
| planVersionId不一致 | 選択VersionとCSVを一致させる |
| plannedOperationId重複 | CSV内で一意のIDにする |
| 数量が文字列 | 数値へ修正する |
| PIECE／LOTに小数 | 整数へ修正する |
| 開始・終了時刻の片方だけ入力 | 両方入力または両方空欄 |
| APPROVED VersionへImport | 新しいDRAFT Versionを作る |
| STALE Preview | 最新DataでPreviewを再実行する |

## 10. 現在の対応範囲

このPhaseではPlanned Operation CSVを対象とします。

Production Plan、Plan Version、Assumption、Diagnosis ScenarioのCSV Importは、後続Phaseで同じPreview・Commit方式へ拡張します。
