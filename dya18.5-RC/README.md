# Task Management App Ver2

**100アプリチャレンジ DAY18.5 Release Candidate**

---

## 📖 概要

Task Management App Ver2 は、100アプリチャレンジのDAY18.5で開発したタスク管理アプリです。

このバージョンでは、単にタスクを管理するだけではなく、

* 保守しやすい設計
* 機能追加しやすい構造
* 初心者でも理解しやすいコード

を目標に、アーキテクチャ全体を見直しました。

---

# ✨ 主な機能

* タスク追加
* タスク編集
* タスク削除
* タスク完了／未完了切り替え
* フィルター表示

  * 全て
  * 未完了
  * 完了
* LocalStorage保存
* Summary表示
* Empty State表示
* レスポンシブ対応
* アニメーション
* アクセシビリティ改善

---

# 🏗 Architecture

本プロジェクトでは Layer Architecture を採用しています。

```
Config
    ↓
State
    ↓
DOM Cache
    ↓
Initialize
    ↓
Event
    ↓
Flow
    ↓
Validation
    ↓
Factory
    ↓
TaskService
    ↓
StorageService
    ↓
Render
    ↓
Component
    ↓
Utility
```

各Layerは一つの責務だけを担当し、役割を明確に分離しています。

---

# 📂 ディレクトリ構成

```
TaskManagementApp/

├── index.html
├── style.css
├── script.js

├── README.md
├── CHANGELOG.md
├── LICENSE
```

---

# 🎯 DAY18.5で学んだこと

* Layer Architecture
* Service Layer
* Component Design
* Design Token
* Render Pattern
* DOM Cache
* State管理
* 責務分離（Single Responsibility Principle）

---

# 🚀 今後追加予定

DAY19以降では、以下の機能を追加予定です。

* 優先度
* 期限設定
* カテゴリ
* 検索
* 並び替え
* ドラッグ＆ドロップ
* ダークモード
* Firebase対応

設計を変更するのではなく、現在のアーキテクチャを維持したまま段階的に機能追加を行います。

---

# 📚 このプロジェクトについて

このアプリは「100アプリチャレンジ」の教材の一つです。

目的は100個のアプリを作ることではなく、

* 設計する
* 実装する
* 改善する

というサイクルを100回繰り返し、自分の力で設計できるエンジニアへ成長することを目標としています。

---

# 📝 License

MIT License
