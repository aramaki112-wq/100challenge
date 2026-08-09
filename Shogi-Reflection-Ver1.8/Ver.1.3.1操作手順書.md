# 将棋振り返りアプリ Ver.1.3.1 操作手順書

## 目的

Ver.1.3.1では、スマホでKIF Fileを選択しにくい場合に、KIF本文をClipboardから貼り付けて既存のImport Previewへ進めます。

## iPhone / iPadで最も確実な方法

1. ぴよ将棋等でKIF全文をCopyする。
2. アプリの`スマホ：KIF本文を貼り付け`まで移動する。
3. `KIF Text`欄を長押しする。
4. iOSの`ペースト`を選ぶ。
5. `貼り付けたKIFをPreview`を押す。
6. 対局日時・先手・後手・結果・総手数・Warningを確認する。
7. 自分の手番を選ぶ。
8. `この内容をFormへ反映`を押す。
9. 棋譜再現盤で局面を確認し、重要局面を追加する。
10. FACT・INTERPRETATION・HYPOTHESIS等を自分で入力する。
11. 最後に`振り返りを保存する`を押す。

## Clipboard Buttonを使う方法

BrowserがClipboard直接読込に対応している場合は、KIFをCopyしたあと`クリップボードから読み込む`を押します。許可されればKIF Text欄へ入り、そのままImport Previewが開きます。

Browserの権限や実行環境によって直接読込できない場合があります。その場合もErrorで現在Formを消さず、長押しPasteを案内します。

## 保存境界

次の操作だけではRepositoryやBrowser保存Dataは変更されません。

- KIFをClipboardへCopy
- TextareaへPaste
- `クリップボードから読み込む`
- `貼り付けたKIFをPreview`
- `この内容をFormへ反映`
- Replay
- `この局面を重要局面へ追加`

正式保存は従来どおり`振り返りを保存する`だけが担当します。

## 入力上限

貼り付けKIFもFile Importと同じ最大2MiBです。貼り付け文字列はUTF-8のFile-like入力へ変換した後、既存`KifFileReaderAdapter`と`KifParser`を通ります。

## 不具合時

- Clipboard Buttonが使えない → Textareaを長押ししてPasteする。
- 空欄と表示される → KIF全文がCopyされているか確認する。
- KIF形式として認識されない → Copy範囲にKIF Header／指し手が含まれるか確認する。
- Preview Error → 現在のGameReview Formは変更されない。
