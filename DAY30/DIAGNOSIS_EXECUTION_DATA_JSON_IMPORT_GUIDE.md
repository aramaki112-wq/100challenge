# DAY30 外部診断Data JSON取込手順書

## 1. このFileの目的

このJSONは、DAY29で計算・整備した外部Read DataをDAY30へ渡すためのPackageです。

対象は次のDataです。

- Capacity Snapshot
- Capacity Bucket
- Equipment Master
- Order Master
- Routing Operation Master
- Shift Master
- Capacity Rule
- Operation別Factory対応
- Model Coverageや確認済み制約などの補助Data
- 外部Data Revision

Planned Operation、Assumption、Diagnosis Scenario、Diagnosis ResultはこのFileには含めません。これらはDAY30本体のBackup対象です。

## 2. 基本操作

1. Dashboardの「DAY29外部Data JSONを取り込む」を開きます。
2. JSON Fileを選択します。
3. PreviewでCapacity Scenario、対象月、Bucket数、設備数、Order数、Routing数、Capacity Rule数を確認します。
4. Errorがないことを確認します。
5. 「Preview内容を保存」を押します。
6. 対象Scenarioを選び、改めて「診断を実行」します。

Fileを選択しただけでは保存されません。

## 3. Packageの識別情報

```json
{
  "application": "DAY30_DIAGNOSIS_EXECUTION_DATA",
  "schemaVersion": 1,
  "exportedAt": "2026-08-02T09:00:00+09:00",
  "providerRevision": 1,
  "items": []
}
```

- `application`：このPackageの種類です。変更しません。
- `schemaVersion`：現在は`1`です。
- `exportedAt`：Package作成日時です。
- `providerRevision`：作成元の外部Data Revisionです。Preview表示用であり、DAY30側のLocal Revisionを直接上書きしません。
- `items`：Capacity Scenario・対象月ごとの外部Dataです。

## 4. 一意性

一つのPackage内では、次の組合せを重複登録できません。

```text
capacityScenarioId
＋
targetMonth
```

同じCapacity Scenario・同じ対象月が二件ある場合は、`DUPLICATE_DIAGNOSIS_EXECUTION_DATA`になります。

## 5. 0と未確認の違い

Capacity Bucketの`availableMinutes`では、次を区別します。

```text
0
＝利用可能時間が0分であることを確認済み

null
＝利用可能時間を判断できない
```

`null`を0へ置き換えないでください。

## 6. 保存時の動作

保存時は、外部Read Data一式を原子的に置き換えます。

- 全件成功：保存します。
- 一件でも不正：現在Dataを変更しません。
- Preview後に外部Dataが変更済み：`EXTERNAL_DATA_IMPORT_STALE_PREVIEW`として再Previewを求めます。

Import元の`providerRevision`が小さくても、DAY30側のRevisionを過去へ戻しません。ImportはDAY30側の新しい変更として記録します。

## 7. Browser保存・Backup

外部Read Dataは、Schema Version 2のDAY30 Backupへ同梱されます。

```text
DAY30本体Repository
＋
DAY29由来の外部Read Data
```

を同時に保存・復元します。

旧Schema Version 1のBackupには外部Read Dataが含まれていません。旧Backupを復元した場合、現在読み込まれている外部Dataはそのまま残ります。

## 8. 主なErrorと対応

### `INVALID_EXTERNAL_DATA_DOCUMENT`

JSONが壊れているか、`application`が異なります。元Fileを確認し、Templateと比較します。

### `UNSUPPORTED_EXTERNAL_DATA_SCHEMA_VERSION`

現在のDAY30が対応していないSchema Versionです。対応版へ変換するか、対応するDAY30を使用します。

### `DUPLICATE_DIAGNOSIS_EXECUTION_DATA`

同じCapacity Scenario・対象月が重複しています。どちらを正式Dataとするか確認して一件にします。

### `EXTERNAL_DATA_IMPORT_STALE_PREVIEW`

Preview後に外部Dataが変更されました。Fileを選び直して再Previewします。

### `EXTERNAL_DATA_RESTORE_FAILED`

復元中に整合性Errorが発生しました。現在Dataは維持されます。Errorの対象項目を修正して再実行します。

## 9. Template

`diagnosis-execution-data-template.json`を複製して使用できます。

ただし、手入力よりも、将来実装するDAY29 Export機能から生成する運用を推奨します。
