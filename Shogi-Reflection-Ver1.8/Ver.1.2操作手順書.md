# 将棋振り返りアプリ Ver.1.2 操作手順書

## 1. 起動

```bash
cd Shogi-Reflection-Ver1.2
python -m http.server 8000
```

Browserで`http://localhost:8000`を開きます。

## 2. KIFを読み込む

1. `KIFファイルを選択`を押す、またはDrop領域へKIFをDrag & Dropする
2. Import Previewで対局日時、先手、後手、手合割、結果、総手数、Warningを確認する
3. 自分の手番を選ぶ
4. `この内容をFormへ反映`を押す

この時点ではRepositoryやBrowserへ保存されていません。

## 3. 棋譜再現盤を操作する

- `前へ`：一手戻る
- `次へ`：一手進む
- `最初へ`：0手目へ戻る
- `最後へ`：再現可能な最終手数へ移動する
- Range：つまみを動かして手数を選ぶ
- 任意手数：数値を入力し`移動`を押す
- 棋譜一覧：任意の指し手を押す
- `盤面を反転`：先手側表示と後手側表示を切り替える

Keyboard操作：

- 左Arrow：前へ
- 右Arrow：次へ
- Home：最初へ
- End：最後へ

Input、Textarea、SelectへFocus中はKeyboard操作が動きません。

## 4. 表示の読み方

- 現在手数：現在表示しているPosition
- 現在：そのPositionを作った指し手
- 直前：一つ前の指し手
- 手番：現在Positionで次に指す側
- 点線：最終移動元
- 太い枠：最終移動先
- 持ち駒：盤面上部・下部に所有者別で表示
- `×2`など：同種持ち駒の枚数

## 5. 保存済み対局から再現する

保存済み対局一覧からCardを選ぶと、詳細表示と棋譜再現盤へ読み込まれます。詳細内の`棋譜を再現`を押すと盤面位置へ移動します。

Replay操作だけでは保存済みGameReviewを変更しません。

## 6. Formへ手入力したKIFを再現する

棋譜Text欄へKIFを入力し、棋譜再現盤の`現在Formの棋譜を再現`を押します。

棋譜Textが空の場合は空盤を表示せず、再現できない理由を表示します。

## 7. WarningとError

### Warning

KIF Parser Warningまたは途中Replay失敗を表示します。途中失敗では、失敗手数と再現可能な最終手数を確認できます。

### Replay拒否

未対応手合割、手合割Headerなし、初期局面を作れない場合はReplayを拒否します。平手として暗黙に再現しません。

### Import Error

壊れたKIFを選んでも、現在入力中のFormと保存済みReviewは消えません。

## 8. 振り返りを記録して保存する

従来どおり次を記録します。

- 対局の物語
- 重要局面3〜5件
- FACT
- INTERPRETATION
- HYPOTHESIS
- 思考・相手の狙い・感情・判断への影響
- 判断Pattern
- Observation Theme 1件
- 実行Rule 1〜3件

`振り返りを保存する`を押したときだけ正式保存されます。

## 9. Markdownを出力する

保存済み対局の詳細から次を作成できます。

- `振り返り.md`
- `次局用Observation Card.md`

Replayによって元KIF Textが欠落することはありません。

## 10. 困ったとき

- 盤面が出ない：手合割とError Codeを確認する
- 途中で止まる：Warning内の失敗手数と指し手を確認する
- Jumpできない：0〜再現可能最終手数の整数を入力する
- KIFを選べない：`.kif`または`.kifu`、2MiB以下を確認する
- 画面を閉じる前：必要に応じてBrowser保存またはJSON Backupを行う
