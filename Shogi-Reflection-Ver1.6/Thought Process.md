# Thought Process — Ver.1.6 Design Decisions

> この文書はprivate chain-of-thoughtではなく、再利用可能な設計判断・比較・決定事項を記録する。

## 1. 最強Engine固定を避けた理由

将棋Engineは探索部と評価関数が継続更新される。
Applicationが特定Versionや特定評価FileのPath／USI commandへ直接依存すると、更新のたびにDomainやUIまで変更される。
そこでPort/Adapter境界を設けた。

## 2. Browserへnative Engineを押し込まなかった理由

通常Browserは任意のLocal executableを直接起動できない。
WASM/Workerは候補だが、本ApplicationのSmartphone実機でPerformanceを測定していない。
「できそう」と「完成している」を分けるため、Ver.1.6ではEngine非同梱を正式判断とした。

## 3. GameReviewへAnalysisを追加しなかった理由

Engine Resultは本人の振り返りDataとは性質が異なる。
また再解析で複数世代が発生する。
そのためGameReviewへ大量のengine fieldsを追加せず、Analysis Repositoryを分離した。

## 4. Backup schemaを変えなかった理由

Ver.1.4.1保存済みDataの互換が最重要である。
Engine Analysisは再生成可能なので、GameReview Backup schema 1へ混ぜるより、別Persistenceへ置く方がBoundaryが明確。

## 5. 本人視点Normalizeを採用した理由

後手番やSIDE_TO_MOVE scoreは符号解釈を誤りやすい。
Candidate Rankingは符号ミスが致命的なため、Application内部では「本人に良い = positive」で統一した。

## 6. Mateを別型にした理由

`mate in 5 = +100000` のような便宜値は、CP Rankingを歪める。
そこでCP_CHANGEとmate transitionを別にした。

## 7. Rule-basedを採用した理由

Ver.1.6の目的は説明可能な重要局面候補。
機械学習Rankingはtraining data、検証、説明可能性の問題を増やす。
まずDelta、shape change、best match、mate、duplicate suppressionで十分な基礎を作る。

## 8. 良かった可能性も出す理由

失敗だけを抽出すると、振り返りが「反省のみ」になる。
best一致や評価維持を候補化することで「何を継続すべきか」も確認できる。
ただし「好手」と断定しない。

## 9. Candidateを自動KeyPositionにしない理由

Engineは探索条件により結果が変わる。
また人間の学習価値は数値だけでは決まらない。
最終選択権は利用者に残す。

## 10. Real Engine Testを未確認とした理由

現在の実行環境には検証可能なYaneuraOu Binary/評価Fileがなく、外部取得も成立しなかった。
Mock E2EはArchitecture/UI検証として有効だが、Real Engine E2Eの代替ではない。
この差をCompletion Reportへ明記する。
