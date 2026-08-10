# Phase4 操作手順書

## 1. 起動

Phase4 FolderをVS Codeで開き、Terminalで次を実行します。

```bash
python -m http.server 8000
```

Browserで`http://localhost:8000`を開きます。

## 2. 保存済み対局を見る

1. Browser保存Dataがあれば起動時に自動復元されます。
2. 「保存済み対局」の左側一覧からCardを押します。
3. 右側に棋譜、対局の物語、重要局面、判断Pattern、Observation Theme、実行Ruleが表示されます。

一覧は対局日時の新しい順です。

## 3. 保存済み対局を編集する

1. 一覧または詳細の「編集する」を押します。
2. 保存済み内容が下の入力Formへ戻ります。
3. 内容を修正します。
4. 「振り返りを保存する」を押します。

Review IDは変更されないため、新規作成ではなく同じ対局の更新になります。保存時には再びDomain Validationが実行されます。

## 4. 保存済み対局を削除する

1. 一覧または詳細の「削除する」を押します。
2. 確認Dialogで内容を確認します。
3. 承認するとRepositoryから削除し、LocalStorageへ保存します。

LocalStorage保存に失敗した場合、削除は確定せず、Repositoryを削除前へ戻します。

## 5. Browser保存Data全体の削除との違い

- 対局Cardの「削除する」：指定した一局をRepositoryとBrowser保存Dataから削除します。
- 上部の「Browser保存Dataを削除」：LocalStorage内のSnapshotだけを削除し、現在Memory上のDataは維持します。

## 6. Test

```bash
npm test
npm run check
```

`TEST_RESULT.txt`と`STATIC_VERIFICATION_RESULT.txt`に正式結果を記録します。
