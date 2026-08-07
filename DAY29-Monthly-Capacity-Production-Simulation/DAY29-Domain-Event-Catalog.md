# DAY29 Domain Event Catalog

DAY29はDAY23〜DAY28のSource EventとEvent Replayを維持する。

## Source Event

DAY28までのFactory Event：

- WORKER_ASSIGNED_TO_EQUIPMENT
- WORKER_UNASSIGNED_FROM_EQUIPMENT
- WORKER_SHIFT_ASSIGNED
- WORKER_ABSENCE_STARTED
- WORKER_ABSENCE_ENDED
- EQUIPMENT_STATUS_CHANGED
- MATERIAL_STATUS_CHANGED
- PRODUCTION_COMPLETED
- WIP_MOVED

これらはFactory Stateを再構築する事実である。

## Derived Result

DAY29の次の結果はSource Event Logへ保存しない。

- Shift Capacity Result
- Daily Capacity Result
- Monthly Capacity Result
- Production Allocation
- Production Result
- Bottleneck Result
- Scenario Comparison
- Validation Report

同じScenario Inputから再計算できるためである。

## Application Audit Candidate

将来、監査が必要になった場合は次を別Audit Logへ記録できる。

- SCENARIO_CLONED
- MASTER_IMPORTED
- CALENDAR_OVERRIDDEN
- ASSIGNMENT_CHANGED
- SIMULATION_RECALCULATED

これらをFactory Source Event Logと混在させない。
