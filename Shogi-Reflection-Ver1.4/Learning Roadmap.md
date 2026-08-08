# Learning Roadmap.md — Ver.1.4から学ぶ設計テーマ

## 1. Workflow StateとDomain Completion

同じEntityでも「保存できる」と「完了できる」は別条件になり得る。Command IntentとValidation境界を分ける。

## 2. Draft Data

未完成Dataを無効Dataと決めつけず、どのRuleをいつ適用するかを設計する。

## 3. Read Model

一覧画面では必要なSummaryだけを作り、重いReplay計算を遅延させる。将来の数千局Libraryに接続する基本になる。

## 4. Presentation Component

SVG駒のように、見た目の改善をDomainへ侵入させない。Replay盤とSnapshot盤で再利用する。

## 5. Backward Compatibility

新しいStatusを旧Backupに強制せず、復元境界で推定する。Schema変更とMigrationが本当に必要かを判断する。

## 6. Regression Guard

「新しく作るもの」だけでなく、すでに解決したReplay Scroll PolicyをHashとBrowser Automationで守る。

## 次Version候補

Ver.1.4の実使用評価後にのみ、Storage本格化、Application化、AI Advice Layer、判断Pattern分析、振り返り対局、Game Storyを個別に検討する。
