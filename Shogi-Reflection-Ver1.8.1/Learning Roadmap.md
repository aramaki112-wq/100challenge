# Ver.1.8 Learning Roadmap

## 今回学ぶこと

1. **Source of Truth Audit** — Version名ではなく受領Artifactそのものをhash固定する。
2. **Interface First** — Engine交換をDomain変更にしない。
3. **Protocol Adapter** — USI文字列をApplication Serviceへ漏らさない。
4. **Best-vs-Actual Evaluation** — before/afterだけでなくEngine Bestとの差を比較する。
5. **Perspective Normalization** — 評価値は「誰視点か」を統一してから使う。
6. **Mate Semantics** — Mateを巨大CPへ潰さない。
7. **Candidate Curation** — Good/Bad分離、最大数、重複抑制、水増し禁止。
8. **Human-in-the-loop** — Candidateと本人のKeyPositionを分離する。
9. **Intentional Scroll Exception** — 通常Navigation policyを守りつつ明示操作だけ例外化する。
10. **Worker / Cancel** — UI Threadと探索を分離し中止を端から端まで通す。
11. **Resource Budget** — Smartphoneでは最大棋力より継続利用可能性を優先する。
12. **License Architecture** — Engine/Weight/WASM/Toolchainを別Componentとして監査する。
13. **Reproducible Build** — Source/Commit/Compiler/Command/Hashまで記録する。
14. **Evidence Discipline** — Fallback Engineの成功をReal YaneuraOu成功と書かない。

## 正式Ver.1.8へ残るGate

1. Emscripten exact versionを用意する。
2. YaneuraOu V9.00 exact commitをofficial sourceからcheckoutする。
3. MATERIAL_LEVEL=1 / WASMをbuildする。
4. JS/WASM/worker hashesをmanifestへ記録する。
5. actual generated glueと`YaneuraOuWasmWorkerBootstrap` contractを合わせる。
6. Real USI handshakeをBrowserで通す。
7. Initial/material advantage/material disadvantage/mate sanityをReal Engineで確認する。
8. short/normal/long KIF E2EをReal Engineで通す。
9. Candidate Good/Bad/Best/PV/Scroll/KeyPositionをReal Engineで通す。
10. License/Corresponding Source Gateを再監査する。
11. Formal ZIPを作り、別Folder展開物のみで再検証する。

## その後の候補

### Physical iPhone Resource Profiling
- initialize time
- 1局面/通常棋譜/長い棋譜
- memory pressure / crash
- battery / thermal
- background/foreground recovery

### Candidate Quality Study
- MATERIAL版と強いDesktop USIの候補重複率
- false positive / missed critical position
- Good Candidateの学習価値

### Audited NNUE / 水匠
MATERIAL Integration成功後に、Engine LicenseとWeight Licenseを別監査して採否を決める。不明Weightは同梱しない。
