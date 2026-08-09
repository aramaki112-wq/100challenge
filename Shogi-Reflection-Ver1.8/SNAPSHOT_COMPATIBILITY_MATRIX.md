# SNAPSHOT_COMPATIBILITY_MATRIX.md

## Compatibility方針

Top-level JSON Snapshot SchemaはVer.1.2と同じ`schemaVersion: 1`を維持します。Ver.1.3のReplay ReferenceはKeyPositionの任意Propertyであり、欠落をErrorにしません。

| Data | Ver.1.3読込 | 保存後 | 方針 |
|---|---:|---:|---|
| Ver.1.2 GameReview | 可能 | Ver.1.3形式 | SnapshotなしKeyPositionを有効として読む |
| SnapshotなしKeyPosition | 可能 | 可能 | `replayReference = null`として扱う |
| Snapshot Version 1付きKeyPosition | 可能 | Version 1 | Constructorで再検証する |
| Replay Warning付きSnapshot | 可能 | Warning保持 | Warningを隠さない |
| 未対応Snapshot Version | 拒否 | 変更なし | 暗黙Migrationしない |
| 壊れたBoard／Hand | 拒否 | 変更なし | Atomic Restoreで全件置換しない |
| Source Game ID不一致 | 候補追加を拒否 | 変更なし | Formを保護する |
| Source KIF Fingerprint不一致 | 候補追加を拒否 | 変更なし | 推測で同一視しない |
| Snapshotだけ欠落 | 旧Dataとして可能 | Snapshotなし | 本文を失わない |
| 改ざんBackup | Restore拒否 | 現在Data維持 | 全件検証後に置換する |

## 旧Data読込

旧KeyPositionには次がありません。

- `moveText`
- `decisionPattern`
- `learning`
- `replayReference`

これらは空文字または`null`へ正規化し、既存の必須Propertyと3〜5件Ruleは変更しません。

## JSON Versionを上げない理由

既存Schema VersionはSnapshot Document全体の必須構造を示します。今回追加したものは、KeyPosition内の任意拡張であり、旧Readerを破壊する必須変更ではありません。

将来、Snapshot Document全体の必須構造や意味を変更する場合はTop-level Schema Versionを上げます。Replay Position自身の変更は`ReplayPositionSnapshot.snapshotVersion`で管理します。

## 不正Snapshot時のFallback

永続DataからDomainへ戻すとき、Replay Referenceを持つKeyPositionはReference全体を再検証します。不正であればRestoreを拒否し、現在Repositoryを変更しません。

Ver.1.3では「壊れたSnapshotだけを自動削除して本文を勝手に保存する」処理は行いません。改ざんを黙って隠すより、現在Dataを守り、Backupを修復・再取得する判断材料を残すためです。

一方、最初からSnapshotが存在しない旧Dataは正常Dataとして扱います。

## MarkdownとObservation Card

- 振り返りMarkdownには、指し手、Snapshot Version、Source Game ID、Warningの有無を補助情報として出力できます。
- FACT・INTERPRETATION・HYPOTHESIS本文は従来どおり本人入力を出力します。
- Observation Cardの生成条件と本文Ruleは変更しません。
- Snapshotがない旧Reviewでも両Markdown機能を使用できます。
