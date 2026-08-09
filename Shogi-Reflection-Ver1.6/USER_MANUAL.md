# USER_MANUAL.md — 将棋振り返りアプリ Ver.1.4.1

## このApplicationの目的

このApplicationは最善手だけを探すものではない。棋譜を再現し、自分が何を見て、どう解釈し、何を仮説として指したかを残し、次局のObservationへ接続する。

## 7 Step

1. 棋譜登録
2. 対局情報
3. 棋譜再現
4. 重要局面
5. 振り返り
6. 次局の観察テーマ／実行Rule
7. 最終レポート

## 棋譜は先に保存できる

対局直後に十分な振り返りができなくても、KIFと対局情報だけを保存できる。保存済み対局から後日再開する。

振り返り状態は次の日本語で表示する。

- 棋譜のみ
- 振り返り中
- 振り返り完了

## 保存済み対局一覧

Cardには主に次を表示する。

- `対局日：YYYY/MM/DD`
- 対戦相手
- 自分の側
- 勝敗
- 戦型
- 手数
- 振り返り状態

長いKIF Header全文は一覧へ表示しない。Raw KIF自体はReplayやBackupのため保存されている。

## 将棋盤

Ver.1.4.1では盤面を固定9×9 Gridとして表示する。

- 全81升は同じ幅・高さ。
- 空升と駒入り升でSizeは同じ。
- 成桂・成香・成銀もSquareを広げない。
- と・成香・成桂・成銀・馬・龍は文字と成駒Markで識別する。
- 先後は駒向きでも区別する。
- Board Flipと重要局面Snapshotでも同じGeometry方針を使う。

## Replay Navigation

`前へ` / `次へ` / `最初へ` / `最後へ`とKeyboard Navigationを利用できる。

Ver.1.3.2で解決したReplay Scroll Policyを維持している。Replay操作でBrowser Page全体を棋譜一覧へ自動Scrollしない。Current Move追従はMove List Container内部で行う。

## 重要局面

Replay中の局面を重要局面へ追加し、FACT / INTERPRETATION / HYPOTHESISを自分の言葉で残す。完成時は3〜5件を基本Ruleとする。

## 次局への接続

- Observation Theme: 1件
- 実行Rule: 1〜3件

Observation CardとしてMarkdown Exportできる。

## KIF入力をやり直す

`入力をクリア`、`棋譜入力へ戻る`、別KIF再入力、再Previewを利用できる。Temporary Input Clearは保存済み対局Deleteではない。

## Backup / Restore

保存済みDataをBackupし、Restoreできる。Ver.1.4.1ではStorage Schema Migrationを行っていない。

## アプリ内Help

Headerの`使い方`からApplication内取扱説明書を開ける。StepごとのContext Helpも利用できる。
