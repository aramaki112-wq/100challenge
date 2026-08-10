# Ver.1.8 Review Checklist

## Source of Truth
- [x] ユーザー提供Ver.1.8 Baseline ZIPをSource of Truthにした
- [x] Baseline 331 filesを記録した
- [x] SHA-256 manifestを作成した
- [x] Existing LICENSEを変更していない
- [x] 削除File/変更File/追加Fileを最終Auditで機械比較する

## YaneuraOu
- [x] Official Repository確認
- [x] Official README / GPLv3確認
- [x] V9.00 Release確認
- [x] Exact commit固定
- [x] Official MakefileのMATERIAL確認
- [x] MATERIAL_LEVEL=1確認
- [x] TARGET_CPU=WASM確認
- [x] COMPILER=em++確認
- [x] Build Script作成
- [ ] Current environmentでEmscriptenを用いたofficial-source WASM Build
- [ ] Output JS/WASM SHA-256記録
- [ ] Real YaneuraOu Browser initialize
- [ ] Real YaneuraOu USI handshake
- [ ] Real YaneuraOu short/normal/long E2E

## USI
- [x] usi / usiok
- [x] setoption
- [x] isready / readyok
- [x] usinewgame
- [x] position
- [x] go
- [x] info cp / mate
- [x] pv / multipv / nodes / depth / time
- [x] bestmove
- [x] stop / quit
- [x] timeout / worker crash
- [x] token順序への過度依存を抑制

## Candidate
- [x] Good最大5
- [x] Bad最大5
- [x] 合計最大10
- [x] 5件未満を水増ししない
- [x] Duplicate suppression
- [x] Mate Candidate
- [x] Bad CandidateにBest Move
- [x] Best Evaluation / Actual Evaluation / Difference
- [x] Short PV
- [x] MultiPV拡張可能性維持
- [x] 「唯一の正解」と表示しない

## Candidate → Replay / KeyPosition
- [x] existing Replay jumpを使用
- [x] ply / current move / snapshot / board / highlight一致
- [x] Candidate JumpだけBoard Page Scroll
- [x] Sticky Header offset
- [x] 通常Replay NavigationはPage Scrollなし
- [x] existing KeyPosition Serviceを使用
- [x] Manual KeyPosition維持
- [x] Candidate自動登録なし
- [x] STEP4本人編集欄を自動入力しない

## Resource / Failure
- [x] SMARTPHONE_SAFE
- [x] Threads / Hash / Nodes / Depth / Time / maxPlies / MultiPV
- [x] Cancel / Timeout / terminate / restart
- [x] Graceful Degradation
- [x] Background safety
- [ ] Physical iPhone Low Memory実測
- [ ] Battery実測
- [ ] Thermal実測

## Compatibility
- [x] 7 STEP維持
- [x] Fixed 9×9 Grid維持
- [x] SVG Piece維持
- [x] Board Flip維持
- [x] Snapshot維持
- [x] Backup/Restore schema破壊なし
- [x] Markdown/Observation Card責務維持

## License Gate
- [x] YaneuraOu Source / WASM / Evaluation / Emscriptenを分離監査
- [x] NNUE/水匠Weightを未確認のまま同梱しない
- [x] GPLをWorker boundaryだけで単純判定しない
- [x] Corresponding Source plan
- [x] Personal/Public/Commercialを別判定
- [x] Existing Application LICENSE unchanged
- [x] `LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION`をYaneuraOu bundleへ明記

## Verification
- [x] Automated Test
- [x] 390×844 Browser Regression
- [x] Visual Verification
- [x] Static / Missing Import
- [x] ReflectionLocal fallback Worker gate
- [ ] Real YaneuraOu WASM E2E
- [ ] Physical iPhone Browser

## Formal Completion
- [ ] **Ver.1.8正式完成** — Real YaneuraOu WASM E2Eが未達のため現時点ではチェックしない
## Ver.1.8.2 Finalization Record

### Ver.1.8.2追加Checklist

- [x] all-ply Evaluation Graph
- [x] CP/Mate/Unknown分離
- [x] Good/Bad/KeyPosition/Mate marker
- [x] Graph→Replay
- [x] Graph→STEP4 exact card
- [x] Candidate→KeyPosition scroll anchoring抑止
- [x] official message bridge bootstrap
- [x] cross-origin isolation/SAB runtime gate
- [x] Real artifact/formal hard gate
- [ ] Real WASM build/E2E

## Ver.1.8.3 Build Bridge追加Checklist

### Reproducible Build
- [x] official YaneuraOu V9.00 exact commit固定
- [x] MATERIAL_LEVEL=1 / TARGET_CPU=WASM / COMPILER=em++固定
- [x] Emscripten 4.0.15 official release mapping照合
- [x] dirty upstream source拒否
- [x] actual Worker filename discovery
- [x] JS/WASM/Worker SHA-256自動化
- [x] Runner/Image/Compiler/Node/Python provenance設計
- [ ] Real CI Build実行成功

### Real Evidence
- [x] Real USI verifierをMock E2Eから分離
- [x] Real Application E2E verifierを分離
- [x] 両Evidenceとcurrent WASM SHA-256一致をFormal Gateで要求
- [ ] Real USI PASS
- [ ] Real Evaluation Sanity PASS
- [ ] Real Sample KIF full-ply PASS
- [ ] Real Good/Bad Candidate PASS
- [ ] Real Graph/Replay/STEP4 PASS
- [ ] Real Cancel/Re-analysis PASS

### Hosting / Device
- [x] Local verifierはCOOP/COEPを明示
- [x] GitHub Pages pthread成立を未証明として分離
- [x] upstream resource valuesをSmartphone最適と表現しない
- [ ] production hosting response header実測
- [ ] physical iPhone実測
- [ ] Battery/Thermal実測

### Distribution / Formal
- [x] exact-commit source archive生成設計
- [x] Existing Application LICENSE unchanged
- [x] Personal/Public/Commercial Readiness分離
- [x] `LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION`
- [ ] Real binary-specific notice audit
- [ ] Formal candidate ZIP作成
- [ ] ZIP展開後Real再検証
