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
  CapacityBucket,
  assertCapacityBucket
} from "./CapacityBucket.js";

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

test("既知の利用可能Capacity Bucketを復元できる", () => {
  const bucket = createBucket();

  assert.equal(bucket.availableMinutes, 420);
  assert.equal(bucket.isKnown(), true);
  assert.equal(bucket.isUsable(), true);
  assert.equal(
    bucket.key,
    "F2::F2_EQ_A::2026-08-03::F2_S1"
  );
});

test("日単位BucketはShift IDなしで一意Keyを持つ", () => {
  const bucket = createBucket({ shiftId: null });

  assert.equal(
    bucket.key,
    "F2::F2_EQ_A::2026-08-03::DAY"
  );
});

test("ID・日付・Status・Confidenceを厳密に検証する", () => {
  const cases = [
    [{ factoryId: "" }, ERROR_CODES.INVALID_FACTORY_ID],
    [{ equipmentId: "EQ A" }, ERROR_CODES.INVALID_EQUIPMENT_ID],
    [{ date: "2026-02-30" }, ERROR_CODES.INVALID_DATE],
    [{ availabilityStatus: "OPEN" }, ERROR_CODES.INVALID_CAPACITY_BUCKET],
    [{ workerStatus: "ENOUGH" }, ERROR_CODES.INVALID_CAPACITY_BUCKET],
    [{ dataConfidence: "HIGH" }, ERROR_CODES.INVALID_CAPACITY_BUCKET]
  ];

  for (const [overrides, code] of cases) {
    assert.throws(
      () => createBucket(overrides),
      (error) => hasErrorCode(error, code)
    );
  }
});

test("availableMinutesは0以上の整数またはnullだけを許可する", () => {
  assert.equal(
    createBucket({ availableMinutes: 0 }).availableMinutes,
    0
  );

  assert.throws(
    () => createBucket({ availableMinutes: -1 }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_CAPACITY_BUCKET)
  );

  assert.throws(
    () => createBucket({ availableMinutes: 10.5 }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_CAPACITY_BUCKET)
  );
});

test("0分は確認済みのCapacityなしとしてnullと区別する", () => {
  const zero = createBucket({
    availableMinutes: 0,
    availabilityStatus:
      EQUIPMENT_AVAILABILITY_STATUS.UNAVAILABLE,
    reasonCodes: ["EQUIPMENT_CLOSED"]
  });

  const unknown = createBucket({
    availableMinutes: null,
    availabilityStatus:
      EQUIPMENT_AVAILABILITY_STATUS.UNKNOWN,
    reasonCodes: ["CALENDAR_NOT_CONFIRMED"],
    dataConfidence: DATA_CONFIDENCE.D
  });

  assert.equal(zero.availableMinutes, 0);
  assert.equal(zero.isKnown(), true);
  assert.equal(zero.isUsable(), false);

  assert.equal(unknown.availableMinutes, null);
  assert.equal(unknown.isKnown(), false);
  assert.equal(unknown.isUsable(), false);
});

test("全条件既知なのにavailableMinutesがnullの状態を拒否する", () => {
  assert.throws(
    () => createBucket({ availableMinutes: null }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_BUCKET_STATE
    )
  );
});

test("UNAVAILABLE設備はavailableMinutes=0だけを許可する", () => {
  assert.throws(
    () => createBucket({
      availabilityStatus:
        EQUIPMENT_AVAILABILITY_STATUS.UNAVAILABLE,
      availableMinutes: 120
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_BUCKET_STATE
    )
  );
});

test("UNSATISFIED Resourceは利用可能時間を0にする", () => {
  const zero = createBucket({
    availableMinutes: 0,
    workerStatus:
      CAPACITY_RESOURCE_STATUS.UNSATISFIED,
    reasonCodes: ["WORKER_SHORTAGE"]
  });

  assert.equal(zero.isKnown(), true);
  assert.equal(zero.isUsable(), false);

  assert.throws(
    () => createBucket({
      availableMinutes: 60,
      skillStatus:
        CAPACITY_RESOURCE_STATUS.UNSATISFIED
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_BUCKET_STATE
    )
  );
});

test("PARTIALLY_SATISFIED条件では正のCapacityを保持できる", () => {
  const bucket = createBucket({
    availableMinutes: 180,
    workerStatus:
      CAPACITY_RESOURCE_STATUS.PARTIALLY_SATISFIED,
    reasonCodes: ["WORKER_PARTIAL"]
  });

  assert.equal(bucket.isKnown(), true);
  assert.equal(bucket.isUsable(), true);
});

test("Reason Codeは重複なしのUpper Snake Caseに限定する", () => {
  const bucket = createBucket({
    reasonCodes: [
      "WORKER_PARTIAL",
      "SKILL_LIMITED"
    ]
  });

  assert.equal(bucket.hasReasonCode("SKILL_LIMITED"), true);

  assert.throws(
    () => createBucket({ reasonCodes: ["worker shortage"] }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_REASON_CODE
    )
  );

  assert.throws(
    () => createBucket({ reasonCodes: ["WORKER_SHORTAGE", "WORKER_SHORTAGE"] }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_REASON_CODE
    )
  );
});

test("BucketとSnapshotを外部から変更できない", () => {
  const bucket = createBucket({
    reasonCodes: ["CONFIRMED_CAPACITY"]
  });
  const snapshot = bucket.toSnapshot();

  assert.equal(Object.isFrozen(bucket), true);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.reasonCodes), true);

  assert.throws(() => {
    snapshot.reasonCodes.push("OTHER");
  }, TypeError);
});

test("assertCapacityBucketは正式Bucketだけを受け付ける", () => {
  const bucket = createBucket();
  assert.equal(assertCapacityBucket(bucket), bucket);

  assert.throws(
    () => assertCapacityBucket({}),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_CAPACITY_BUCKET)
  );
});
