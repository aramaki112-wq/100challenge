# DAY14 Todoリストアプリ

## 概要

JavaScriptで作成したシンプルなTodoリストアプリです。

今回は「データ（配列）」と「画面（HTML）」を分けて考える設計を学びます。

---

## 使用技術

- HTML
- CSS
- JavaScript

---

## 学習目標

- 配列(Array)
- push()
- splice()
- forEach()
- render()という考え方
- データと画面を分ける設計
- Enterキー対応
- DOM操作

---

## 機能

- Todo追加
- Todo削除
- Enterキーで追加
- Todo件数表示
- 空文字は追加できない
- スマホ対応

---

## ファイル構成

```
DAY14/

├── index.html
├── style.css
├── script.js
├── README.md
└── challenge.md
```

---

## アプリ画面

```
📝 Todoリスト

[ やることを入力 ]

[追加]

Todo 2件

────────────

JavaScript勉強

削除

────────────

散歩

削除
```

---

## 学んだこと

### 配列でデータを管理する

Todoは画面ではなく配列に保存しています。

```javascript
const todos = [];
```

---

### render関数

画面を更新する処理を1つの関数へまとめています。

```javascript
render();
```

データが変わったら必ずrender()を呼びます。

---

### push()

配列へ追加します。

```javascript
todos.push(text);
```

---

### splice()

配列から削除します。

```javascript
todos.splice(index, 1);
```

---

### forEach()

配列を1件ずつ表示します。

```javascript
todos.forEach(...)
```

---

## 今回一番大切なこと

画面を直接変更するのではなく、

```
データ

↓

render()

↓

画面
```

という考え方でアプリを作ることを学びました。

---

## 今後追加したい機能

- LocalStorage保存
- 完了チェック
- 編集機能
- 優先順位
- 締切日
- 並び替え
- 検索機能

---

## 作成日

100アプリチャレンジ DAY14
Todoリストアプリ