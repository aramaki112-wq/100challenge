# COMPLETION_REPORT — Shogi Reflection Ver.1.8

作成日: 2026-08-09

## 今回何を実装したか
Ver.1.7をSource of Truthとして、STEP3 UIを「Engine解析 → 候補 → Replay確認」の順序へ改善し、first-party Real Local EngineをWeb Workerで統合した。既存Position Historyを再利用して評価値・本人視点Normalization・Candidate Rankingを実行し、Candidateから既存Replay/KeyPositionへ接続した。License Gateを設計・運用資料として整え、権利不明第三者Assetを正式ZIPへ入れない構成とした。

## Engine
- 採用Engine: **Shogi Reflection Local Engine**
- Engine Version: **1.0.0**
- Engine Source: `ReflectionLocalEngineWorker.js`
- Engine Source SHA-256: `86e9e5975347f3d511d9143304b74f8d332610c2fcb856e4407c640861219dc8`
- Engine Adapter SHA-256: `378274d8a6cee9aedc331fbf7e1b7dcaa6503aa3bd0bad76fdada8c29f2d22fc`
- Engine License: existing project **MIT**
- WASM方式: **正式BaselineではWASMを同梱しない**。Actual Browser Web Worker JavaScript Engine。YaneuraOu WASMは将来Connector候補として調査・資料化。
- Evaluation Model: `Material + mobility + king-safety heuristic`
- Evaluation Version: **1.0.0**
- Evaluation License: first-party source / project MIT。External Weightなし。
- Real Engine動作: **YES**
- Mock依存有無: **Runtime NO**。Broad UI regressionでは明示Mockを使用し、Real Engine E2E/Browser verificationを別実施。
- Worker: **YES**

## Analysis Settings / Resource Policy
- Threads: 1
- Hash setting: STANDARD 16MB（Local baselineはTT未実装のためcompatibility/resource metadata）
- Depth: 2
- Per-position Nodes/Time: presetで制限
- Max analyzed plies: FAST 160 / STANDARD 200 / DETAILED 240
- Timeout: Adapter timeoutあり
- Cancel: `stop` + Worker disposeまで接続
- Engine crash / missing Worker: Graceful Degradation
- Background移行: active analysisをcancel

これらはPhysical iPhoneで測定した「最適値」ではなく、安全側の初期値。

## Candidate品質
- Candidate types: Major Dropoff / Review / Good Move
- Primary upper limit: 5
- 合理的候補が3件未満なら水増ししない
- Engine CandidateをKeyPositionへ自動登録しない
- Candidate → Replay: **PASS**
- Candidate → KeyPosition: **PASS**
- Manual KeyPosition: **PASS / retained**
- **品質評価: LIMITED / BASELINE**。強豪Engine級の深い戦略評価・読みを保証しない。

## Evaluation Sanity
- Initial position: finite CP **PASS**
- Obvious material advantage/disadvantage: side-to-move perspective sign **PASS**
- Mate fixture: CPへ潰さず`mate -1` **PASS**
- Existing Evaluation Normalization/Mate Handling regression: **PASS**

## STEP3 UI / Replay
- 7 STEP: **retained**
- Engine Panel: Replay Boardより前
- Board Flip位置: Replay Navigation内
- 390×844: horizontal overflow 0をBrowser実測
- Replay Scroll: **PASS / page scrollなし**
- Fixed 9×9 Grid / SVG Piece / promoted pieces / Snapshot: **retained and verified**

## Smartphone / Performance
- Smartphone Browser emulation: Chromium 390×844 **tested**
- Physical iPhone: **NOT TESTED**
- Engine initialization: **7.70 ms**（formal ZIP extraction後のheadless Chromium run）
- Short 5-ply game analysis + candidate generation: **833.70 ms**（同run）
- Cancel UI-to-CANCELLED response: **70.20 ms**（同run）
- Replay Next x100 average: `PERFORMANCE_RESULT.txt`参照
- Memory: main-page `performance.memory`観測のみ。Worker heap **NOT DIRECTLY MEASURED**
- Battery: **NOT MEASURED**
- 発熱: **NOT MEASURED**

測定値は環境依存であり、実iPhone性能の保証ではない。

## Privacy / Security
- 標準EngineはLocal Worker。
- Engine実装にNetwork fetch/uploadなし。棋譜を外部Serverへ送信しない。
- Existing LocalStorage / Backup policyを維持。
- 巨大な探索TreeをLocalStorageへ保存しない。

## License / Distribution Readiness
- Engine License監査: **PASS for bundled first-party engine**
- Evaluation License監査: **PASS for bundled first-party heuristic / no external weight**
- WASM/Build Toolchain: YaneuraOu/Emscriptenの一次資料を調査・再現Build計画を文書化、**not bundled**
- License不明Asset同梱: **0**
- Existing application LICENSE: **unchanged / SHA-256 `f80358715ec38c12618abead454a81ecd7dc1a8cf4e64e1f498d749a5697988c`**
- Personal Use Readiness: **READY**
- Public Distribution Readiness: **READY for this exact first-party-only ZIP from component-license gate perspective**
- Commercial Distribution Readiness: **READY for this exact first-party-only ZIP from component-license gate perspective**
- Future YaneuraOu/WASM/third-party Weight bundle: **LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION** until exact distribution combination passes the gate.

上記は全法域での「100%合法」や紛争不存在を保証する法律意見ではない。

## Verification — formal ZIP extraction round
- Automated Test件数: **639 / 639 PASS**
- Browser Test件数: **141 / 141 PASS**（broad regression / explicit Mock）
- Real Engine Browser Test件数: **14 / 14 PASS**（actual Blob Web Worker）
- Static Test件数: **87 / 87 PASS**
- Visual Verification件数: **9 / 9 PASS**
- Real Engine E2E: **3 fixture groups**（short / normal / long with safety cap）
- Evaluation Sanity: **3 / 3 PASS**
- Missing Import: **0**
- Real Engine initialize/evaluation/bestmove/stop: **PASS**
- Candidate Replay/KeyPosition: **PASS**
- Backup/Restore/Markdown/Observation Card/Help: broad regression **PASS**

## Known Limitation
1. Local Engineは高棋力Engineではない。目的は日常振り返り候補の軽量Baseline。
2. Physical iPhoneのBattery/Thermal/Worker memoryは未測定。
3. YaneuraOu WASMを公式Sourceから再現Buildして正式Bundleする作業は今回実施していない。
4. External NNUE/WeightはLicense Gate未通過のため同梱していない。
5. 長い棋譜はSmartphone安全上限でtruncatedになる場合があり、その旨をUI/metadataで区別する。

## ZIP
- Release Candidate ZIP Integrity: **PASS** (`zipfile.testzip() = None`)
- Release Candidate extraction full verification: **PASS**
- Formal ZIP Round 1 Integrity: **PASS** (`zipfile.testzip() = None`, 331 entries)
- Formal ZIP Round 1 extraction full verification: **PASS** (639/639 automated, 141/141 browser, 14/14 real-engine browser, 9/9 visual, 87/87 static, Missing Import 0)
- Final delivery ZIP: this verified extraction is repacked without changing application source; delivery-time post-package extraction is performed once more and reported with the artifact.
- Engine Asset Hash: worker SHA-256 above
- License File: present / unchanged
- Third Party Notice: present

## 次Version候補
- Audited YaneuraOu WASM prototype（Source/Compiler/Weight/Corresponding Sourceまで固定）
- Physical iPhone resource profiling
- Local Baseline vs strong Desktop USI Candidate quality comparison
- Desktop native USI Connector
