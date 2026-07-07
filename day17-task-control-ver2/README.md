# Task Management App Ver2

> **100アプリチャレンジ DAY17 Release Complete**

## 📖 概要

Task Management App Ver2 は、100アプリチャレンジのDAY17で開発したタスク管理アプリです。

DAY17では新しい機能を増やすことよりも、「状態を持つアプリケーションの設計」を学ぶことを目的としました。

本バージョンでは、責務分離（Separation of Concerns）を意識し、Layer Architecture を導入しています。

---

## 🎯 学習テーマ

**「状態を持つ」から「状態を設計に使う」へ**

DAY17では次の考え方を重点的に学びました。

* StateとDataの分離
* Layer Architecture
* Render Pattern
* 責務分離（Single Responsibility）
* Flowによる処理制御

---

## ✨ 主な機能

* タスク追加
* タスク保存（LocalStorage）
* フィルター切り替え
* タスク一覧表示
* 完了件数表示
* State管理

---

## 🏗 Architecture

```
User
 │
 ▼
Event Layer
 │
 ▼
Flow Layer
 │
 ▼
Validation Layer
 │
 ▼
Factory Layer
 │
 ▼
Data Layer
 │
 ▼
Storage Layer
 │
 ▼
Render Layer
 │
 ▼
Display Layer
```

---

## 📂 プロジェクト構成

```
TaskManagement/

├── index.html
├── style.css
├── script.js
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

## 🛠 使用技術

* HTML5
* CSS3
* JavaScript (ES6)
* LocalStorage API

---

## 🚀 今後追加予定

* タスク編集
* タスク削除
* 検索機能
* 並び替え
* カテゴリ
* 優先度
* 締切日
* ドラッグ＆ドロップ

---

## 📚 このアプリで学べること

* 状態管理（State Management）
* オブジェクト設計
* Layer設計
* Render Pattern
* LocalStorage
* DOM操作
* 保守しやすいコード構成

---

## 📈 更新履歴

### DAY17 Release Complete

* Layer Architecture導入
* State管理導入
* Render Layer導入
* Flow Layer導入
* Factory Layer導入
* 責務分離を全面採用

---

## 🎓 100アプリチャレンジ

このアプリは「100アプリチャレンジ」の一環として制作しています。

目的は100個のアプリを作ることではなく、

**100回設計し、100回改善し、自分で設計・実装できるエンジニアへ成長すること**です。
