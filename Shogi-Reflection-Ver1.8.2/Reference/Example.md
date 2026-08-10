# Reference — Example.md

> Phase2のPatternを別Domainへ応用する具体例。

## Diary Repository

```js
class DiaryRepository {
  save(entry) {}
  findById(entryId) {}
  findAll() {}
  deleteById(entryId) {}
  replaceAll({ entries, revision }) {}
}
```

## Recipe Backup Snapshot

```json
{
  "applicationId": "RECIPE_NOTE",
  "schemaVersion": 1,
  "exportedAt": "2026-08-02T00:00:00.000Z",
  "repositoryRevision": 12,
  "recipes": []
}
```

## Factory Observation Log Restore

```text
全Observation LogをParse
↓
Fact / Interpretation / Hypothesis必須確認
↓
ID重複確認
↓
全件正常時だけRepository置換
```

## Project Compass Log

子どもの観測Logでも、外部JSONをそのまま正式記録として採用せず、必須項目・日付・観測と推測の分離を再検証する。

## Todo LocalStorage Adapter

```js
class LocalStorageTextStore {
  save(text) {}
  load() {}
  delete() {}
}
```

Todo Entityを知らず、文字列だけを保存する。

## Phase3追加

```javascript
{
  keyPositionId: "KP-1",
  moveNumber: "45",
  title: "攻めを急いだ局面",
  fact: "相手の飛車が侵入できる状態だった。",
  interpretation: "攻め切れば問題ないと思った。",
  hypothesis: "一手守る可能性もあった。"
}
```

## Phase4追加

### GameReview List Item

```javascript
{
  reviewId: "REV-001",
  displayDate: "2026/08/02 11:00",
  resultLabel: "負け",
  keyPositionCount: 3,
  readyForNextGame: true
}
```

## Phase5追記

### Observation Card Artifact

```javascript
{
  kind: "OBSERVATION_CARD_MARKDOWN",
  fileName: "次局用Observation Card-2026-08-02-REV-001.md",
  markdownText: "# ...",
  sourceReviewId: "REV-001"
}
```
