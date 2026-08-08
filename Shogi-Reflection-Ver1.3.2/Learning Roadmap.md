# Learning Roadmap.md — ReplayからObservationへ

## 現在地：Ver.1.3

Ver.1.3で学ぶ中心は、異なるModelを安全に接続する設計です。

- Replay ModelとReflection Domainの境界
- Snapshotと本文の境界
- 客観Dataと本人の意味付けの境界
- UI操作と永続化の境界
- 新Dataと旧Dataの互換境界

## 学習順序

### Level 1｜既存Domainを読む

1. `KeyPosition.js`
2. `GameReview.js`
3. `GameReviewFormMapper.js`
4. `GameReviewSnapshotMapper.js`

到達目標：既存Ruleを変更せず拡張点を説明できる。

### Level 2｜Replay Positionを読む

1. `ShogiPosition.js`
2. `PositionHistory.js`
3. `ShogiReplayApplicationService.js`
4. `ShogiReplayController.js`

到達目標：現在局面と直前局面がどこから取得されるか説明できる。

### Level 3｜Snapshotを読む

1. `BoardSnapshot.js`
2. `HandSnapshot.js`
3. `ShogiPositionSnapshot.js`
4. `ReplayPositionSnapshot.js`
5. `ReplayPositionSnapshotFactory.js`

到達目標：表示文字列ではなく構造化Dataを保存する理由を説明できる。

### Level 4｜Connectionを読む

1. `KeyPositionReplayReference.js`
2. `AddCurrentPositionToKeyPosition.js`
3. `KeyPositionReplayController.js`
4. `KeyPositionReplayViewModel.js`

到達目標：候補追加だけでは保存されないことをCodeから説明できる。

### Level 5｜Browser接続を読む

1. `BrowserShogiReplayView.js`
2. `BrowserGameReviewFormView.js`
3. `main.js`
4. `index.html`
5. `style.css`

到達目標：Button状態、Focus、Snapshot Preview、保存境界を追跡できる。

### Level 6｜Compatibilityを読む

1. `GameReviewSnapshotMapper.js`
2. `ReplayPositionSnapshotSerializer.js`
3. `SNAPSHOT_COMPATIBILITY_MATRIX.md`
4. `GameReviewReplayCompatibility.test.js`

到達目標：「存在しない旧Data」と「存在するが壊れたData」を区別できる。

## 実習

### Exercise 1

0手目を許可した場合に、既存KeyPosition Ruleへどのような影響が出るか列挙する。

### Exercise 2

同一手数をWarning付きで許可するModelを考え、今回の拒否方針と比較する。

### Exercise 3

Snapshotへ`createdAt`を追加した場合、同一性・Test・Migrationへ与える影響を説明する。

### Exercise 4

Current／Previous PositionからBoard Differenceを計算するPure Functionを設計する。ただしFACT文は生成しない。

### Exercise 5

Snapshot Version 2で新Propertyを必須化するMigration戦略を作る。

## Ver.1.4へ進む前の到達条件

- Replay Referenceを図で説明できる
- FACTを自動生成しない理由を説明できる
- 反転と内部座標の分離を説明できる
- Candidate AddとSaveの分離を説明できる
- Atomic Restoreの保護範囲を説明できる
- Current／Previous PositionからDifferenceを計算できる

## 将来Roadmap

### Ver.1.4

- 重要局面一覧からReplay Jump
- Snapshot再表示
- Board／Hand Difference
- FACT作成支援
- Observation入力UX改善

### Ver.2.0

- 判断Pattern集計
- 同じミスの再発傾向
- Observation Theme履歴
- 実行Ruleの有効性検証
- 長期統計・検索・可視化

将来機能でも、Engine評価と本人のObservationを同一Conceptへ混ぜないことを継続します。

---

## Ver.1.3.2 学習テーマ

1. DOM StateとDomain Stateを分離する。
2. `scrollIntoView()`が祖先Scrollへ与える影響を理解する。
3. Container内部Scrollを`scrollTop`で制御する。
4. FocusとScrollの関係、`preventScroll`を理解する。
5. SmartphoneのTouch TargetとViewport設計を学ぶ。
6. Browser Automationで`window.scrollY`とContainer `scrollTop`を別々に検証する。
7. 次のVer.1.4では、今回の実使用Logを基準にStep型UIを検討する。
