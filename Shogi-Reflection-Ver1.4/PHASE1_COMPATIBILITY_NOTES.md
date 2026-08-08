# Phase1 Compatibility Notes

## Source of Truth

`Shogi-Reflection-Interlude-Phase1(1).zip`

## Phase5再確認対象

- `GameReview.js`
- `KeyPosition.js`
- `ReflectionErrors.js`
- `GameReview.test.js`

## 結果

4ファイルはPhase1正式ZIPのSHA-256と一致する。

Phase5で追加したMarkdown出力は、GameReview Snapshotを読み取る外側の層であり、Phase1 Domain Model、Validation Rule、Error Code、既存8Testを変更していない。

## Observation Cardとの関係

Observation Card作成条件は新しいRuleではなく、Phase1の`isReadyForNextGame()`をそのまま利用する。

- 重要局面3〜5件
- Observation Theme 1件
- 実行Rule 1〜3件

不足Reviewは保存できるが、Observation Cardは生成できない。
