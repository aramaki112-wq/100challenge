# DAY30 Browser保存・Backup・復元手順書

## 1. 目的

Browserを閉じた後もDAY30の登録Dataを継続利用し、端末故障・Browser Data削除・誤操作に備えてBackup JSONを保管します。

## 2. 保存対象

現在のApplication Backup Schema Version 2では、DAY30本体とDAY29由来の外部Read Dataを同時に保存します。

### DAY30本体Repository

1. Production Plan
2. Production Plan Version
3. Planned Operation
4. Assumption
5. Diagnosis Scenario
6. Scenario–Assumption Relation
7. Diagnosis Result

各RepositoryのRevisionも保存します。

### DAY29由来の外部Read Data

- Capacity Snapshot／Capacity Bucket
- Equipment Master
- Order Master
- Routing Operation Master
- Shift Master
- Capacity Rule
- Operation別Factory対応
- Model Coverage・確認済み制約等の補助Data
- 外部Input Revision

旧Schema Version 1のBackupには外部Read Dataがありません。旧Backupを復元した場合、DAY30本体Repositoryだけを復元し、現在の外部Read Dataは変更しません。

## 3. Browser保存

Dashboardの`Browser保存とBackup`で、`現在DataをBrowserへ保存`を押します。

```text
現在のRepository
↓
整合性を保ったSnapshotへ変換
↓
Browser LocalStorageへ保存
```

診断実行やCSV ImportをDashboardから確定した場合も、自動保存されます。

### 注意

Browser保存は、同じ端末・同じBrowser・同じOriginでの継続利用向けです。重要Dataの唯一の保管場所にはしないでください。

## 4. 起動時の自動復元

保存Dataがある場合、Dashboard起動時に自動復元します。

```text
Browser起動
↓
保存済みSnapshotを読込
↓
Schema・Entity・参照整合性を検証
↓
問題がなければ全Repositoryをまとめて復元
```

壊れたJSON、未対応Schema、参照切れがある場合は復元せず、起動前のDataを保持します。

## 5. Backup JSONの作成

1. `Backup JSONを作成`を押します。
2. `Backup JSONをDownload`が表示されます。
3. FileをDownloadします。
4. Obsidian Vault外、外付け媒体、社内許可済み共有Folder等へ複製します。

File名の例：

```text
DAY30-backup-2026-08-02.json
```

Backup JSONを手作業で編集しないでください。

## 6. Backup JSONからの復元

1. `Backup JSONを復元`でFileを選択します。
2. Application IDとSchema Versionを確認します。
3. 全EntityをDomain Objectとして再検証します。
4. ID重複と参照整合性を確認します。
5. 問題がなければ全Repositoryを一括置換します。
6. Dashboardを再読込します。
7. 必要に応じて診断を再実行します。

一件でも不整合があれば、現在Dataは変更されません。

## 7. Browser保存Dataの削除

`Browser保存Dataを削除`はLocalStorage内の保存Snapshotだけを削除します。

```text
現在画面のInMemory Data
→ 画面を閉じるまで残る

Browser保存Snapshot
→ 削除される
```

完全に初期化する機能とは異なります。

## 8. 主なError

### PERSISTENCE_STORAGE_ERROR

Browser保存領域へアクセスできない、容量不足、JSON破損等が考えられます。

- Private Browsing設定を確認する
- Browserの保存許可を確認する
- Backup JSONをDownloadしてから不要Dataを整理する

### INVALID_BACKUP_DOCUMENT

選択したFileがDAY30 Backup JSONではない、またはJSONとして壊れています。別のBackup Fileを選択します。

### UNSUPPORTED_BACKUP_SCHEMA_VERSION

現在のApplicationが対応していないVersionです。古いApplicationで開かず、移行手順を確認します。

### PERSISTENCE_RESTORE_FAILED

Entityまたは参照関係の復元に失敗しました。現在DataはRollbackされます。Error CodeとBackup Fileを保存し、原因を確認します。

## 9. 運用推奨

```text
日常操作
→ Browser自動保存

大きなImport前
→ Backup JSONを作成

月次確定時
→ 日付付きBackup JSONを別場所へ保管

復元後
→ Plan・Scenario・Result件数を確認し再診断
```


## 外部Read Dataを含むBackup

現在のBackup Schema Version 2では、DAY30のPlan・Assumption・Scenario・診断結果だけでなく、DAY29由来の外部Read Dataも同時に保存します。

対象はCapacity Snapshot、Equipment、Order、Routing、Shift、Capacity Ruleなどです。

旧Schema Version 1のBackupを復元した場合、外部Read DataはBackup内に存在しないため、現在の外部Dataを変更しません。
