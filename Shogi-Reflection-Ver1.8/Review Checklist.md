# Ver.1.8 Review Checklist

## Source of Truth
- [x] Ver.1.7正式ZIPをBaselineにした
- [x] Ver.1.7元File数309を記録した
- [x] SHA-256 manifestを作成した
- [x] LICENSE変更有無をhash確認した
- [x] 削除Fileを監査する仕組みを用意した

## STEP UI
- [x] 7 STEPを維持
- [x] Engine PanelはReplay Boardより前
- [x] Board FlipはReplay Navigation内
- [x] 390px前後でNavigation Wrap
- [x] 横scrollなしをBrowser確認
- [x] Fixed 9×9 Grid維持
- [x] SVG Piece/Snapshot維持

## Real Engine
- [x] Real Local Engine initialize
- [x] position input
- [x] evaluation receive
- [x] bestmove
- [x] MultiPV
- [x] stop
- [x] worker terminate/restart
- [x] timeout/error境界
- [x] KIF→Position History→Evaluation→Normalization→Candidate
- [x] short/normal/long Real E2E

## Candidate
- [x] 3〜5件上限Rule維持
- [x] 3件未満を無理に水増ししない
- [x] Good Move Candidate維持
- [x] Candidate→existing Replay
- [x] Candidate→existing KeyPosition
- [x] Manual KeyPosition維持
- [x] Engine Candidate自動登録なし

## Resource / Failure
- [x] Threads設定
- [x] Hash/Memory設定metadata
- [x] Nodes/Time budget
- [x] maxPlies
- [x] Cancel
- [x] Timeout
- [x] Worker stop/terminate
- [x] crash/missing worker graceful failure
- [x] Browser background cancel
- [x] Reload時in-progress result非保存
- [ ] Physical iPhone Low Memory実測（未実施）
- [ ] Battery実測（未実施）
- [ ] Thermal実測（未実施）

## License Gate
- [x] YaneuraOu official repository確認
- [x] YaneuraOu LICENSE確認
- [x] public release/commit確認
- [x] official WASM Makefile path確認
- [x] Evaluation/WeightをEngineと分離監査
- [x] unknown-license third-party assetを同梱しない
- [x] Existing Application LICENSEを変更しない
- [x] THIRD_PARTY_NOTICES作成
- [x] Source Distribution Plan作成
- [x] Personal/Public/Commercial readinessを分離

## Verification
- [x] Automated tests
- [x] Broad Browser regression（Mock明示）
- [x] Real Engine Browser E2E（actual Worker）
- [x] Visual screenshot
- [x] Static/Missing import
- [x] Replay response measurement
- [x] Real Engine init/game/cancel measurement
- [ ] Physical iPhone Browser（未実施）
