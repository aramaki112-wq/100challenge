# DAY30 Scenario比較 操作・読取手順書

## 1. 目的

Scenario比較は、基準Scenarioと比較Scenarioの診断結果を横並びにし、変更後に何が変わったかを確認する機能です。

例：

- 残業を2時間追加した
- 応援者を配置した
- 設備停止時間を短縮した
- 材料到着Assumptionを確認済みにした

## 2. 事前条件

比較には次が必要です。

1. 基準Scenarioが登録されている
2. 比較Scenarioの`baseDiagnosisScenarioId`に基準Scenario IDが設定されている
3. 比較Scenarioに`changeSummary`が記載されている
4. 基準Scenarioと比較Scenarioの両方で診断を実行済み
5. 両Scenarioが同じPlan Versionに属している

## 3. Demoで確認する手順

1. Dashboardを開く
2. `基準Capacityで診断`を選択する
3. `診断を実行`を押す
4. `残業2時間追加Scenario`へ切り替える
5. `診断を実行`を押す
6. `基準Scenarioとの差を確認する`を読む

Demoでは、設備利用可能時間を420分から540分へ増やします。

## 4. 表示項目

### 比較Outcome

- `IMPROVED`：改善
- `WORSENED`：悪化
- `UNCHANGED`：変化なし
- `MIXED`：改善と悪化が混在
- `UNCERTAIN`：UNKNOWNを含み、改善・悪化を断定できない
- `NOT_COMPARABLE`：INVALIDな結果を含み、比較に使用できない

### 全体差分

- 変化したOperation件数
- 実行可能数量差
- 不足数量差
- 不足時間差
- 要対応Operation差
- Open確認項目差

差分は、`比較先 − 比較元`です。

例：

```text
不足時間差 = -120分
```

は、比較Scenarioで不足時間が120分減ったことを表します。

### Operation別差分

- 比較元Status
- 比較先Status
- Operation比較Outcome
- 実行可能数量差
- 不足数量差
- 不足時間差
- Primary Reasonの変化

## 5. 重要な注意

Scenario比較で確認できるのは、二つの診断結果の差です。

```text
変更内容
↓
診断結果の差
```

が表示されても、その変更だけが結果差の原因であることを単独で証明するものではありません。

他のData、Revision、Assumption、Capacity Ruleも同時に変わっていないか確認してください。

## 6. UNKNOWNの扱い

比較元または比較先に`UNKNOWN`が含まれる場合、改善・悪化を安易に断定しません。

```text
UNKNOWN → FEASIBLE
```

であっても、以前は不可能だったことを証明するものではなく、以前は判断できなかったという意味です。

## 7. STALE・INVALID

- `CURRENT`：現在の比較に使用できる
- `STALE`：変更理由を確認し、両Scenarioを再診断する
- `INVALID`：比較結果を判断に使用しない

## 8. 比較できない場合

### 比較元Scenario未設定

比較Scenarioの`baseDiagnosisScenarioId`を確認します。

### 診断結果不足

基準Scenarioと比較Scenarioの両方で診断を実行します。

### Plan Version不一致

同じPlan Versionに属するScenario同士で比較します。

## 9. 推奨する観察順

```text
変更概要を読む
↓
全体Outcomeを見る
↓
不足時間・不足数量の差を見る
↓
変化したOperationを特定する
↓
Primary Reasonの変化を見る
↓
他の条件も同時変更されていないか確認する
↓
次の小さなScenarioを作る
```
