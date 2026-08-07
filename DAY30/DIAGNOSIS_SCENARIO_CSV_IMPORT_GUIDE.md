# DAY30 Diagnosis Scenario CSV Import Guide

## 目的

同じPlan Versionを異なるCapacity条件・仮定条件で比較するDiagnosis Scenarioを登録します。

## 操作

1. Dashboardで対象Production PlanとPlan Versionを確認します。
2. `Diagnosis Scenario CSVを取り込む`からCSVを選択します。
3. PreviewでScenario ID、Category、比較元、Errorを確認します。
4. Errorが0件の場合だけ保存します。
5. Dashboardを再読込し、追加したScenarioを選択します。
6. 必要なAssumption Relationを接続し、診断を実行します。

## Category

- `BASE`: 基準Scenario。`baseDiagnosisScenarioId`を設定しません。
- `COMPARISON`: 比較Scenario。比較元と`changeSummary`が必須です。
- `EXPERIMENT`: 実験的Scenario。
- `ARCHIVED`: 保存履歴用。`active=false`が必要です。

## 重要なRule

- CSVの`planVersionId`は画面で選択したPlan Versionと一致させます。
- `COMPARISON`の比較元は、Repositoryに既に存在するか同じCSV内に必要です。
- DAY30初期版の`capacityBaseline`は`AVAILABLE_CAPACITY`だけを使用します。
- Scenario ImportはAssumption Relationを自動作成しません。
- Preview後にScenario Repositoryが変わった場合は再Previewします。
