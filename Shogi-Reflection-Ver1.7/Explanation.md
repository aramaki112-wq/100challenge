# Ver.1.7 Explanation — Engine解析導線改善・駒グラフィック本格化

## 今回の変更
Ver.1.7は、Ver.1.6のDomain Model・Repository・Storage・Replay・Engine Port/Adapterを作り直さず、利用者が重要局面を選ぶ順序だけを自然にしたVersionである。Engine解析PanelをSTEP4からSTEP3「棋譜再現」へ移し、`棋譜を解析する → 振り返り候補 → 局面を見る → 重要局面へ追加`をReplayの中で完結させた。

Engine Candidateは本人のKeyPositionではない。Candidate Jumpは既存`ShogiReplayController.jump()`を呼び、Candidate Addは既存`AddCurrentPositionToKeyPosition`へ接続する。FACT / INTERPRETATION / HYPOTHESISは空欄のままで、利用者がSTEP4で記述する。

駒は既存9×9 DOM Gridを維持し、共通`ShogiPieceSvg.js`の内部形状だけを改善した。外部画像・Font Fileは追加せず、オリジナルSVG五角形、控えめな輪郭、System Japanese Serif Font Stack、2文字成駒の縦組みで視認性を上げた。ReplayとSnapshotは同じSVG Componentを使う。

## 互換性
- GameReview Domain: 変更なし
- GameReview Storage Schema: 変更なし（schemaVersion 1）
- Backup / Restore: Ver.1.6互換
- ReplayScrollPolicy: 変更なし
- Position History / Snapshot schema: 変更なし
- Engine Analysis Store: 既存の独立Storeを維持
- 実Engine: 必須Dependencyにしない

## Replay ScrollのVer.1.7差分
Ver.1.6ではMove List JumpにだけPage Scroll例外があったが、今回の正式要件に合わせ、UI Eventからその例外を除去した。次へ・前へ・最初へ・最後へ・Keyboard・Move List Jump・Candidate JumpのいずれもBrowser Page全体を移動させず、Move List Container内部だけが追従する。

---

# Explanation — Shogi Reflection Ver.1.6

## 今回追加したもの

Ver.1.6は、Ver.1.4.1の手動振り返りApplicationへ、交換可能なEngine解析Layerを追加したVersionである。

目的は「Engineに正解を教えてもらう」ことではない。
**どこを振り返ればよいか分からない摩擦を減らす**ことにある。

## Checkpoint 1 — Ver.1.4.2相当

- FACT / INTERPRETATION / HYPOTHESIS等に短い記入例をPlaceholderとして追加。
- 例文はdefault valueにしないため保存Dataへ混入しない。
- Piece SVGの五角形を同じviewBox / footprint内で軽く丸めた。
- 9×9 Fixed Grid、成桂・成香・成銀、馬、龍、Board Flip、Snapshotを維持。
- Replay Scroll Policyを変更しない。

## Checkpoint 2 — Ver.1.5相当

Engineを外部能力として分離した。

```text
AnalyzeGame
  -> ShogiEnginePort
  -> YaneuraOuEngineAdapter
  -> UsiEngineAdapter
  -> Transport
```

GameReview DomainはEngine都合で肥大化していない。

追加した中核:

- ShogiEnginePort
- UsiEngineAdapter
- YaneuraOuEngineAdapter
- BrowserWorkerUsiTransport
- NodeChildProcessUsiTransport
- UsiInfoParser
- UsiPositionMapper
- EngineAnalysisSettings
- EngineErrors
- EvaluationNormalizer
- EvaluationDelta
- EngineAnalysis Repository / Persistence

## Ver.1.6 — Candidate Selection

本人の手だけを対象に:

1. 指す前の評価
2. 実戦手
3. 指した後の評価
4. 本人視点へNormalize
5. Delta計算
6. Rule-based Ranking
7. 近接重複抑制
8. 3〜5件中心に表示

Candidate Type:

- 大きく悪化した可能性
- 振り返り候補
- 良かった可能性

Engine候補から「局面を見る」「重要局面へ追加」が可能。
ただし自動登録しない。

## Mate

mate scoreを巨大なCPへ置換しない。
詰み発生、詰み逃し等を独立Transitionとして扱いRanking崩壊を防ぐ。

## Metadata / Re-analysis

解析ResultはEngine Name/Version、Evaluation Model/Version、Settings、AnalyzedAt、Schema Versionを保持。
新しい解析はHistoryへappendし、旧結果を無条件に破棄しない。

## Engine Missing

Engine未設定でも既存Applicationは完全に使える。
`ENGINE_NOT_FOUND` はGraceful Degradationであり、GameReview自体のErrorではない。

## Browser / Smartphone

本ZIPはEngine Binary／WASM／水匠評価Fileを同梱しない。
Browser AutomationはVerification Mock Engineで実施した。
実EngineのSmartphone解析時間・Battery・Memoryは未測定であり、実用Performance確認済みとは記載しない。

## Backup

既存GameReview Backup schema version 1を維持。
Engine Analysisは別LocalStorageに保存し、既存Backupへ混入させない。

## AIとの分離

Ver.1.6はAI Adviceを実装しない。
FACT / INTERPRETATION / HYPOTHESISは本人が記述する。
将来AIはEngineが見つけた局面を人間向けに説明する別Layerとして追加する。
