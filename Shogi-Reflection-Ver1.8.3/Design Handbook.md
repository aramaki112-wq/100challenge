# Design Handbook — Shogi Reflection Ver.1.8

> 共通仕様書Ver.1.3の4部構成と、各STEPの「目的→理由→コード→設計者のひとこと→チェックポイント→次へ進む条件」を維持する。

## Part 1 — Source of Truth・Component Gate・Architecture

### STEP 1 — 受領Ver.1.8 Baselineを固定する
#### 1. 🎯 このSTEPの目的
ユーザー提供`Shogi-Reflection-Ver1.8(1).zip` 331 filesを変更前Baselineとして固定する。
#### 2. 🤔 なぜこの作業をするのか
Version名が同じでも「今回のSource of Truth」は受領ZIPそのものだからである。
#### 3. 💻 コードを書く
全File SHA-256を`SOURCE_OF_TRUTH_V1_8_BASELINE_HASHES.json`へ保存し、最終Folderと比較する。
#### 4. 💡 設計者のひとこと
新機能より先に、壊してはいけないものを数えられる状態にする。
#### 5. ✅ チェックポイント
Baseline file count、LICENSE、Replay、Storage、Board、Testのhashを追跡できる。
#### 6. ▶ 次へ進む条件
削除・変更・追加Fileを説明できるManifestが存在する。

### STEP 2 — LicenseをEngine選定より前へ置く
#### 1. 🎯 このSTEPの目的
YaneuraOu Source、WASM output、MATERIAL、Emscripten、将来Weightを別Componentとして監査する。
#### 2. 🤔 なぜこの作業をするのか
「動いたから入れる」を先にすると、配布不能AssetがArchitectureへ食い込むため。
#### 3. 💻 コードを書く
`ENGINE_LICENSE_AUDIT.md`、`ENGINE_COMPONENT_DECISION.md`、`ENGINE_SOURCE_DISTRIBUTION_PLAN.md`へVersion/Commit/License/Unknown/採否を記録する。
#### 4. 💡 設計者のひとこと
License GateはREADME末尾ではなくDependencyの入口に置く。
#### 5. ✅ チェックポイント
権利不明Weightとthird-party prebuilt WASMが正式Packageへ入っていない。
#### 6. ▶ 次へ進む条件
各Componentの採用・不採用理由を説明できる。

### STEP 3 — Interfaceを守ったままYaneuraOu境界を追加する
#### 1. 🎯 このSTEPの目的
Application DomainからYaneuraOu/WASM/MATERIALを参照しない。
#### 2. 🤔 なぜこの作業をするのか
将来Desktop Native USI、NNUE、別Engineへ交換可能にするため。
#### 3. 💻 コードを書く
`YaneuraOuWasmAdapter → UsiEngineAdapter → ShogiEnginePort`とし、`BrowserEngineProvider`でverified manifest時だけprimaryへ選ぶ。
#### 4. 💡 設計者のひとこと
強いEngineを入れる変更を、棋譜Domainの変更にしてはいけない。
#### 5. ✅ チェックポイント
`AnalyzeGame`にspecific build pathがなく、Fallback名もYaneuraOuと混同しない。
#### 6. ▶ 次へ進む条件
manifest unavailable/available双方のProvider testが通る。

## Part 2 — WASM・USI・Evaluation

### STEP 4 — 再現可能なMATERIAL WASM Buildを定義する
#### 1. 🎯 このSTEPの目的
V9.00 exact commitから同じ条件でBuildできる入口を作る。
#### 2. 🤔 なぜこの作業をするのか
BinaryだけではSourceとの対応、Compiler、Hash、配布条件を説明できないため。
#### 3. 💻 コードを書く
`scripts/build-yaneuraou-wasm.sh`で`TARGET_CPU=WASM COMPILER=em++ YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL MATERIAL_LEVEL=1`を固定する。
#### 4. 💡 設計者のひとこと
Build Scriptがあっても実行していなければ「Build済み」ではない。
#### 5. ✅ チェックポイント
manifestにCommit/Modelが入り、未Build時は`available:false`である。
#### 6. ▶ 次へ進む条件
Emscripten環境で実BuildしJS/WASM Hashを記録できる。**現環境では未達。**

### STEP 5 — USIを順序に過度依存せず読む
#### 1. 🎯 このSTEPの目的
Handshake、setoption、info、bestmove、stopをAdapter境界へ閉じ込める。
#### 2. 🤔 なぜこの作業をするのか
Engineの`info` token順序差でApplicationが壊れないようにするため。
#### 3. 💻 コードを書く
`UsiEngineAdapter`と`UsiInfoParser`で`cp/mate/pv/multipv/nodes/depth/time`をparseし、PVは次のknown keywordで区切る。
#### 4. 💡 設計者のひとこと
Protocol Parserは「今見えた一例」を仕様全体だと思わない。
#### 5. ✅ チェックポイント
usi/usiok/isready/readyok/usinewgame/position/go/info/bestmove/stop/quit/timeout/crash testが通る。
#### 6. ▶ 次へ進む条件
AdapterがEngine非依存Resultを返せる。

### STEP 6 — Best MoveとActual Moveを同じ視点へ揃える
#### 1. 🎯 このSTEPの目的
悪手Candidateで「より良かった可能性」を比較可能にする。
#### 2. 🤔 なぜこの作業をするのか
単純な前後評価差だけでは、指す前に存在したBest Moveとの差を表せないため。
#### 3. 💻 コードを書く
Position BeforeのBest Evaluationと、Actual Move後Evaluationを既存`EvaluationNormalizer`で本人視点へ揃え、`bestMoveDifferenceCp`を作る。
#### 4. 💡 設計者のひとこと
評価値で最初に確認するのは数値ではなく「誰の視点か」である。
#### 5. ✅ チェックポイント
CP/MATE/UNKNOWNを混同せず、Best/Actual/PVがCandidateへ残る。
#### 6. ▶ 次へ進む条件
Perspective/Mate regressionとBest-vs-Actual testが成功する。

## Part 3 — Candidate・Replay・人間の振り返り

### STEP 7 — Good最大5 / Bad最大5を独立選出する
#### 1. 🎯 このSTEPの目的
「良かった手」と「考え直したい手」の両方から学べる候補集合を作る。
#### 2. 🤔 なぜこの作業をするのか
一つのRankingだけでは一方の種類で枠が埋まり、振り返りが偏るため。
#### 3. 💻 コードを書く
`EngineCandidateSelector`でGroup別Ranking、最大5、no padding、nearby duplicate suppression、mate priorityを実装する。
#### 4. 💡 設計者のひとこと
候補数を満たすことより、見る価値があることを優先する。
#### 5. ✅ チェックポイント
Good<=5、Bad<=5、合理的候補不足時は5未満、合計<=10。
#### 6. ▶ 次へ進む条件
Candidate Ranking testが全成功する。

### STEP 8 — Candidate Cardを比較の入口にする
#### 1. 🎯 このSTEPの目的
悪手Cardで実戦手とEngine推奨手の差を短く読めるようにする。
#### 2. 🤔 なぜこの作業をするのか
「悪かった」だけでは本人が何を見直すべきか分からないため。
#### 3. 💻 コードを書く
手数、実戦手、before、actual、Engine推奨、best evaluation、difference、short PVを表示し、「唯一の正解」という表現を避ける。
#### 4. 💡 設計者のひとこと
Engineの数字は結論ではなく、盤面を見直すための索引である。
#### 5. ✅ チェックポイント
Good/Bad Section、基準を満たす候補のみ表示、aria-label、Best Move/PV表示がある。
#### 6. ▶ 次へ進む条件
390px Browser/Visual verificationで読める。

### STEP 9 — Candidate JumpだけBoard Scroll例外にする
#### 1. 🎯 このSTEPの目的
「局面を見る」を押したら、既存Replayを更新して盤面まで移動する。
#### 2. 🤔 なぜこの作業をするのか
Candidate Cardから盤面が遠いSmartphoneでは、Jumpだけしても確認操作が完了しないため。
#### 3. 💻 コードを書く
`replayController.jump(ply)`後に`replayView.scrollIntoView({reason:"ENGINE_CANDIDATE_JUMP"})`を呼び、Sticky Header高さ+offsetを引く。
#### 4. 💡 設計者のひとこと
Scroll Policyを壊すのではなく、利用者の明示Intentだけ例外化する。
#### 5. ✅ チェックポイント
Current Move/Snapshot/Board/Highlight一致。次/前/最初/最後/Keyboard/Move List/FlipではPage Scrollなし。
#### 6. ▶ 次へ進む条件
390×844でJump後の盤面がHeaderに隠れない。

### STEP 10 — Engine Candidateを本人の文章へ混ぜない
#### 1. 🎯 このSTEPの目的
Engineを比較対象に留め、本人の振り返りを保持する。
#### 2. 🤔 なぜこの作業をするのか
Engine Best MoveをそのままFACT/HYPOTHESISへ入れると、思考の原因分析が消えるため。
#### 3. 💻 コードを書く
KeyPosition追加は既存Application Serviceだけを使い、Engine Referenceと本人入力欄を分離する。
#### 4. 💡 設計者のひとこと
正解を覚えるより「なぜ候補に入らなかったか」を言語化することが目的である。
#### 5. ✅ チェックポイント
自動KeyPosition登録なし。STEP4欄は空のまま本人が編集できる。
#### 6. ▶ 次へ進む条件
Candidate Add / Manual Add / Duplicate / STEP4 Edit testが通る。

## Part 4 — Smartphone・Degradation・Release Gate

### STEP 11 — Smartphoneでは最大棋力より継続利用性を優先する
#### 1. 🎯 このSTEPの目的
解析のためにApplication全体を重くしない。
#### 2. 🤔 なぜこの作業をするのか
毎局使えることが、単発の最大Depthより振り返り習慣に重要だからである。
#### 3. 💻 コードを書く
SMARTPHONE_SAFEをThreads1/Hash16MB/MultiPV1/Depth6/Nodes5000/220ms/maxPlies160とし、Cancel/Timeout/terminate/background safetyを持たせる。
#### 4. 💡 設計者のひとこと
測定していない数字は「最適値」ではなく「保守的初期値」と呼ぶ。
#### 5. ✅ チェックポイント
Engine failureでもReplay/Manual KeyPosition/Reflection/Exportが利用できる。
#### 6. ▶ 次へ進む条件
Physical iPhone feedbackでResource policyを評価できる。**実機測定は未実施。**

### STEP 12 — Evidence Gateを満たすまで正式完成と呼ばない
#### 1. 🎯 このSTEPの目的
Mock/Fallback成功とReal YaneuraOu成功を区別する。
#### 2. 🤔 なぜこの作業をするのか
「Adapterがある」「Workerが動いた」だけではユーザー指定のReal YaneuraOu完成条件を満たさないため。
#### 3. 💻 コードを書く
Automated/Browser/Visual/Static結果と、`REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt`のYaneuraOu WASM `NOT RUN`を別々に記録する。
#### 4. 💡 設計者のひとこと
未達Gateを隠さないこともRelease Engineeringの一部である。
#### 5. ✅ チェックポイント
Real YaneuraOu WASM E2Eが未実施ならCompletion Reportが`FORMAL COMPLETION NOT ACHIEVED`になる。
#### 6. ▶ 次へ進む条件
Official-source WASM build、Real USI、short/normal/long E2E、License Gate、ZIP展開後再検証がすべて成功する。
## Ver.1.8.2 Finalization Record

# Part 1 — Best vs Actual

### STEP 1 — 悪手を「実戦手後の未来」で測る
#### 1. 🎯 このSTEPの目的
Root局面のBest Evaluationと実戦手後Actual Evaluationを比較する。
#### 2. 🤔 なぜこの作業をするのか
まだ駒を取られていないquiet blunderも探索評価なら先の損失として現れるため。
#### 3. 💻 コードを書く
`AnalyzeGame`で`bestEvaluation`/`actualEvaluation`/`bestMoveDifferenceCp`をviewer perspectiveへ揃え、Candidate Selectorはこの差を優先する。
#### 4. 💡 設計者のひとこと
閾値を下げるだけでは「悪手が見えない」原因を直したことにならない。
#### 5. ✅ チェックポイント
clear/quiet/tactical/mate miss/形勢帯遷移/no forced five testがある。
#### 6. ▶ 次へ進む条件
Real Engine searchでfuture lossが評価へ現れることをE2E確認する。現環境では未達。

# Part 2 — Evaluation Graph

### STEP 2 — グラフを別Domainにしない
#### 1. 🎯 このSTEPの目的
全plyの流れを見ながら既存Replay/KeyPositionへ移動できるようにする。
#### 2. 🤔 なぜこの作業をするのか
Graph専用局面Stateを作るとReplayと表示がずれる危険があるため。
#### 3. 💻 コードを書く
`evaluationTimeline → EngineEvaluationGraphModel → SVG View`とし、markerは既存`replayController.jump`またはKeyPosition card lookupを呼ぶ。
#### 4. 💡 設計者のひとこと
グラフは地図であって、盤面の代用品ではない。
#### 5. ✅ チェックポイント
Good/Bad/KeyPosition/Mate、0手目、Mate/Unknown line split、390pxを確認する。
#### 6. ▶ 次へ進む条件
Graph→ReplayとGraph→STEP4 exact cardがBrowser Testで通る。

# Part 3 — Real Engine Boundary

### STEP 3 — Interfaceを変えずofficial WASM contractへ合わせる
#### 1. 🎯 このSTEPの目的
Domainを変更せずYaneuraOuWasmAdapterの内部だけをofficial buildへ合わせる。
#### 2. 🤔 なぜこの作業をするのか
特定EngineのThread起動やpre-js事情をApplicationへ漏らさないため。
#### 3. 💻 コードを書く
Worker Bootstrapはofficial `Module.postMessage` bridgeを使い、Runtime Providerはhash/cross-origin isolation/SABをGateする。
#### 4. 💡 設計者のひとこと
`usi_command`がexportされていても、official queue/retryを迂回してよいとは限らない。
#### 5. ✅ チェックポイント
Direct ccall fallbackを禁止するTestとBrowser capability testがある。
#### 6. ▶ 次へ進む条件
Real generated glueでUSI handshakeを通す。現環境では未達。

# Part 4 — License / Formal Completion

### STEP 4 — 「動作」と「配布可能」と「正式完成」を分ける
#### 1. 🎯 このSTEPの目的
通常Testが通ってもReal Engine未確認なら完成と誤認しない。
#### 2. 🤔 なぜこの作業をするのか
FallbackやMockはApplication品質の証拠にはなるがReal YaneuraOuの証拠ではないため。
#### 3. 💻 コードを書く
Real Artifact Gate、Real E2E result、License Gate、Formal Completion Gateを別Evidenceとして保存する。
#### 4. 💡 設計者のひとこと
LicenseもTestと同じくArchitecture Gateである。
#### 5. ✅ チェックポイント
Real binary/weightがない状態でformal gateが意図的にFAILする。
#### 6. ▶ 次へ進む条件
Build、Real E2E、binary-specific source/notice gateがすべてPASSする。

### STEP 5 — official SourceとCompilerを固定する
#### 1. 🎯 このSTEPの目的
Real YaneuraOuの出所をV9.00 exact commitとEmscripten 4.0.15へ固定し、再現Buildの入口を一意にする。
#### 2. 🤔 なぜこの作業をするのか
Moving branchや`latest`では、同じVersion名でも生成物が変わり、後から原因・License・性能を説明できなくなるため。
#### 3. 💻 コードを書く
`.github/workflows/build-yaneuraou-wasm.yml`でofficial repository、commit、emsdk version、official release mappingを固定し、clean checkoutを確認する。
#### 4. 💡 設計者のひとこと
「Version固定」は文字列を置くだけではなく、そのVersionが何を指したか検証するところまでが設計である。
#### 5. ✅ チェックポイント
Commit一致、dirty sourceなし、emsdk 4.0.15 mapping一致、emcc/em++/LLVM実測記録。
#### 6. ▶ 次へ進む条件
同じ入力Source/Toolchain/Commandを後から説明できること。

### STEP 6 — Build ArtifactへTraceabilityを埋め込む
#### 1. 🎯 このSTEPの目的
JS/WASMを実生成物として確定し、Emscripten 4.0.15のpthread packaging（main JS self-worker）とApplication Worker BootstrapをSHA-256/Build Metadataへ結び付ける。
#### 2. 🤔 なぜこの作業をするのか
想定File名や推測したCompiler情報では、Real RuntimeがどのBinaryを使ったか証明できないため。
#### 3. 💻 コードを書く
`build-yaneuraou-wasm.sh`、`hash-engine-assets.sh`、`update-engine-build-metadata.mjs`でactual output discovery、hash、runner/toolchain metadataを生成する。
#### 4. 💡 設計者のひとこと
Artifact名よりHashを信頼する。名前が同じでも中身が違えば別Buildである。
#### 5. ✅ チェックポイント
JS/WASMが各1つ、separate pthread workerが0件、Application Worker Bootstrapが存在し、それぞれ必要Hash一致、metadata.measured=true、runtime manifestと一致。
#### 6. ▶ 次へ進む条件
Real Artifact Gateが同じ実測情報だけでPASSできること。

### STEP 7 — MockとReal Evidenceを完全に分離する
#### 1. 🎯 このSTEPの目的
USI Protocolの成功とApplication Flowの成功を別Evidenceとして取得し、同じWASM Hashへ結び付ける。
#### 2. 🤔 なぜこの作業をするのか
MockでUIが動くこと、USIが応答すること、Sample KIF全体が振り返りFlowまで成立することは別問題だから。
#### 3. 💻 コードを書く
`real_yaneuraou_usi_verify.py`と`real_yaneuraou_browser_verify.py`を分離し、Formal Gateで両Result JSONとcurrent WASM SHA-256の一致を検証する。
#### 4. 💡 設計者のひとこと
Evidenceは「成功した気がする」を排除するためのInterfaceである。
#### 5. ✅ チェックポイント
usi/readyok/cp/mate/PV/stopとSample KIF/full-ply/Good/Bad/Graph/STEP4/Cancelが別々にPASSし、hashが同一。
#### 6. ▶ 次へ進む条件
ReflectionLocalやMockを一切数えずReal Gateを通せること。

### STEP 8 — LicenseとFormal Completionを最後まで別Gateにする
#### 1. 🎯 このSTEPの目的
Build成功、Personal Use、Public Distribution、Commercial Distribution、Formal Completionを混同しない。
#### 2. 🤔 なぜこの作業をするのか
GPL、generated JS、Worker、Corresponding Source、Hosting条件は「動いた」だけでは解決しないため。
#### 3. 💻 コードを書く
License Audit、Component Decision、Source Distribution Plan、Third Party Notices、Formal Gate、ZIP展開後再検証を独立Evidenceとして残す。
#### 4. 💡 設計者のひとこと
Licenseは最後に貼る紙ではなく、採用できるArchitectureを決める制約である。
#### 5. ✅ チェックポイント
Existing LICENSE unchanged、Corresponding Source exact commit、Readiness三分離、Legal Review flag、NOT-FORMAL naming。
#### 6. ▶ 次へ進む条件
Real GateとLicense Gateを通過したFormal候補ZIPを別Folderで再検証できること。
