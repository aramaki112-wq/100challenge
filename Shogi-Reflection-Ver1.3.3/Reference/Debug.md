# Reference — Debug.md

> Interlude Phase2で学んだError事例と確認方法。

## Object Spreadの上書き順

### 症状

Browser復元後のStatusが`RESTORED_FROM_BROWSER`ではなく`RESTORED`になる。

### 原因

```js
{
  status: "RESTORED_FROM_BROWSER",
  ...restored
}
```

後から展開した`restored.status`が上書きする。

### 修正

```js
{
  ...restored,
  status: "RESTORED_FROM_BROWSER"
}
```

## JSON.parse Error

### 症状

Backup復元でSyntaxError。

### 対応

`INVALID_SNAPSHOT_JSON`へ変換し、Repositoryを変更しない。

## LocalStorage unavailable

### 症状

`setItem`、`getItem`、`removeItem`が例外を返す。

### 対応

操作別の`PersistenceError`へ変換し、Current Domain Dataを維持する。

## Instance判定失敗

### 症状

Propertyは揃っているのにRepositoryが保存を拒否する。

### 原因

通常Objectであり`GameReview` Instanceではない。

### 対応

正式Inputから`new GameReview()`を作成する。

## Revisionが予想より増える

### 確認

- 更新保存も1変更として数える
- 存在しないIDの削除では増えない
- Constructor初期化時の`replaceAll`は指定Revisionへ設定する

## 部分Testだけ成功する

### 危険

対象TestだけではPhase1 RegressionやImport漏れを見逃す。

### 対応

最後に必ず`npm test`と`npm run check`を実行する。

## Phase3追加

### ES Moduleがfile://で動作しない

Live Serverまたは`python -m http.server`を使用する。

### Reload後に件数が戻らない

LocalStorage Error FeedbackとBrowser Storageの利用可否を確認する。

## Phase4追加

### 削除したReviewが再起動後に復活する

原因：Repositoryだけ削除し、LocalStorage Snapshotの更新に失敗または未実行。

対策：削除と永続保存を同じUse Caseへまとめ、保存失敗時は削除前へRollbackする。

### 編集したらReviewが二件になる

原因：編集時に新しいReview IDを発行している。

対策：元のReview IDをFormへ戻し、更新保存する。

## Phase5追記

### Observation Card Buttonがdisabled

原因：重要局面、Observation Theme、実行Ruleのいずれかが不足している。

確認：詳細画面の不足案内と`missingReflectionItems`を見る。

### Clipboard Copyが失敗する

原因：Browser権限、非対応環境、Secure Context条件。

対応：`.md Download`を使用する。

### Obsidian Linkが切れる

原因：Download後に片方のNote名だけ変更した。

対応：相互Linkの`[[Note名]]`も同じ名前へ変更する。
