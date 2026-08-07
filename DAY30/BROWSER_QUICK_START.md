# DAY30 Browser版 クイックスタート

## 1. 起動

`index.html`を直接開かず、VS Code Live Server等のLocal Web Serverから起動します。

### VS Code

1. `DAY30-work-in-progress` Folderを開く。
2. `index.html`を右Clickする。
3. `Open with Live Server`を選ぶ。

### Python

```bash
python -m http.server 8000
```

Browserで`http://localhost:8000/index.html`を開きます。

## 2. 最初の診断

1. `2026年8月 デモ生産計画`を選択する。
2. `基準Capacityで診断`を選択する。
3. `診断を実行`を押す。
4. 全体Statusが`一部実行可能`になることを確認する。
5. 二件目Operationの不足時間120分を確認する。

同じ設備の420分を重複使用しないため、二件目は一部だけ実行可能になります。

## 3. CSV Import

推奨順は次のとおりです。

```text
Planned Operation
↓
Assumption
↓
Diagnosis Scenario
↓
Scenario–Assumption Relation
```

Fileを選択しただけでは保存されません。PreviewのErrorが0件であることを確認し、`Preview内容を保存`を押します。

詳細：`BROWSER_CSV_IMPORT_GUIDE.md`

## 4. Browser保存とBackup

Dashboard下部の`Browser保存とBackup`を使用します。

- `現在DataをBrowserへ保存`：同じBrowserで継続利用する
- `Backup JSONを作成`：別Fileとして保管する
- `Backup JSONを復元`：保存FileからRepositoryを一括復元する
- `Browser保存Dataを削除`：LocalStorageだけを削除する

診断実行とCSV Importの確定後は自動保存されます。

詳細：`BROWSER_PERSISTENCE_BACKUP_GUIDE.md`

## 5. 判断時の注意

- `UNKNOWN`は0ではありません。
- `UNKNOWN`は実行不可能の確定でもありません。
- `STALE`は変更後の再診断が必要です。
- `INVALID`は判断材料として使用しません。
- Backup復元後は対象月、Plan、Scenario、Result件数を確認します。

## 6. Browser Console

学習・確認用に次を参照できます。

```javascript
DAY30_DEMO.application.controller.getState()
DAY30_DEMO.repositories.diagnosisResults.findAll()
DAY30_DEMO.repositories.scenarioAssumptionRelations.findAll()
```

通常操作はDashboardから行ってください。


## DAY29外部Dataを入れ替える場合

1. 「DAY29外部Data JSONを取り込む」でJSON Fileを選択します。
2. Capacity Scenario、対象月、Bucket数、設備数、Order数、Routing数、Capacity Rule数を確認します。
3. 「Preview内容を保存」を押します。
4. 対象Scenarioを選択し、診断を再実行します。

詳細は`DIAGNOSIS_EXECUTION_DATA_JSON_IMPORT_GUIDE.md`を参照してください。
