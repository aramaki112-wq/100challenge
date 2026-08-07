# DAY30 Scenario–Assumption Relation CSV取込手順書

## 1. 目的

Assumption本体を、どのDiagnosis Scenarioで評価するかを明示的に接続します。

```text
Assumptionを登録
↓
Scenario–Assumption Relationを登録
↓
選択したScenarioで診断
```

Assumptionを登録しただけでは、すべてのScenarioへ自動適用されません。意図しない前提条件が診断へ混入することを防ぐためです。

## 2. CSV列

| 列名 | 必須 | 意味 |
|---|---:|---|
| `diagnosisScenarioId` | 必須 | Assumptionを適用するDiagnosis Scenario ID |
| `assumptionId` | 必須 | 接続するAssumption ID |
| `active` | 任意 | `true`で診断対象、`false`で一時的に対象外。省略時は`true` |
| `note` | 任意 | 接続理由、対象外にした理由、運用上の補足 |

Relation IDは次の複合Keyです。

```text
diagnosisScenarioId::assumptionId
```

## 3. 事前条件

1. 対象のProduction PlanとPlan Versionが登録済みである。
2. Diagnosis Scenarioが登録済みである。
3. Assumptionが登録済みである。
4. DashboardでScenarioと同じPlan Versionを選択している。

推奨Import順は次のとおりです。

```text
Planned Operation
↓
Assumption
↓
Diagnosis Scenario
↓
Scenario–Assumption Relation
```

## 4. 操作手順

1. DashboardでProduction Planを選択します。
2. 対象Plan Version IDを確認します。
3. `Scenario–Assumption Relation CSVを取り込む`を開きます。
4. CSV Fileを選択します。
5. PreviewでADD・UPDATE・UNCHANGED・Errorを確認します。
6. Errorが0件であることを確認します。
7. `Preview内容を保存`を押します。
8. 対象Scenarioを選択して診断を実行します。

File選択だけでは保存されません。

## 5. activeの意味

```text
active=true
→ AssumptionをScenarioの診断対象にする

active=false
→ Relation履歴は残すが、現在の診断対象から外す
```

`active=false`はAssumption本体の削除ではありません。他Scenarioで利用しているAssumptionへ影響しません。

## 6. 主なError

### Scenarioが見つからない

`diagnosisScenarioId`を確認し、Diagnosis Scenario CSVを先に取り込みます。

### Assumptionが見つからない

`assumptionId`を確認し、Assumption CSVを先に取り込みます。

### TARGET_VERSION_MISMATCH

ScenarioがDashboardで選択したPlan Versionに属していません。対象Planを選び直すか、CSVのScenario IDを修正します。

### DUPLICATE_ROW_ID

同じScenarioとAssumptionの組合せがCSV内に複数あります。一行に統合してください。

### IMPORT_STALE_PREVIEW

Preview後にScenario・Assumption・Relation等が変更されています。CSVを再選択して最新状態でPreviewを作り直します。

## 7. 診断結果の観察

Relation登録後は、次を確認します。

- Assumption Findingに対象Assumptionが表示されるか
- `UNKNOWN`、`REJECTED`、`CONFIRMED`が最終Statusへどう影響したか
- blocking AssumptionにNext Checkが生成されたか
- activeをfalseへ変えたとき診断結果から外れるか

