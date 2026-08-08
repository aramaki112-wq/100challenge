# 将棋振り返りアプリ Ver.1.4 Challenge

## Theme

Application WorkflowとDomain Completionを分離し、「棋譜は今保存、振り返りは後日」を安全に成立させる。

## Challenge Question

縦長一画面を7 Stepへ分けながら、画面遷移をDomain Validationへ混入させず、棋譜だけ保存した対局をSaved Game Viewerから再開し、Ver.1.3.2で解決済みReplay Scroll PolicyとVer.1.3のKeyPosition Snapshotを壊さず、将来配布可能なオリジナル駒Graphicsへ改善するにはどう設計するか。

## Constraints

- Ver.1.3.3 ZIPをSource of Truthとする。
- Repository Port / LocalStorage Adapter構造を維持する。
- 棋譜保存と振り返り完成を別Intentにする。
- 完成Ruleは重要局面3〜5件、Observation Theme 1件、実行Rule 1〜3件のまま。
- Step移動だけで保存・削除・Validation Completeを行わない。
- Saved Game一覧で全Position Historyを構築しない。
- ReplayScrollPolicyを変更しない。
- Graphics変更をReplay Domain変更理由にしない。
- 第三者駒Assetをコピーしない。
- AI / Engine / PWA / Cloud Sync / 課金は実装しない。

## Completion Evidence

正式な数値は`TEST_RESULT.txt`、`BROWSER_VERIFICATION_RESULT.txt`、`STATIC_VERIFICATION_RESULT.txt`、`SOURCE_OF_TRUTH_AUDIT.md`を参照する。
