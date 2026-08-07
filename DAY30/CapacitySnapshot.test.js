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
  CapacitySnapshot,
  assertCapacitySnapshot
} from "./CapacitySnapshot.js";

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

function createSnapshot(overrides = {}) {
  return new CapacitySnapshot({
    capacityScenarioId: "CAP-SCENARIO-BASE",
    targetMonth: "2026-08",
    generatedAt: "2026-08-01T19:00:00+09:00",
    sourceRevision: {
      capacityScenario: 3,
      calendar: 12,
      assignment: 7,
      capacityRule: 4
    },
    buckets: [
      createBucket(),
      createBucket({
        shiftId: "F2_S2",
        availableMinutes: 360
      })
    ],
    ...overrides
  });
}

test("DAY29 Capacityを読み取り専用Snapshotとして復元できる", () => {
  const snapshot = createSnapshot();

  assert.equal(snapshot.capacityScenarioId, "CAP-SCENARIO-BASE");
  assert.equal(snapshot.targetMonth, "2026-08");
  assert.equal(snapshot.bucketCount, 2);
  assert.equal(snapshot.hasEquipment("F2_EQ_A"), true);
});

test("Scenario・対象月・生成日時・Revisionを厳密に検証する", () => {
  const cases = [
    [{ capacityScenarioId: "" }, ERROR_CODES.INVALID_CAPACITY_SCENARIO_ID],
    [{ targetMonth: "2026/08" }, ERROR_CODES.INVALID_TARGET_MONTH],
    [{ generatedAt: "2026-08-01T19:00:00" }, ERROR_CODES.INVALID_DATE_TIME],
    [{ sourceRevision: {} }, ERROR_CODES.INVALID_SOURCE_REVISION],
    [{ sourceRevision: { calendar: -1 } }, ERROR_CODES.INVALID_SOURCE_REVISION]
  ];

  for (const [overrides, code] of cases) {
    assert.throws(
      () => createSnapshot(overrides),
      (error) => hasErrorCode(error, code)
    );
  }
});

test("CapacityBucket以外をSnapshotへ入れられない", () => {
  assert.throws(
    () => createSnapshot({ buckets: [{}] }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_SNAPSHOT
    )
  );
});

test("Bucketの日付はSnapshotの対象月内でなければならない", () => {
  assert.throws(
    () => createSnapshot({
      buckets: [
        createBucket({ date: "2026-09-01" })
      ]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_SNAPSHOT
    )
  );
});

test("同じFactory・Equipment・Date・Shiftの重複Bucketを拒否する", () => {
  assert.throws(
    () => createSnapshot({
      buckets: [createBucket(), createBucket()]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DUPLICATE_CAPACITY_BUCKET
    )
  );
});

test("Factory・Equipment・Date・ShiftでBucketを検索できる", () => {
  const snapshot = createSnapshot();
  const bucket = snapshot.findBucket({
    factoryId: "F2",
    equipmentId: "F2_EQ_A",
    date: "2026-08-03",
    shiftId: "F2_S2"
  });

  assert.equal(bucket.availableMinutes, 360);
  assert.equal(
    snapshot.findBucket({
      factoryId: "F2",
      equipmentId: "F2_EQ_A",
      date: "2026-08-04",
      shiftId: "F2_S2"
    }),
    null
  );
});

test("存在しないBucketをrequireした場合は明示的Errorにする", () => {
  const snapshot = createSnapshot();

  assert.throws(
    () => snapshot.requireBucket({
      factoryId: "F2",
      equipmentId: "F2_EQ_A",
      date: "2026-08-04",
      shiftId: "F2_S1"
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.CAPACITY_BUCKET_NOT_FOUND
    )
  );
});

test("Equipment・日付単位で複数Shiftを取得できる", () => {
  const snapshot = createSnapshot();
  const buckets = snapshot.findBucketsForDay({
    factoryId: "F2",
    equipmentId: "F2_EQ_A",
    date: "2026-08-03"
  });

  assert.equal(buckets.length, 2);
  assert.deepEqual(
    buckets.map((bucket) => bucket.shiftId),
    ["F2_S1", "F2_S2"]
  );
  assert.equal(Object.isFrozen(buckets), true);
});

test("同じEquipment IDでもFactoryを指定して絞り込める", () => {
  const snapshot = createSnapshot({
    buckets: [
      createBucket(),
      createBucket({
        factoryId: "F3",
        shiftId: "F3_S1",
        availableMinutes: 300
      })
    ]
  });

  assert.equal(
    snapshot.findBucketsForDay({
      factoryId: "F3",
      equipmentId: "F2_EQ_A",
      date: "2026-08-03"
    }).length,
    1
  );
});

test("検索Indexを外部へ公開しない", () => {
  const snapshot = createSnapshot();

  assert.equal(snapshot._bucketByKey, undefined);
  assert.equal(snapshot._bucketsByEquipment, undefined);
  assert.equal(
    snapshot.findBucket({
      factoryId: "F2",
      equipmentId: "F2_EQ_A",
      date: "2026-08-03",
      shiftId: "F2_S1"
    }).availableMinutes,
    420
  );
});

test("SnapshotとSource RevisionとBucketsを外部から変更できない", () => {
  const snapshot = createSnapshot();
  const plain = snapshot.toSnapshot();

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.sourceRevision), true);
  assert.equal(Object.isFrozen(snapshot.buckets), true);
  assert.equal(Object.isFrozen(plain), true);
  assert.equal(Object.isFrozen(plain.buckets), true);

  assert.throws(() => {
    plain.sourceRevision.calendar = 99;
  }, TypeError);

  assert.throws(() => {
    plain.buckets.push({});
  }, TypeError);
});

test("assertCapacitySnapshotは正式Snapshotだけを受け付ける", () => {
  const snapshot = createSnapshot();
  assert.equal(assertCapacitySnapshot(snapshot), snapshot);

  assert.throws(
    () => assertCapacitySnapshot({}),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_SNAPSHOT
    )
  );
});
