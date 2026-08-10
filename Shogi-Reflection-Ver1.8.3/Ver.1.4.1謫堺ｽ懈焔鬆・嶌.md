# 将棋振り返りアプリ Ver.1.4.1 操作手順書

## 1. 起動

```bash
cd Shogi-Reflection-Ver1.4.1
python -m http.server 8000
```

Browserで`http://localhost:8000`を開く。

## 2. KIFを登録する

STEP1で次のいずれかを使う。

- KIF File選択
- Drag & Drop
- KIF Text貼り付け
- Clipboardから読込

Preview内容を確認してApplicationへ反映する。

入力をやり直す時は`入力をクリア`または`棋譜入力へ戻る`を使う。この操作は保存済み対局の削除ではない。

## 3. 棋譜だけ先に保存する

STEP2で対局情報を確認し、`対局を保存`する。重要局面やObservation Themeが未入力でも棋譜は保存できる。

保存後にApplicationを閉じてもよい。

## 4. 保存済み対局から再開する

`保存済み対局`を開く。Cardでは次を確認できる。

- 対局日
- 対戦相手
- 自分の側
- 勝敗
- 戦型
- 手数
- 振り返り状態

Raw KIF Header全文は一覧へ表示しない。戦型不明時は`未設定`と表示する。

目的の対局を開き、振り返りを再開する。

## 5. 固定Grid盤でReplayする

STEP3で`最初へ` / `前へ` / `次へ` / `最後へ`またはKeyboardを使う。

- 盤面は9×9固定。
- 成桂・成香・成銀が現れても升Sizeは変わらない。
- 馬・龍も同じ外形Sizeの中で表示する。
- Board Flipでも9×9比率を維持する。
- Current Moveは棋譜一覧でHighlightする。
- 手を進めてもPage全体は棋譜一覧へ飛ばず、必要な追従は棋譜一覧Container内部だけで行う。

## 6. 重要局面を登録する

Replay中に`この局面を重要局面へ追加`を押す。局面Snapshotと手数/指し手参照が登録される。

STEP4でFACT / INTERPRETATION / HYPOTHESISを記録する。完成時の重要局面は3〜5件。

## 7. 振り返りを完成する

STEP5〜7で振り返り、Observation Theme 1件、実行Rule 1〜3件を記録する。最後に振り返り完了操作を行う。

## 8. Export / Backup

- Markdown Export: 振り返りレポート
- Observation Card: 次局の観察Themeと実行Rule
- Backup: 保存済み全対局のSnapshot
- Restore: Backupから復元

Ver.1.4.1はBackup Schemaを変更していない。

## 9. 削除

保存済み対局のDeleteは確認を伴う別操作である。KIF Temporary Input Clearとは無関係なので、目的を確認して操作する。
