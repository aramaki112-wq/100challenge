# DAY29 Design Decisions

## Decision 001
DAY27・DAY28の既存Entityを変更せず、月間Master RecordとProduction Domainを外側へ追加する。

## Decision 002
Availability、Assignment、Worker Capacity、Equipment Capacity、Factory Capacity、Productionを別Conceptとして維持する。

## Decision 003
設備MasterはEquipment IDで接続し、表示名変更を関係変更へ波及させない。

## Decision 004
設備能力は設備一台一固定値ではなく、期間・条件・Priorityを持つ複数Ruleとして表現する。

## Decision 005
条件別Ruleが一致しない場合だけDefault RuleへFallbackする。

## Decision 006
同じ具体性とPriorityのRuleが競合した場合は黙って選択しない。

## Decision 007
月間Capacityの内部正本は数量ではなく利用可能時間とする。

## Decision 008
本／Shiftや本／日のRuleも、部分稼働時は時間比で按分する。

## Decision 009
Worker勤務開始・終了とAssignment開始・終了をShift内の計算境界へ追加する。

## Decision 010
Role Skillが指定されたAssignmentは、そのRole Slotへだけ使用する。

## Decision 011
設備間Worker競合はPriority階層ごとの成立設備数を最大化し、同点だけStable IDで決める。

## Decision 012
設備単体候補が成立しても、Factory-wide解で選ばれなければ配置競合とする。

## Decision 013
月間日数換算は利用可能分を工場標準1日分で割る。

## Decision 014
Production SimulationはOrder Priority、納期、Order IDによる決定論的前方割当とする。

## Decision 015
ProductionではOrder条件ごとにCapacity Ruleを選び、消費数量を時間へ戻してCapacity Bucketを減らす。

## Decision 016
複数工程では前工程完了時刻より前のCapacityを次工程へ使用しない。

## Decision 017
Simulation RunはScenario Dataを破壊せず、毎回再計算可能なDerived Resultとする。

## Decision 018
ScenarioはBaseを複製して変更し、差分を比較する。

## Decision 019
ImportはPreviewとCommitを分け、Error行を黙って保存しない。

## Decision 020
自動最適化、Solver、AI配置は、登録・変更・説明・検証の基盤が完成するまで導入しない。
