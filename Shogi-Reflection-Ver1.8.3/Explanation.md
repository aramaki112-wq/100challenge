# Ver.1.8 Explanation — Real YaneuraOu Integration境界とBest Move比較

## 1. Source of Truth
今回の出発点はVer.1.7ではなく、ユーザー提供の`Shogi-Reflection-Ver1.8(1).zip`です。331 filesのSHA-256を保存し、そこから必要な変更だけを加えました。

## 2. Interfaceを維持したままEngineを交換する
Applicationは`ShogiEnginePort`だけを知ります。YaneuraOu/WASM/MATERIAL/Emscripten固有処理はAdapter/Workerより外側へ閉じ込めます。これにより将来Desktop Native USIやNNUEへ差し替えてもReplay/Reflection Domainを作り直しません。

## 3. Real YaneuraOu Gate
V9.00 / exact commit / MATERIAL_LEVEL=1 / WASM / em++を固定し、Build Scriptとmanifestを用意しました。ただしこの環境にEmscriptenが無いためReal YaneuraOu WASMは生成できませんでした。したがって正式完成とは判定しません。

## 4. Best Move Comparison
各本人手について「指す前の局面のEngine Best Evaluation」と「実戦手後のEvaluation」を本人視点へNormalizeして比較します。単純なbefore/afterだけでなく、Best Moveとの差をBad Candidate Rankingへ使います。

## 5. Good / Bad Candidate
GoodとBadを別Groupで最大5件ずつ選びます。合理的候補が少なければ水増ししません。MateはCP巨大値に潰さず専用変化として扱います。近接局面の重複も抑えます。

## 6. Human-in-the-loop
Engineは「重要局面」を自動確定しません。Candidate→既存Replay→本人の判断→既存KeyPositionという順序です。FACT/INTERPRETATION/HYPOTHESISは本人が入力します。

## 7. Candidate Scroll例外
通常Replay NavigationはPage Scrollなしを維持します。一方「局面を見る」は利用者が盤面確認を明示した操作なので、Jump完了後だけ盤面までPage Scrollします。

## 8. Smartphone Resource Safety
DefaultはSMARTPHONE_SAFEです。Threads 1、Hash 16MB、MultiPV 1、1局面Budget、maxPlies、Cancel/Timeoutを持ちます。これらはPhysical iPhoneで最適化済みではありません。

## 9. License as Architecture
YaneuraOu Source/WASM output/MATERIAL/Emscripten/NNUE Weightを別Componentとして監査します。現在はYaneuraOu Binary/Weightを同梱せず、権利不明AssetをPackageへ入れません。
## Ver.1.8.2 Finalization Record

### Evaluation GraphとFormal Gate

Evaluation Graphは全ply評価を一覧するだけでなく、候補局面と本人KeyPositionへ移動するNavigation Mapとして追加した。Real Engineの有無は通常Testと別Gateにし、Fallback成功をReal成功へ読み替えない。

## Ver.1.8.3 — YaneuraOu WASM Build Bridge

Ver.1.8.3は新機能追加ではなく、Real Engineの「出所 → Build → Hash → Runtime Evidence」をつなぐ版である。GitHub Actionsを一次Build Hostとし、YaneuraOu V9.00 exact commit、MATERIAL_LEVEL=1、Emscripten 4.0.15を固定する。生成されたJS/WASMは実File名とSHA-256を記録する。Emscripten 4.0.15ではseparate pthread `.worker.js`は生成されず、main JSをpthread Worker scriptとして再利用するため、そのPackaging Modeと0件の生成Worker数を測定値として記録する。Application側の`YaneuraOuWasmWorkerBootstrap.js`は別途SHA-256を固定し、`ENGINE_BUILD_METADATA.json`とruntime manifestを一致させる。

Real証拠は二層へ分けた。`real_yaneuraou_usi_verify.py`はUSI handshake、cp/mate、PV、MultiPV、depth/nodes/time、bestmove、stop/quit、評価Sanityを検証する。`real_yaneuraou_browser_verify.py`はSample KIF、全ply、Good/Bad Candidate、Best/Actual/Difference、Graph、Replay、Board Scroll、KeyPosition、STEP4、Cancel/Re-analysisを検証する。Formal Gateは両Evidenceが同一WASM hashへ結び付く場合だけ通る。

現在の実行環境ではReal Buildを実行できていないため、Build Metadataの実測欄はnullのまま、manifestは`available=false`、Formal CompletionはNOT-FORMALを維持する。
