# KIF Support Matrix — Ver.1.1

## 1. 対応File

| 項目 | Ver.1.1の扱い |
|---|---|
| `.kif` | 対応。Shift_JISを先に判定する |
| `.kifu` | 対応。UTF-8を先に判定する |
| UTF-8 BOM | 対応 |
| Shift_JIS | 対応 |
| UTF-8 | 対応 |
| 最大Size | 2MiB |
| その他拡張子 | Import拒否 |
| 判定不能Encoding | Import拒否 |

拡張子の標準Encodingと実内容が異なる場合は、内容を優先してWarningを表示します。

## 2. 対応Header

| KIF Header | DTO Property | Formへの扱い |
|---|---|---|
| 対局日 | `playedAt` | 対局日時候補 |
| 開始日時 | `startedAt` | 対局日時候補、Memo Metadata |
| 終了日時 | `endedAt` | Memo Metadata |
| 先手／下手 | `senteName` | 自分が後手の場合の対局相手 |
| 後手／上手 | `goteName` | 自分が先手の場合の対局相手 |
| 棋戦 | `eventName` | Preview、Memo Metadata |
| 場所 | `place` | Preview、Memo Metadata |
| 表題 | `title` | Memo Metadata |
| 戦型 | `openingName` | Memo Metadata |
| 手合割 | `handicap` | Preview、Memo Metadata |
| 持ち時間 | `timeControl` | Formの持ち時間・対局形式 |
| 消費時間 | `consumedTime` | Memo Metadata |
| 結果 | `resultText`の補助 | 棋譜内容との矛盾確認 |

未知Headerは`HEADER_UNMAPPED` Warningを表示し、`unmappedHeaders`と元KIF Textへ保持します。

## 3. 日時表記

対応例：

```text
2026年08月02日(日) 10:15:30
2026/08/02 10:15
2026-08-02
```

日時の値が存在しても変換できない場合は`VALUE_INVALID` Warningを表示し、元値はKIF Textへ残します。推測補完しません。

## 4. 指し手表記

### 対応

- 通常の筋・段・駒名
- `同`表記
- 成／不成
- 打
- 右／左／直／寄／引／上／行／入
- 移動元座標 `(77)`など
- 全角／半角手数
- 指し手時間 `( 0:01/00:00:01)`
- 指し手一覧Headerあり／省略

指し手一覧Header省略はKIF仕様上許容し、`MOVE_HEADER_OMITTED` Warningを返します。

### Ver.1.1で行わないこと

- 合法手判定
- 盤面State更新
- 駒の移動可能性確認
- 王手・詰み判定
- 変化手順の再現

文字表記として妥当かを確認するだけです。

## 5. 終局表記

### 対応

- 投了
- 詰み
- 切れ負け
- 時間切れ
- 反則負け
- 反則勝ち
- 千日手
- 持将棋
- 中断
- 入玉勝ち
- 不戦勝
- 不戦敗

### Footer

対応例：

```text
まで7手で先手の勝ち
まで120手で後手の勝ち
まで80手で千日手
まで100手で持将棋
まで50手で中断
```

終局表記、Header結果、Footer勝者、Footer総手数に矛盾がある場合はImportを拒否します。

## 6. 手合割

| 手合割 | 扱い |
|---|---|
| 平手 | 正式対応 |
| 平手以外 | `UNSUPPORTED_HANDICAP` Warning付きで基本情報と元KIF TextをImport |

Ver.1.1は盤面再現を行わないため原文保持を許可しますが、Ver.1.2の盤面処理対応を保証しません。

## 7. ぴよ将棋

### 確認済み

- 公式公開KIF Sample
- ぴよ将棋Markerを含むUTF-8 Fixture
- Shift_JIS Fixture
- 解析／評価Commentを含むKIF
- 投了終了

`PiyoShogiCompatibility`はGeneric Parserの外側で、Source Markerや評価Commentを確認します。ぴよ将棋専用分岐をParser全体へ埋め込んでいません。

### 注意

ぴよ将棋のVersionや出力設定によりHeader・Commentが増減する可能性があります。未知HeaderはWarning付きで原文保持します。

## 8. Warning一覧

| Code | 意味 |
|---|---|
| `HEADER_MISSING` | 先手名・後手名などが存在しない |
| `HEADER_UNMAPPED` | 未対応Headerがある |
| `VALUE_INVALID` | 値はあるがApplication形式へ変換できない |
| `UNSUPPORTED_HANDICAP` | 平手以外 |
| `TERMINATION_NOT_FOUND` | 終局理由を取得できない |
| `RESULT_UNKNOWN` | 勝敗を確定できない |
| `PLAYER_SIDE_REQUIRED` | 自分の手番を決定できない |
| `ENCODING_EXTENSION_MISMATCH` | 拡張子標準と実Encodingが異なる |
| `MOVE_HEADER_OMITTED` | 指し手一覧Headerが省略されている |

## 9. Error一覧

| Code | Import拒否理由 |
|---|---|
| `KIF_FILE_NOT_SELECTED` | File未選択 |
| `KIF_FILE_EMPTY` | 空File／空Text |
| `KIF_FILE_TOO_LARGE` | 2MiB超過 |
| `KIF_FILE_EXTENSION_INVALID` | `.kif`／`.kifu`以外 |
| `KIF_READ_FAILED` | Browser File Reader失敗 |
| `KIF_ENCODING_UNSUPPORTED` | UTF-8／Shift_JISで読めない |
| `INVALID_KIF_FORMAT` | KIF Marker・指し手を確認できない |
| `KIF_HEADER_INVALID` | Header区切り不正 |
| `KIF_MOVES_NOT_FOUND` | 有効な指し手なし |
| `KIF_MOVE_INVALID` | 手数または指し手表記不正 |
| `KIF_MOVE_NUMBER_DUPLICATE` | 手数重複 |
| `KIF_MOVE_NUMBER_GAP` | 手数飛び |
| `KIF_TERMINATION_INVALID` | 終局行複数、終局後指し手など |
| `KIF_CONTENT_CONFLICT` | Header・指し手・Footerの矛盾 |
| `KIF_IMPORT_CANCELLED` | Import中止 |
| `KIF_PREVIEW_NOT_FOUND` | PreviewなしでForm反映 |

## 10. 正式範囲外

- CSA
- KI2
- 将棋ウォーズ独自形式
- Clipboard貼付
- KIF Text直接入力
- 分岐棋譜の完全解釈
- 盤面再現
- 合法手判定
- Engine評価Commentの意味解析
- AIによるFACT・解釈・仮説生成

## 11. 参照

- 柿木将棋 KIF形式説明：`https://kakinoki.o.oo7.jp/kif_format.html`
- ぴよ将棋 公式ページ／KIF Sample：`https://www.studiok-i.net/android/piyo_shogi.html`

実装は手元Sampleだけに固定せず、一般KIFのHeader・指し手・終局構造を基準にしています。
