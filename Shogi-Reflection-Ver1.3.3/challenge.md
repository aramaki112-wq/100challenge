# 将棋振り返りアプリ Ver.1.3.3 Challenge

## Theme

一時的なKIF入力状態と保存済みDomain Dataを分離したまま、スマートフォンで「間違えたKIFを安全にやり直す」UXを作る。

## Challenge Question

利用者には簡単な「入力をクリア」「棋譜入力へ戻る」を提供しながら、Clipboard、Repository、LocalStorage、保存済みGameReviewを一切巻き込まず、Ver.1.3.2で解決済みのReplay Scroll UXも壊さないためにはどう設計するか。

## Constraints

- Ver.1.3.2をSource of Truthとする。
- GameReview Domain、KeyPosition Rule、Replay Domainを再構成しない。
- `入力をクリア`を保存済みDataのDeleteへ接続しない。
- Clipboard内容を消去・上書きしない。
- `棋譜入力へ戻る`では貼り付けたKIF本文を保持する。
- Previewをやり直した時に古いPreviewを残さない。
- ClearだけでKIF Parser／Position Historyを再構築しない。
- UI日本語化を内部Class／Function／Error CodeのRename理由にしない。
- 「戻る」だけの曖昧なButton名を使わない。
- Replay Scroll Policyを変更しない。
- KIF File Import、Drag & Drop、Clipboard、Replay、KeyPosition、保存、Backup／Restore、Markdown Export、Observation Cardを回帰確認する。

## Completion Evidence

- Ver.1.3.2 baseline再実行: Automated 495/495、Static 47/47。
- Ver.1.3.3 Automated Test: 505/505 PASS。
- Browser Verification: 181/181 PASS。
- 390×844 ChromiumでClear／Retry／Replay連続Navigation／Touch Targetを確認。
- Clear前後で保存済み対局数、LocalStorage Snapshot、Clipboard内容が不変であることをBrowser Automationで確認。
- Missing Import: 0。
- ZIPを別Folderへ展開し、展開物のみで再Testする。
