# Ver.1.7 Thought Process — 変更範囲を小さく保つ判断

## 1. EngineをSTEPとして増やさない
Engine解析は独立した成果物ではなく「どこを振り返るかを探す補助」である。そのため新しいSTEPを増やさずSTEP3へ置く。STEP4は本人が選択済みの重要局面を言語化する場所として維持する。

## 2. Candidate専用盤面を作らない
Candidateのplyを既存Replayへ渡せば、Current Move、Move List Highlight、Board Position、Snapshot sourceが同じSource of Truthから得られる。別盤面を作るとReplayとの不整合が生まれるため採用しない。

## 3. Candidate専用KeyPosition Domainを作らない
Engine Candidateから追加した後は手動追加と区別する必要がない。既存Validation（0手目拒否、重複、5件上限）を再利用し、Engineは自動確定しない。

## 4. 駒改善でGridを触らない
見た目の問題はPiece内部で解く。Square Size、Piece Container Size、9×9 Grid、Replay Positionは変更対象外とした。2文字駒は文字を小さく横へ潰すのではなくSVG内で縦2段に配置する。

## 5. 外部Assetを増やさない
配布可能性を優先し、外部駒画像やFont Fileは同梱しない。System Font Stackだけを参照し、SVG GeometryはApplication内で新規作成した。

## 6. 検証の境界
Node TestだけでVisual品質を断定しない。390×844 ChromiumでBrowser Automationを行い、さらに通常盤面・成駒・Flip・STEP3 Smartphone ViewをScreenshot化する。実Engine Binaryや実スマートフォン実機は今回のZIPに含まれないため、その部分は未確認として残す。

---

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
