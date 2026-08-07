import test from "node:test";
import assert from "node:assert/strict";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  CapacityAllocation,
  assertCapacityAllocation
} from "./CapacityAllocation.js";

function createAllocation(overrides = {}) {
  return new CapacityAllocation({
    allocationId: "CAL-0001",
    plannedOperationId: "POP-0001",
    factoryId: "F2",
    equipmentId: "F2_EQ_A",
    date: "2026-08-03",
    shiftId: "F2_S1",
    sequence: 1,
    requestedMinutes: 240,
    allocatedMinutes: 180,
    shortageMinutes: 60,
    remainingMinutesAfterAllocation: 0,
    allocationReason: "DETERMINISTIC_OPERATION_ORDER",
    ...overrides
  });
}

test("Capacity割当結果を不変Objectとして生成できる", () => {
  const allocation = createAllocation();

  assert.equal(allocation.ledgerKey, "F2::F2_EQ_A::2026-08-03::F2_S1");
  assert.equal(allocation.isPartialAllocation(), true);
  assert.equal(allocation.isFullAllocation(), false);
  assert.equal(allocation.isZeroAllocation(), false);
  assert.equal(Object.isFrozen(allocation), true);
});

test("requestedMinutesとallocatedMinutesとshortageMinutesの整合性を検証する", () => {
  const cases = [
    {
      allocatedMinutes: 241,
      shortageMinutes: 0
    },
    {
      allocatedMinutes: 180,
      shortageMinutes: 50
    },
    {
      requestedMinutes: -1
    }
  ];

  for (const overrides of cases) {
    assert.throws(
      () => createAllocation(overrides),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_CAPACITY_ALLOCATION
      )
    );
  }
});

test("全量割当・部分割当・ゼロ割当を区別できる", () => {
  const full = createAllocation({
    requestedMinutes: 120,
    allocatedMinutes: 120,
    shortageMinutes: 0,
    remainingMinutesAfterAllocation: 300
  });

  const partial = createAllocation();

  const zero = createAllocation({
    requestedMinutes: 120,
    allocatedMinutes: 0,
    shortageMinutes: 120,
    remainingMinutesAfterAllocation: 0
  });

  assert.equal(full.isFullAllocation(), true);
  assert.equal(partial.isPartialAllocation(), true);
  assert.equal(zero.isZeroAllocation(), true);
});

test("日単位LedgerのKeyではShiftをDAYとして表す", () => {
  const allocation = createAllocation({ shiftId: null });

  assert.equal(
    allocation.ledgerKey,
    "F2::F2_EQ_A::2026-08-03::DAY"
  );
});

test("Allocation Snapshotを外部から変更できない", () => {
  const snapshot = createAllocation().toSnapshot();

  assert.equal(Object.isFrozen(snapshot), true);

  assert.throws(() => {
    snapshot.allocatedMinutes = 999;
  }, TypeError);
});

test("assertCapacityAllocationは正式Objectだけを受け付ける", () => {
  const allocation = createAllocation();

  assert.equal(
    assertCapacityAllocation(allocation),
    allocation
  );

  assert.throws(
    () => assertCapacityAllocation({}),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_ALLOCATION
    )
  );
});
