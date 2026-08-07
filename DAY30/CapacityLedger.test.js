import test from "node:test";
import assert from "node:assert/strict";

import {
  CAPACITY_RESOURCE_STATUS,
  DATA_CONFIDENCE,
  EQUIPMENT_AVAILABILITY_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  CapacityBucket
} from "./CapacityBucket.js";

import {
  CapacityLedger,
  assertCapacityLedger
} from "./CapacityLedger.js";

function createLedger(overrides = {}) {
  return new CapacityLedger({
    factoryId: "F2",
    equipmentId: "F2_EQ_A",
    date: "2026-08-03",
    shiftId: "F2_S1",
    availableMinutes: 420,
    ...overrides
  });
}

function createBucket(overrides = {}) {
  return new CapacityBucket({
    factoryId: "F2",
    equipmentId: "F2_EQ_A",
    date: "2026-08-03",
    shiftId: "F2_S1",
    availableMinutes: 420,
    availabilityStatus:
      EQUIPMENT_AVAILABILITY_STATUS.AVAILABLE,
    workerStatus:
      CAPACITY_RESOURCE_STATUS.SATISFIED,
    skillStatus:
      CAPACITY_RESOURCE_STATUS.SATISFIED,
    assignmentStatus:
      CAPACITY_RESOURCE_STATUS.SATISFIED,
    reasonCodes: [],
    dataConfidence: DATA_CONFIDENCE.A,
    ...overrides
  });
}

function allocate(ledger, overrides = {}) {
  return ledger.allocate({
    allocationId: "CAL-0001",
    plannedOperationId: "POP-0001",
    requestedMinutes: 120,
    allocationReason: "DETERMINISTIC_OPERATION_ORDER",
    sequence: 1,
    ...overrides
  });
}

test("既知の利用可能時間から空のLedgerを生成できる", () => {
  const ledger = createLedger();

  assert.equal(ledger.key, "F2::F2_EQ_A::2026-08-03::F2_S1");
  assert.equal(ledger.availableMinutes, 420);
  assert.equal(ledger.allocatedMinutes, 0);
  assert.equal(ledger.remainingMinutes, 420);
  assert.equal(ledger.allocationCount, 0);
});

test("CapacityBucketからLedgerを生成できる", () => {
  const ledger = CapacityLedger.fromBucket(createBucket());

  assert.equal(ledger.availableMinutes, 420);
  assert.equal(ledger.factoryId, "F2");
});

test("利用可能時間がUNKNOWNのBucketからLedgerを生成しない", () => {
  const bucket = createBucket({
    availableMinutes: null,
    availabilityStatus:
      EQUIPMENT_AVAILABILITY_STATUS.UNKNOWN
  });

  assert.throws(
    () => CapacityLedger.fromBucket(bucket),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_LEDGER
    )
  );
});

test("120分要求した場合に全量割当し残り300分になる", () => {
  const ledger = createLedger();
  const result = allocate(ledger);

  assert.equal(result.requestedMinutes, 120);
  assert.equal(result.allocatedMinutes, 120);
  assert.equal(result.shortageMinutes, 0);
  assert.equal(result.remainingMinutesAfterAllocation, 300);
  assert.equal(ledger.allocatedMinutes, 120);
  assert.equal(ledger.remainingMinutes, 300);
});

test("残り180分に240分要求した場合は180分だけ割り当てる", () => {
  const ledger = createLedger({ availableMinutes: 180 });
  const result = allocate(ledger, {
    requestedMinutes: 240
  });

  assert.equal(result.allocatedMinutes, 180);
  assert.equal(result.shortageMinutes, 60);
  assert.equal(ledger.remainingMinutes, 0);
});

test("利用可能時間0分では全量不足として記録する", () => {
  const ledger = createLedger({ availableMinutes: 0 });
  const result = allocate(ledger, {
    requestedMinutes: 120
  });

  assert.equal(result.allocatedMinutes, 0);
  assert.equal(result.shortageMinutes, 120);
  assert.equal(ledger.allocatedMinutes, 0);
  assert.equal(ledger.remainingMinutes, 0);
});

test("同じ420分を二つのOperationへ合計480分割り当てない", () => {
  const ledger = createLedger();

  const first = allocate(ledger, {
    allocationId: "CAL-0001",
    plannedOperationId: "POP-0001",
    requestedMinutes: 240,
    sequence: 1
  });

  const second = allocate(ledger, {
    allocationId: "CAL-0002",
    plannedOperationId: "POP-0002",
    requestedMinutes: 240,
    sequence: 2
  });

  assert.equal(first.allocatedMinutes, 240);
  assert.equal(second.allocatedMinutes, 180);
  assert.equal(second.shortageMinutes, 60);
  assert.equal(ledger.allocatedMinutes, 420);
  assert.equal(ledger.remainingMinutes, 0);
});

test("同じAllocation IDの二重登録を拒否しLedgerを変更しない", () => {
  const ledger = createLedger();
  allocate(ledger);

  assert.throws(
    () => allocate(ledger),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DUPLICATE_CAPACITY_ALLOCATION
    )
  );

  assert.equal(ledger.allocationCount, 1);
  assert.equal(ledger.allocatedMinutes, 120);
  assert.equal(ledger.remainingMinutes, 300);
});

test("不正な割当要求ではLedgerを変更しない", () => {
  const ledger = createLedger();

  assert.throws(
    () => allocate(ledger, {
      requestedMinutes: -1
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION
    )
  );

  assert.equal(ledger.allocationCount, 0);
  assert.equal(ledger.allocatedMinutes, 0);
  assert.equal(ledger.remainingMinutes, 420);
});

test("0分要求はCapacityを消費せず監査記録として残せる", () => {
  const ledger = createLedger();
  const result = allocate(ledger, {
    requestedMinutes: 0
  });

  assert.equal(result.allocatedMinutes, 0);
  assert.equal(result.shortageMinutes, 0);
  assert.equal(ledger.remainingMinutes, 420);
  assert.equal(ledger.allocationCount, 1);
});

test("Allocation一覧とSnapshotを外部から変更できない", () => {
  const ledger = createLedger();
  allocate(ledger);

  const allocations = ledger.getAllocations();
  const snapshot = ledger.toSnapshot();

  assert.equal(Object.isFrozen(allocations), true);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.allocations), true);

  assert.throws(() => {
    allocations.push({});
  }, TypeError);

  assert.throws(() => {
    snapshot.allocations.push({});
  }, TypeError);
});

test("hasAllocationで登録済みIDを確認できる", () => {
  const ledger = createLedger();
  allocate(ledger);

  assert.equal(ledger.hasAllocation("CAL-0001"), true);
  assert.equal(ledger.hasAllocation("CAL-9999"), false);
  assert.equal(ledger.hasAllocation(null), false);
});

test("assertCapacityLedgerは正式Ledgerだけを受け付ける", () => {
  const ledger = createLedger();

  assert.equal(assertCapacityLedger(ledger), ledger);

  assert.throws(
    () => assertCapacityLedger({}),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_LEDGER
    )
  );
});
