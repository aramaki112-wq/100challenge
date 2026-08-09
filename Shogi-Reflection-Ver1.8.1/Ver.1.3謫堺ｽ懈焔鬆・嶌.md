# 将棋振り返りアプリ Ver.1.3 操作手順書

## 1. 起動

```bash
cd Shogi-Reflection-Ver1.3
python -m http.server 8000
```

Browserで`http://localhost:8000`を開きます。

## 2. KIFを読み込む

1. `KIF Fileを選択`を押すか、Drop ZoneへKIFをDrag & Dropします。
2. Import Previewで対局者、手合割、総手数、結果、Warningを確認します。
3. 自分の手番を選びます。
4. `この内容をFormへ反映`を押します。

この時点では保存されていません。

## 3. 棋譜を移動する

- `最初へ`：0手目
- `前へ`：1手戻る
- `次へ`：1手進む
- `最後へ`：再現可能最終手数
- Range：連続的に移動
- 任意手数＋`移動`：指定手数へJump
- 棋譜一覧：該当手数へJump
- Keyboard：←、→、Home、End

入力欄へFocus中はKeyboard Navigationが動作しません。

## 4. 現在局面を追加する

1. 1手目以降の重要だと思う局面へ移動します。
2. `この局面を重要局面へ追加`を押します。
3. Formの重要局面Cardへ移動します。
4. 次が自動入力されていることを確認します。
   - 手数
   - 現在の指し手
   - Replay由来表示
   - 局面Snapshot
5. FACT・INTERPRETATION・HYPOTHESISが空欄であることを確認します。

0手目、同一手数、5件登録済みではButtonが無効または追加が拒否され、理由が表示されます。

## 5. Snapshotを見る

重要局面Cardの`局面Snapshotを表示`を開きます。

確認できる内容：

- 手数、現在指し手、直前指し手
- 手番
- 盤面
- 成駒
- 先手・後手の持ち駒
- 最終移動元・移動先
- Replay Warning
- Snapshot Version

小型盤面は表示用です。盤面反転中に追加しても、Snapshot内部座標は反転しません。

## 6. 本人入力を追記する

### FACT

盤上や対局中に実際に起きたことを、自分の言葉で記録します。

### INTERPRETATION

その局面を自分がどう受け取ったかを記録します。

### HYPOTHESIS

別の見方、次に確認する可能性、反証できる仮説を記録します。

必要に応じて、自分の思考、相手の狙い、感情、感情の影響、判断Pattern、学びも記録します。

## 7. 重複と削除

同じ手数をもう一度追加すると、既存の重要局面へFocusします。既存本文は上書きされません。

不要な候補は`この局面を削除`で削除できます。最低3枚の表示枠は残りますが、中身は空になります。

## 8. 保存

1. 重要局面を3〜5件に整えます。
2. Observation Themeを1件入力します。
3. 実行Ruleを1〜3件入力します。
4. `振り返りを保存する`を押します。

Replay、Jump、盤面反転、局面追加だけでは保存されません。

## 9. 保存済み対局から追加する

1. 保存済み対局一覧から対象を開きます。
2. Replayを目的の手数へ移動します。
3. `この局面を重要局面へ追加`を押します。
4. 対象Reviewが編集Formへ読み込まれ、新しい候補が追加されます。
5. 本人入力を追記します。
6. 保存Buttonを押して更新します。

Buttonを押しただけでは保存済みDataを変更しません。

## 10. Warning付きReplay

途中まで再現できる場合は、Warningが表示されます。再現可能な最終手数以前は追加できますが、SnapshotにもWarningが残ります。

Warningを見てもFACT等を自動変更しません。自分で確かめた内容だけを記録してください。

## 11. Backup／Restore

- `現在DataをBrowser保存`：Memory上の全ReviewをLocalStorageへ保存
- `JSON BackupをDownload`：全件Backupを作成
- `JSON Backupを復元`：全件検証後にAtomic Restore
- `Browser保存Dataを読込`：LocalStorageから復元

壊れたSnapshotや未対応Versionを含むBackupは拒否し、現在Dataを維持します。

## 12. Markdown成果物

保存済み詳細から次を作成できます。

- `振り返り.md`
- `次局用Observation Card.md`

Observation Cardは、重要局面3〜5件、Observation Theme 1件、実行Rule 1〜3件を満たす場合だけ作成できます。

## 13. 困ったとき

- 追加Buttonが無効：0手目、Replay未開始、または5件上限を確認
- 重複Error：同じ手数の既存Cardを確認
- Source不一致：現在Formの棋譜を再現し直す
- Snapshot Error：元KIFを再Importし、再現可能範囲を確認
- 保存失敗：JSON Backupを作成し、Error Codeを記録
