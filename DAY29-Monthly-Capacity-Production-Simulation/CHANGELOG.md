
## Ver.1.1 - 2026-07-31

- Excel Import作成ガイド兼テンプレートを追加
- Equipment Master／Capacity RuleのExcel→CSV UTF-8→Import手順を追加
- Calendar／Assignment／Order CSVが将来接続用Sampleであることを明確化
- 完成例CSVを追加

# CHANGELOG

## 1.0.0 - 2026-07-28

### Added

- Factory、Process、Equipment、Shift、Stop ReasonのMaster Domain
- Equipment Capacity Rule、条件別Rule、Default Rule、Priority、期間、倍率
- Factory Calendar、Equipment Calendar、Worker Calendar
- Skill有効期限付きQualification
- 日付・Shift・時間帯単位のManual Assignment解決
- 設備PriorityとFactory-wide Worker競合判定
- Shift、日別、月別Equipment Capacity
- 時間ベースの稼働可能日数換算
- Factory Monthly Capacity集計
- Order、Routing、Operation、Production Simulation
- 複数日繰越、複数設備、複数工程、納期判定
- Bottleneck設備・工程、未処理量、主制約理由
- Scenario複製、Base復元、差分比較
- CSV／JSON Import Preview、Commit、Export
- InMemory／LocalStorage Scenario Repository
- Master、Calendar、Assignment、Simulation、Scenario比較、Validation UI
- 4工場Sample DataとImport Sample
- DAY29 Automated Test 59件
- DAY29 Browser UI Test 9件

### Preserved

- DAY23〜DAY28 Source Code
- DAY27 Factory-wide Allocation
- DAY28 Time-Based Capacity Calendar
- Event ReplayとSource／Derived Event境界
- DAY28までのAutomated Test 104件

### Verification

- Node Automated Test: 163 / 163 PASS
- JavaScript Syntax: 129 / 129 PASS
- Missing Import: 0
- Missing HTML Reference: 0
- Browser Test: Test Code収録、生成環境ではHeadless Chromium実行未完了
