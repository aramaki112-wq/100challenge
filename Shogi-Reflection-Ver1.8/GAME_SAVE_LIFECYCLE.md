# GAME_SAVE_LIFECYCLE.md — Ver.1.4

## 中心原則

**SaveとCompleteを分離する。**

```text
KIF登録
  ↓
対局情報確認
  ↓
SAVE_GAME ───────────────→ 棋譜のみ（GAME_ONLY）
                              ↓ 後日Open
                         Replay / KeyPosition / Reflection
                              ↓
SAVE_REFLECTION_DRAFT ───→ 振り返り中（REFLECTION_IN_PROGRESS）
                              ↓
Completion Validation
                              ↓
COMPLETE_REFLECTION ─────→ 振り返り完了（REFLECTION_COMPLETE）
```

## Status

| Internal | 日本語表示 | 意味 |
|---|---|---|
| `GAME_ONLY` | 棋譜のみ | 棋譜・対局情報は保存済み。振り返り未開始でもよい |
| `REFLECTION_IN_PROGRESS` | 振り返り中 | 重要局面・振り返り等に本人入力があるがComplete未確定 |
| `REFLECTION_COMPLETE` | 振り返り完了 | 既存完成Validationを満たし明示Complete済み |

## 棋譜保存条件

GameReviewとして成立する既存基本Validation（Review ID、対局日時、手番、結果の正式値、KIF本文等）は必要。一方、以下は不要。

- 重要局面：0件可
- Observation Theme：空可
- 実行Rule：0件可
- FACT / INTERPRETATION / HYPOTHESIS：未入力可

対局メモはGame metadataとして扱い、メモだけで`REFLECTION_IN_PROGRESS`へ遷移しない。

## 振り返り完成条件

既存Ruleを変更しない。

- 重要局面 3〜5件
- Observation Theme 1件
- 実行Rule 1〜3件

`COMPLETE_REFLECTION`だけが`REFLECTION_COMPLETE`を要求し、Domain Entity生成時に既存Ruleと整合しなければRejectする。

## Timestamp

- `createdAt`: 初回保存時に設定し、更新時も保持する。
- `updatedAt`: 保存・更新のたびに更新する。
- どちらもOptionalとして追加し、旧Backupではnullを許容する。

## Ver.1.3.3 Backup互換

Snapshot Schema Versionは1を維持する。旧Dataに`workflowStatus`が無い場合は、Domain復元境界で内容から推定する。

- Completion条件を満たす旧Review → `REFLECTION_COMPLETE`
- 意味のある振り返りDataあり → `REFLECTION_IN_PROGRESS`
- それ以外 → `GAME_ONLY`

旧Dataを復元するためにStorage Migrationを強制しない。

## Auto Save

Ver.1.4では導入しない。Domain Dataを書き換えるのは明示的な保存操作だけとする。
