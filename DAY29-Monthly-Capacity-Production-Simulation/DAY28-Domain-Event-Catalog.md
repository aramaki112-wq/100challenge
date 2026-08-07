# DAY28 Domain・Event Catalog

## 追加Domain

| Name | Type | Responsibility |
|---|---|---|
| TimeSlot | Value Object | 半開時間区間、包含、重複、隣接判定 |
| AvailabilityCalendar | Domain Object | Worker別の時間的Availability保持 |
| WorkerCapacity | Value Object | Available CapacityとCommitted Capacityの分離 |
| EquipmentCapacity | Value Object | Time Slot内の設備成立能力0/1 |
| FactoryCapacity | Value Object | 同時成立Equipment Capacityの集約 |
| CapacityPeriod | Domain Object | 一つのTime SlotのCapacity Snapshot |
| CapacityWindow | Domain Object | 同一Capacityが連続する時間窓 |
| CapacityCalendar | Domain Object | Period・Window・Capacity Minutesの保持 |

## 追加Application Service・Function

| Name | Responsibility |
|---|---|
| evaluateWorkerTemporalAvailability | Assignmentを含めず時間的Availabilityを評価 |
| buildCapacityTimeSlots | Intervalと状態変化境界からTime Slotを生成 |
| BuildCapacityCalendar | DAY27評価を複数Time Slotへ展開 |
| deriveCapacityEvents | Capacity変化をDerived Eventへ変換 |

## 追加Derived Event

| Event | Meaning |
|---|---|
| WORKER_BECAME_AVAILABLE | Workerが時間的に利用可能へ変化 |
| WORKER_BECAME_UNAVAILABLE | Workerが時間的に利用不能へ変化 |
| SHIFT_STARTED | Shift内へ入った |
| SHIFT_ENDED | Shift外へ出た |
| EQUIPMENT_CAPACITY_CHANGED | Equipment Capacity Unitが変化 |
| FACTORY_CAPACITY_CHANGED | Factory Capacity Unitが変化 |
| CAPACITY_CHANGED | Capacityの一般的な変化通知 |

## 保存方針

上記Derived EventはLocalStorageへ保存しない。

Source Event Logから再計算可能なため、Capacity Calendar Resultにだけ含める。
