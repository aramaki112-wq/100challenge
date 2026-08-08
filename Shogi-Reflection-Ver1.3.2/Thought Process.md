# Thought Process.md — 公開可能な設計判断記録

この文書は実装の内部思考を逐語的に残すものではなく、再利用可能な設計判断、比較した選択肢、採用理由を記録します。

## 問い

再現された現在局面を、どのように既存の振り返りDomainへ安全に接続するか。

## 1. KeyPositionへ盤面全部を直接追加する案

### 利点

- 一つのObjectだけ見ればよい
- UIから扱いやすく見える

### 問題

- 振り返り本文とReplay技術Dataが混在する
- 旧Dataとの互換処理が大きくなる
- 将来Engineや盤面Formatの変更がKeyPosition全体へ波及する

### 判断

不採用。任意のReplay Referenceへ分離する。

## 2. KIF全文と手数だけ保存し、表示時に毎回再解析する案

### 利点

- 保存Dataが小さい
- Snapshot Formatを持たなくてよい

### 問題

- Parser変更で過去表示が変わる
- 表示のたびに全KIFを再処理する
- 途中Replay失敗や元KIF改変で同じ局面を再現できない

### 判断

不採用。追加時点の現在局面・直前局面を構造化Snapshotとして保存する。

## 3. FACTを盤面から自動生成する案

### 利点

- 入力が速く見える

### 問題

- 盤面Dataから何をFACTとして選ぶかは利用者の観察である
- 自動文が本人の観察を置き換える
- FACTとInterpretationの境界が曖昧になる

### 判断

不採用。Snapshotは観察材料、FACTは本人入力とする。

## 4. Button Clickで即保存する案

### 利点

- 操作数が少ない

### 問題

- 未完成の候補が保存される
- 保存済みReviewが閲覧操作から暗黙変更される
- Repository失敗時のUI保護が複雑になる

### 判断

不採用。候補追加とGameReview保存を分離する。

## 5. 0手目を許可するか

### 比較

- 許可：初期配置や事前Observationを記録できる
- 拒否：既存KeyPositionの1手以上Ruleと整合する

### 判断

Ver.1.3では拒否。暗黙に1手目へ補正しない。対局前Observationが必要なら将来別Conceptで扱う。

## 6. 同一手数を許可するか

### 比較

- 許可：同じ局面を複数観点で記録できる
- 拒否：意図しない二重登録を防ぎやすい

### 判断

自動追加では拒否し、既存項目へFocusする。複数観点は既存本文内で記録する。将来明示的な複数観点Conceptが必要になった時に再検討する。

## 7. Snapshot作成日時を持つか

### 比較

- 持つ：いつ追加したか分かる
- 持たない：同じSource・手数から決定的なSnapshotを作れる

### 判断

持たない。GameReview Backupの`exportedAt`は既存どおり保持する。

## 8. Top-level Schema Versionを上げるか

### 比較

- 上げる：Version差が明確
- 維持：任意Property追加で旧Dataと同じDocument構造を保てる

### 判断

Top-levelは1を維持し、Replay Snapshot自身にVersion 1を持たせる。

## 9. 不正Snapshotだけ削除して本文を救うか

### 比較

- 自動削除：本文を読める可能性がある
- Restore拒否：改ざんを隠さず現在Dataを守る

### 判断

不正Snapshotを含むBackupはAtomic Restore前に拒否する。一方、Snapshotなし旧Dataは正常として読む。

## 10. 保存済み詳細からの追加

### 選択肢

- 閲覧状態のまま直接更新
- 確認Dialog
- 自動で編集Formへ移す

### 判断

編集Formへ自動移行する。ただし未保存であることを明示し、Repositoryは変更しない。

## 11. UI描画

5件すべての小型盤面を常時描画せず、`details`を開いた時に描画する。入力欄を圧迫せず、Smartphoneでも必要な局面だけ確認できるためです。

## 12. 将来への余白

Current／Previous Positionを保持したことで、Ver.1.4ではBoard Difference、Hand Difference、該当手数Jump、Observation入力支援を追加できます。ただし、Ver.1.3で意味付けを先取りしません。

---

# Ver.1.3.2 設計判断記録

> このSectionは実装判断を再検証するための設計記録であり、内部の私的推論過程ではない。

## 観測

実使用では「次へ」を押すたびに盤面から棋譜一覧へViewportが移動した。Source監査で、Replay描画ごとにCurrent Moveへ`scrollIntoView({ block: "nearest" })`を実行していることを確認した。

## 仮説

`scrollIntoView()`はCurrent Move ItemだけでなくScroll可能な祖先を対象にするため、縦配置されたSmartphoneではBrowser Pageまで移動する。

## 検証

Ver.1.3.1正式Test 471件とBrowser 133項目を再実行してBaselineを確認した。その後、300手Fixture・390px ViewportでPage `scrollY`とMove List `scrollTop`を別々に計測した。

## 採用した修正

Page位置を毎回`window.scrollTo()`で戻す案は採用しなかった。副作用の後始末になるためである。代わりにCurrent Move追従の責務を`ReplayScrollPolicy`へ分離し、Container `scrollTop`だけを変更する。

## 追加観測

Replay開始時にSection先頭へ移動するだけでは390px幅でNavigationがViewport外になる場合があった。そのため、利用者がReplayへ明示的に移動する場面だけ盤面を中央寄せするようにした。通常NavigationではPageを動かさない。
