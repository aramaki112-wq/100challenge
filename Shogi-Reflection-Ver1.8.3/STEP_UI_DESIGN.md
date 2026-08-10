# STEP_UI_DESIGN.md — Ver.1.4

## 目的

Ver.1.3.3の縦長一画面UIを、Domain Modelをページ都合で再構成せず、スマートフォンで一つの作業へ集中できる7 Step Workflowへ整理する。

## 既存Section → Ver.1.4 Step

| Ver.1.3.3の責務 | Ver.1.4 | Domain変更 | 保存タイミング |
|---|---|---|---|
| KIF File / Drop / Paste / Clipboard / Preview / Clear / Retry | STEP1 棋譜登録 | なし | Preview・Form反映だけでは保存しない |
| GameReview基本情報 | STEP2 対局情報 | 先手名・後手名を後方互換Optional項目として追加 | 「対局を保存して一覧へ」で保存可能 |
| Replay / Navigation / Flip / Move List | STEP3 棋譜再現 | なし | Replay操作だけでは保存しない |
| KeyPosition / Snapshot / FACT / INTERPRETATION / HYPOTHESIS | STEP4 重要局面 | なし | 候補追加だけでは保存しない |
| gameStory / decisionPattern | STEP5 振り返り | なし | STEP6の途中保存で保存可能 |
| Observation Theme / Action Rules | STEP6 次局への接続 | なし | 「振り返りを途中保存」で保存可能 |
| 集約Preview / Completion / Markdown導線 | STEP7 最終レポート | Completion Status追加 | 「振り返りを完了する」で完成確定 |

## Step責務

### STEP1 棋譜登録
Temporary KIF InputとImport Previewだけを扱う。KIF File、Drag & Drop、Paste、Clipboard、Clear、Retryをここに集約する。Preview成功は保存成功ではない。

### STEP2 対局情報
対局日、先手、後手、自分の側、結果、相手、対局種別・持ち時間、対局メモ、KIF本文を確認・編集する。ここで保存してApplicationを閉じてもよい。

### STEP3 棋譜再現
既存Position History → Replay Application Service → Replay View Modelを再利用する。Stepへ移動するたびにParserを再実行せず、現在SessionでReplayが構築済みならそのStateを使う。

### STEP4 重要局面
3〜5件Ruleは「振り返り完成」の条件として維持する。棋譜保存時には0件でよい。Replay Reference / Snapshotを維持する。

### STEP5 振り返り
一局全体と判断Patternを本人の言葉で記録する。AI生成は行わない。

### STEP6 次局への接続
Observation Theme 1件、実行Rule 1〜3件を扱う。途中保存は許可するが、未完成Dataを完成扱いしない。

### STEP7 最終レポート
対局情報、棋譜、重要局面、FACT / INTERPRETATION / HYPOTHESIS、振り返り、Observation Theme、実行Ruleを集約表示する。完成条件を満たして明示的にCompleteした後、既存Markdown Export / Observation Cardへ接続する。

## Smartphone Navigation

- 7個のTabを横一列にしない。
- `STEP n / 7`、Progress、Step選択Menu、移動先を明示した前後Buttonを使用する。
- Step NavigationはDOM表示状態だけを変更し、Form ResetやDomain Saveを行わない。
- Current Stepは`aria-label`で読み上げる。
- Browser BackではなくApplication Navigationを使うため、Button Labelに移動先を明示する。

## Data Safety

Step移動ではForm Stateを破棄しない。破壊的操作は「入力をクリア」「保存済み対局を削除」「ブラウザ保存Dataを削除」に分離し、それぞれ対象Dataを限定する。
