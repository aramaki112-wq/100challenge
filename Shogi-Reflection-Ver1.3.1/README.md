# 将棋振り返りアプリ Ver.1.3.1 — スマホKIF Clipboard貼り付け対応

一局の最善手を自動判定するのではなく、棋譜を再現しながら、自分が重要だと思った局面を選び、FACT・INTERPRETATION・HYPOTHESIS・感情・判断Pattern・学びを自分の言葉で記録するBrowser Applicationです。

Ver.1.3.1はVer.1.3をSource of Truthとする小規模Hotfixです。Ver.1.3の重要局面Snapshot設計を変えず、スマホでKIF Fileを扱いにくい場合でも、KIF本文をTextareaへ長押しPasteするか、利用可能なBrowserではClipboard Buttonから直接読み込めるようにしました。どちらも既存のFile Reader → KIF Parser → Import Preview → Form反映経路を再利用します。

## 学習Loop

```text
対局する
↓
KIF FileをImportする／KIF本文を貼り付ける
↓
棋譜再現盤で局面を前後へ移動する
↓
重要だと思う局面で「この局面を重要局面へ追加」を押す
↓
手数・指し手・局面Snapshotを確認する
↓
FACT・INTERPRETATION・HYPOTHESISを自分で書く
↓
感情・判断Pattern・学びを記録する
↓
GameReviewを明示的に保存する
↓
振り返り.md／次局用Observation Card.mdを作成する
↓
次局でObservation Themeと実行Ruleを試す
```

## Source of Truth

- Hotfix入力ZIP：`Shogi-Reflection-Ver1.3.zip`
- Ver.1.3 Source of Truth File：199件
- Ver.1.3 Automated Test：458件成功／0件失敗
- Ver.1.3.1追加Automated Test：13件
- Ver.1.3.1全Automated Test：471件成功／0件失敗
- 実Chromium確認：133件成功／0件失敗
- Missing Import：0件
- Ver.1.3 File削除：0件

Ver.1.2からVer.1.3への正式監査は`SOURCE_OF_TRUTH_AUDIT.md`、Ver.1.3からVer.1.3.1へのHotfix監査は`SOURCE_OF_TRUTH_AUDIT_V1_3_1.md`を参照してください。

## Ver.1.3.1で追加した入力経路

- スマホ向けKIF Textarea
- 長押し → 「ペースト」 → Preview
- `クリップボードから読み込む` Button
- Clipboard APIが使えない／拒否された場合の手動Paste案内
- Pasteでも既存Import Previewを必ず通す
- Paste・Preview・Form反映だけでは保存しない
- 2MiB上限・KIF Parser・ぴよ将棋互換判定をFile Importと共通化

## Ver.1.3から維持する中心機能

- 「この局面を重要局面へ追加」Button
- 0手目の追加拒否
- 現在手数・現在指し手の自動入力
- 元KIF指し手の構造化保持
- 現在局面・直前局面のSnapshot
- 盤面、先手持ち駒、後手持ち駒、手番、最終移動元・移動先の保持
- 盤面反転に依存しない内部座標
- Replay Warningの引継ぎ
- 同一手数の重複拒否と既存項目へのFocus
- 重要局面5件上限の事前無効化
- Form内の小型盤面Preview
- 保存済みReviewのReplayから候補追加
- KIF Import直後の未保存Formから候補追加
- SnapshotなしVer.1.2 Dataの読込
- Snapshot付きBackup／Atomic Restore

## 自動入力するもの／しないもの

自動入力するのはReplay結果から客観的に取得できる情報だけです。

### 自動入力する

- 手数、現在の指し手、元KIF指し手
- 現在局面、直前局面
- Board State、Hand State、Side to Move
- 最終移動元、最終移動先
- Replay Warning、終局情報、Snapshot識別情報

### 自動入力しない

- FACT、INTERPRETATION、HYPOTHESIS
- 自分が考えていたこと、相手の狙い
- 感情、感情の影響、判断Pattern、学び
- 最善手、悪手、評価値、重要度
- Observation Theme、実行Rule

Snapshotと本人の振り返り本文は別の責務として保存されます。

## 起動方法

ES Moduleを使用するため、`index.html`を直接開かずLocal HTTP Serverを使用してください。

```bash
cd Shogi-Reflection-Ver1.3.1
python -m http.server 8000
```

Browserで次を開きます。

```text
http://localhost:8000
```

## 基本操作

1. PCではKIFをFile選択／Drag & Dropする。スマホではKIF本文を貼り付け欄へ長押しPasteするか、利用可能なら`クリップボードから読み込む`を押す。
2. `貼り付けたKIFをPreview`またはClipboard ButtonでImport Previewを開き、内容を確認してFormへ反映する。
3. 棋譜再現盤を目的の手数へ移動する。
4. `この局面を重要局面へ追加`を押す。
5. Formへ移動した重要局面のSnapshotを必要に応じて開く。
6. FACT・INTERPRETATION・HYPOTHESISなどを本人が入力する。
7. 重要局面を3〜5件に整える。
8. Observation Themeを1件、実行Ruleを1〜3件入力する。
9. `振り返りを保存する`を押す。

追加しただけでは保存されません。詳しくは`Ver.1.3.1操作手順書.md`を参照してください。

## Domain Rule

次局へ接続できる条件はVer.1.2から変更していません。

- 重要局面：3〜5件
- Observation Theme：1件
- 実行Rule：1〜3件

0〜2件のReviewも途中保存できますが、Observation Cardは作成できません。6件以上はDomain Validationで拒否します。

## Replay Snapshotの構造

```text
KeyPosition
└─ replayReference（任意）
   ├─ sourceGameId
   ├─ sourceKifFingerprint
   ├─ moveNumber
   ├─ sourceKifMove
   ├─ snapshotVersion
   ├─ replayWarning
   └─ snapshot
      ├─ currentPosition
      └─ previousPosition
```

旧KeyPositionは`replayReference = null`として有効です。詳細は`SNAPSHOT_FORMAT.md`と`SNAPSHOT_COMPATIBILITY_MATRIX.md`を参照してください。

## Test

```bash
npm test
npm run check
python3 browser_verify.py
```

- `npm test`：458件
- `npm run check`：Syntax、Missing Import、Source of Truth Hash、必須File、Design Rule、Architecture境界を確認
- `browser_verify.py`：実Chromiumで116項目を確認

## 主な資料

- `Explanation.md`
- `Thought Process.md`
- `Design Novel.md`
- `Design Handbook.md`
- `Design Rules.md`
- `Review Checklist.md`
- `Learning Roadmap.md`
- `Ver.1.3操作手順書.md`
- `KEY_POSITION_REPLAY_CONNECTION.md`
- `SNAPSHOT_FORMAT.md`
- `SNAPSHOT_COMPATIBILITY_MATRIX.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `COMPLETION_REPORT.md`

## 今回実装しないもの

AIによる重要局面抽出、最善手・悪手判定、評価値、エンジン解析、FACT等の自動文章生成、感情分析、判断Pattern自動分類、局面Difference自動生成、局面共有URL、SFEN／CSA Exportは含みません。
