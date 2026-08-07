import test from "node:test";
import assert from "node:assert/strict";

import {
  CAPACITY_RESOURCE_STATUS,
  CAPACITY_STATUS,
  DATA_CONFIDENCE,
  DIAGNOSIS_GRANULARITY,
  EQUIPMENT_AVAILABILITY_STATUS,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  SequentialIdGenerator
} from "./SequentialIdGenerator.js";

import {
  PlannedOperation
} from "./PlannedOperation.js";

import {
  CapacityBucket
} from "./CapacityBucket.js";

import {
  CapacitySnapshot
} from "./CapacitySnapshot.js";

import {
  CapacityLedgerFactory
} from "./CapacityLedgerFactory.js";

import {
  CAPACITY_ALLOCATION_REASON,
  CapacityAllocationService
} from "./CapacityAllocationService.js";

function operation(overrides = {}) {
  return new PlannedOperation({
    plannedOperationId: "POP-0001",
    planVersionId: "PV-0001",
    orderId: "ORDER-001",
    routingOperationId: "ROUTE-010",
    equipmentId: "EQ-A",
    plannedDate: "2026-08-03",
    shiftId: "S1",
    plannedStartTime: null,
    plannedEndTime: null,
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    ...overrides
  });
}

function bucket(overrides = {}) {
  return new CapacityBucket({
    factoryId: "F2",
    equipmentId: "EQ-A",
    date: "2026-08-03",
    shiftId: "S1",
    availableMinutes: 420,
    availabilityStatus:
      EQUIPMENT_AVAILABILITY_STATUS.AVAILABLE,
    workerStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    skillStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    assignmentStatus: CAPACITY_RESOURCE_STATUS.SATISFIED,
    reasonCodes: [],
    dataConfidence: DATA_CONFIDENCE.A,
    ...overrides
  });
}

function registry(buckets) {
  const snapshot = new CapacitySnapshot({
    capacityScenarioId: "CAP-BASE",
    targetMonth: "2026-08",
    generatedAt: "2026-08-01T05:00:00+09:00",
    sourceRevision: { capacity: 1 },
    buckets
  });

  return new CapacityLedgerFactory()
    .createFromSnapshot(snapshot);
}

function service() {
  return new CapacityAllocationService({
    idGenerator: new SequentialIdGenerator()
  });
}

test("SHIFT Operationを指定Shiftへ全量割当する", () => {
  const result = service().allocate({
    plannedOperation: operation(),
    factoryId: "F2",
    requiredMinutes: 360,
    ledgerRegistry: registry([bucket()])
  });

  assert.equal(result.status, CAPACITY_STATUS.FEASIBLE);
  assert.equal(result.allocatedMinutes, 360);
  assert.equal(result.shortageMinutes, 0);
  assert.equal(result.allocations.length, 1);
  assert.equal(
    result.allocations[0].allocationReason,
    CAPACITY_ALLOCATION_REASON.SHIFT_FIXED_BUCKET
  );
});

test("SHIFT Capacity不足はPARTIALLY_FEASIBLEになる", () => {
  const result = service().allocate({
    plannedOperation: operation(),
    factoryId: "F2",
    requiredMinutes: 480,
    ledgerRegistry: registry([bucket({ availableMinutes: 180 })])
  });

  assert.equal(result.status, CAPACITY_STATUS.PARTIALLY_FEASIBLE);
  assert.equal(result.allocatedMinutes, 180);
  assert.equal(result.shortageMinutes, 300);
});

test("指定ShiftのCapacityがUNKNOWNなら0分とせずUNKNOWNにする", () => {
  const result = service().allocate({
    plannedOperation: operation(),
    factoryId: "F2",
    requiredMinutes: 360,
    ledgerRegistry: registry([
      bucket({
        availableMinutes: null,
        availabilityStatus:
          EQUIPMENT_AVAILABILITY_STATUS.UNKNOWN,
        dataConfidence: DATA_CONFIDENCE.D,
        reasonCodes: ["CALENDAR_NOT_CONFIRMED"]
      })
    ])
  });

  assert.equal(result.status, CAPACITY_STATUS.UNKNOWN);
  assert.equal(result.allocatedMinutes, 0);
  assert.equal(result.shortageMinutes, 360);
  assert.equal(result.unknownBucketKeys.length, 1);
});

test("指定Shift Bucketが存在しない場合もUNKNOWNとして返す", () => {
  const result = service().allocate({
    plannedOperation: operation(),
    factoryId: "F2",
    requiredMinutes: 360,
    ledgerRegistry: registry([])
  });

  assert.equal(result.status, CAPACITY_STATUS.UNKNOWN);
  assert.equal(result.reasonCode, "CAPACITY_BUCKET_NOT_FOUND");
});

test("DAY Operationは複数Shiftへ順番に割り当てる", () => {
  const result = service().allocate({
    plannedOperation: operation({ shiftId: null }),
    factoryId: "F2",
    requiredMinutes: 240,
    ledgerRegistry: registry([
      bucket({ shiftId: "S2", availableMinutes: 180 }),
      bucket({ shiftId: "S1", availableMinutes: 120 })
    ])
  });

  assert.equal(result.granularity, DIAGNOSIS_GRANULARITY.DAY);
  assert.equal(result.status, CAPACITY_STATUS.FEASIBLE);
  assert.equal(result.allocatedMinutes, 240);
  assert.deepEqual(
    result.allocations.map((allocation) => allocation.shiftId),
    ["S1", "S2"]
  );
  assert.deepEqual(
    result.allocations.map((allocation) => allocation.allocatedMinutes),
    [120, 120]
  );
});

test("DAY Operationの既知Capacity不足はPARTIALLY_FEASIBLEになる", () => {
  const result = service().allocate({
    plannedOperation: operation({ shiftId: null }),
    factoryId: "F2",
    requiredMinutes: 400,
    ledgerRegistry: registry([
      bucket({ shiftId: "S1", availableMinutes: 120 }),
      bucket({ shiftId: "S2", availableMinutes: 180 })
    ])
  });

  assert.equal(result.status, CAPACITY_STATUS.PARTIALLY_FEASIBLE);
  assert.equal(result.allocatedMinutes, 300);
  assert.equal(result.shortageMinutes, 100);
});

test("DAY Operationで既知不足とUNKNOWN Shiftが混在する場合はUNKNOWNになる", () => {
  const result = service().allocate({
    plannedOperation: operation({ shiftId: null }),
    factoryId: "F2",
    requiredMinutes: 400,
    ledgerRegistry: registry([
      bucket({ shiftId: "S1", availableMinutes: 120 }),
      bucket({
        shiftId: "S2",
        availableMinutes: null,
        availabilityStatus:
          EQUIPMENT_AVAILABILITY_STATUS.UNKNOWN,
        dataConfidence: DATA_CONFIDENCE.D,
        reasonCodes: ["WORKER_NOT_CONFIRMED"]
      })
    ])
  });

  assert.equal(result.status, CAPACITY_STATUS.UNKNOWN);
  assert.equal(result.allocatedMinutes, 120);
  assert.equal(result.shortageMinutes, 280);
});

test("DAY Operationで全既知Capacityが0ならINFEASIBLEになる", () => {
  const result = service().allocate({
    plannedOperation: operation({ shiftId: null }),
    factoryId: "F2",
    requiredMinutes: 120,
    ledgerRegistry: registry([
      bucket({
        shiftId: "S1",
        availableMinutes: 0,
        availabilityStatus:
          EQUIPMENT_AVAILABILITY_STATUS.UNAVAILABLE,
        reasonCodes: ["EQUIPMENT_CLOSED"]
      }),
      bucket({
        shiftId: "S2",
        availableMinutes: 0,
        availabilityStatus:
          EQUIPMENT_AVAILABILITY_STATUS.UNAVAILABLE,
        reasonCodes: ["EQUIPMENT_CLOSED"]
      })
    ])
  });

  assert.equal(result.status, CAPACITY_STATUS.INFEASIBLE);
  assert.equal(result.allocatedMinutes, 0);
  assert.equal(result.reasonCode, "NO_AVAILABLE_CAPACITY");
});

test("DAY集計BucketとShift Bucketが混在する場合は二重計上防止のため拒否する", () => {
  assert.throws(
    () => service().allocate({
      plannedOperation: operation({ shiftId: null }),
      factoryId: "F2",
      requiredMinutes: 120,
      ledgerRegistry: registry([
        bucket({ shiftId: null, availableMinutes: 300 }),
        bucket({ shiftId: "S1", availableMinutes: 120 })
      ])
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.CAPACITY_ALLOCATION_TARGET_AMBIGUOUS
    )
  );
});

test("TIME OperationにはShift IDを必須とする", () => {
  assert.throws(
    () => service().allocate({
      plannedOperation: operation({
        shiftId: null,
        plannedStartTime: "08:00",
        plannedEndTime: "10:00"
      }),
      factoryId: "F2",
      requiredMinutes: 120,
      ledgerRegistry: registry([
        bucket({ shiftId: null, availableMinutes: 420 })
      ])
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.CAPACITY_ALLOCATION_TARGET_AMBIGUOUS
    )
  );
});

test("TIME Operationは計画時間枠を超えて割り当てない", () => {
  const result = service().allocate({
    plannedOperation: operation({
      plannedStartTime: "08:00",
      plannedEndTime: "10:00"
    }),
    factoryId: "F2",
    requiredMinutes: 180,
    ledgerRegistry: registry([bucket({ availableMinutes: 420 })])
  });

  assert.equal(result.status, CAPACITY_STATUS.PARTIALLY_FEASIBLE);
  assert.equal(result.scheduleLimitMinutes, 120);
  assert.equal(result.allocatedMinutes, 120);
  assert.equal(result.shortageMinutes, 60);
  assert.equal(result.reasonCode, "TIME_WINDOW_SHORTAGE");
});

test("同じRegistryを複数Operationで共有しCapacity二重使用を防ぐ", () => {
  const sharedRegistry = registry([
    bucket({ availableMinutes: 420 })
  ]);
  const allocator = service();

  const first = allocator.allocate({
    plannedOperation: operation({ plannedOperationId: "POP-0001" }),
    factoryId: "F2",
    requiredMinutes: 240,
    ledgerRegistry: sharedRegistry
  });

  const second = allocator.allocate({
    plannedOperation: operation({ plannedOperationId: "POP-0002" }),
    factoryId: "F2",
    requiredMinutes: 240,
    ledgerRegistry: sharedRegistry
  });

  assert.equal(first.allocatedMinutes, 240);
  assert.equal(second.allocatedMinutes, 180);
  assert.equal(second.shortageMinutes, 60);
  assert.equal(
    sharedRegistry.requireLedger({
      factoryId: "F2",
      equipmentId: "EQ-A",
      date: "2026-08-03",
      shiftId: "S1"
    }).remainingMinutes,
    0
  );
});

test("Allocation Service Resultを外部から変更できない", () => {
  const result = service().allocate({
    plannedOperation: operation(),
    factoryId: "F2",
    requiredMinutes: 120,
    ledgerRegistry: registry([bucket()])
  });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.allocations), true);
  assert.equal(Object.isFrozen(result.candidateLedgerKeys), true);
  assert.throws(() => result.allocations.push("invalid"), TypeError);
});
