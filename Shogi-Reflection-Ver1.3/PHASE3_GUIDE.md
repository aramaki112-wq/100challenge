# Phase3 手順書 — Browser入力画面

## 目的

Phase2の保存・復元機構へ、実際に入力できるBrowser画面を接続します。入力値を直接保存せず、`GameReviewFormMapper`とDomain Constructorを必ず通します。

## 起動

```bash
python -m http.server 8000
```

Browserで`http://localhost:8000`を開きます。

## 操作

1. 対局日時・手番・結果を入力する
2. 棋譜Textと対局の物語を入力する
3. 重要局面を3件入力する。必要なら5件まで追加する
4. 各局面でFACT・INTERPRETATION・HYPOTHESISを分ける
5. 判断Pattern、Observation Theme、実行Ruleを入力する
6. 「振り返りを保存する」を押す

## 空Cardと途中入力

- 完全に空の重要局面Card：未使用枠として除外
- 一部だけ入力されたCard：Domain Rule違反として拒否

途中入力を黙って捨てません。

## 保存結果

- `SAVED`：RepositoryとLocalStorageへ保存
- `REJECTED`：入力不正。Repositoryは変更しない
- `SAVED_IN_MEMORY_ONLY`：Repository保存成功、LocalStorage失敗。現在Dataは保持

## Backup／Restore

JSON BackupはRepository全体の復元用Dataです。Restoreは全件を先に検証し、一件でも不正なら現在Dataを変更しません。

## 次局接続条件

重要局面3〜5件、Observation Theme 1件、実行Rule 1〜3件です。不足していても途中保存できますが、画面へ不足項目を表示します。

## Test

```bash
npm test
npm run check
```
