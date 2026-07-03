# DAY15 Todoリストアプリ Ver2（LocalStorage対応）

## 📖 概要

Todoリストアプリ Ver2です。

DAY14で作成したTodoリストに、**LocalStorage** を利用した保存機能を追加しました。

これにより、ブラウザを更新したり閉じたりしても、Todoが保持されます。

---

# 完成画面

* Todoを入力
* 「追加」ボタンまたはEnterキーで登録
* Todo一覧を表示
* 削除ボタンで削除
* ページ更新後もデータを保持

---

# 使用技術

* HTML
* CSS
* JavaScript
* LocalStorage
* JSON

---

# 学習目的

今回のアプリでは次の内容を学ぶことを目的としました。

* LocalStorageへの保存方法
* LocalStorageからの読み込み
* JSON.stringify()
* JSON.parse()
* 配列データの保存方法
* データと画面を分けて考える設計

---

# ファイル構成

```text
DAY15/

├── index.html
├── style.css
├── script.js
├── README.md
└── challenge.md
```

---

# 主な機能

* Todo追加
* Todo削除
* Enterキー対応
* LocalStorage保存
* 起動時自動読み込み

---

# 今回学んだこと

## LocalStorage

ブラウザ内へデータを保存できる仕組み。

ページを更新してもデータが残る。

---

## JSON.stringify()

配列やオブジェクトを文字列へ変換する。

```javascript
JSON.stringify(todos)
```

---

## JSON.parse()

文字列を元の配列へ戻す。

```javascript
JSON.parse(savedTodos)
```

---

## renderTodos()

画面を更新する関数。

画面表示はこの関数だけが担当する設計にしました。

---

## saveTodos()

Todo一覧を保存する関数。

データ変更後は必ず保存します。

---

## loadTodos()

保存されたTodoを読み込みます。

アプリ起動時に一度だけ実行します。

---

# 処理の流れ

```text
アプリ起動
        ↓
loadTodos()
        ↓
renderTodos()
        ↓
画面表示
```

Todo追加

```text
入力
 ↓
配列へ追加
 ↓
saveTodos()
 ↓
renderTodos()
```

Todo削除

```text
削除
 ↓
配列更新
 ↓
saveTodos()
 ↓
renderTodos()
```

---

# 今後の発展案

* 完了チェック機能
* 編集機能
* 並び替え
* 優先順位設定
* カテゴリー追加
* 期限日設定
* 検索機能
* フィルター機能
* ダークモード
* クラウド保存

---

# 学習メモ

今回初めて「保存」という概念を学びました。

今までは画面だけを更新していましたが、

今回は

* データを更新する
* 保存する
* 画面を更新する

という3段階で考える設計になっています。

この考え方は、今後作成するほとんどのWebアプリの基礎になります。
