# 将棋振り返りアプリ Ver.1.3.2 操作手順書

## 1. Replayを開始する

従来どおり次のいずれかを使用する。

1. KIF File選択
2. Drag & Drop
3. SmartphoneのKIF Text貼り付け
4. Clipboardから読み込む
5. 保存済みGameReviewを開く

KIF Import / PasteはPreviewだけでは保存されない。Formへ反映した後も、保存Buttonを押すまでRepositoryへ保存されない。

## 2. 盤面を見ながら進める

Replay開始後、盤面直下のNavigationを使用する。

- 最初へ
- 前へ
- 次へ
- 最後へ

Ver.1.3.2では、これらを押してもBrowser Page全体は棋譜一覧へ移動しない。現在手は棋譜一覧でHighlightされ、必要な場合だけ棋譜一覧内部が追従する。

## 3. Keyboard

入力欄へFocusしていない場合だけ次を使用できる。

- `←`: 前へ
- `→`: 次へ
- `Home`: 最初へ
- `End`: 最後へ

Textarea、Input、Select、ContentEditable中はReplay Shortcutを発火しない。

## 4. 任意手数へJump

Rangeまたは任意手数Inputから移動できる。Jumpしても通常はPage位置を維持する。

## 5. 棋譜一覧から選ぶ

棋譜一覧を自分でタップした場合は例外として、選択した局面へJumpした後に盤面へ自然に戻る。これは利用者が「一覧から選んだ後、盤面を確認する」ための意図的Page Scrollである。

## 6. 盤面反転

盤面反転後もNavigationとScroll Policyは変わらない。内部Square座標やSnapshotへ反転状態は保存されない。

## 7. 重要局面へ追加

盤面を進め、重要だと思った局面で「この局面を重要局面へ追加」を押す。

成功時はReplay位置を維持するので、そのまま「次へ」を続けられる。手数・現在指し手・Snapshotだけが候補へ入り、FACT・INTERPRETATION・HYPOTHESIS等は自動入力しない。

## 8. 保存

Replay操作だけではGameReviewを変更・保存しない。重要局面候補を含むForm内容を確認し、最後に保存Buttonを押す。
