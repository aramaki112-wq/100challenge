# Reference — Word.md

> 100アプリチャレンジ全体で育てる用語辞典。以下はInterlude Phase2で追加・確認した用語。

## Repository

Domain Entityの集合を保存・取得するための抽象的な窓口。保存技術そのものではなく、集合に対する操作を表す。

関連：`GameReviewRepository.js`

## Repository Contract

Repository実装が提供すべきMethodと意味の約束。

## InMemory Repository

Memory上のCollectionを使うRepository実装。高速なAutomated TestやSample実行に向く。

## Revision

Repository Dataが何回変更されたかを識別する番号。保存・削除・復元の時点を追跡する。

## Snapshot

ある時点のDataを固定した変更不能な表現。Domain Entityそのものではない。

## Schema Version

保存Documentの構造Version。将来のData移行可否を判断する。

## Application ID

SnapshotがどのApplication用かを識別する文字列。

## Atomic Restore

全Dataが正常な場合だけ一括復元し、一件でも不正なら現在Dataを変更しない復元方式。

## Adapter

外部技術の違いをApplication内部から隠す部品。Phase2ではLocalStorage APIを文字列保存Contractへ変換する。

## Coordinator

複数Service・Adapterを正しい順序で接続し、一つのUse Caseとして提供する部品。

## Defensive Copy

内部参照を外部へ共有しないために、Dataを複製して保存・返却する方法。

## Derived Data

他の正式Dataから計算できる結果。例：`readyForNextGame`。

## Persistence

Applicationを終了してもDataが残るように保存・復元すること。

## LocalStorage

BrowserがOrigin単位で文字列を保存するWeb Storage API。

## Backup

現在Dataを別File等へ退避し、障害・誤操作・環境移行時に復元できるようにしたもの。

## Phase3追加

- **Form Input**：Browser Formから取得した未検証Data。
- **Input Mapper**：外部入力をDomain Constructorが受け取れる形式へ翻訳する境界Object。
- **Browser Adapter**：DownloadやFile読込などBrowser固有APIを分離するAdapter。
- **Partial Save**：処理の一部だけ成功した状態。Phase3ではRepository成功・LocalStorage失敗を区別する。

## Phase4追加

### View Model

画面表示のために整形したData。Domain Entityとは分離し、日本語Label、表示日時、抜粋などを持つ。

### Presenter

Application SnapshotをView Modelへ変換するObject。HTML操作そのものは担当しない。

### Event Delegation

動的に増減する子ElementのEventを、共通の親Elementで受け取る方法。

### Rollback

複数処理の途中で失敗したとき、処理前の整合したStateへ戻すこと。

## Phase5追記

### Markdown Artifact

保存済みDataから生成される、File名・本文・種別を持つ変更不能な成果物。

### Frontmatter

Markdown冒頭の`---`で囲むMetadata。Obsidianで検索・整理に利用できる。

### Wiki Link

Obsidianの`[[Note名]]`形式の内部Link。

### Observation Card

前局の判断Patternを、次局で観測する兆候と実行Ruleへ変換した短いNote。
