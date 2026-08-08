# Reference — Tips.md

> 実務で再利用しやすい短い設計Tips。

- 保存先を決める前に、失敗時に守るDataを決める。
- JSONのPropertyが揃っていてもDomain Entityとは限らない。
- Restoreは先に候補Stateを完成させ、最後に一度だけCommitする。
- Backupと通常保存で別Schemaを作らない。
- `Object.freeze`だけに頼らず、Repository境界でも参照を分離する。
- Revisionは成功した状態変更だけで進める。
- Error Codeは層と操作を識別できる名前にする。
- LocalStorageは唯一のBackupにしない。
- Derived Dataは元Dataから再計算する。
- Spread構文では同名Propertyの上書き順をTestする。
- UIからBrowser APIを直接呼ばず、Controller境界を通す。
- Happy Pathだけでなく、失敗後に現在Dataが残るTestを書く。

## Phase3追加

- Form Field名はDomain用語と対応させても、Form ObjectをEntityとして扱わない。
- Error Codeだけでなく、次に直す内容を表示する。
- 実Data入力を始めるPhaseではBackup UIも接続する。

## Phase4追加

- 一覧はRepositoryの偶然の順番へ依存せず、利用者が探しやすい順序を明示する。
- 動的CardのEventは親Elementへまとめる。
- 削除Testでは成功だけでなく永続保存失敗後のStateを確認する。
- 保存済み文字列もHTMLへ出す前にEscapeする。

## Phase5追記

- Observation Cardは対局前に30秒程度で読める量を目標にする。
- 同じミスが再発しても、兆候に早く気づけたなら進歩として記録する。
- Ruleは抽象語ではなく対局中に実行できる動詞で書く。
- Markdownは学習成果物、JSONは復元Dataとして両方保管する。
