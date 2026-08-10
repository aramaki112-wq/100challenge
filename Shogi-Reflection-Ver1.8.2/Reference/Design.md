# Reference — Design.md

> Codeではなく設計の考え方を蓄積する。

## DomainとPersistenceを分離する

Domainは正しい状態を定義し、Persistenceはその状態を別媒体へ保存する。保存媒体の制限でDomain Ruleを弱めない。

## 外部Dataは境界で疑う

JSON、CSV、LocalStorage、File Uploadは外部Dataである。Property名が一致しても正式Entityとして信用しない。

## Atomic性を状態遷移として考える

Atomic Restoreは単なるError Handlingではない。

```text
Current State
→ Candidate Validation
→ Commit
```

Commit前にCurrent Stateを変更しない設計である。

## Derived Dataを正本にしない

他Dataから計算できる値は、外部入力を正として復元しない。元Dataから再計算する。

## Errorを責任別に分ける

Domain、Repository、Application、PersistenceでErrorを分けると、原因と利用者向け説明を両立できる。

## Revisionは変更の証拠

Revisionは時刻の代わりではない。同じData集合が何回変更されたかを追跡する識別子である。

## 失敗時に守るStateを先に決める

保存機能では、成功後のDataだけでなく失敗後のCurrent Stateを設計する。

## UIの前に境界を作る

Controller／Use Case境界を先に作ると、DOM EventがStorageやDomainの詳細へ依存しない。

## Phase3追加

UI Validationは入力を支援し、Domain Validationは正式Dataの成立を保証する。完全空の入力枠は除外できるが、一部入力Dataは黙って捨てずErrorにする。

## Phase4追加

### 表示DataをDomainへ入れない

日本語Labelや本文抜粋は利用画面により変化する。Domain Entityへ追加せずPresenterで作る。

### 削除の成功境界

Repository削除だけでなく、次回起動に使うLocalStorage更新まで成功して削除確定とする。

## Phase5追記

### Derived ArtifactをDomainへ入れない理由

Markdown、HTML、CSVなどの表示・出力形式は変化しやすい。Domain Entityへ保持せず、正式Dataから再生成することでDomainを安定させる。

### 兆候候補とFACTの分離

兆候は次局で検証する仮説であり、盤上FACTとは異なる。出力成果物でも見出しを分ける。
