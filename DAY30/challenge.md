# 100アプリチャレンジ DAY30

## Production Plan Diagnosis

### 生産計画診断・制約分析・実行可能性評価System

---

## 1. 中心Question

> 人が作成したProduction Planを、DAY29で計算した現実Capacity、Routing、Assumption、Model Coverageと照合し、「できる・一部できる・できない・判断できない」を理由付きで再現可能に説明できるか。

---

## 2. 背景

現在の生産計画では、設備の理論能力や経験上の目標値が使われても、次の現実条件が十分に反映されないことがあります。

- 日・Shift別設備稼働時間
- Worker、Skill、Assignment
- 設備停止・Calendar例外
- 前工程完了・材料到着・運搬
- Capacity Rule
- 同時に成立しない複数計画
- Data更新時点

その結果、成立しない計画を「できる」と表現したり、情報不足を0として扱ったり、未達理由を後から説明できなくなる問題があります。

---

## 3. DAY29との関係

DAY29は現実に利用可能なCapacityを作ります。
DAY30は、そのCapacityを再計算せず、Production Planを診断します。

```text
DAY29
Availability
≠ Assignment
≠ Worker Capacity
≠ Equipment Capacity
≠ Factory Capacity
≠ Production

DAY30で追加
Production Plan
≠ Available Capacity
≠ Feasible Production
≠ Actual Production
```

---

## 4. Must Have

- Production PlanとVersionを保存できる
- Planned OperationをTIME・SHIFT・DAY粒度で表現できる
- APPROVED Versionを直接変更しない
- DAY29 Capacity Snapshotを読み取り専用で利用できる
- 同じCapacityを二重使用しない
- 数量から必要時間、割当時間から実行可能数量を計算できる
- Capacity Rule未登録・競合を検出できる
- Assumptionを事実と分けて管理できる
- Routing順序を診断できる
- Model外条件をUNMODELEDとして残せる
- FEASIBLE、PARTIALLY_FEASIBLE、INFEASIBLE、UNKNOWNを分けられる
- 診断理由、Finding、Next Checkを返せる
- 診断ResultがSTALE／INVALIDになった理由を追跡できる
- CSV／JSON ImportをPreviewしてからCommitできる
- Browserで診断・比較・保存・復元できる
- Scenario差を数値とOperation単位で比較できる
- 同じInput・Version・Ruleから同じ結果を返せる
- Automated TestとEnd-to-End Acceptance Testを持つ

---

## 5. Should Have

- Excelで外部診断Dataを準備できる
- 日本語Quick Startと詳細Manualを持つ
- 要対応項目をPriority・期限で並べられる
- Browserを閉じてもDataを保持できる
- Backup JSONで移行・復旧できる
- The Book of DesignとObservation Handbookへ学習接続できる

---

## 6. Scope外

- 数理最適化による自動計画確定
- AIによる自動承認
- AS/400・Flexsche・PLCとの直接接続
- Real-time Sensor更新
- Cloud Database
- 本番認証
- 複数User同時編集
- 3D Digital Twin表示
- 未観測条件を自動推定して確認済みにすること

---

## 7. Input

- Production Plan
- Production Plan Version
- Planned Operation
- Diagnosis Scenario
- Assumption
- Scenario–Assumption Relation
- DAY29 Capacity Snapshot
- Equipment Master
- Order Master
- Routing Operation Master
- Shift Master
- Capacity Rule
- Source Revision
- Model Coverage Condition

---

## 8. Output

- Operation Diagnosis Result
- Diagnosis Summary
- Diagnosis Result
- Diagnosis Status
- Result Validity
- Capacity Status
- Assumption Resolution
- Routing Status
- Model Coverage Status
- 実行可能数量
- 不足数量
- 必要時間
- 割当時間
- 不足時間
- Constraint Finding
- Assumption Finding
- Next Check
- Scenario Comparison
- Stale Reason

---

## 9. 完成条件

- DemoをBrowserから最後まで操作できる
- 基準Scenarioで不足120分を再現できる
- 残業2時間追加Scenarioで不足0分を再現できる
- Scenario比較で改善差を表示できる
- 未確認blocking AssumptionでUNKNOWNになる
- UNKNOWN数量を0へ変換しない
- BackupとRestoreで同じ診断Dataを再構築できる
- 壊れたBackupを非破壊で拒否できる
- 全Automated Testが成功する
- Static VerificationでMissing Importが0になる
- GitHub正式Fileがそろう
- Obsidian正式成果物7点がそろう
- 日本語ManualとExcel Templateがそろう
- GitHub用ZIPとFormal Complete ZIPを作成できる

---

## 10. 学習Theme

- Bounded Context
- PlanとRealityの分離
- Derived Result
- Assumption Management
- Explainability
- Deterministic Allocation
- Repository Contract
- Transaction
- Read Model
- Controller／View Model
- Import Preview
- Version／Revision
- Stale Data
- End-to-End Test
- What-if Scenario
- Observation→Diagnosis→Action→Re-observation

---

## 11. 中心文

> Production Planを正解として扱わず、現実Capacity・確認済み条件・未確認条件・Model外条件へ分解し、無理なものは無理、分からないものは分からないと理由付きで返す。
