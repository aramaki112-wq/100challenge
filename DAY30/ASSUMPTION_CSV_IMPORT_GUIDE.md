# DAY30 Assumption CSV Import Guide

## 目的

計画成立に必要な未確認条件を、事実と混同せずAssumptionとして登録・更新します。

## 操作

1. Dashboardで対象Production Planを選択します。
2. 対象Plan VersionがDRAFTまたはREVIEWであることを確認します。
3. `Assumption CSVを取り込む`からCSVを選択します。
4. ADD・UPDATE・UNCHANGED・ERRORとIssue一覧を確認します。
5. Errorが0件の場合だけ`Preview内容を保存`を押します。
6. AssumptionをScenarioで使用する場合は、別途Scenario–Assumption Relationを接続します。
7. 診断を再実行します。

## 重要なRule

- `EXPECTED`は`CONFIRMED`ではありません。
- `CONFIRMED`と`REJECTED`には`confirmedAt`と`confirmedBy`が必要です。
- `REJECTED`にはEvidenceが必要です。
- 既存Assumptionの`assumptionType`・`targetType`・`targetId`はCSV更新で変更できません。新しいAssumption IDを作成します。
- `PLANNED_OPERATION`対象は、選択中Plan Versionに属するOperationだけ登録できます。
- Preview作成後にPlanやAssumption Dataが変わった場合は、再Previewが必要です。

## 主なColumn

- `assumptionId`: 一意なID
- `assumptionType`: MATERIAL_ARRIVAL、EQUIPMENT_AVAILABILITYなど
- `targetType`: PLAN_VERSION、PLANNED_OPERATION、EQUIPMENTなど
- `targetId`: 対象ID
- `status`: UNKNOWN、EXPECTED、CONFIRMED、REJECTED、EXPIRED
- `blocking`: trueの場合、未確認や不成立が最終診断へ影響します
- `validFrom` / `validTo`: Assumptionが有効な期間

## 保存されないもの

このCSVはAssumption本体だけを登録します。Diagnosis Scenarioとの接続Relationは自動作成しません。
