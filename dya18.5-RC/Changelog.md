# Changelog

このファイルでは、本プロジェクトの変更履歴を記録します。

本プロジェクトは **Semantic Versioning** を参考に管理します。

---

## [1.0.0] - DAY18.5 Release Candidate

### Added

* Layer Architectureを正式採用
* Config Layer追加
* State管理追加
* DOM Cache導入
* Flow Layer導入
* Validation Layer導入
* Factory Layer導入
* TaskService導入
* StorageService導入
* Render Layer導入
* Component Layer導入
* Utility Layer導入

### Added (UI)

* Summary Card
* Filter Button UI
* Empty State
* Task Card UI
* Responsive Design
* Hover Animation
* Focus Style
* Fade-in Animation

### Changed

* script.jsを責務ごとに分割
* LocalStorage処理をStorageServiceへ集約
* タスク操作をTaskServiceへ集約
* render()を画面更新の唯一の入口へ変更
* UI生成をComponentへ集約
* CSSをDesign Tokenベースへ変更

### Improved

* 保守性向上
* 可読性向上
* 再利用性向上
* レスポンシブ対応
* アクセシビリティ改善

---

## 今後の予定（v1.1.0）

* 優先度
* 期限設定
* カテゴリ
* 検索
* 並び替え

---

## 今後の予定（v1.2.0）

* ドラッグ＆ドロップ
* ダークモード
* Firebase対応
* オンライン同期
* PWA対応
