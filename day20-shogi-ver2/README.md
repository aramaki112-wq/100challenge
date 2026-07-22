# DAY20 将棋棋譜再現アプリ Ver2

## KIF棋譜読み込み編

---

## アプリ概要

DAY20では、DAY19で制作した「将棋棋譜再現アプリ Ver1」へ、KIF棋譜の読み込み機能を追加しました。

利用者がKIF形式の棋譜を入力欄へ貼り付けると、アプリが指し手を解析し、将棋盤上で一手ずつ局面を再現します。

```text
KIFテキスト
↓
Parser
↓
Move Object[]
↓
Validation
↓
LocalStorage
↓
State
↓
Render
```

今回の目的は、KIF形式へ完全対応することではありません。

外部から受け取った文字列を、アプリ内部で扱えるDataへ変換する設計を学ぶことが中心です。

---

# 完成した機能

## KIF入力

* 複数行のKIFテキストを貼り付ける
* 「KIFを読み込む」ボタンで解析を開始する
* 入力欄をクリアする
* 保存済み棋譜を再読み込みする

## KIF解析

* KIFを行単位へ分割する
* 指し手行だけを抽出する
* 手数を取得する
* 移動先を取得する
* 移動元を取得する
* 駒名を取得する
* 奇数手・偶数手から先手と後手を判定する
* Move Objectの配列へ変換する

## 対局情報

次の情報をKIFから取得します。

* 棋戦名
* 先手名
* 後手名
* 総手数

## 棋譜再現

* 初期局面を表示する
* 「進む」で次の局面へ進む
* 「戻る」で前の局面へ戻る
* 「最初へ」で開始局面へ戻る
* 「最後へ」で最終局面へ進む
* 現在の手数を表示する
* 現在の指し手を表示する
* 棋譜一覧で現在手を強調する
* 最初と最後で操作ボタンを無効化する

## LocalStorage

* 解析した棋譜を保存する
* KIF原文を保存する
* 対局情報を保存する
* ページ再読み込み後に保存済み棋譜を復元する
* 保存DataのVersionを確認する
* 不正な保存Dataを検出する

## エラー処理

* 空欄入力を検出する
* 指し手が存在しないKIFを検出する
* 未対応表記を検出する
* 手数の欠落を検出する
* 不正な座標を検出する
* 移動元に駒がない状態を検出する
* 手番と駒の所有者の不一致を検出する
* 駒名の不一致を検出する

---

# DAY20で対応するKIF

次のように、移動元が丸括弧で記載された通常の指し手へ対応します。

```text
手合割：平手
棋戦：練習対局
先手：先手
後手：後手
手数----指手---------消費時間--
1 ７六歩(77)
2 ３四歩(33)
3 ２六歩(27)
4 ８四歩(83)
```

一手分のKIFは、次のようなMove Objectへ変換されます。

```javascript
{
  moveNumber: 1,

  notation: "▲７六歩",

  from: {
    row: 7,
    col: 7
  },

  to: {
    row: 6,
    col: 7
  },

  piece: "歩",

  player: "sente"
}
```

---

# 現在対応していない表記

DAY20 Ver2では、次の機能・表記には対応していません。

* `同`
* `打`
* `成`
* `不成`
* 駒台
* 持ち駒
* 平手以外の開始局面
* 分岐棋譜
* 中断局面から始まる棋譜
* 合法手判定
* 王手・詰み判定
* SFEN
* AI棋譜解析

対応していない指し手が含まれている場合は、エラーメッセージを表示し、それまで使用していた棋譜を維持します。

---

# ファイル構成

```text
DAY20/
├── index.html
├── style.css
├── script.js
├── README.md
├── challenge.md
├── CHANGELOG.md
└── LICENSE
```

## index.html

次の画面要素を定義します。

* KIF入力欄
* 読み込みボタン
* 保存済み棋譜ボタン
* 入力クリアボタン
* 読み込み結果
* 対局情報
* 将棋盤
* 棋譜操作ボタン
* 現在手情報
* 棋譜一覧

## style.css

次の見た目を担当します。

* KIF入力エリア
* 将棋盤
* 先手・後手の駒表示
* 現在手の強調
* ボタンの有効・無効状態
* 成功・エラーメッセージ
* スマートフォン対応

## script.js

次の処理を担当します。

* State管理
* Event登録
* KIF入力処理
* KIF Parser
* Validation
* LocalStorage
* 局面再構築
* Render
* 初期盤面生成
* Utility処理

---

# 起動方法

## 1. ファイルを保存する

`index.html`、`style.css`、`script.js`を同じフォルダへ保存します。

```text
DAY20/
├── index.html
├── style.css
└── script.js
```

## 2. ブラウザで開く

`index.html`をブラウザで開きます。

初回起動時は、サンプルKIFが表示されます。

## 3. 棋譜を操作する

次のボタンで局面を移動します。

```text
最初へ
開始局面へ移動する

戻る
一手前へ戻る

進む
一手先へ進む

最後へ
最終局面へ移動する
```

---

# KIFの読み込み方法

## 1. KIFを入力する

入力欄へKIFを貼り付けます。

```text
1 ７六歩(77)
2 ３四歩(33)
3 ２六歩(27)
```

## 2. 読み込みボタンを押す

「KIFを読み込む」を押します。

## 3. 解析結果を確認する

成功した場合は、次の内容が更新されます。

* 対局情報
* 棋譜一覧
* 総手数
* 将棋盤
* LocalStorage

現在位置は0手目へ戻ります。

---

# 設計構造

DAY20では、次の責務を分けています。

## Input

```text
利用者が入力したKIFを受け取る
```

## Parser

```text
KIF文字列をMove Objectへ変換する
```

## Validation

```text
解析結果がアプリで使用できるか確認する
```

## Storage

```text
確認済みDataを保存・読み込みする
```

## State

```text
現在の棋譜・対局情報・現在位置を管理する
```

## Render

```text
Stateを画面へ反映する
```

## Reconstruction

```text
初期盤面へ現在位置までの棋譜を適用する
```

---

# Dataの流れ

```text
KIF入力欄
↓
handleLoadKif()
↓
parseKif()
↓
parseKifMetadata()
↓
extractMoveLines()
↓
parseMoveLine()
↓
validateParsedGameData()
↓
applyGameDataToState()
↓
saveGameData()
↓
render()
```

---

# Parserの役割

Parserは、外部形式と内部形式の境界に置かれています。

## 外部形式

```text
1 ７六歩(77)
```

## 内部形式

```javascript
{
  moveNumber: 1,
  notation: "▲７六歩",
  from: {
    row: 7,
    col: 7
  },
  to: {
    row: 6,
    col: 7
  },
  piece: "歩",
  player: "sente"
}
```

Renderや局面再構築処理は、KIFの文字列表現を直接扱いません。

アプリ内部では、共通形式であるMove Objectだけを使用します。

---

# State設計

```javascript
const state = {
  moves: [],

  currentMoveIndex: 0,

  metadata: {
    title: "未設定",
    sente: "先手",
    gote: "後手"
  },

  rawKif: "",

  message: "",

  messageType: "information"
};
```

## `moves`

解析済みの指し手配列です。

## `currentMoveIndex`

何手目まで盤面へ適用したかを表します。

## `metadata`

棋戦名・先手名・後手名を管理します。

## `rawKif`

入力されたKIF原文です。

## `message`

利用者へ表示する処理結果です。

## `messageType`

通常・成功・エラーの種類を管理します。

---

# 保存Data

LocalStorageには次の形式で保存します。

```javascript
{
  version: 1,

  metadata: {
    title: "練習対局",
    sente: "先手",
    gote: "後手"
  },

  moves: [
    // Move Object
  ],

  rawKif: "KIF原文"
}
```

画面表示だけに必要なメッセージは保存しません。

現在の手数も保存しないため、再読み込み後は開始局面から再生します。

---

# DAY19からの変更点

## DAY19

```text
プログラム内のサンプル棋譜
↓
State
↓
Render
```

## DAY20

```text
利用者が入力したKIF
↓
Parser
↓
Validation
↓
Move Object[]
↓
Storage
↓
State
↓
Render
```

DAY19の盤面再構築・操作・Renderは、そのまま再利用しています。

新しく追加したのは、棋譜Dataを作る入口です。

---

# 学習したJavaScript

* `textarea.value`
* `trim()`
* `replace()`
* `split()`
* `filter()`
* `map()`
* `forEach()`
* `startsWith()`
* `includes()`
* `match()`
* 正規表現
* `throw new Error()`
* `try...catch`
* `Array.isArray()`
* `every()`
* `Number.isInteger()`
* `Object.hasOwn()`
* `JSON.stringify()`
* `JSON.parse()`
* `localStorage.setItem()`
* `localStorage.getItem()`

---

# 学習した設計

* Inputと内部Dataを分ける
* Parserは変換だけを担当する
* Validation後にStateを更新する
* 外部Dataをそのまま信用しない
* 原文と解析後Dataを分けて保存する
* 保存DataへVersionを持たせる
* 読み込み失敗時に既存Stateを壊さない
* 新しい入力経路から既存Renderを再利用する
* 外部形式を内部の共通形式へ変換する

---

# 今後の発展

## Ver3候補

* `同`の解析
* `成`・`不成`の解析
* 駒台
* `打`の解析
* 持ち駒管理
* 投了などの終局行
* KIFファイル選択
* 複数棋譜保存

## SFEN対応

* SFENから盤面を生成する
* 現在局面をSFENとして出力する
* 好きな局面を保存する
* 指し直し開始局面を作る

## 将棋振り返りアプリ

* 重要局面の保存
* 局面コメント
* 悪手候補の記録
* 先手・後手の思考記録
* Observation Theme
* 次局の実行ルール
* AI棋譜解析

---

# 100アプリチャレンジでの位置

```text
DAY19
内部に用意した棋譜Dataを再現する

DAY20
外部KIFを内部Dataへ変換して再現する

今後
複雑な棋譜表記・持ち駒・局面保存へ発展する
```

DAY20は、固定Dataを使うアプリから、外部Dataを受け取れるアプリへ進む回です。

---

# まとめ

DAY20では、将棋棋譜再現アプリへKIF入力機能を追加しました。

最も重要な設計は、次の流れです。

```text
Raw Data
↓
Parser
↓
Validation
↓
Canonical Data
↓
State
↓
Render
```

KIFを直接盤面表示へ使わず、Move Objectという内部形式へ変換しました。

これにより、将来KIF以外の形式を読み込む場合でも、内部の再生処理を再利用できます。

この考え方は、次のData取り込みにも応用できます。

* CSV
* JSON
* API
* SFEN
* 工場実績Data
* センサーData
* AI出力
