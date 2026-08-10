# Ver.1.8 Thought Process — 設計判断の記録

> これは成果物として共有できる設計判断の要約であり、内部推論ログではありません。

## 1. Baselineを取り違えない
ユーザーが指定したVer.1.8 BaselineそのものをSource of Truthとしてhash固定し、以前のVer.1.7を出発点とする記述を修正した。

## 2. Real Engineを入れるためDomainを作り替えない
`ShogiEnginePort`が既にあるのでYaneuraOu固有語をApplication Domainへ入れない。差し替える場所はAdapter/Worker boundaryだけにする。

## 3. 本物を使えないときは本物と呼ばない
公式Source/Makefile/Releaseを確認しBuild targetを固定したが、現環境にEmscriptenが無い。ReflectionLocalEngineは実局面を解析するfirst-party Engineだが、YaneuraOuではない。Formal Gateは未達のまま記録する。

## 4. 悪手判定はBest Moveとの差を見る
「前より評価が下がった」だけではなく、指す前にEngineが選べた最善候補と実戦結果の差を比較する。これにより「何をすれば良かったか」をCardへ出せる。

## 5. GoodとBadを別々に選ぶ
一つのRankingへ押し込むと悪手だけ、または好手だけで枠が埋まり得る。Good最大5 / Bad最大5を独立し、必要数に届かなくても水増ししない。

## 6. 連続局面を並べすぎない
同じ崩れの連続手を5枚並べるより、異なる学びが得られる局面を優先する。そのため同Group近接Candidateを抑制する。

## 7. 「局面を見る」はScroll例外にする
通常NavigationのPage Scroll禁止は使いやすさに重要。ただしCandidate Buttonは盤面を見る意思表示そのものなので、Jump後だけ盤面を見える位置へ動かす。

## 8. Smartphoneで設定画面を増やさない
利用者にThreads/Hash/Nodesを毎回考えさせず、Application Presetへ閉じる。MultiPV 1をdefaultにしBest Move+短いPVを優先する。

## 9. LicenseをBuild後の事務作業にしない
Source、WASM output、Evaluation、Toolchain、Weightを別Componentとして採否判定する。曖昧なAssetは「とりあえず同梱」をしない。
## Ver.1.8.2 Finalization Record

### 設計判断記録

公開可能な設計判断として、①既存Replay Stateを再利用、②KeyPositionは本人入力をSource of Truth、③Best-vs-Actualを悪手中心指標、④official wasm_pre.js bridgeを尊重、⑤Real証拠不足ならformal gateをfail-closed、とした。

## Ver.1.8.3 — Buildを「再現できる説明」にする

今回の中心判断は「WASMを手に入れる」ことと「そのWASMを説明できる」ことを分けないことだった。official repository、exact commit、固定compiler、clean checkout、build command、actual output、hash、runner provenanceを一続きにする。Build後のReal USIとApplication E2Eも別証拠にし、同じWASM SHA-256へ結び付ける。

また、upstreamのpthread=on、PTHREAD_POOL_SIZE=32、Memory/Stack設定は再現性のために一旦尊重するが、Smartphone最適化とは扱わない。GitHub PagesのCOOP/COEP成立性とphysical iPhoneも未確認を未確認のまま残す。測っていない性能・Battery・発熱を良好と書かない。

Build失敗やReal Asset不在は「空白」ではなくEvidenceである。`NOT_RUN_REAL_WASM_ASSET_UNAVAILABLE`を正式に記録し、ReflectionLocal成功で穴埋めしない。
