# DAY29 Import Data Specification

## 1. この文書の目的

ExcelでDAY29のImportデータを作成し、CSV UTF-8へ変換し、Applicationへ貼り付けてPreview・Commitするまでの手順を定義します。

Excelテンプレート：

```text
DAY29_Excelインポート作成ガイド兼テンプレート.xlsx
```

## 2. 現在Importできるデータ

| データ | CSV | JSON | 画面個別登録 |
|---|---:|---:|---:|
| Equipment Master | 対応 | 対応 | 対応 |
| Capacity Rule | 対応 | 対応 | 対応 |
| Factory／Process／Worker等 | 未対応 | 未対応 | 対応 |
| Equipment Calendar | 未接続 | 未接続 | 対応 |
| Worker Calendar | 未接続 | 未接続 | 対応 |
| Assignment | 未接続 | 未接続 | 対応 |
| Order | 未接続 | 未接続 | 対応 |

Calendar・Assignment・OrderのCSVは将来Adapter用Sampleであり、現時点では画面Importへ接続されていません。

## 3. Excelでの作成手順

### Equipment Master

1. Excelの`02_設備Master入力`を開きます。
2. 黄色セルへ入力します。
3. `入力チェック`が`OK`であることを確認します。
4. Headerを含むA列〜O列のうち、`equipmentId`が入力されている行だけをコピーします。
5. 新しいExcel BookのA1へ貼り付けます。

### Capacity Rule

1. Excelの`03_CapacityRule入力`を開きます。
2. A〜G列、I〜V列の黄色セルへ入力します。
3. M〜V列の条件からH列`conditions`が自動生成されます。
4. `入力チェック`が`OK`であることを確認します。
5. Headerを含むA列〜L列の入力済み行だけをコピーします。
6. 新しいExcel Bookへ**値として貼り付け**ます。

H列は数式なので、通常貼り付けではなく値貼り付けが必要です。

## 4. CSVへの変換

1. 新しいBookにHeaderと入力済み行だけがあることを確認します。
2. `ファイル`→`名前を付けて保存`を開きます。
3. ファイル形式に`CSV UTF-8（コンマ区切り）（*.csv）`を選びます。
4. 現在のSheetだけを保存します。
5. 元のExcelテンプレートは`.xlsx`のまま残します。

CSVには一つのSheetしか保存されません。Equipment MasterとCapacity Ruleは別々のCSVとして作成します。

## 5. DAY29へのImport

現在のDAY29はファイル選択式ではありません。CSV本文をテキスト欄へ貼り付けます。

1. CSVをメモ帳、VS CodeなどのテキストEditorで開きます。
2. CSV全文をコピーします。
3. DAY29 Applicationを開きます。
4. 必要に応じてBase Scenarioを複製します。
5. Navigationの`Master`を開きます。
6. `CSV／JSON Import・Export`まで移動します。
7. `対象Master`で`Equipment Master`または`Capacity Rule`を選びます。
8. `形式`で`CSV`を選びます。
9. テキスト欄へCSV全文を貼り付けます。
10. `Import Preview`を押します。
11. ADD・UPDATE・DUPLICATE・ERRORを確認します。
12. 全行がADDまたはUPDATEなら`Commit`を押します。
13. 再計算し、MasterとCapacity結果への反映を確認します。

Excelのセルを直接コピーするとタブ区切りになるため、CSVファイルをテキストとして開いてコピーしてください。

## 6. Preview Status

| Status | 意味 | Commit |
|---|---|---:|
| ADD | 新規IDを追加 | 可 |
| UPDATE | 既存IDを更新 | 可 |
| DUPLICATE | ID不足または同一CSV内ID重複 | 不可 |
| ERROR | 値・単位・期間等が不正 | 不可 |

DUPLICATEまたはERRORが一件でもある場合、Import全体をCommitできません。

## 7. Equipment Master CSV

推奨Header：

```csv
equipmentId,factoryId,processId,name,equipmentType,priority,planningTarget,usable,defaultCapacityRuleId,capacityUnit,displayOrder,active,note,startDate,endDate
```

注意事項：

- `priority`と`displayOrder`は1以上の整数です。
- Booleanは`true`または`false`です。
- `capacityUnit`は`PIECE`、`KILOGRAM`、`LOT`です。
- `startDate`と`endDate`は`yyyy-mm-dd`形式です。
- 現行Importでは`defaultCapacityRuleId`を空文字にするとErrorになるため、登録済みまたは同時登録予定のRule IDを入力します。
- 同じCSV内で`equipmentId`を重複させません。

## 8. Capacity Rule CSV

推奨Header：

```csv
capacityRuleId,equipmentId,capacityValue,unit,basis,priority,active,conditions,capacityMultiplier,isDefault,startDate,endDate
```

使用可能Code：

```text
unit  : PIECE / KILOGRAM / LOT
basis : HOUR / SHIFT / DAY
Boolean: true / false
```

`conditions`はJSON Objectです。

```json
{"productGroup":"SPECIAL","difficultyClass":"HIGH"}
```

Excelテンプレートでは、次の補助列から`conditions`を自動生成します。

```text
productGroup
materialGroup
dimensionGroup
outsideDiameterMin
outsideDiameterMax
wallThicknessMin
wallThicknessMax
processingType
difficultyClass
operationType
```

Default Ruleは条件列を空欄にし、`isDefault=true`にします。条件別Ruleは通常`isDefault=false`にします。

Rule選択順：

```text
有効期間
↓
条件一致
↓
条件数が多いRule
↓
priorityが小さいRule
↓
同条件数・同priorityなら競合Error
```

## 9. ExcelテンプレートのSheet

| Sheet | 用途 |
|---|---|
| 00_使い方 | 全体手順 |
| 01_実装状況 | Import接続状況 |
| 02_設備Master入力 | Equipment Master入力 |
| 03_CapacityRule入力 | Capacity Rule入力・conditions生成 |
| 04_CSV変換手順 | CSV UTF-8保存手順 |
| 05_DAY29取込手順 | Applicationへの貼付・Preview・Commit |
| 06_設備列定義 | Equipment列仕様 |
| 07_Rule列定義 | Capacity Rule列仕様 |
| 08_コード一覧 | Enum／Boolean一覧 |
| 09〜12 | 将来Import用Sample |

## 10. 実務運用上の推奨

```text
Base Scenarioを複製
↓
少量のデータでImport Preview
↓
Commit
↓
整合性チェック
↓
月間Capacityの変化を確認
↓
問題がなければ登録範囲を拡大
```

最初から40設備分を一括登録せず、1工場・1〜2設備でID接続と能力Rule選択を確認してから拡大します。
