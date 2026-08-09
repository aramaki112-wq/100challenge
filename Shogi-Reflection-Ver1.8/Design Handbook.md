# Design Handbook — Shogi Reflection Ver.1.8

## Part 1 — Source of Truth・License Gate・UI順序

### STEP 1 — Ver.1.7 Source of Truthを固定する
#### 1. 🎯 このSTEPの目的
Ver.1.7正式ZIP 309 filesを変更前Baselineとして固定する。
#### 2. 🤔 なぜこの作業をするのか
Real Engine追加を理由に既存Domain/Replay/Storageを無意識に再構成しないため。
#### 3. 💻 コードを書く
全File SHA-256 manifestを`SOURCE_OF_TRUTH_V1_7_BASELINE_HASHES.json`へ保存し、変更/追加/削除を機械比較する。
#### 4. 💡 設計者のひとこと
新機能の前に「壊してはいけないもの」を数えられる状態にする。
#### 5. ✅ チェックポイント
Ver.1.7元File数309、LICENSE hash、ReplayScrollPolicy、GameReview/Backup関連を比較できる。
#### 6. ▶ 次へ進む条件
削除Fileを説明でき、Source of Truth manifestが存在する。

### STEP 2 — LicenseをComponent選定Gateにする
#### 1. 🎯 このSTEPの目的
Engine/WASM/Evaluation/Build Tool/Assetを採用前に監査する。
#### 2. 🤔 なぜこの作業をするのか
「動いた後でLicenseを調べる」と配布不能なAssetがArchitectureへ食い込むため。
#### 3. 💻 コードを書く
`ENGINE_LICENSE_AUDIT.md`、`ENGINE_COMPONENT_DECISION.md`、`DISTRIBUTION_LICENSE_CHECKLIST.md`を作り、EngineとWeightを別Componentとして記録する。
#### 4. 💡 設計者のひとこと
LicenseはREADME末尾の注意書きではなくDependency Injectionの入口に置く。
#### 5. ✅ チェックポイント
Source URL、Version/Commit、License、Redistribution、Source disclosure、Unknown、採否が記録される。
#### 6. ▶ 次へ進む条件
不明Assetを正式ZIPへ入れない方針を確定できる。

### STEP 3 — STEP3の思考順序を直す
#### 1. 🎯 このSTEPの目的
Engine PanelをReplay Boardより前へ置き、Board FlipをReplay Navigationへ移す。
#### 2. 🤔 なぜこの作業をするのか
「まず候補を知り、盤面で確認する」という利用者の行動順序へ合わせるため。
#### 3. 💻 コードを書く
`index.html`のSTEP3 DOM順序をEngine→Replayへ変更し、CSSで390px前後3列Wrapを設定する。
#### 4. 💡 設計者のひとこと
機能が正しくても、思考順序とUI順序が逆なら毎局の負担になる。
#### 5. ✅ チェックポイント
7 STEP維持、Engine Panel before Board、Flip inside navigation、横overflowなし。
#### 6. ▶ 次へ進む条件
390×844 Browserで配置を確認できる。

## Part 2 — Real Engine・Worker・USI

### STEP 4 — Portを守ったままReal Engineを差し込む
#### 1. 🎯 このSTEPの目的
Application Domainを特定Engineへ依存させず実解析を成立させる。
#### 2. 🤔 なぜこの作業をするのか
将来YaneuraOu/WASM/Desktop Nativeへ差し替えるため。
#### 3. 💻 コードを書く
`ReflectionLocalEngineAdapter`を`UsiEngineAdapter`のsubclassとして実装し、`BrowserEngineProvider`のdefaultへ設定する。
#### 4. 💡 設計者のひとこと
最初にInterfaceがあると、強いEngineへの交換はDomain改造ではなくAdapter交換になる。
#### 5. ✅ チェックポイント
`AnalyzeGame`にYaneuraOu/WASM文字列がない。Mockはtest専用。
#### 6. ▶ 次へ進む条件
Real Engine initialize/metadata testが通る。

### STEP 5 — SearchをWeb Workerへ隔離する
#### 1. 🎯 このSTEPの目的
Main Threadを長時間Blockingしない。
#### 2. 🤔 なぜこの作業をするのか
SmartphoneでReplay/UIの応答性を守るため。
#### 3. 💻 コードを書く
`ReflectionLocalEngineWorker.js`でSFEN parse、合法手候補、簡易search、USI message処理を実装する。
#### 4. 💡 設計者のひとこと
「Workerを使った」だけで軽量とは言えない。BudgetとCancelもセットで設計する。
#### 5. ✅ チェックポイント
Worker start/message/result/terminate/restart testが通る。
#### 6. ▶ 次へ進む条件
Position→evaluation/bestmove/MultiPVが実Workerから返る。

### STEP 6 — Cancelを端から端まで通す
#### 1. 🎯 このSTEPの目的
UI Buttonではなく実行中探索を止める。
#### 2. 🤔 なぜこの作業をするのか
SmartphoneでBattery/発熱/離脱時の資源消費を制御するため。
#### 3. 💻 コードを書く
`AnalyzeGame.cancel()`→Adapter `stop`→Worker stop/terminateへ伝播し、UIへCANCELLING/CANCELLEDを返す。
#### 4. 💡 設計者のひとこと
Cancelは「押せる」ではなく「処理が止まり、再開できる」が完成条件。
#### 5. ✅ チェックポイント
Real BrowserでCancel→CANCELLED→再解析可能を確認する。
#### 6. ▶ 次へ進む条件
長いfixtureでCancel E2Eが通る。

## Part 3 — 全棋譜解析・Candidate・既存Replay接続

### STEP 7 — Position Historyを再利用する
#### 1. 🎯 このSTEPの目的
Engine専用棋譜再現Domainを作らない。
#### 2. 🤔 なぜこの作業をするのか
Replay盤とEngine局面の不一致を防ぐため。
#### 3. 💻 コードを書く
既存`PositionHistoryBuilder`出力を`AnalyzeGame`へ渡し、各plyを`UsiPositionMapper`へ変換する。
#### 4. 💡 設計者のひとこと
同じ棋譜を二つの再現器で読むと、いつか局面が割れる。
#### 5. ✅ チェックポイント
KIF→History→Engine EvaluationがReal testで通る。
#### 6. ▶ 次へ進む条件
short/normal/long fixture E2Eが成功する。

### STEP 8 — PerspectiveとMateを壊さない
#### 1. 🎯 このSTEPの目的
評価値を本人視点へNormalizeし、MateをCPへ潰さない。
#### 2. 🤔 なぜこの作業をするのか
side-to-move符号をそのまま差分化すると良化/悪化が逆転し得るため。
#### 3. 💻 コードを書く
既存`EvaluationNormalizer`と`EvaluationDelta`をそのまま使い、Engine raw resultだけAdapterから渡す。
#### 4. 💡 設計者のひとこと
評価値は数字より「誰から見た数字か」がDomain上重要。
#### 5. ✅ チェックポイント
CP/MATE/UNKNOWNが区別され、rowsはVIEWER perspectiveになる。
#### 6. ▶ 次へ進む条件
既存Normalization/Mate regressionが全成功する。

### STEP 9 — Candidateを既存Replay/KeyPositionへ戻す
#### 1. 🎯 このSTEPの目的
Engine Candidateを別世界にせず既存振り返りFlowへ接続する。
#### 2. 🤔 なぜこの作業をするのか
Engineが人間の重要局面Domainを上書きしないため。
#### 3. 💻 コードを書く
Candidate Jumpは`replayController.jump(ply)`、Addは既存`addCurrentReplayPositionToKeyPosition()`を使う。
#### 4. 💡 設計者のひとこと
Candidateが消えてもReplayとKeyPositionは残る設計が望ましい。
#### 5. ✅ チェックポイント
Current Ply/Move/Highlight/Board/Snapshotが一致し、FACT等は空欄。
#### 6. ▶ 次へ進む条件
Real BrowserでCandidate→Replay→KeyPositionが通る。

## Part 4 — Resource・Verification・Release

### STEP 10 — Smartphone Resource Policyを実装する
#### 1. 🎯 このSTEPの目的
最大棋力ではなく継続利用可能性を守る。
#### 2. 🤔 なぜこの作業をするのか
長い棋譜・Background・Low MemoryでApplication全体を巻き込まないため。
#### 3. 💻 コードを書く
1 thread、保守的Depth/Nodes/Time、maxPlies、Timeout、background cancelを実装する。
#### 4. 💡 設計者のひとこと
測っていない数字は「最適値」ではなく「安全側の初期値」と呼ぶ。
#### 5. ✅ チェックポイント
長い300-ply fixtureは安全上限metadataを残し、未解析分を偽装しない。
#### 6. ▶ 次へ進む条件
Resource policyとKnown limitationをManual/Reportへ記録する。

### STEP 11 — Mock RegressionとReal E2Eを分離する
#### 1. 🎯 このSTEPの目的
大量UI regressionの安定性とReal Engineの真正性を両立する。
#### 2. 🤔 なぜこの作業をするのか
Mock成功をReal Engine成功と誤記しないため。
#### 3. 💻 コードを書く
`browser_verify.py`は明示Mock、`real_engine_browser_verify.py`はactual Blob Workerを使う。
#### 4. 💡 設計者のひとこと
Test Doubleは悪くない。名前を付けずに本物扱いすることが悪い。
#### 5. ✅ チェックポイント
両結果FileにEngine種別が明記される。
#### 6. ▶ 次へ進む条件
Automated/Browser/Real Browser/Visual/Staticが0 fail。

### STEP 12 — ZIP展開物だけでFinal Verificationする
#### 1. 🎯 このSTEPの目的
ユーザーへ渡す実物を最終Sourceとして検証する。
#### 2. 🤔 なぜこの作業をするのか
作業Folderだけ成功してZIPに欠品する事故を防ぐため。
#### 3. 💻 コードを書く
ZIP作成→別Folder展開→`npm test`/`npm run check`/Browser/Real Browser/Visualを展開物上で再実行する。
#### 4. 💡 設計者のひとこと
完成品は作業Folderではなく、相手が受け取るZIPである。
#### 5. ✅ チェックポイント
ZIP integrity、Missing Import 0、License/Notice/Engine hash、全test pass。
#### 6. ▶ 次へ進む条件
`COMPLETION_REPORT.md`の最終数字が展開物実測と一致する。
