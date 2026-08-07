import test from "node:test";
import assert from "node:assert/strict";

import {
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  PlannedOperation
} from "./PlannedOperation.js";

import {
  OperationSortService
} from "./OperationSortService.js";

const service = new OperationSortService();

function operation(id, overrides = {}) {
  return new PlannedOperation({
    plannedOperationId: id,
    planVersionId: "PV-0001",
    orderId: `ORDER-${id}`,
    routingOperationId: `ROUTE-${id}`,
    equipmentId: "EQ-A",
    plannedDate: "2026-08-03",
    shiftId: null,
    plannedStartTime: null,
    plannedEndTime: null,
    plannedQuantity: 10,
    quantityUnit: QUANTITY_UNIT.PIECE,
    priority: null,
    ...overrides
  });
}

function ids(values) {
  return values.map((value) => value.plannedOperationId);
}

test("TIME・SHIFT・DAYの順で並べる", () => {
  const day = operation("POP-DAY");
  const shift = operation("POP-SHIFT", { shiftId: "S1" });
  const time = operation("POP-TIME", {
    shiftId: "S1",
    plannedStartTime: "08:00",
    plannedEndTime: "09:00"
  });

  const result = service.sort({
    plannedOperations: [day, shift, time]
  });

  assert.deepEqual(ids(result), [
    "POP-TIME",
    "POP-SHIFT",
    "POP-DAY"
  ]);
});

test("Operation priorityが小さいものを先にする", () => {
  const result = service.sort({
    plannedOperations: [
      operation("POP-B", { priority: 2 }),
      operation("POP-A", { priority: 1 })
    ]
  });

  assert.deepEqual(ids(result), ["POP-A", "POP-B"]);
});

test("Order priorityが小さいOrderを先にする", () => {
  const a = operation("POP-A", { orderId: "ORDER-A" });
  const b = operation("POP-B", { orderId: "ORDER-B" });

  const result = service.sort({
    plannedOperations: [a, b],
    orders: [
      { orderId: "ORDER-A", priority: 5 },
      { orderId: "ORDER-B", priority: 1 }
    ]
  });

  assert.deepEqual(ids(result), ["POP-B", "POP-A"]);
});

test("納期が早いOrderを先にする", () => {
  const a = operation("POP-A", { orderId: "ORDER-A" });
  const b = operation("POP-B", { orderId: "ORDER-B" });

  const result = service.sort({
    plannedOperations: [a, b],
    orders: [
      { orderId: "ORDER-A", dueDate: "2026-08-20" },
      { orderId: "ORDER-B", dueDate: "2026-08-10" }
    ]
  });

  assert.deepEqual(ids(result), ["POP-B", "POP-A"]);
});

test("TIME同士では開始時刻が早いOperationを先にする", () => {
  const early = operation("POP-EARLY", {
    shiftId: "S1",
    plannedStartTime: "08:00",
    plannedEndTime: "09:00"
  });
  const late = operation("POP-LATE", {
    shiftId: "S1",
    plannedStartTime: "10:00",
    plannedEndTime: "11:00"
  });

  const result = service.sort({
    plannedOperations: [late, early]
  });

  assert.deepEqual(ids(result), ["POP-EARLY", "POP-LATE"]);
});

test("Routing sequenceが小さい工程を先にする", () => {
  const a = operation("POP-A", {
    routingOperationId: "ROUTE-A"
  });
  const b = operation("POP-B", {
    routingOperationId: "ROUTE-B"
  });

  const result = service.sort({
    plannedOperations: [a, b],
    routingOperations: [
      { routingOperationId: "ROUTE-A", sequence: 20 },
      { routingOperationId: "ROUTE-B", sequence: 10 }
    ]
  });

  assert.deepEqual(ids(result), ["POP-B", "POP-A"]);
});

test("最後はplannedOperationIdで決定的に並べる", () => {
  const result = service.sort({
    plannedOperations: [
      operation("POP-0002"),
      operation("POP-0001")
    ]
  });

  assert.deepEqual(ids(result), ["POP-0001", "POP-0002"]);
});

test("入力配列順が変わっても結果は変わらない", () => {
  const values = [
    operation("POP-0003", { priority: 2 }),
    operation("POP-0001", { priority: 1 }),
    operation("POP-0002", { priority: 1 })
  ];

  const first = service.sort({ plannedOperations: values });
  const second = service.sort({
    plannedOperations: [...values].reverse()
  });

  assert.deepEqual(ids(first), ids(second));
});

test("Order・Routing情報が未登録でもIDを使って再現可能に並べる", () => {
  const result = service.sort({
    plannedOperations: [
      operation("POP-B"),
      operation("POP-A")
    ],
    orders: [],
    routingOperations: []
  });

  assert.deepEqual(ids(result), ["POP-A", "POP-B"]);
});

test("入力配列を変更せず、結果配列を変更不能にする", () => {
  const input = [operation("POP-B"), operation("POP-A")];
  const original = [...input];

  const result = service.sort({ plannedOperations: input });

  assert.deepEqual(input, original);
  assert.equal(Object.isFrozen(result), true);
  assert.throws(() => result.push(operation("POP-C")), TypeError);
});

test("重複Operation IDを拒否する", () => {
  assert.throws(
    () => service.sort({
      plannedOperations: [
        operation("POP-001"),
        operation("POP-001")
      ]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT
    )
  );
});
