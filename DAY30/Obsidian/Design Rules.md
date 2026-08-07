---
title: "DAY30 Design Rules"
type: design-rules
day: 30
status: formal-draft
created: 2026-08-02
tags:
  - 100アプリチャレンジ
  - Design-Rules
---

# DAY30 Design Rules

> [!note]
> DAY29統合済みReferenceの最終連番が最終成果物作成時に確認できるまで、継承監査方針に従い`DAY30-Rule-A`形式で管理する。

- **DAY30-Rule-A** Production Plan、Available Capacity、Feasible Production、Actual Productionを同一概念として扱わない。
- **DAY30-Rule-B** DAY30はDAY29 Capacityを再計算せず読み取り専用Snapshotとして利用する。
- **DAY30-Rule-C** 診断結果をPlanned Operationへ書き戻さない。
- **DAY30-Rule-D** 確認済み0と判断不能nullを区別する。
- **DAY30-Rule-E** UNKNOWNの実行可能数量と不足数量を0へ変換しない。
- **DAY30-Rule-F** 確認済みの不成立条件を未確認事項によってUNKNOWNへ弱めない。
- **DAY30-Rule-G** EXPECTEDをCONFIRMEDとして扱わない。
- **DAY30-Rule-H** AssumptionはStatus、Evidence、Owner、期限、有効期間、blockingを保持する。
- **DAY30-Rule-I** Assumption本体とScenarioへの適用Relationを分離する。
- **DAY30-Rule-J** 同じCapacity Bucketを複数Operationへ重複計上しない。
- **DAY30-Rule-K** 必要時間は過少評価を避けて分単位で切り上げる。
- **DAY30-Rule-L** 実行可能数量は過大評価を避けて安全側へ切り捨てる。
- **DAY30-Rule-M** 計画数量単位とCapacity Rule単位が異なる場合は自動変換しない。
- **DAY30-Rule-N** Capacity Rule未登録を能力0へ変換しない。
- **DAY30-Rule-O** 同順位・同具体性のCapacity Rule競合を黙って解決しない。
- **DAY30-Rule-P** Operation処理順を入力配列順へ依存させない。
- **DAY30-Rule-Q** 明確なRouting逆転とRouting判断材料不足を区別する。
- **DAY30-Rule-R** Model化していない条件を一つの能力係数へ押し込まない。
- **DAY30-Rule-S** Diagnosis StatusとResult Validityを分離する。
- **DAY30-Rule-T** 診断時点のRevisionをResultへ保存する。
- **DAY30-Rule-U** Revision後退とRevision Schema変更をINVALIDとして扱う。
- **DAY30-Rule-V** Derived ResultをFactory Source Event Logへ保存しない。
- **DAY30-Rule-W** Entity状態変更はDomain Event記録成功後に確定する。
- **DAY30-Rule-X** ImportはParse、Preview、Commitを分離する。
- **DAY30-Rule-Y** Import CommitはTransaction内で原子的に行う。
- **DAY30-Rule-Z** Stale Previewを保存しない。
- **DAY30-Rule-AA** Backup Restoreは全参照整合性確認後に一括反映する。
- **DAY30-Rule-AB** Browser ControllerはRepositoryやDomain Entityへ直接依存しない。
- **DAY30-Rule-AC** View ModelとRead Modelの返却Dataを外部から変更できないようにする。
- **DAY30-Rule-AD** 古い非同期応答で現在画面を上書きしない。
- **DAY30-Rule-AE** ExcelをJavaScriptと競合する第二の診断Engineにしない。
- **DAY30-Rule-AF** Scenario比較結果を単独で因果効果の証明として扱わない。
- **DAY30-Rule-AG** Solver提案でBase Planを自動上書きしない。
- **DAY30-Rule-AH** Manualは操作手順だけでなく観察項目、判断理由、次の行動、再診断条件を示す。
- **DAY30-Rule-AI** 全体Test結果を部分Test結果で置き換えない。
- **DAY30-Rule-AJ** 共通Code Catalog、Error Catalog、ID Prefixの完全性を自動Testで確認する。
