import test from "node:test";
import assert from "node:assert/strict";

import {
  QUANTITY_UNIT,
  ROUTING_CHECK_REASON,
  ROUTING_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  PlannedOperation
} from "./PlannedOperation.js";

import {
  RoutingDiagnosisService
} from "./RoutingDiagnosisService.js";

const service = new RoutingDiagnosisService();

const routingOperations = Object.freeze([
  { routingId: "ROUTING-A", routingOperationId: "RO-10", sequence: 10 },
  { routingId: "ROUTING-A", routingOperationId: "RO-20", sequence: 20 },
  { routingId: "ROUTING-A", routingOperationId: "RO-30", sequence: 30 }
]);

function operation(id, routingOperationId, overrides = {}) {
  return new PlannedOperation({
    plannedOperationId: id,
    planVersionId: "PV-0001",
    orderId: "ORDER-0001",
    routingOperationId,
    equipmentId: `EQ-${routingOperationId}`,
    plannedDate: "2026-08-04",
    shiftId: null,
    plannedStartTime: null,
    plannedEndTime: null,
    plannedQuantity: 10,
    quantityUnit: QUANTITY_UNIT.PIECE,
    ...overrides
  });
}

function diagnose(current, others, options = {}) {
  return service.diagnose({
    plannedOperation: current,
    plannedOperations: others,
    routingOperations,
    shifts: [],
    ...options
  });
}

test("前工程が前日・後工程が翌日ならVALIDになる", () => {
  const previous = operation("POP-10", "RO-10", {
    plannedDate: "2026-08-03"
  });
  const current = operation("POP-20", "RO-20");
  const next = operation("POP-30", "RO-30", {
    plannedDate: "2026-08-05"
  });

  const result = diagnose(current, [previous, current, next]);

  assert.equal(result.status, ROUTING_STATUS.VALID);
  assert.equal(result.checks.length, 2);
});

test("前工程が現工程より後日に計画されていればINVALIDになる", () => {
  const previous = operation("POP-10", "RO-10", {
    plannedDate: "2026-08-05"
  });
  const current = operation("POP-20", "RO-20");

  const result = diagnose(current, [previous, current]);

  assert.equal(result.status, ROUTING_STATUS.INVALID);
  assert.equal(
    result.checks[0].reasonCode,
    ROUTING_CHECK_REASON.PREVIOUS_OPERATION_PLANNED_AFTER_CURRENT
  );
});

test("後工程が現工程より前日に計画されていればINVALIDになる", () => {
  const current = operation("POP-20", "RO-20");
  const next = operation("POP-30", "RO-30", {
    plannedDate: "2026-08-03"
  });

  const result = diagnose(current, [current, next]);

  assert.equal(result.status, ROUTING_STATUS.INVALID);
  assert.equal(
    result.checks.at(-1).reasonCode,
    ROUTING_CHECK_REASON.NEXT_OPERATION_PLANNED_BEFORE_CURRENT
  );
});

test("同日でも前工程終了時刻が現工程開始以前ならVALIDになる", () => {
  const previous = operation("POP-10", "RO-10", {
    shiftId: "S1",
    plannedStartTime: "08:00",
    plannedEndTime: "09:00"
  });
  const current = operation("POP-20", "RO-20", {
    shiftId: "S1",
    plannedStartTime: "09:00",
    plannedEndTime: "10:00"
  });

  const result = diagnose(current, [previous, current]);

  assert.equal(result.checks[0].status, ROUTING_STATUS.VALID);
  assert.equal(
    result.checks[0].reasonCode,
    ROUTING_CHECK_REASON.PREVIOUS_OPERATION_ENDS_BEFORE_CURRENT
  );
});

test("同日の前工程と現工程が重なればINVALIDになる", () => {
  const previous = operation("POP-10", "RO-10", {
    shiftId: "S1",
    plannedStartTime: "08:00",
    plannedEndTime: "09:30"
  });
  const current = operation("POP-20", "RO-20", {
    shiftId: "S1",
    plannedStartTime: "09:00",
    plannedEndTime: "10:00"
  });

  const result = diagnose(current, [previous, current]);

  assert.equal(result.status, ROUTING_STATUS.INVALID);
  assert.equal(
    result.checks[0].reasonCode,
    ROUTING_CHECK_REASON.PREVIOUS_OPERATION_OVERLAPS_CURRENT
  );
});

test("同日の後工程が現工程終了後に始まればVALIDになる", () => {
  const current = operation("POP-20", "RO-20", {
    shiftId: "S1",
    plannedStartTime: "09:00",
    plannedEndTime: "10:00"
  });
  const next = operation("POP-30", "RO-30", {
    shiftId: "S1",
    plannedStartTime: "10:00",
    plannedEndTime: "11:00"
  });

  const result = diagnose(current, [current, next]);

  assert.equal(result.checks.at(-1).status, ROUTING_STATUS.VALID);
});

test("同日で時刻もShift順も確認できなければUNKNOWNになる", () => {
  const previous = operation("POP-10", "RO-10");
  const current = operation("POP-20", "RO-20");

  const result = diagnose(current, [previous, current]);

  assert.equal(result.status, ROUTING_STATUS.UNKNOWN);
  assert.equal(
    result.checks[0].reasonCode,
    ROUTING_CHECK_REASON.SAME_DAY_SEQUENCE_UNCONFIRMED
  );
});

test("Shift順が分かれば同日の前後関係を確認できる", () => {
  const previous = operation("POP-10", "RO-10", { shiftId: "S1" });
  const current = operation("POP-20", "RO-20", { shiftId: "S2" });
  const next = operation("POP-30", "RO-30", { shiftId: "S3" });

  const result = diagnose(current, [previous, current, next], {
    shifts: [
      { shiftId: "S1", sequence: 1 },
      { shiftId: "S2", sequence: 2 },
      { shiftId: "S3", sequence: 3 }
    ]
  });

  assert.equal(result.status, ROUTING_STATUS.VALID);
  assert.deepEqual(result.reasonCodes, [
    ROUTING_CHECK_REASON.PREVIOUS_SHIFT_BEFORE_CURRENT,
    ROUTING_CHECK_REASON.NEXT_SHIFT_AFTER_CURRENT
  ]);
});

test("前工程が後のShiftならINVALIDになる", () => {
  const previous = operation("POP-10", "RO-10", { shiftId: "S2" });
  const current = operation("POP-20", "RO-20", { shiftId: "S1" });

  const result = diagnose(current, [previous, current], {
    shifts: [
      { shiftId: "S1", sequence: 1 },
      { shiftId: "S2", sequence: 2 }
    ]
  });

  assert.equal(result.status, ROUTING_STATUS.INVALID);
  assert.equal(
    result.checks[0].reasonCode,
    ROUTING_CHECK_REASON.PREVIOUS_SHIFT_AFTER_CURRENT
  );
});

test("Shift IDがあっても順序MasterがなければUNKNOWNになる", () => {
  const previous = operation("POP-10", "RO-10", { shiftId: "S1" });
  const current = operation("POP-20", "RO-20", { shiftId: "S2" });

  const result = diagnose(current, [previous, current]);

  assert.equal(result.status, ROUTING_STATUS.UNKNOWN);
});

test("隣接工程の計画が存在しなければUNKNOWNになる", () => {
  const current = operation("POP-20", "RO-20");

  const result = diagnose(current, [current]);

  assert.equal(result.status, ROUTING_STATUS.UNKNOWN);
  assert.equal(result.checks.length, 2);
  assert.equal(
    result.checks[0].reasonCode,
    ROUTING_CHECK_REASON.ADJACENT_OPERATION_NOT_PLANNED
  );
});

test("Routing定義に現工程がなければUNKNOWNになる", () => {
  const current = operation("POP-99", "RO-99");

  const result = diagnose(current, [current]);

  assert.equal(result.status, ROUTING_STATUS.UNKNOWN);
  assert.deepEqual(result.reasonCodes, [
    ROUTING_CHECK_REASON.ROUTING_DEFINITION_NOT_FOUND
  ]);
});

test("単一工程RoutingはNOT_APPLICABLEになる", () => {
  const current = operation("POP-10", "RO-10");

  const result = service.diagnose({
    plannedOperation: current,
    plannedOperations: [current],
    routingOperations: [
      { routingId: "SINGLE", routingOperationId: "RO-10", sequence: 1 }
    ]
  });

  assert.equal(result.status, ROUTING_STATUS.NOT_APPLICABLE);
  assert.equal(result.checks.length, 0);
});

test("同一Routing内の重複SequenceをSource不整合として拒否する", () => {
  const current = operation("POP-20", "RO-20");

  assert.throws(
    () => service.diagnose({
      plannedOperation: current,
      plannedOperations: [current],
      routingOperations: [
        { routingId: "R", routingOperationId: "RO-10", sequence: 1 },
        { routingId: "R", routingOperationId: "RO-20", sequence: 1 }
      ]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT
    )
  );
});

test("同じOrder・Routing工程のPlanned Operationが複数あれば拒否する", () => {
  const current = operation("POP-20", "RO-20");
  const previousA = operation("POP-10-A", "RO-10");
  const previousB = operation("POP-10-B", "RO-10");

  assert.throws(
    () => diagnose(current, [current, previousA, previousB]),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT
    )
  );
});

test("別Order・別Plan VersionのOperationを隣接工程に使わない", () => {
  const current = operation("POP-20", "RO-20");
  const otherOrder = operation("POP-10-X", "RO-10", {
    orderId: "ORDER-X"
  });
  const otherVersion = operation("POP-30-X", "RO-30", {
    planVersionId: "PV-X"
  });

  const result = diagnose(current, [current, otherOrder, otherVersion]);

  assert.equal(result.status, ROUTING_STATUS.UNKNOWN);
  assert.equal(result.checks.every(
    (check) => check.adjacentPlannedOperationId === null
  ), true);
});

test("結果と内部配列を外部から変更できない", () => {
  const previous = operation("POP-10", "RO-10", {
    plannedDate: "2026-08-03"
  });
  const current = operation("POP-20", "RO-20");

  const result = diagnose(current, [previous, current]);

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.checks), true);
  assert.equal(Object.isFrozen(result.checks[0].currentSchedule), true);
  assert.throws(() => result.checks.push({}), TypeError);
});
