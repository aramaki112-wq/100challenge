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
  CapacitySnapshot
} from "./CapacitySnapshot.js";

import {
  CapacityLedgerFactory,
  CapacityLedgerRegistry,
  assertCapacityLedgerRegistry
} from "./CapacityLedgerFactory.js";

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

function snapshot(buckets) {
  return new CapacitySnapshot({
    capacityScenarioId: "CAP-BASE",
    targetMonth: "2026-08",
    generatedAt: "2026-08-01T05:00:00+09:00",
    sourceRevision: { capacity: 1 },
    buckets
  });
}

test("Snapshotの既知BucketからLedgerを一括生成する", () => {
  const registry = new CapacityLedgerFactory()
    .createFromSnapshot(snapshot([
      bucket({ shiftId: "S1", availableMinutes: 240 }),
      bucket({ shiftId: "S2", availableMinutes: 180 })
    ]));

  assert.equal(registry.ledgerCount, 2);
  assert.equal(registry.unknownBucketCount, 0);
  assert.equal(
    registry.requireLedger({
      factoryId: "F2",
      equipmentId: "EQ-A",
      date: "2026-08-03",
      shiftId: "S1"
    }).availableMinutes,
    240
  );
});

test("UNKNOWN Capacityは0分Ledgerへ変換せず別に保持する", () => {
  const unknown = bucket({
    shiftId: "S2",
    availableMinutes: null,
    availabilityStatus:
      EQUIPMENT_AVAILABILITY_STATUS.UNKNOWN,
    dataConfidence: DATA_CONFIDENCE.D,
    reasonCodes: ["CALENDAR_NOT_CONFIRMED"]
  });

  const registry = new CapacityLedgerFactory()
    .createFromSnapshot(snapshot([
      bucket({ shiftId: "S1", availableMinutes: 240 }),
      unknown
    ]));

  assert.equal(registry.ledgerCount, 1);
  assert.equal(registry.unknownBucketCount, 1);
  assert.equal(
    registry.findUnknownBucket({
      factoryId: "F2",
      equipmentId: "EQ-A",
      date: "2026-08-03",
      shiftId: "S2"
    }),
    unknown
  );
});

test("日単位検索はShift ID順で決定的に返す", () => {
  const registry = new CapacityLedgerFactory()
    .createFromSnapshot(snapshot([
      bucket({ shiftId: "S2", availableMinutes: 180 }),
      bucket({ shiftId: "S1", availableMinutes: 240 })
    ]));

  assert.deepEqual(
    registry.findLedgersForDay({
      factoryId: "F2",
      equipmentId: "EQ-A",
      date: "2026-08-03"
    }).map((ledger) => ledger.shiftId),
    ["S1", "S2"]
  );
});

test("存在しないLedgerをrequireすると明示的Errorになる", () => {
  const registry = new CapacityLedgerFactory()
    .createFromSnapshot(snapshot([]));

  assert.throws(
    () => registry.requireLedger({
      factoryId: "F2",
      equipmentId: "EQ-A",
      date: "2026-08-03",
      shiftId: "S1"
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.CAPACITY_LEDGER_NOT_FOUND
    )
  );
});

test("Registryの配列とSnapshotを外部から変更できない", () => {
  const registry = new CapacityLedgerFactory()
    .createFromSnapshot(snapshot([
      bucket({ availableMinutes: 240 })
    ]));

  const ledgers = registry.getLedgers();
  const data = registry.toSnapshot();

  assert.equal(Object.isFrozen(registry), true);
  assert.equal(Object.isFrozen(ledgers), true);
  assert.equal(Object.isFrozen(data), true);
  assert.equal(Object.isFrozen(data.ledgers), true);

  assert.throws(() => ledgers.push("invalid"), TypeError);
});

test("Registryは正式LedgerとUNKNOWN Bucketだけを受け付ける", () => {
  assert.throws(
    () => new CapacityLedgerRegistry({
      ledgers: [{}],
      unknownBuckets: []
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_LEDGER
    )
  );

  assert.throws(
    () => new CapacityLedgerRegistry({
      ledgers: [],
      unknownBuckets: [bucket()]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_SNAPSHOT
    )
  );
});

test("assertCapacityLedgerRegistryは正式Registryだけを受け付ける", () => {
  const registry = new CapacityLedgerFactory()
    .createFromSnapshot(snapshot([]));

  assert.equal(assertCapacityLedgerRegistry(registry), registry);

  assert.throws(
    () => assertCapacityLedgerRegistry({}),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_LEDGER
    )
  );
});
