# Design Handbook — Ver.1.7

## Part 1 — Source of TruthとFlow

### STEP 1 — Ver.1.6を固定する
#### 1. 🎯 このSTEPの目的
Ver.1.6 ZIPを変更前Baselineとして固定する。
#### 2. 🤔 なぜこの作業をするのか
UI移動やSVG改善を、既存Domainの再設計と混同しないため。
#### 3. 💻 コードを書く
全FileのSHA-256、File数、Baseline Testを記録する。
#### 4. 💡 設計者のひとこと
最初に「壊してはいけないもの」を機械的に残す。
#### 5. ✅ チェックポイント
296 files、606/606 Baseline Test、49/49 Baseline Static、Missing Import 0。
#### 6. ▶ 次へ進む条件
Ver.1.6が再現可能なSource of Truthになっている。

### STEP 2 — STEP3/STEP4の責務を分ける
#### 1. 🎯 このSTEPの目的
Engineを重要局面選定の前段へ置く。
#### 2. 🤔 なぜこの作業をするのか
「重要局面を選ぶ→解析」ではなく「解析→候補を見る→選ぶ」が自然だから。
#### 3. 💻 コードを書く
Engine PanelをSTEP3へ移し、STEP4からCandidate一覧を外す。
#### 4. 💡 設計者のひとこと
Stepを増やさず、既存Stepの意味を明確にする。
#### 5. ✅ チェックポイント
7 Steps維持、STEP3=Replay+候補、STEP4=選択済み重要局面。
#### 6. ▶ 次へ進む条件
EngineなしでもSTEP3→手動追加→STEP4が成立する。

## Part 2 — Candidateを既存Domainへ接続する

### STEP 3 — CandidateからReplayへ戻す
#### 1. 🎯 このSTEPの目的
Candidate専用盤面を作らず対象局面を見る。
#### 2. 🤔 なぜこの作業をするのか
Board PositionとCurrent MoveのSource of Truthを二重化しないため。
#### 3. 💻 コードを書く
Candidateのplyを`replayController.jump()`へ渡す。
#### 4. 💡 設計者のひとこと
新しい画面を作るより、既存の正しい再現器を使う。
#### 5. ✅ チェックポイント
Current Ply、Actual Move、Highlight、81升、Snapshot sourceが一致する。
#### 6. ▶ 次へ進む条件
Candidate JumpでもPage Scrollが変化しない。

### STEP 4 — CandidateをKeyPosition候補へ追加する
#### 1. 🎯 このSTEPの目的
Engine Candidateを本人が選んだときだけ通常KeyPositionへ変換する。
#### 2. 🤔 なぜこの作業をするのか
Engineに本人の振り返り判断を代行させないため。
#### 3. 💻 コードを書く
既存`AddCurrentPositionToKeyPosition`とValidationを再利用する。
#### 4. 💡 設計者のひとこと
追加元がEngineでもManualでも、選択後は同じKeyPositionでよい。
#### 5. ✅ チェックポイント
Duplicate、0手目、5件上限、FACT等空欄、STEP4編集。
#### 6. ▶ 次へ進む条件
Engine Candidateの自動登録が存在しない。

## Part 3 — Fixed Gridを壊さないPresentation改善

### STEP 5 — Piece GraphicsをSVG内部で磨く
#### 1. 🎯 このSTEPの目的
他者へ見せても違和感の少ない駒へ近づける。
#### 2. 🤔 なぜこの作業をするのか
盤面構造は安定しており、問題はPiece Presentationに限定されているため。
#### 3. 💻 コードを書く
共通viewBox内にオリジナル五角形、控えめな輪郭、System Serif文字を描く。
#### 4. 💡 設計者のひとこと
SVGはSquare Sizeを決めない。SquareがSVGの表示領域を決める。
#### 5. ✅ チェックポイント
全駒種、成桂/成香/成銀、馬、龍、先後方向、Flip、Snapshot。
#### 6. ▶ 次へ進む条件
81升Geometryが駒種で変化しない。

### STEP 6 — Asset Licenseを閉じる
#### 1. 🎯 このSTEPの目的
将来配布を妨げる不明Assetを入れない。
#### 2. 🤔 なぜこの作業をするのか
見た目改善のために再配布不能なFont/画像を抱えないため。
#### 3. 💻 コードを書く
外部Assetを使わず、Font FileをBundleしない構成を監査する。
#### 4. 💡 設計者のひとこと
System Font名の参照とFont Fileの再配布は別問題である。
#### 5. ✅ チェックポイント
External image 0、@font-face 0、Font file 0、LICENSE変更なし。
#### 6. ▶ 次へ進む条件
License不明Assetが0件。

## Part 4 — RegressionとRelease

### STEP 7 — Browser/Visual/Staticを分けて検証する
#### 1. 🎯 このSTEPの目的
動作、見た目、構造を別の検証で確認する。
#### 2. 🤔 なぜこの作業をするのか
Node TestだけではScrollや見た目を確認できないため。
#### 3. 💻 コードを書く
`npm test`、`browser_verify.py`、`visual_verify.py`、`npm run check`を実行する。
#### 4. 💡 設計者のひとこと
「確認済み」は実際に実行した項目だけに使う。
#### 5. ✅ チェックポイント
Automated/Browser/Visual/Staticが0 fail、Missing Import 0。
#### 6. ▶ 次へ進む条件
Known Limitationを含め結果を文書化できる。

### STEP 8 — ZIPを展開物から再検証する
#### 1. 🎯 このSTEPの目的
配布物そのものが動くことを確認する。
#### 2. 🤔 なぜこの作業をするのか
作業Folderが正常でもZIP漏れやImport欠落は起こり得るため。
#### 3. 💻 コードを書く
ZIP Integrityを確認し、別Folderへ展開して展開物だけで全検証を再実行する。
#### 4. 💡 設計者のひとこと
完成判定のSourceは最後に利用者へ渡す構成物である。
#### 5. ✅ チェックポイント
Integrity、Test、Browser、Visual、Static、Missing Import。
#### 6. ▶ 次へ進む条件
展開後検証が全てPASSし、Completion Reportへ記録できる。

---

# Design Handbook — Ver.1.6

## Part 1 — Source of TruthとUI Polish

### STEP 1 — Ver.1.4.1を固定する

#### 1. 🎯 このSTEPの目的
元ZIPを基準化し、変更前後を説明可能にする。

#### 2. 🤔 なぜこの作業をするのか
Engine追加は変更範囲が広い。Baselineが無いと「意図した変更」とRegressionを区別できない。

#### 3. 💻 コードを書く
SHA-256 manifestを作り、File数、package、test、LICENSE、重要Domain fileを記録する。

#### 4. 💡 設計者のひとこと
新機能を作る前に「触らないもの」を決める。

#### 5. ✅ チェックポイント
- 257 files
- Ver.1.4.1 test success
- ReplayScrollPolicy hash
- GameReview hash

#### 6. ▶ 次へ進む条件
Source of Truthが再現可能である。

### STEP 2 — UIだけを磨く

#### 1. 🎯 このSTEPの目的
FACT等の書き方を分かりやすくし、駒へ軽い丸みを加える。

#### 2. 🤔 なぜこの作業をするのか
Engine以前に入力摩擦と視認性を改善するが、Domainへ影響させないため。

#### 3. 💻 コードを書く
Placeholderを追加し、SVG pathを同じviewBox内で変更する。

#### 4. 💡 設計者のひとこと
Presentation改善をData Migrationへしない。

#### 5. ✅ チェックポイント
固定9×9、2文字駒、Flip、Snapshotが不変。

#### 6. ▶ 次へ進む条件
Checkpoint 1 regressionが通る。

### STEP 3 — Engine/Licenseを先に監査する

#### 1. 🎯 このSTEPの目的
採用前に技術・配布境界を決める。

#### 2. 🤔 なぜこの作業をするのか
動いた後でLicense問題が見つかるとArchitectureごと戻る可能性がある。

#### 3. 💻 コードを書く
`ENGINE_FEASIBILITY_AUDIT.md` と `ENGINE_LICENSE_AUDIT.md` を作る。

#### 4. 💡 設計者のひとこと
「入手できる」と「再配布できる」は別。

#### 5. ✅ チェックポイント
Engine Source、Binary、Evaluation File、Commercial Use、Bundlingを分離。

#### 6. ▶ 次へ進む条件
不明License AssetをBundleしない方針が決まる。

## Part 2 — Port / Adapter / Evaluation

### STEP 4 — ShogiEnginePortを置く

#### 1. 🎯 このSTEPの目的
ApplicationとEngine実装を分離する。

#### 2. 🤔 なぜこの作業をするのか
特定VersionのYaneuraOuへDomainを固定しないため。

#### 3. 💻 コードを書く
`initialize/analyzePosition/cancelAnalysis/getEngineInfo/dispose` をPort契約とする。

#### 4. 💡 設計者のひとこと
Applicationは「解析してほしい」と言う。`go depth 12` の詳細はAdapterが知る。

#### 5. ✅ チェックポイント
Missing Adapter、Missing MethodをTestする。

#### 6. ▶ 次へ進む条件
AnalyzeGameがUSI文字列を知らない。

### STEP 5 — USIをAdapterへ閉じ込める

#### 1. 🎯 このSTEPの目的
Engine固有Protocolを境界内へ隔離する。

#### 2. 🤔 なぜこの作業をするのか
別USI EngineやRemote Adapterへ交換しやすくするため。

#### 3. 💻 コードを書く
`UsiEngineAdapter`, `UsiInfoParser`, transportsを実装する。

#### 4. 💡 設計者のひとこと
ProtocolはInfrastructure detailであり、Reflection Domainの言葉ではない。

#### 5. ✅ チェックポイント
CP/Mate/MultiPV/bestmove/cancel。

#### 6. ▶ 次へ進む条件
USI parse unit testが通る。

### STEP 6 — PositionHistoryをSFENへMapperする

#### 1. 🎯 このSTEPの目的
Replay DomainをUSI形式から守る。

#### 2. 🤔 なぜこの作業をするのか
ReplayのSource of TruthをEngine都合で再設計しないため。

#### 3. 💻 コードを書く
`UsiPositionMapper` でPosition -> SFEN、KIF normalized move -> USI moveへ変換する。

#### 4. 💡 設計者のひとこと
変換はBoundaryで行う。

#### 5. ✅ チェックポイント
start position SFEN、normal move、drop、promotion等。

#### 6. ▶ 次へ進む条件
既存Replay testが無変更で通る。

### STEP 7 — Evaluationを本人視点へ揃える

#### 1. 🎯 このSTEPの目的
先手/後手/手番側scoreの符号ミスを防ぐ。

#### 2. 🤔 なぜこの作業をするのか
Candidate Rankingで符号逆転は致命的だから。

#### 3. 💻 コードを書く
`EvaluationNormalizer` と `EvaluationDelta` を実装する。

#### 4. 💡 設計者のひとこと
比較前にPerspectiveを統一する。

#### 5. ✅ チェックポイント
先手、後手、positive、negative、mateをTest。

#### 6. ▶ 次へ進む条件
「本人に良い=positive」が全Caseで成立。

## Part 3 — Candidate / Persistence / UI

### STEP 8 — CandidateをRule-basedで選ぶ

#### 1. 🎯 このSTEPの目的
学習価値の高い局面を少数へ絞る。

#### 2. 🤔 なぜこの作業をするのか
評価値が低い局面一覧では「自分の一手」を振り返れない。

#### 3. 💻 コードを書く
Delta、mate、shape change、best match、duplicate suppressionをScore化する。

#### 4. 💡 設計者のひとこと
まず説明可能なRule。MLは必要性が証明されてから。

#### 5. ✅ チェックポイント
Major / Review / Good、3〜5件、近接重複。

#### 6. ▶ 次へ進む条件
Candidate testが全て通る。

### STEP 9 — AnalysisをGameReviewから分離保存する

#### 1. 🎯 このSTEPの目的
再解析履歴と本人Dataを混在させない。

#### 2. 🤔 なぜこの作業をするのか
Engine Resultは更新可能なReferenceであり、Human ReflectionとLifecycleが違う。

#### 3. 💻 コードを書く
Analysis Repository、Snapshot Service、separate LocalStorageを追加する。

#### 4. 💡 設計者のひとこと
同じGame IDでつなぐが、同じAggregateへ詰め込まない。

#### 5. ✅ チェックポイント
旧Game backup schema 1が維持される。

#### 6. ▶ 次へ進む条件
Re-analysisがappendされる。

### STEP 10 — Candidate UIをSTEP4へ統合する

#### 1. 🎯 このSTEPの目的
既存Step責務を壊さずEngine候補を使えるようにする。

#### 2. 🤔 なぜこの作業をするのか
重要局面選択の補助はSTEP4が自然だが、Replay/KeyPosition責務は既存Serviceを再利用すべきだから。

#### 3. 💻 コードを書く
解析Button、status、progress、cancel、candidate card、Replay Jump、KeyPosition追加を接続する。

#### 4. 💡 設計者のひとこと
新UIから既存Flowへ「合流」し、別のKeyPosition保存系を作らない。

#### 5. ✅ チェックポイント
Auto registrationなし、manual selection維持。

#### 6. ▶ 次へ進む条件
Browser Mock E2EでCandidate -> Replay -> KeyPositionが通る。

## Part 4 — Graceful Degradation / Verification / Update

### STEP 11 — Engine Missing / Cancel / Errorを正常系の一部にする

#### 1. 🎯 このSTEPの目的
外部能力が無くてもApplicationを壊さない。

#### 2. 🤔 なぜこの作業をするのか
Browser/SmartphoneではEngineを常に利用できるとは限らない。

#### 3. 💻 コードを書く
Engine error code、日本語message、AbortController、cancelを実装する。

#### 4. 💡 設計者のひとこと
Optional dependencyの失敗をCore Domainの失敗へ昇格させない。

#### 5. ✅ チェックポイント
ENGINE_NOT_FOUNDでもKIF/Replay/Manual Reflectionが使える。

#### 6. ▶ 次へ進む条件
Failure testsとBrowser cancelが通る。

### STEP 12 — ZIP展開物だけで再検証する

#### 1. 🎯 このSTEPの目的
開発Folderではなく配布物が正しいことを証明する。

#### 2. 🤔 なぜこの作業をするのか
ZIP漏れ、Missing Import、生成前File参照を検出するため。

#### 3. 💻 コードを書く
ZIP作成 → 別Folder展開 → npm test → static verification → browser verificationを実行する。

#### 4. 💡 設計者のひとこと
「作ったFolderが動いた」と「渡したZIPが動く」は別の事実。

#### 5. ✅ チェックポイント
ZIP integrity、Missing Import 0、all tests pass。

#### 6. ▶ 次へ進む条件
`COMPLETION_REPORT.md` に実測値を記録できる。
