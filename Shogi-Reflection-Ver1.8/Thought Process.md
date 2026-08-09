# Ver.1.8 Thought Process — 設計判断の記録

> これは実装判断を再現できるようにまとめた設計理由であり、内部推論ログではない。

## 1. Interfaceを先に守る

Ver.1.7ですでに`ShogiEnginePort`が存在するため、Engineを入れるためにDomainをYaneuraOu専用へ作り替えない。実EngineはAdapter/Transportより外側に置く。

## 2. 実Engineを「強さ」だけで選ばない

Browser Smartphoneで毎局振り返る用途では、最大棋力だけでなく起動、Memory、Cancel、Battery、発熱、License、再現Buildが成立条件になる。強いが配布条件を説明できないAssetはBaselineにしない。

## 3. WASMを調べたうえで採用しなかった

WASMは第一候補として調査し、YaneuraOu公式MakefileにEmscripten経路があることを確認した。一方、今回の環境では`em++`を使った再現Buildを実行できず、公式Sourceとの対応が追えないprebuilt binaryを正式Assetとして採用するのはGate違反になる。

## 4. first-party Worker Engineを置く

Local JavaScript Worker Engineなら第三者Weightが不要で、Source/License/Hashを完全に追える。棋力には限界があるが、実Engine Integration、USI transport、Cancellation、Position History接続、Candidate Flowを本物のRuntimeで検証できる。

## 5. UIは解析を先に見せる

「盤面を全部眺めてから解析する」のではなく「解析→候補→Replay確認」とした。Candidate専用盤は作らず既存Replayを唯一の盤面Stateにする。

## 6. Board Flipを盤面操作へ戻す

盤面反転は盤面を見ながら押せなければ操作コストが高い。Replay Navigationへ集約し、小画面ではWrapする。

## 7. CancelはUI装飾にしない

Cancelは`AnalyzeGame.cancel → EngineAdapter.cancelAnalysis → USI stop → Worker termination`まで伝播させ、Browser E2EでCANCELLED状態まで確認する。

## 8. 長い棋譜は安全上限を持つ

300手全てを常にSmartphoneで解析することより、毎局継続利用できることを優先する。上限を超えた場合はtruncated metadataを残し、未解析分を解析済みと見せない。

## 9. Licenseは後付け資料にしない

Component採用前にLicense/Source/Weight/BuildをGateにする。不明Assetを先に同梱して後から調べる順序を禁止する。

## 10. READYの意味を限定する

Current formal ZIPはthird-party Engine/Weightを含まないためcomponent license gate上はPublic/Commercial readyと判定できる。ただしそれを「全法域で100%合法」とは言わない。将来YaneuraOuをbundleした時点で再監査する。
