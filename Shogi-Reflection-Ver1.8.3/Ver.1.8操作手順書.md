# 将棋振り返りアプリ Ver.1.8 操作手順書

> 現在のPackageはYaneuraOu Integration Candidateです。YaneuraOu WASMが未Buildの場合、自動的に**「簡易Engineへ切り替わりました」**と分かるFallback metadataを使用します。手動振り返り機能は継続利用できます。

## 1. 最短手順

1. STEP1でKIF Fileを選択、Drag & Drop、Text Paste、または「サンプル棋譜を試す」を押す。
2. Import Previewを確認して反映する。
3. STEP2で対局情報を確認し「棋譜を保存して一覧へ」を押す。
4. 保存済み対局を開きSTEP3へ進む。
5. 「棋譜を解析する」を押す。
6. Good Candidate / Bad Candidateを確認する。
7. Cardの「局面を見る」を押す。
8. Replayが対象plyへJumpし、盤面が見える位置まで自動Scrollする。
9. 実戦手とEngine推奨を盤面で比較する。
10. 本当に振り返る価値がある局面だけ「重要局面へ追加」を押す。
11. STEP4でFACT / INTERPRETATION / HYPOTHESIS等を自分の言葉で入力する。
12. STEP5〜7で振り返り、Observation Theme / 実行Rule / Reportを完成させる。

## 2. サンプル棋譜

STEP1の「サンプル棋譜を試す」は`samples/piyo_20260617_170236.kif`を既存KIF Import Previewへ読み込みます。Sample専用Parserは作っていません。

## 3. Engine Status

主なStatus:
- READY
- INITIALIZING
- ANALYZING
- CANCELLING
- CANCELLED
- COMPLETED
- FAILED
- NOT_AVAILABLE

YaneuraOu manifestがverifiedならYaneuraOuWasmAdapterを使います。未Build/Load失敗時はReflectionLocalEngineへFallbackできます。UI上のEngine Nameは混同しません。

## 4. Candidateの読み方

### 良かった手
最大5件。評価改善、Engine推奨との近さ、Mate変化等から「振り返る価値がありそうな好手」を表示します。

### 考え直したい手
最大5件。最低限次を表示します。
- 手数
- 実戦手
- 指す前の評価
- 実戦後評価
- Engine推奨
- 推奨手評価
- 実戦手との差
- 短いPV

候補は基準を満たすものだけです。5件ずつ水増ししません。

## 5. 「局面を見る」

Candidate専用盤はありません。

```text
Candidate Button
→ existing Replay jump(ply)
→ Current Move
→ Position Snapshot
→ Board Position
→ Move List Highlight
→ existing Replay BoardへPage Scroll
```

Sticky Headerに盤面が隠れないようoffsetを取ります。

## 6. Replay Scroll Policy

以下ではBrowser Page全体を動かしません。
- 次へ
- 前へ
- 最初へ
- 最後へ
- Keyboard Navigation
- Move List Jump
- Board Flip

例外はEngine Candidateの「局面を見る」だけです。

## 7. 重要局面へ追加

既存`AddCurrentPositionToKeyPosition`を使用します。重複・5件上限等の既存Validationを維持します。Engine Candidateは自動追加されません。

## 8. Cancel / Re-analysis

「解析を中止」はApplication Service→Adapter→`stop`→Workerへ伝播します。必要時はWorkerをterminateします。Cancel後に再解析できます。

## 9. YaneuraOu WASMをLocal Buildする場合

前提:
- 公式YaneuraOu Source checkout
- exact commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- Emscripten / `em++`

`scripts/build-yaneuraou-wasm.sh <official-source-checkout>`を使います。Build後はmanifestへCompiler VersionとSHA-256を記録し、Browser Resource/USI/E2E/License Gateを通すまで配布用Binaryとみなしません。

## 10. Engineが使えない場合

以下は継続利用できます。
- KIF Import/Paste/Preview
- Save / Saved Game Viewer
- Replay / Board Flip
- Manual KeyPosition
- STEP4〜7 Reflection
- Markdown Export
- Observation Card
- Backup / Restore

## 11. Privacy

解析はLocal Engineを基本とし、棋譜を解析目的で外部Serverへ送信する実装は追加していません。

## 12. 実機確認

PC Chromium 390×844までは検証対象です。Physical iPhoneでは次を確認してください。
- Engine起動
- 1局解析
- Cancel / 再解析
- Candidate表示
- Candidate Board Scroll
- Replay / Board Flip
- Browser crash
- 発熱
- Battery

未測定項目を「最適」「軽量」と断定しません。
## Ver.1.8.2 Finalization Record

### 評価値グラフ

STEP3は基本的に `Engine Status → Progress → 評価値グラフ → Good Candidate → Bad Candidate → Replay Board` の順。

- 横軸: ply
- 縦軸: 本人視点（+有利 / -不利）
- Mate: CPとは別marker
- Good/Bad: Candidate marker
- KeyPosition: 本人が重要局面へ追加したplyだけ

Candidate markerを押すと既存ReplayへJumpし盤面までScrollする。KeyPosition markerを押すとSTEP4の該当Cardへ移動し、FACT欄へFocusする。

### Real Engine表示について

Real YaneuraOuが利用可能なのは、verified manifest、JS/WASM hash、Thread要件、cross-origin isolation等のGateを満たす場合だけ。満たさない場合は「簡易Engine」Fallbackとして明示する。Fallback結果をYaneuraOu結果と読み替えない。
