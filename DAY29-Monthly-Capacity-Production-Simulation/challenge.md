# 100アプリチャレンジ DAY29

## 人員・Skill制約付き 月間設備Capacity／Production Simulation

---

## Challenge Question

工場・工程・設備・処理能力・Calendar・Worker・Skill・Assignment・OrderをMaster駆動で登録し、人員・Skill制約後の月間設備CapacityとProduction結果を、理由付きで素早く再計算できるか。

---

## Source of Truth

1. Challenge Specification Ver.1.3
2. DAY27正式完成版
3. DAY28正式完成版
4. DAY27・DAY28 Source Code
5. Automated Test
6. Browser Test
7. README.md
8. challenge.md
9. 設計上の決定
10. DAY27・DAY28の用語とDomain境界

---

## 必須境界

```text
Availability
≠ Assignment
≠ Worker Capacity
≠ Equipment Capacity
≠ Factory Capacity
≠ Production
```

---

## 必須機能

- Factory／Process／Equipment Master
- Worker／Skill／Qualification／Equipment Requirement
- Shift／Capacity Rule／Routing／Stop Reason
- Factory／Equipment／Worker Calendar
- Manual Assignment
- Worker勤務、Skill期限、Role人数、設備競合、Priority判定
- 日付×Shift×設備の稼働可否
- 日別・月別Capacity
- 時間ベース稼働可能日数換算
- 月間設備Calendar
- Order／Routing／Operation投入
- Production Simulation
- 未処理・納期・Bottleneck・制約理由
- Scenario複製・再計算・比較
- 整合性チェック
- CSV／JSON Import Preview／Commit／Export
- LocalStorage保存

---

## 設計優先順位

```text
登録しやすさ
↓
変更しやすさ
↓
入力ミス発見
↓
再計算速度
↓
原因追跡
↓
Scenario差分
↓
自動最適化
```

---

## Definition of Done

- DAY28全ファイルを収録している
- DAY27・DAY28既存EntityをDAY29都合で簡略化していない
- Equipment追加にJavaScript修正が不要
- Capacity Ruleを設備一台一固定値へ限定していない
- 稼働可能日数換算を時間で計算している
- Factory-wide Worker競合を解決後にCapacityを算出している
- Production結果へ不足理由を含めている
- Scenario再計算が元Scenarioを破壊しない
- Automated Testが全件成功する
- 構文・Import Path・HTML参照が成功する
- GitHub用完全版FolderとZIPを作成する
- Obsidian正式成果物を作成する
