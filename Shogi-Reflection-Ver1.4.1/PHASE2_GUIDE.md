# 将棋振り返りアプリ Interlude Phase2 手順書

## 1. Phase2の目的

作成した`GameReview`をBrowser終了後も利用できるようにし、JSON Backupで別の保存場所へ退避・復元できるようにします。

## 2. 最初に確認するFile

1. `README.md`
2. `GameReview.js`
3. `GameReviewRepository.js`
4. `InMemoryGameReviewRepository.js`
5. `GameReviewSnapshotService.js`
6. `LocalStorageSnapshotStore.js`
7. `ReflectionPersistenceCoordinator.js`
8. `ReflectionBackupController.js`
9. `TEST_RESULT.txt`

## 3. Testの実行

```bash
npm test
```

全Test終了後、次も実行します。

```bash
npm run check
```

`Missing Import: 0`、必要Fileがすべて`PASS`であることを確認します。

## 4. Repositoryの使い方

```js
const repository = new InMemoryGameReviewRepository();
repository.save(gameReview);
repository.findById("REV-001");
repository.findAll();
repository.existsById("REV-001");
repository.deleteById("REV-001");
repository.getRevision();
```

新規保存と更新保存は同じ`save`を使用します。同じ`reviewId`が存在する場合は更新です。成功した変更ごとにRevisionを1増やします。

## 5. Application Service

- `SaveGameReview`：新規／更新を区別して保存
- `GetGameReview`：IDで一件取得
- `ListGameReviews`：全件取得
- `DeleteGameReview`：IDで削除

返却値は変更不能なSnapshotです。Repository ErrorはApplication Errorへ変換されます。

## 6. Browser保存

Phase3以降のComposition Rootで`window.localStorage`を渡します。

```js
const snapshotStore = new LocalStorageSnapshotStore({
  storage: window.localStorage
});
```

現在Dataを保存します。

```js
coordinator.saveCurrentDataToBrowser();
```

Browser保存Dataから復元します。

```js
coordinator.loadFromBrowserData();
```

Browser保存Dataだけを削除します。

```js
coordinator.deleteBrowserSavedData();
```

Repository内の現在Dataは削除しません。

## 7. Backup JSON

```js
const backup = coordinator.createBackupJson();
```

返却値：

- `fileName`
- `jsonText`
- `exportedAt`
- `repositoryRevision`
- `gameReviewCount`

Phase3では`jsonText`から`Blob`を作り、Download Linkへ接続します。

復元：

```js
coordinator.restoreBackupJson({
  jsonText: backupFileText
});
```

## 8. Restoreで拒否するData

- JSON構文破損
- Application ID不一致
- 未対応Schema Version
- GameReview ID重複
- KeyPosition ID重複
- 必須項目不足
- GameReview／KeyPosition Domain Rule違反
- Repository Revision不正

一件でも不正な場合、正常なReviewだけを部分復元しません。

## 9. Error時の確認

### `INVALID_SNAPSHOT_JSON`

JSONが壊れています。手作業編集せず、別Backupを確認します。

### `INVALID_APPLICATION_ID`

別ApplicationのJSONです。`SHOGI_REFLECTION_INTERLUDE`用Backupを選びます。

### `UNSUPPORTED_SCHEMA_VERSION`

現在のPhase2が対応していないVersionです。移行機能が追加されるまで上書きしません。

### `DOMAIN_RULE_VIOLATION`

必須項目、重要局面数、実行Rule数、FACT・INTERPRETATION・HYPOTHESISを確認します。

### `LOCAL_STORAGE_*`

Browser保存領域が利用不可、容量不足、Private Browsing制限等の可能性があります。現在のRepository Dataは削除されません。

## 10. 運用上の注意

- LocalStorageだけを唯一の保管場所にしない
- 大きな変更前にBackup JSONを作る
- Backup JSONを手作業で編集しない
- 復元後に件数、Revision、Observation Theme、実行Ruleを確認する
- 不完全な振り返りを「完了」と誤認しない
