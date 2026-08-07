# Changelog

このFileはDAY30 Production Plan Diagnosisの主要変更を記録します。

## [1.0.0] - 2026-08-02

### Added

- Production Plan、Plan Version、Planned Operation Domain
- Assumption状態管理とScenario Relation
- DAY29 Capacity Snapshot読取境界
- Capacity Ledgerと二重使用防止
- 必要時間・実行可能数量計算
- Capacity Rule Resolver
- Routing DiagnosisとModel Coverage
- Operation Status Decider
- Constraint Finding、Assumption Finding、Next Check
- Operation Diagnosis Result、Diagnosis Summary、Diagnosis Result
- Result ValidityとStale Reason検出
- Repository Contract、InMemory Repository、Transaction
- RunPlanDiagnosis Application Service
- Read Model、Dashboard View Model、Browser Controller
- DOM RendererとBrowser Demo
- Planned Operation、Assumption、Scenario、Relation CSV Import
- DAY29外部診断Data JSON Import／Export
- LocalStorage、Backup／Restore
- Excel外部Data入力Template
- Scenario比較
- End-to-End Acceptance Test
- 日本語Quick Start、詳細User Manual、Error・Troubleshooting手順書の正式版
- Static Verification Script
- GitHub正式FileとObsidian正式成果物7点
- 運用Check・再診断記録Workbook
- Status・Error・Domain・Domain Event Catalog
- GitHub Complete ZIP／Formal Complete ZIPの最終構成

### Design Decisions

- `UNKNOWN`を0へ変換しない
- Capacity上の成立と現実成立を分離する
- Production PlanへDiagnosis Resultを書き戻さない
- `EXPECTED`を`CONFIRMED`として扱わない
- Capacity Ledgerで二重使用を防ぐ
- Diagnosis ResultとResult Validityを分離する
- ImportはPreviewとCommitを分離する
- Scenario比較を因果効果の証明として扱わない
- Solverは助言層とする

### Verification

正式な件数は`TEST_RESULT.txt`と`npm run check`の出力を参照してください。
