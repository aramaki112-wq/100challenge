# DAY29 人員・Skill制約付き 月間設備Capacity／Production Simulation

100アプリチャレンジ DAY29の正式完成版です。

DAY27のFactory-wide Worker Allocation、DAY28のTime-Based Capacity Calendarを継承し、月間Master、Calendar、手動Assignment、設備処理能力Rule、Order、Routing、Scenarioを接続します。

```text
Factory / Process / Equipment Master
        ↓
Factory / Equipment / Worker Calendar
        ↓
Manual Assignment
        ↓
Worker・Skill・設備競合判定
        ↓
日付×Shift×設備 Capacity
        ↓
日別・月別 Capacity
        ↓
Order / Routing / Operation
        ↓
Production Simulation
        ↓
未処理・納期・Bottleneck・制約理由
        ↓
Scenario比較
```

---

## 1. DAY27・DAY28から維持した境界

次を混同しません。

```text
Availability
≠ Assignment
≠ Worker Capacity
≠ Equipment Capacity
≠ Factory Capacity
≠ Production
```

DAY27・DAY28の既存Entity、Application Service、Event Replay、Testは削除・再定義していません。DAY29は既存ファイルをすべて収録したうえで、月間計算とProduction Domainを外側へ追加しています。

---

## 2. DAY29の優先順位

1. Masterを登録しやすい
2. 月間条件を変更しやすい
3. 入力ミスを発見しやすい
4. 条件変更後すぐ再計算できる
5. 結果から原因へ辿れる
6. Scenario差分を確認できる
7. 自動最適化は後回し

本Applicationは、完全自動最適化を行いません。人が仮説を立て、条件を一つ変更し、結果の理由を確認するための検証Applicationです。

---

## 3. 主な画面

- Dashboard
- Master登録
- Calendar登録
- Assignment
- Order／Simulation条件
- 月間設備Calendar
- 月間集計
- 日別・Shift別詳細
- Production Simulation
- Scenario比較
- 整合性チェック

月間設備Calendarのセルを選択すると、日別結果、Shift結果、Worker Allocation、停止・不足理由へ辿れます。

---

## 4. Master駆動

JavaScriptを修正せず、画面またはImportから次を追加・変更できます。

- Factory
- Process
- Equipment
- Worker
- Skill
- Worker Skill Qualification
- Equipment Requirement
- Shift
- Equipment Capacity Rule
- Routing
- Stop Reason

設備間の関係は設備名ではなく`equipmentId`で接続します。

---

## 5. Equipment Capacity Rule

同じ設備へ複数Ruleを登録できます。

```text
Default Rule
Product Group Rule
材質・寸法・加工・難易度・Operation条件Rule
```

選択順序：

```text
有効期間
↓
条件一致
↓
条件具体性
↓
Rule Priority
↓
Stable ID
```

同じ条件具体性・同じPriorityで複数Ruleが一致した場合は、黙って選ばず`CAPACITY_RULE_CONFLICT`を返します。

対応単位：

- PIECE
- KILOGRAM
- LOT

対応基準：

- HOUR
- SHIFT
- DAY

内部計算は時間を正本とし、Rule適用時に数量へ変換します。

---

## 6. 月間Capacity計算

### 稼働可否の順序

```text
工場稼働予定
↓
Shift稼働予定
↓
設備使用可能
↓
必要人数・Role Skill設定
↓
Worker勤務時間
↓
Skill有効期限
↓
Assignment
↓
設備間競合・Priority
↓
設備単体成立
↓
工場全体同時成立
```

遅刻、早退、一部勤務はShiftを時間区間へ分割して計算します。

### 稼働可能日数換算

```text
月間稼働可能日数換算
=
月間稼働可能時間
÷
工場標準1日稼働時間
```

Shift数は説明用であり、内部計算の正本は分です。

---

## 7. Production Simulation

OrderをPriority、納期、Order IDの順で決定論的に並べます。

Routing Operationごとに、利用可能設備のCapacity時間を古い時間帯から消化します。Operationごとに適用するCapacity Ruleを選択するため、標準品と難加工品を同じ固定能力値で計算しません。

出力：

- 達成可能数量
- 未処理数量
- 使用Capacity時間
- 残Capacity時間
- 過負荷日
- 実行不能Operation
- Bottleneck設備
- Bottleneck工程
- 主制約理由
- 納期内達成可否

DAY29のSimulationは決定論的な前方割当です。数理最適化Solverではありません。

---

## 8. Scenario

Sampleには次の二つを収録しています。

- Base Scenario
- Worker追加Scenario

Baseでは第一工場の二設備が同じWorkerを必要とし、設備Priorityにより設備Bが配置競合になります。Worker追加Scenarioでは設備B用の要員を追加し、月間日数換算、Capacity、特殊品Orderの達成量が変化します。

操作：

```text
Scenario複製
↓
Calendar・Worker・Assignment・Ruleを変更
↓
再計算
↓
比較Scenarioを選択
↓
差分確認
```

LocalStorageへ保存するため、Reload後もScenarioを維持します。

---

## 9. Import／Export

画面からEquipment MasterとCapacity RuleをCSVまたはJSONでImportできます。

Importは即時保存しません。

```text
Parse
↓
Validation
↓
Preview
↓
追加・更新・重複・Error確認
↓
Commit
```

Sampleは`import-samples`フォルダへ収録しています。

Excelでデータを作成する場合は、次を使用してください。

- `import-samples/DAY29_Excelインポート作成ガイド兼テンプレート.xlsx`
- `import-samples/Import Data Specification.md`

現在、画面Importへ接続されているのはEquipment MasterとCapacity Ruleです。Calendar・Assignment・OrderのCSVは将来Adapter接続用Sampleです。

---

## 10. 実行方法

### Application

VS Codeでこのフォルダを開き、Live ServerなどのLocal HTTP Serverから`index.html`を開いてください。

ES Moduleを使用するため、HTMLファイルを直接ダブルクリックするよりLocal Serverを推奨します。

### Automated Test

```bash
npm test
```

正式検証結果：

```text
Total: 163
Passed: 163
Failed: 0
```

内訳：

- DAY27以前Regression：65件
- DAY28追加：39件
- DAY29追加：59件

### 構文・Import Path・HTML参照確認

```bash
npm run check
```

正式検証結果：

```text
JavaScript / MJS: 129 files PASS
Missing Imports: 0
Missing HTML References: 0
```

### Browser Test

`tests.html`へDAY28 UI Test 2件とDAY29 UI Test 9件を収録しています。

生成環境ではHeadless Chromiumが終了せず、Browser Testの自動実行結果を取得できませんでした。Testコードは未実行を実行済みとは記録していません。Live Serverから`tests.html`を開いて確認してください。

---

## 11. Sample Data

`sample-data`：

- 4工場
- 8工程
- 8設備
- 2Shift／工場
- Worker・Skill Qualification
- Factory Calendar
- Equipment Calendar
- Worker Calendar
- Assignment
- Default／条件別Capacity Rule
- 2 Routing
- 2 Order
- 2 Scenario

Sample規模は説明用です。Masterは40設備以上へ追加できます。

---

## 12. 後回しにしたもの

- 全Worker・全設備・全Orderの完全自動最適化
- 数理最適化Solver
- AI自動配置
- AS/400、Flexsche、RFIDとの直接接続
- Cloud Database
- 複数ユーザー同時編集
- 本番認証

Port、Repository、Adapter、Scenario境界を設け、後続DAY・Digital Twinへ接続できる構成にしています。
