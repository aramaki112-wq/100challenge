# 将棋振り返りアプリ Ver.1.8 操作手順書

## 1. 最短手順

1. STEP1でKIF Fileを選ぶ、Drag & Dropする、またはTextをPasteする。
2. Preview内容を確認して反映する。
3. STEP2で対局情報を確認し「棋譜を保存して一覧へ」を押す。
4. 保存済み対局から「Replay」を開く。
5. STEP3上部の「棋譜を解析する」を押す。
6. `解析済み局面数 / 全対象局面数`を確認する。
7. 候補Cardの「局面を見る」で下の既存ReplayへJumpする。
8. 盤面を見て本当に振り返る価値があると思えば「重要局面へ追加」を押す。
9. STEP4でFACT / INTERPRETATION / HYPOTHESIS等を本人が入力する。
10. STEP5〜7で振り返り、Observation Themeと実行Ruleをまとめる。

## 2. Engine解析

### 解析開始
STEP3のReplay盤面より上にEngine Analysis Panelがあります。「棋譜を解析する」を押すとLocal Worker Engineが起動します。

状態:
- READY: 解析可能
- INITIALIZING: Engine準備中
- ANALYZING: 解析中
- CANCELLING: 中止処理中
- CANCELLED: 中止済み
- COMPLETED: 完了
- FAILED: 失敗
- NOT_AVAILABLE: Engine利用不可

### 進捗
`42 / 105 局面`のように局面数で表示します。残り秒数を推測表示しません。

### 中止
「解析を中止」を押すとUI→Application Service→Adapter→WorkerへCancelが伝わります。中止後は再解析できます。

### 長い棋譜
Smartphone安全側の最大解析手数があります。上限に達した場合は「安全上限で終了」と表示し、解析していない局面を解析済みと扱いません。

## 3. Candidateの意味

Candidateは重要局面の自動判定ではありません。

- 大きく悪化した可能性
- 振り返り候補
- 良かった可能性

を提示します。合理的候補が少なければ3件へ水増ししません。

### 局面を見る
既存Replayだけを対象plyへ移動します。Candidate専用盤面はありません。Move List Highlight、Current Move、Board Positionが同じReplay Stateから更新されます。

### 重要局面へ追加
既存KeyPosition Application Serviceを使います。0手目、重複、5件上限等の既存Validationがそのまま働きます。FACT等は自動入力しません。

## 4. Replay操作

盤面直下の操作:
- 最初へ
- 前へ
- 次へ
- 最後へ
- 盤面を反転

390px前後では自動Wrapします。横scrollは原則発生しません。

Keyboard:
- Left: 前へ
- Right: 次へ
- Home: 最初へ
- End: 最後へ

Replay操作でBrowser Page全体を自動Scrollしません。Move List内の現在手追従だけ行います。

## 5. Engineが失敗した場合

Engineが利用できなくても以下は利用できます。

- KIF Import/Paste/Preview
- 棋譜保存
- Saved Game Viewer
- Replay
- 手動KeyPosition
- Reflection
- Markdown Export
- Observation Card
- Backup/Restore

## 6. Privacy

Ver.1.8標準EngineはLocal Workerで動き、解析のため棋譜を外部ServerへUploadしません。

## 7. License / Distribution

正式ZIPにはthird-party Engine Binary/WASM/NNUE Weightを同梱していません。将来他人へ配布・販売するときは`DISTRIBUTION_LICENSE_CHECKLIST.md`を使用してください。

## 8. 実機について

390×844 Chromium Browser Automationは実施済みです。Physical iPhoneでBattery/発熱/長時間Memoryを実測したとは記載していません。
