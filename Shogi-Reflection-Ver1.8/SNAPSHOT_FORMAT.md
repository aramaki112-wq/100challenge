# SNAPSHOT_FORMAT.md

## 1. Formatの目的

Replay Position Snapshotは、重要局面へ追加した時点の客観的な局面を、後から再表示・再検証できるDataとして保存します。画面表示用文字列だけを保存せず、Square、Piece、Owner、Promotion、Hand Countを構造化して保持します。

## 2. Version

```json
{
  "snapshotVersion": 1
}
```

Ver.1.3の対応Versionは`1`です。未対応Versionは暗黙変換せず、`KEY_POSITION_SNAPSHOT_VERSION_UNSUPPORTED`として拒否します。

## 3. KeyPositionReplayReference

```json
{
  "referenceVersion": 1,
  "sourceGameId": "REV-...",
  "sourceKifFingerprint": "fnv1a32-...",
  "moveNumber": 45,
  "sourceKifMove": {
    "moveNumber": 45,
    "notation": "７六歩(77)",
    "elapsed": "0:01",
    "totalElapsed": "00:05:12",
    "lineNumber": 52,
    "rawLine": "45 ７六歩(77) ..."
  },
  "snapshotVersion": 1,
  "replayWarning": null,
  "snapshot": {}
}
```

`sourceKifFingerprint`はSource一致確認用であり、暗号学的な電子署名ではありません。

## 4. ReplayPositionSnapshot

```json
{
  "snapshotVersion": 1,
  "moveNumber": 45,
  "currentMove": "７六歩(77)",
  "previousMove": "３四歩(33)",
  "sourceKifMove": {},
  "currentPosition": {},
  "previousPosition": {},
  "replayWarning": null,
  "termination": null
}
```

### 必須

- `snapshotVersion`
- `moveNumber`（1以上）
- `currentMove`
- `sourceKifMove`
- `currentPosition`
- `previousPosition`

### 任意

- `previousMove`：1手目では初期局面を表す表示値
- `replayWarning`
- `termination`

## 5. ShogiPositionSnapshot

```json
{
  "board": {
    "pieces": []
  },
  "senteHand": {
    "counts": {
      "ROOK": 0,
      "BISHOP": 0,
      "GOLD": 0,
      "SILVER": 0,
      "KNIGHT": 0,
      "LANCE": 0,
      "PAWN": 0
    }
  },
  "goteHand": { "counts": {} },
  "sideToMove": "SENTE",
  "lastMoveFrom": { "file": 7, "rank": 7 },
  "lastMoveTo": { "file": 7, "rank": 6 }
}
```

駒打ちでは`lastMoveFrom`を`null`にできます。

## 6. BoardSnapshot

```json
{
  "pieces": [
    {
      "square": { "file": 7, "rank": 6 },
      "type": "PAWN",
      "owner": "SENTE",
      "promoted": false
    }
  ]
}
```

### Rule

- `file`と`rank`は1〜9
- 同じSquareへ複数駒を置かない
- Ownerは`SENTE`または`GOTE`
- Piece Typeは既存Shogi Piece Typeに限定
- 盤面反転は保存しない
- 表示順ではなく内部座標を保存する

## 7. HandSnapshot

持ち駒はPiece Typeごとの0以上の整数Countで保持します。玉は持ち駒として扱いません。

## 8. ReplayWarningReference

```json
{
  "code": "SHOGI_CAPTURE_INVALID",
  "message": "そのSquareでは駒取りを適用できません。",
  "moveNumber": 83,
  "moveText": "９九飛(28)",
  "replayableUntil": 82
}
```

調査用CauseやStack Traceは永続化しません。

## 9. 作成日時

Snapshot作成日時は保存しません。

理由は、同一Source・同一手数から同じSnapshotを再生成できることを優先し、UI操作時刻によってSnapshot同一性が変わることを避けるためです。GameReview全体のBackupには既存`exportedAt`があります。

## 10. 不変性とCopy

- ConstructorでValidationする
- 入力Objectを安全にCopyする
- 生成後はDeep Freezeする
- JSON復元時も同じConstructorを通す
- UIへ渡すときに内部Objectを直接変更させない

## 11. Size

通常の局面は最大40枚程度の盤上駒と少数の持ち駒Countで表現されます。最大5件に制限されるため、通常の200〜300手KIF全体をKeyPositionごとに保存するより小さく保てます。

SnapshotにはKIF全文を重複保存せず、Source Game IDとFingerprintを参照として持ちます。
