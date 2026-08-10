# Shogi Reflection Ver.1.8 — YaneuraOu Integration Candidate

このFolderは、ユーザー提供の **`Shogi-Reflection-Ver1.8-Integration-Candidate(1).zip`（331 files）をSource of Truth** とし、既存Domain/Repository/Storage/Replay/7 STEPを大規模再構成せず、Ver.1.8本来の完成形へ近づけた実装です。

> **Release Gate Status:** `FORMAL COMPLETION NOT ACHIEVED`
>
> Real YaneuraOu WASMを公式SourceからBuildしてBrowserでE2E実行するGateだけは、この検証環境にEmscripten (`em++` / `emcc`) が無いため未達です。ReflectionLocalEngineをYaneuraOuと偽装せず、YaneuraOu未利用時は明示Fallbackとして扱います。

## 今回成立したFlow

```text
KIF登録 / 添付Sample KIF
  ↓
棋譜保存
  ↓
保存済み対局を開く
  ↓
STEP3
  ↓
Engine Analysis Panel
  ↓
良かった手 最大5件 / 考え直したい手 最大5件
  ↓
Bad Candidateでは Engine推奨 / Best Evaluation / Actual Evaluation / Difference / 短いPV
  ↓
局面を見る
  ↓
既存ReplayへJump
  ↓
Current Move / Snapshot / Board / Move List Highlight更新
  ↓
Candidate操作だけ盤面まで意図的Page Scroll
  ↓
本人が必要な局面だけ既存KeyPositionへ追加
  ↓
STEP4 FACT / INTERPRETATION / HYPOTHESIS
  ↓
STEP5〜7 Reflection / Observation Theme / 実行Rule / Report
```

Engine Candidateは本人の重要局面を自動確定しません。Engine情報をFACT/INTERPRETATION/HYPOTHESISへ自動転記しません。

## Engine Runtime Resolution

Production Providerは次の順序で解決します。

1. 明示指定External Engine
2. Test/Development Mock
3. 明示`?engine=local`
4. 登録済みExternal USI Worker
5. **verified bundled YaneuraOu WASM manifest**
6. **ReflectionLocalEngine fallback**

`engine/yaneuraou/engine-manifest.json`が`available: true`で、Build/Hash Gateを通過したときだけYaneuraOuWasmAdapterをprimaryにします。現在のmanifestは`available: false`です。

## YaneuraOu Integration Target

- Engine: YaneuraOu
- Release: **V9.00**
- Commit: **`a5ee2786c0030edc7d4a1cdfe94b04dffec55493`**
- Evaluation: **`YANEURAOU_ENGINE_MATERIAL`**
- Material Level: **1**
- Target: **WASM**
- Compiler: **`em++`**
- Adapter: `YaneuraOuWasmAdapter`
- Worker bootstrap: `YaneuraOuWasmWorkerBootstrap.js`
- Port: existing `ShogiEnginePort`

Build helper: `scripts/build-yaneuraou-wasm.sh`

正式Build時はOutput JS/WASM/WorkerのSHA-256とEmscripten Versionを`engine-manifest.json`へ記録してください。

## Smartphone-first Preset

利用者へ細かなEngine設定を要求しません。

| Preset | Depth | Nodes | 1局面Time | MultiPV | Threads | Hash | Max Plies |
|---|---:|---:|---:|---:|---:|---:|---:|
| SMARTPHONE_SAFE | 6 | 5,000 | 220ms | 1 | 1 | 16MB | 160 |
| DESKTOP_BALANCED | 8 | 20,000 | 650ms | 2 | 1 | 32MB | 240 |

これはPhysical iPhoneで最適化済みの値ではなく、**保守的な初期値**です。Battery/発熱/Worker Memoryは実機Feedback後に調整します。

## Candidate Policy

- Good Candidate: 最大5件
- Bad Candidate: 最大5件
- 合計: 最大10件
- 基準未達の候補は水増ししない
- 近接する同種Candidateを重複抑制
- Mate変化はCP巨大値へ雑変換しない
- Bad Candidateは`bestMoveDifferenceCp`を中心に比較
- MultiPVを保持できるArchitectureは維持し、Smartphone DefaultはBest Move 1件 + 短いPV

## Replay Scroll Policy

通常の以下操作はBrowser Page全体を動かしません。

- 次へ / 前へ / 最初へ / 最後へ
- Keyboard Navigation
- Move List Jump
- Board Flip

**Engine Candidateの「局面を見る」だけ**は明示的な盤面確認要求として、Replay Jump完了後に既存盤面までPage Scrollします。Sticky Header分のoffsetを考慮します。

## Sample KIF

`samples/piyo_20260617_170236.kif`を同梱しました。STEP1の「サンプル棋譜を試す」から既存Import Preview経路で読み込めます。

- Encoding: Shift_JIS
- Parsed moves: 152
- Termination: 投了
- SHA-256: `72a1c92726dee787cd13af0508b559be44a6c0d7c088b4c37894a3eaba5f06c7`

## License / Distribution Gate

Applicationの既存`LICENSE`は変更していません。YaneuraOu Source/WASM output/MATERIAL Evaluation/Emscripten/将来のNNUE Weightを別Componentとして監査します。

現在のPackageにはYaneuraOu JS/WASM binary、NNUE/水匠Weightを同梱していません。Public/Commercial配布時のGPL結合形態・Corresponding Source要件については、具体的Bundleを対象に法務確認が必要です。

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION** of a YaneuraOu-bundled build.

詳細:
- `ENGINE_LICENSE_AUDIT.md`
- `ENGINE_COMPONENT_DECISION.md`
- `ENGINE_BUILD_REPRODUCIBILITY.md`
- `ENGINE_SOURCE_DISTRIBUTION_PLAN.md`
- `DISTRIBUTION_LICENSE_CHECKLIST.md`
- `THIRD_PARTY_NOTICES.md`

## Verification Scope

現在の作業Folderでは次を確認しています。

- Automated Test: 656/656 PASS（最終Package roundで再計測）
- 390×844 Chromium Browser Verification: 148/148 PASS
- Visual Verification: 17/17 PASS
- ReflectionLocal fallback Worker Browser gate: PASS
- Real YaneuraOu WASM E2E: **NOT RUN**
- Physical iPhone: **NOT TESTED**
- Battery / Thermal: **NOT MEASURED**

最終数字は`TEST_RESULT.txt`、`BROWSER_VERIFICATION_RESULT.txt`、`VISUAL_VERIFICATION_RESULT.txt`、`REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt`、`COMPLETION_REPORT.md`を参照してください。
## Ver.1.8.2 Finalization Record

### Source of Truth

この作業のSource of Truthはユーザー添付 **`Shogi-Reflection-Ver1.8-Integration-Candidate(1).zip`（347 files）**。新規baseline manifestは`SOURCE_OF_TRUTH_V1_8_INTEGRATION_CANDIDATE_HASHES.json`。

### 追加実装

- 全ply `evaluationTimeline`
- SVG Evaluation Graph
- CP / Mate / Unknownの分離
- Good / Bad / KeyPosition / Mate marker
- Graph Candidate → existing Replay → Board Scroll
- Graph KeyPosition → STEP4 exact card → FACT focus
- Best Evaluation vs Actual Evaluation回帰Test拡充
- Candidate→KeyPosition時のBrowser scroll anchoring抑止
- official `wasm_pre.js` message bridgeに合わせたWASM Worker Bootstrap
- cross-origin isolation / SharedArrayBuffer / Build hash metadata Runtime Gate
- Real WASM Artifact Gate / Formal Completion Gate

### Verification Status

- Automated: 676/676 PASS（最終再実行値は`TEST_RESULT.txt`参照）
- 390×844 Browser: 154/154 PASS（最終再実行値は`BROWSER_VERIFICATION_RESULT.txt`参照）
- Real YaneuraOu Artifact Gate: **FAIL / NOT BUILT**
- Real YaneuraOu E2E: **NOT RUN**
- Physical iPhone: **NOT TESTED**

### Formal Naming Rule

`FORMAL_COMPLETION_GATE_RESULT.json.passed === true`にならない限り、成果物を`Shogi-Reflection-Ver1.8.2.zip`として正式完成扱いにしない。本環境ではReal WASM Gateが未達のため、配布物は`NOT-FORMAL-Integration-Candidate`として扱う。

## Ver.1.8.3 — YaneuraOu WASM Build Bridge

Ver.1.8.3は、Ver.1.8.2 NOT-FORMALをSource of TruthとしてReal YaneuraOuを再現可能にBuildするためのBridgeを追加する。Application Domain、Repository、Storage、Replay、KeyPosition、Evaluation Graphは再構成しない。

- primary build host: GitHub Actions
- YaneuraOu: V9.00 exact commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- Evaluation: built-in MATERIAL / `MATERIAL_LEVEL=1`
- Toolchain target: emsdk / Emscripten `4.0.15`
- Build: `TARGET_CPU=WASM COMPILER=em++`
- outputs: actual generated JS/WASM/pthread Workerを採用しSHA-256固定
- Real Evidence: USIとApplication E2Eを別Resultへ記録し、同一WASM hashを要求
- License: Build successとPublic/Commercial Distribution readinessを分離

この配布物にはReal YaneuraOu binaryは含まれておらず、現在のFormal Completionは**NOT ACHIEVED**。GitHub ActionsでReal Build → Real USI → Real Application E2E → License/Source Gate → Formal Gate → ZIP展開後再検証を通過するまで、正式版名へ変更しない。
