# 将棋振り返りアプリ Ver.1.7 操作手順書

## 1. まず棋譜を保存する
STEP1でKIF File、Drag & Drop、貼り付け、Clipboardのいずれかから棋譜を読み込み、Previewを確認します。STEP2で対局情報を確認し、まず「棋譜を保存」を行えます。振り返りやEngine解析をその日に完了する必要はありません。

## 2. 後日、保存済み対局から再開する
「保存済み対局」から対象を開きます。一覧には対局日、相手、自分の側、勝敗、戦型、手数、振り返り状態、解析状態を表示します。振り返り状態と解析状態は別の情報です。

## 3. STEP3で棋譜をReplayする
「棋譜再現」を開き、前へ/次へ/最初へ/最後へ、Keyboard、Move Listから局面を確認します。Page全体はNavigationに追従して動かず、Move List内部だけが現在手へ追従します。

## 4. 必要ならEngine解析を使う
STEP3内の「棋譜を解析する」を押します。Engineが利用可能なら解析状態と進捗が表示され、完了後に「振り返り候補」が表示されます。解析中は「解析を中止」で停止できます。

Engineが未設定の場合でも異常ではありません。Replayから自分で局面を探し、「この局面を重要局面へ追加」を使えます。

## 5. Candidateを確認する
Candidate Cardには「大きく悪化した可能性」「振り返り候補」「良かった可能性」などの分類が表示されます。

- **局面を見る**: 同じSTEP3の既存ReplayがCandidateのplyへ移動します。
- **重要局面へ追加**: 本人が必要と判断したときだけ既存KeyPositionへ追加します。

Engineは自動で重要局面を確定しません。短い棋譜など解析可能局面が少ない場合、3件未満になることを画面に明示します。

## 6. STEP4で本人の振り返りを書く
追加したKeyPositionは手動追加と同じCardとして編集できます。FACT / INTERPRETATION / HYPOTHESIS等の例文はplaceholderであり、保存Dataではありません。

- FACT: 盤面上で確認できる事実
- INTERPRETATION: その事実をどう捉えたか
- HYPOTHESIS: 別の考え方や改善仮説

## 7. STEP5〜STEP7
STEP5で一局全体を振り返り、STEP6でObservation Themeを1件、実行Ruleを1〜3件に絞ります。STEP7で最終レポートを確認します。

## 8. Board Flip / Snapshot
Board Flipは表示方向だけを変え、Position DataやSnapshot座標を変更しません。重要局面SnapshotもReplayと同じSVG駒とFixed Grid方針を使用します。

## 9. Backup / Restore / Markdown
Ver.1.6のGameReview Backup形式を維持しています。Engine解析情報は本人のFACT / INTERPRETATION / HYPOTHESISとは分離します。Observation CardはEngine Candidateから自動生成・自動上書きしません。

## 10. Smartphone
390px前後ではBoardが横にはみ出さないよう設計し、主要ButtonはTouch Targetを確保します。Engine Candidate Cardは縦方向へ並びます。
