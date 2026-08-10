# 将棋振り返りアプリ Ver.1.1 操作手順書

## 1. 起動

TerminalでFolderを開きます。

```bash
cd Shogi-Reflection-Ver1.1
python -m http.server 8000
```

Browserで`http://localhost:8000`を開きます。

`index.html`を直接Double Clickすると、BrowserのES Module制約により正常動作しない場合があります。

## 2. KIF Fileを用意する

ぴよ将棋などからKIFを出力します。

正式対象は次です。

- `.kif`：Shift_JISを標準として判定
- `.kifu`：UTF-8を標準として判定
- 最大2MiB

元FileはApplicationが書き換えません。

## 3. File選択で読み込む

1. `KIFファイルを選択`を押す
2. `.kif`または`.kifu`を選ぶ
3. Import Previewが表示されるまで待つ

## 4. Drag & Dropで読み込む

1. KIF FileをExplorerまたはFinderで表示する
2. `ここへKIFファイルをDrag & Drop`へ移動する
3. Dropする
4. Import Previewを確認する

## 5. Import Previewを確認する

次を確認します。

- File名
- Encoding
- 対局日時
- 先手
- 後手
- 棋戦
- 場所
- 手合割
- 持ち時間
- 結果
- 終局理由
- 総手数
- Source判定
- 棋譜概要
- Parser Warning
- 互換性確認

Warningがある場合、内容を読みます。Warningは「一部情報に注意が必要だが、確認してImportできる」状態です。

## 6. 自分の手番を選ぶ

`この対局での自分の手番`から、先手または後手を選びます。

Applicationは名前から利用者の手番を推測しません。ここで選んだ手番を基準に、対局相手と勝ち／負けをFormへ反映します。

## 7. Formへ反映する

Preview内容が正しければ、`この内容をFormへ反映`を押します。

反映される主な内容：

- 対局日時
- 手番
- 結果
- 対局相手
- 持ち時間・対局形式
- 棋譜Text
- 自由Memo内のKIF Import基本情報

この時点では保存されていません。画面上部の保存件数は増えません。

## 8. Importを中止する

内容が違う場合は`Importを中止`を押します。

中止しても次は変わりません。

- 現在入力中のForm
- 保存済みReview
- LocalStorage

## 9. 振り返りを書く

KIFでは自動入力されない項目を、自分で記録します。

### 対局の物語

序盤から終局までを、自分の言葉で振り返ります。

### 重要局面

3〜5件を目安に、次を分けます。

- FACT：盤上で実際に起きたこと
- INTERPRETATION：自分がどう受け取ったか
- HYPOTHESIS：別の見方、次に確かめる可能性

さらに、自分の思考、相手の狙い、感情、判断への影響を記録します。

### 次局への接続

- 判断Pattern
- Observation Theme 1件
- 実行Rule 1〜3件

## 10. 保存する

`振り返りを保存する`を押します。

この時点で初めて、既存Domain Validationを通してRepositoryとBrowser保存Dataへ保存されます。

次局用Observation Cardを作れる条件：

- 重要局面3〜5件
- Observation Theme 1件
- 実行Rule 1〜3件

条件未達でもReview自体は保存できますが、Observation Cardは作成できません。

## 11. 保存済み対局を確認する

`保存済み対局`で対象を選び、詳細を確認します。

- 編集する
- 削除する
- 振り返り.md
- 次局用Observation Card.md

## 12. MarkdownをObsidianへ登録する

1. `振り返り.md`または`次局用Observation Card.md`を押す
2. Previewを確認する
3. `ClipboardへCopy`または`.mdをDownload`を押す
4. Obsidian Vaultの保存先へ登録する

## 13. Error時の対応

### Fileが空です

元Fileを再度出力してください。

### KIF形式として認識できません

`.kif`／`.kifu`拡張子だけを変更したFileではないか確認します。

### Encodingを判定できません

UTF-8またはShift_JISで再出力します。

### 指し手が見つかりません

KIFに指し手一覧が含まれているか確認します。

### 手数が重複／飛んでいます

元KIFを再出力します。手作業で修正する場合は、元FileのCopyを作ってから行います。

### 内容が矛盾しています

Headerの結果、投了などの終局表記、Footerの勝者・総手数を確認します。

Import Errorが起きても、現在Formと保存済みReviewは変更されません。

## 14. Backup

定期的に`JSON Backup`を作成してください。

- JSON Backup：Application全体の復元用
- Markdown：Obsidianで読む学習成果物

目的が異なるため、両方を保管します。
