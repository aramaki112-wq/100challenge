# COMPLETION_REPORT — Shogi Reflection Ver.1.8 Integration Candidate

作成日: 2026-08-09

## Final Verdict

**Ver.1.8正式完成: NOT ACHIEVED**

理由は1点に集約されます。ユーザー指定の正式完成条件には「Real YaneuraOu WASM起動・USI通信・Real Engine E2E」が含まれますが、current verification environmentにEmscripten (`em++` / `emcc`) がなく、official YaneuraOu sourceからWASMをBuild・実行できませんでした。

ReflectionLocalEngineは実局面を解析するfirst-party Local Engineですが、YaneuraOuではありません。この結果をReal YaneuraOu成功として扱っていません。

## 今回実装内容

- User-provided Ver.1.8 BaselineをSource of Truthとしてhash固定
- YaneuraOuWasmAdapter / Worker bootstrap / manifest gate
- verified YaneuraOu primary + ReflectionLocal explicit fallback
- USI handshake / setoption / cp / mate / PV / nodes / depth / time / bestmove / stop / quit強化
- Good Candidate最大5 / Bad Candidate最大5
- no forced padding / duplicate suppression / mate-aware ranking
- Bad CandidateのBest Move / Best Evaluation / Actual Evaluation / Difference / short PV
- Candidate Card UI分離
- Candidate「局面を見る」→existing Replay→Board Scroll
- Sticky Header offset
- Candidate→existing KeyPosition
- SMARTPHONE_SAFE / DESKTOP_BALANCED Preset
- Sample KIF同梱 + STEP1 Sample Button
- License / Build reproducibility / Source distribution資料更新
- Automated / Browser / Visual / Static verification更新

## YaneuraOu Component

- Engine: **YaneuraOu**
- Version/Release target: **V9.00**
- Commit Hash: **a5ee2786c0030edc7d4a1cdfe94b04dffec55493**
- Source: official `yaneurao/YaneuraOu`
- Engine License: **GPLv3として監査**
- WASM方式: official Makefile Emscripten pathを利用する設計
- Compiler target: `em++`
- Evaluation方式: **YANEURAOU_ENGINE_MATERIAL**
- MATERIAL Level: **1**
- Evaluation external file: none planned for MATERIAL_LEVEL=1 first stage
- Emscripten Version: **NOT RECORDED — compiler unavailable**
- Output JS SHA-256: **NOT RECORDED — not built**
- Output WASM SHA-256: **NOT RECORDED — not built**
- Real Engine動作: **NOT VERIFIED**

## ReflectionLocalEngineの扱い

- Name: **Shogi Reflection Local Engine**
- Purpose: Fallback / Development / Test / manual continuation
- YaneuraOuと同じEngine Nameにしない
- YaneuraOu unavailable時はfallback reasonをmetadata/UIへ明示
- Manual Replay / Manual KeyPosition / Reflection / Exportは継続可能

## Worker / Resource Policy

### SMARTPHONE_SAFE
- Threads: 1
- Hash: 16MB
- Depth: 6
- Nodes: 5,000
- Per-position Time: 220ms
- MultiPV: 1
- Max analyzed plies: 160

### DESKTOP_BALANCED
- Threads: 1
- Hash: 32MB
- Depth: 8
- Nodes: 20,000
- Per-position Time: 650ms
- MultiPV: 2
- Max analyzed plies: 240

これらはPhysical iPhoneで最適化済みの値ではなく、保守的初期値です。

### WASM upstream setting warning
Official V9.00 MakefileのEmscripten pathには大きな初期Memory、64MiB stack、memory growth、4GiB maximum、PTHREAD_POOL_SIZE=32等が含まれます。本ApplicationのSmartphone presetを「そのままupstream build flagsへ適用済み」とは扱っていません。Real build後にiOS/Safari要件を含めてResource Policyを再評価する必要があります。

## Candidate

### Good Candidate
- 最大5件
- 評価改善 / Engine推奨との近さ / mate change等を考慮
- 合理的候補不足時は5件へ水増ししない

### Bad Candidate
- 最大5件
- Best-vs-Actual差を主な判断材料にする
- Engine Best Move
- Best Evaluation
- Actual Evaluation
- Difference
- short PV
- Mateは巨大CPへ変換しない

## Candidate → Replay / Scroll / KeyPosition

- Candidate → Replay: **PASS**
- ply / moveNumber / actualMove / Current Move: **PASS**
- Position Snapshot: **PASS**
- Board Position: **PASS**
- Move List Highlight: **PASS**
- Candidate → Board Scroll: **PASS**
- Sticky Header offset: **PASS**
- Candidate → KeyPosition: **PASS**
- Manual KeyPosition: **retained**
- Candidate自動登録: **なし**
- FACT/INTERPRETATION/HYPOTHESIS自動転記: **なし**

## Replay Scroll Regression

Page Scrollなしを維持:
- 次へ
- 前へ
- 最初へ
- 最後へ
- Keyboard Navigation
- Move List Jump
- Board Flip

Page Scroll例外:
- Engine Candidateの「局面を見る」のみ

`ReplayScrollPolicy.js`自体はBaseline hash一致です。

## Sample KIF

- File: `samples/piyo_20260617_170236.kif`
- Encoding: Shift_JIS
- Parsed moves: 152
- Termination: 投了
- SHA-256: `72a1c92726dee787cd13af0508b559be44a6c0d7c088b4c37894a3eaba5f06c7`
- Existing KIF Import/Preview/Parser経路を利用

## Compatibility

- 7 STEP: retained
- Fixed 9×9 Board: retained
- SVG Piece: retained
- 成桂/成香/成銀/馬/龍: retained
- Board Flip: retained
- Snapshot: retained
- Game Schema: breaking changeなし
- Backup/Restore: existing compatibility retained
- Markdown Export:本人ReflectionとEngine Referenceを分離
- Observation Card: Engineによる自動生成/上書きなし

## Privacy

YaneuraOu/ReflectionLocalいずれもLocal Analysisを前提とするArchitectureです。今回の実装では棋譜を解析目的で外部ServerへUploadする経路を追加していません。

## License / Distribution

### Components audited separately
- YaneuraOu Source
- YaneuraOu WASM Build output
- MATERIAL Evaluation
- Emscripten toolchain
- Future NNUE / 水匠 Weight

### Current candidate package
- YaneuraOu JS/WASM binary: **NOT BUNDLED**
- NNUE/水匠 Weight: **NOT BUNDLED**
- Unknown-license external asset: **NOT BUNDLED**
- Existing Application LICENSE: **unchanged**

### Readiness
- Personal Use Readiness: **READY for current fallback-capable candidate**, with YaneuraOu unavailable
- Public Distribution Readiness: **CURRENT CANDIDATE ONLY — no YaneuraOu binary bundled**
- Commercial Distribution Readiness: **CURRENT CANDIDATE ONLY — no YaneuraOu binary bundled**
- YaneuraOu-bundled Public/Commercial build: **LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**

GPLのWorker/WASM/JS境界を「別Fileだから自動的にaggregate」と断定していません。Corresponding Source/Build Scripts/Notices/combined-work assessmentはactual bundleを対象に再監査します。

## Verification

### Automated Test
- **656 / 656 PASS**

### Browser Test
- Chromium 390×844
- **148 / 148 PASS**
- Good/Bad Candidate / Best Move UI / Candidate Jump / Board Scroll / Replay regressionを含む

### Fallback Worker Browser Gate
- ReflectionLocal actual Blob Worker
- **16 / 16 PASS**
- YaneuraOu WASM: **NOT RUN**

### Visual
- **17 / 17 PASS**
- STEP3 / Good / Bad / Best Move / Board / Candidate Jump / Scroll / Flip / 390px screenshots

### Static
- **96 / 96 PASS** in pre-package round
- Missing Import: **0**
- Baseline deletion: **0**

### Real Engine E2E
- ReflectionLocal fallback E2E: PASS
- **Real YaneuraOu WASM short KIF: NOT RUN**
- **Real YaneuraOu WASM normal KIF: NOT RUN**
- **Real YaneuraOu WASM long KIF: NOT RUN**

### Evaluation Sanity
- Existing normalization/mate/fallback test: PASS
- Real YaneuraOu initial/material/mate sanity: **NOT RUN**

## Smartphone Browser Test

PC Chromium 390×844: **PASS**

Physical iPhone:
- Engine起動: **NOT TESTED**
- 1局解析: **NOT TESTED**
- Cancel: **NOT TESTED**
- 再解析: **NOT TESTED**
- Candidate Scroll: **NOT TESTED**
- 発熱: **NOT MEASURED**
- Battery: **NOT MEASURED**
- Browser crash: **NOT TESTED**

## Performance

ReflectionLocal fallback / Chromium verificationでのみ計測。Real YaneuraOu性能ではありません。
- Latest fallback init sample: `REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt`参照
- Latest short fallback analysis sample: 同上
- Replay 300-ply fixture: `PERFORMANCE_RESULT.txt`参照
- Worker heap: direct measurementなし
- Battery/Thermal:未測定

## Known Limitations

1. Real YaneuraOu WASMが未Build・未実行。
2. Generated Emscripten glueと`YaneuraOuWasmWorkerBootstrap`のactual runtime contractは未検証。
3. Upstream WASM flagsはSmartphone向けに保守的ではない可能性があり、actual build後に調整が必要。
4. MATERIAL_LEVEL=1のCandidate品質はReal Engineで未評価。
5. Physical iPhone resource profile未実施。
6. YaneuraOu bundleのPublic/Commercial License conclusionはactual distribution combinationに対する法務確認が必要。

## Missing Import

- Current static verification: **0**

## ZIP Integrity / 展開後Test

Round 1 Integration Candidate ZIPを別Folderへ展開し、展開物だけでAutomated / Static / Browser / Visual / Fallback Worker Gateを再実行しました。

- ZIP integrity: PASS
- Automated: 656/656 PASS
- Static: 96/96 PASS / Missing Import 0
- Browser: 148/148 PASS
- Fallback Worker Browser Gate: 16/16 PASS
- Visual: 17/17 PASS
- Real YaneuraOu WASM: NOT RUN

詳細は`ZIP_EXTRACTED_VERIFICATION_RESULT.txt`を参照してください。

## 次Version / 次工程候補

正式Ver.1.8へ進む次の一手は、新機能追加ではなく **Emscripten-enabled build environmentでのofficial-source YaneuraOu MATERIAL WASM build + Real E2E** です。その後Physical iPhone resource feedbackを反映し、MATERIAL品質が不足する場合だけNNUE/水匠の個別License監査へ進みます。
