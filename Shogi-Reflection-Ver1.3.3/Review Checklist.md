# Review Checklist.md — Ver.1.3.3

## Source of Truth

- [ ] Ver.1.3.2 ZIPを展開してから変更した
- [ ] 元219 Fileを監査した
- [ ] Baseline Automated 495/495を再現した
- [ ] Baseline Static 47/47を確認した
- [ ] Design Rules最終番号DJを確認した

## KIF Clear

- [ ] `入力をクリア`でKIF Textareaが空になる
- [ ] Previewが閉じる
- [ ] Clipboardを書き換えない
- [ ] Repositoryへsave/deleteしない
- [ ] LocalStorageをremove/clearしない
- [ ] 保存済みGameReview数が変わらない
- [ ] ClearだけでParserを再実行しない

## Import Retry

- [ ] Preview後に`棋譜入力へ戻る`を選べる
- [ ] KIF本文が保持される
- [ ] 別KIFへ貼り替えられる
- [ ] 再Previewできる
- [ ] 古いPreview内容が残らない
- [ ] 保存済みGameReviewへ影響しない

## Japanese UI

- [ ] Header／Navigation／KIF／Preview／Replay主要文言が日本語中心
- [ ] Current Move／Previous Move／Turn／Hands／Flip／Jumpが理解できる日本語
- [ ] KeyPosition／Snapshotの表示が重要局面／局面記録
- [ ] Backup／Restore／Save／Delete／Editが日本語
- [ ] aria-labelを確認した
- [ ] Placeholder／Help／Empty State／Validationを確認した
- [ ] KIF・Markdown・Obsidian等、必要な技術名だけを残した
- [ ] 内部Domain名を不要にRenameしていない

## Accessibility / Smartphone

- [ ] Focus表示を維持
- [ ] Warning=`role=status`、Error=`role=alert`
- [ ] KIF操作Button 48px以上
- [ ] 390px前後でKIF操作が縦に詰まりすぎない
- [ ] Textarea入力中にReplay Shortcutが競合しない
- [ ] Current Move読み上げを維持

## Replay Regression

- [ ] ReplayScrollPolicyを維持
- [ ] 次へ／前へでPage全体が飛ばない
- [ ] 最初へ／最後へでPage全体が飛ばない
- [ ] KeyboardでPage全体が飛ばない
- [ ] Current Move Highlightを維持
- [ ] Move List内部追従を維持
- [ ] 盤面反転を維持
- [ ] 重要局面追加を維持

## Persistence / Export

- [ ] 保存／再読込
- [ ] Backup／Restore
- [ ] Markdown Export
- [ ] Observation Card
- [ ] Snapshot互換
- [ ] 保存済みGameReview Replay

## Final Gate

- [ ] Automated Test全成功
- [ ] Browser Verification全成功
- [ ] Static Verification全成功
- [ ] Missing Import 0
- [ ] ZIP Integrity成功
- [ ] ZIPを別Folderへ展開
- [ ] 展開物だけで全Test再成功
