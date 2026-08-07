# 将棋振り返りアプリ Ver.1.3 Challenge

## Theme

棋譜再現盤の現在局面を、既存の重要局面Domainへ安全に接続する。

## Challenge Question

Replayの客観Dataを利用しながら、FACT・INTERPRETATION・HYPOTHESISという本人の観察を自動生成せず、旧Data互換と保存境界を守るにはどう設計するか。

## Constraints

- Ver.1.2をSource of Truthとする
- GameReviewとKeyPositionの既存Ruleを弱めない
- Position Historyを再利用する
- Button Clickでは保存しない
- 0手目を暗黙補正しない
- 同一手数を暗黙重複しない
- 最大5件を越えない
- 盤面反転を内部座標へ保存しない
- SnapshotなしVer.1.2 Dataを読める
- KIF Import、Replay、Markdown、Observation Cardを壊さない

## Deliverable

- Snapshot Model／Reference／Factory／Serializer
- Add Current Position Application Service
- Browser Controller／View Model／Form接続
- Compatibility処理
- Automated Test／Browser Verification
- 教材・監査・操作資料
- VS Codeで開ける完全版ZIP

## Completion Evidence

- Automated Test：458件成功／0件失敗
- Ver.1.2継承：333件
- Ver.1.3追加：125件
- Chromium：116件成功／0件失敗
- Missing Import：0件
- ZIP展開後に同じ結果を再現
