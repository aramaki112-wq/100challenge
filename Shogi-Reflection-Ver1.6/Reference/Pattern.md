# Reference — Pattern.md

> 100アプリチャレンジ全体で再利用する実装Pattern。

## Repository Pattern

```text
Application Service
        ↓
Repository Contract
        ↓
InMemory / Database / Other Adapter
```

保存技術をUse Caseから分離する。

## Data Mapper Pattern

```text
External Object
↓ validate
Domain Constructor
↓
Domain Entity
```

外部表現とDomain Modelを変換する。

## Snapshot Pattern

ある時点のRepository DataをVersion付きDocumentへ固定する。

## Atomic Replace Pattern

```text
next stateを別領域で完成
↓
全Validation成功
↓
current stateを一度だけ差し替え
```

途中状態を公開しない。

## Adapter Pattern

Browser APIなどの外部技術をApplication向けContractへ変換する。

## Coordinator Pattern

複数Componentの呼出順序を一つのUse Caseへまとめる。

## Error Translation Pattern

```text
RepositoryError
↓ Application境界
ApplicationError
```

下位層の詳細を保ちつつ、利用者の操作意味へ変換する。

## Defensive Copy Pattern

保存・取得時に別Instanceを返し、内部Stateを外部変更から守る。

## Immutable Result Pattern

Application Serviceの返却値を`deepFreeze`し、呼出側から変更できないようにする。

## Versioned Backup Pattern

Application ID、Schema Version、Export日時、Revisionを持つBackupを作る。

## Phase3追加

### Form → Mapper → Domain

```text
Browser Form→Plain Input→Input Mapper→Domain Constructor
```

### In-Memory First Persistence

```text
Repository保存→Snapshot→Browser保存→失敗時もRepository保持
```

## Phase4追加

### List / Detail Pattern

一覧で対象を選択し、別領域へ詳細を表示する。

### Edit Round Trip Pattern

保存済みSnapshotをForm Inputへ変換し、保存時に再びDomain Constructorを通す。

### Compensating Rollback Pattern

Repository変更後の外部保存に失敗した場合、事前Snapshotから元Stateへ戻す。

## Phase5追記

### Domain Snapshot → Formatter → Artifact Pattern

```text
Domain Snapshot
→ Pure Formatter
→ Immutable Artifact
→ Preview
→ Browser Adapter
```

### Human Export／Machine Backup分離Pattern

復元用JSONと人向けMarkdownを別Use Caseとして扱う。
