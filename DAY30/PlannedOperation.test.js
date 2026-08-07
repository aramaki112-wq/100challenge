import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTOR_TYPE,
  DIAGNOSIS_GRANULARITY,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  DomainEventCollector
} from "./DomainEventCollector.js";

import {
  PlannedOperation,
  PLANNED_OPERATION_EVENT_TYPE,
  assertPlannedOperation
} from "./PlannedOperation.js";

const CREATED_AT = "2026-08-01T18:30:00+09:00";
const CHANGED_AT = "2026-08-01T19:00:00+09:00";

const USER_ACTOR = Object.freeze({
  type: ACTOR_TYPE.USER,
  actorId: "USER-001",
  actorName: "Production Planner"
});

function createOperationData(overrides = {}) {
  return {
    plannedOperationId: "POP-0001",
    planVersionId: "PV-0001",
    orderId: "ORDER-001",
    routingOperationId: "ROUTE-OP-010",
    equipmentId: "F2-EQ-001",
    plannedDate: "2026-08-03",
    shiftId: null,
    plannedStartTime: null,
    plannedEndTime: null,
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    priority: 1,
    productGroup: "PIPE",
    materialGroup: "SUS304",
    dimensionGroup: "OD50_WT5",
    outsideDiameter: 50,
    wallThickness: 5,
    processingType: "COLD_PILGER",
    difficultyClass: "NORMAL",
    operationType: "PROCESSING",
    note: "",
    ...overrides
  };
}

function createOperation(overrides = {}, options = {}) {
  return new PlannedOperation(
    createOperationData(overrides),
    options
  );
}

test(
  "日単位Planned Operationを正しい状態から復元できる",
  () => {
    const operation = createOperation();

    assert.equal(operation.plannedOperationId, "POP-0001");
    assert.equal(operation.planVersionId, "PV-0001");
    assert.equal(operation.plannedQuantity, 60);
    assert.equal(operation.quantityUnit, QUANTITY_UNIT.PIECE);
    assert.equal(
      operation.getDiagnosisGranularity(),
      DIAGNOSIS_GRANULARITY.DAY
    );
    assert.equal(operation.plannedDurationMinutes, null);
    assert.equal(operation.hasDomainEvents(), false);
  }
);

test(
  "static createはPLANNED_OPERATION_ADDED Eventを記録する",
  () => {
    const operation = PlannedOperation.create(
      createOperationData(),
      {
        eventId: "EVT-0200",
        actor: USER_ACTOR,
        occurredAt: CREATED_AT,
        correlationId: "COR-0200"
      }
    );

    const [event] = operation.peekDomainEvents();

    assert.equal(
      event.eventType,
      PLANNED_OPERATION_EVENT_TYPE.ADDED
    );
    assert.equal(event.aggregateType, "PLANNED_OPERATION");
    assert.equal(event.aggregateId, "POP-0001");
    assert.equal(event.correlationId, "COR-0200");
    assert.deepEqual(event.payload, operation.toSnapshot());
  }
);

test(
  "必須IDに空欄または空白を含む値を使用できない",
  () => {
    const cases = [
      [{ plannedOperationId: "" }, ERROR_CODES.INVALID_PLANNED_OPERATION_ID],
      [{ planVersionId: "PV 0001" }, ERROR_CODES.INVALID_PLAN_VERSION_ID],
      [{ orderId: "" }, ERROR_CODES.INVALID_ORDER_ID],
      [{ routingOperationId: "ROUTE OP" }, ERROR_CODES.INVALID_ROUTING_OPERATION_ID],
      [{ equipmentId: "" }, ERROR_CODES.INVALID_EQUIPMENT_ID]
    ];

    for (const [override, code] of cases) {
      assert.throws(
        () => createOperation(override),
        (error) => hasErrorCode(error, code)
      );
    }
  }
);

test(
  "実在しない計画日を拒否する",
  () => {
    assert.throws(
      () => createOperation({ plannedDate: "2026-02-30" }),
      (error) => hasErrorCode(error, ERROR_CODES.INVALID_DATE)
    );
  }
);

test(
  "Shift指定でSHIFT粒度になる",
  () => {
    const operation = createOperation({ shiftId: "S1" });

    assert.equal(
      operation.getDiagnosisGranularity(),
      DIAGNOSIS_GRANULARITY.SHIFT
    );
  }
);

test(
  "開始・終了時刻指定でTIME粒度と所要時間を保持する",
  () => {
    const operation = createOperation({
      shiftId: "S1",
      plannedStartTime: "08:00",
      plannedEndTime: "10:30"
    });

    assert.equal(
      operation.getDiagnosisGranularity(),
      DIAGNOSIS_GRANULARITY.TIME
    );
    assert.equal(operation.plannedDurationMinutes, 150);
  }
);

test(
  "開始または終了時刻の片方だけを指定できない",
  () => {
    for (const override of [
      { plannedStartTime: "08:00", plannedEndTime: null },
      { plannedStartTime: null, plannedEndTime: "10:00" }
    ]) {
      assert.throws(
        () => createOperation(override),
        (error) => hasErrorCode(
          error,
          ERROR_CODES.INCOMPLETE_TIME_RANGE
        )
      );
    }
  }
);

test(
  "同時刻および日またぎ時刻をTIME計画として許可しない",
  () => {
    for (const override of [
      { plannedStartTime: "08:00", plannedEndTime: "08:00" },
      { plannedStartTime: "22:00", plannedEndTime: "06:00" }
    ]) {
      assert.throws(
        () => createOperation(override),
        (error) => hasErrorCode(
          error,
          ERROR_CODES.INVALID_TIME_RANGE
        )
      );
    }
  }
);

test(
  "PIECEとLOTは正の整数数量だけを許可する",
  () => {
    const invalidCases = [
      { plannedQuantity: 0 },
      { plannedQuantity: -1 },
      { plannedQuantity: 10.5 },
      {
        plannedQuantity: 1.5,
        quantityUnit: QUANTITY_UNIT.LOT
      }
    ];

    for (const override of invalidCases) {
      assert.throws(
        () => createOperation(override),
        (error) => hasErrorCode(
          error,
          ERROR_CODES.INVALID_PLANNED_QUANTITY
        )
      );
    }
  }
);

test(
  "KILOGRAMは正の小数数量を許可する",
  () => {
    const operation = createOperation({
      plannedQuantity: 1250.75,
      quantityUnit: QUANTITY_UNIT.KILOGRAM
    });

    assert.equal(operation.plannedQuantity, 1250.75);
  }
);

test(
  "未登録数量単位を拒否する",
  () => {
    assert.throws(
      () => createOperation({ quantityUnit: "TON" }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_QUANTITY_UNIT
      )
    );
  }
);

test(
  "Priorityはnullまたは正の整数だけを許可する",
  () => {
    assert.equal(createOperation({ priority: null }).priority, null);
    assert.equal(createOperation({ priority: 2 }).priority, 2);

    for (const priority of [0, -1, 1.5]) {
      assert.throws(
        () => createOperation({ priority }),
        (error) => hasErrorCode(error, ERROR_CODES.INVALID_PRIORITY)
      );
    }
  }
);

test(
  "外径と肉厚は未入力または正の有限数だけを許可する",
  () => {
    for (const override of [
      { outsideDiameter: 0 },
      { wallThickness: -1 },
      { outsideDiameter: Number.NaN }
    ]) {
      assert.throws(
        () => createOperation(override),
        (error) => hasErrorCode(
          error,
          ERROR_CODES.INVALID_OPERATION_DIMENSION
        )
      );
    }
  }
);

test(
  "日時・Shift・時刻を一つのrescheduleで変更する",
  () => {
    const operation = createOperation();

    operation.reschedule({
      plannedDate: "2026-08-04",
      shiftId: "S2",
      plannedStartTime: "13:00",
      plannedEndTime: "15:00",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      reason: "設備停止を回避するため",
      eventId: "EVT-0201"
    });

    const [event] = operation.peekDomainEvents();

    assert.equal(operation.plannedDate, "2026-08-04");
    assert.equal(operation.shiftId, "S2");
    assert.equal(operation.plannedDurationMinutes, 120);
    assert.equal(
      operation.getDiagnosisGranularity(),
      DIAGNOSIS_GRANULARITY.TIME
    );
    assert.equal(
      event.eventType,
      PLANNED_OPERATION_EVENT_TYPE.RESCHEDULED
    );
    assert.equal(event.payload.reason, "設備停止を回避するため");
  }
);

test(
  "同じScheduleへの変更はEventを作らない",
  () => {
    const operation = createOperation();

    const changed = operation.reschedule({
      plannedDate: "2026-08-03",
      shiftId: null,
      plannedStartTime: null,
      plannedEndTime: null,
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      reason: "変更なし",
      eventId: "EVT-0202"
    });

    assert.equal(changed, false);
    assert.equal(operation.getDomainEventCount(), 0);
  }
);

test(
  "設備変更を理由とEventとともに記録する",
  () => {
    const operation = createOperation();

    operation.changeEquipment({
      equipmentId: "F2-EQ-002",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      reason: "代替設備へ変更",
      eventId: "EVT-0203"
    });

    const [event] = operation.peekDomainEvents();

    assert.equal(operation.equipmentId, "F2-EQ-002");
    assert.equal(
      event.eventType,
      PLANNED_OPERATION_EVENT_TYPE.EQUIPMENT_CHANGED
    );
    assert.equal(event.payload.previousEquipmentId, "F2-EQ-001");
  }
);

test(
  "数量と単位を一つの変更として記録する",
  () => {
    const operation = createOperation();

    operation.changeQuantity({
      plannedQuantity: 1000.5,
      quantityUnit: QUANTITY_UNIT.KILOGRAM,
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      reason: "受注数量の単位変更",
      eventId: "EVT-0204"
    });

    const [event] = operation.peekDomainEvents();

    assert.equal(operation.plannedQuantity, 1000.5);
    assert.equal(operation.quantityUnit, QUANTITY_UNIT.KILOGRAM);
    assert.equal(
      event.eventType,
      PLANNED_OPERATION_EVENT_TYPE.QUANTITY_CHANGED
    );
    assert.equal(event.payload.previousQuantityUnit, QUANTITY_UNIT.PIECE);
  }
);

test(
  "Priorityを設定・解除できる",
  () => {
    const operation = createOperation();

    operation.changePriority({
      priority: null,
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      reason: "明示優先を解除",
      eventId: "EVT-0205"
    });

    assert.equal(operation.priority, null);
    assert.equal(
      operation.peekDomainEvents()[0].eventType,
      PLANNED_OPERATION_EVENT_TYPE.PRIORITY_CHANGED
    );
  }
);

test(
  "能力Rule選択条件をまとめて変更する",
  () => {
    const operation = createOperation();

    operation.changeCapacityConditions({
      productGroup: "PIPE",
      materialGroup: "SUS329J4L",
      dimensionGroup: "OD60_WT6",
      outsideDiameter: 60,
      wallThickness: 6,
      processingType: "COLD_PILGER",
      difficultyClass: "HIGH",
      operationType: "PROCESSING",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      reason: "製造条件確定",
      eventId: "EVT-0206"
    });

    const context = operation.toCapacityContext();
    const [event] = operation.peekDomainEvents();

    assert.equal(context.materialGroup, "SUS329J4L");
    assert.equal(context.outsideDiameter, 60);
    assert.equal(
      event.eventType,
      PLANNED_OPERATION_EVENT_TYPE.CAPACITY_CONDITIONS_CHANGED
    );
  }
);

test(
  "Note変更は計画条件変更と別Eventにする",
  () => {
    const operation = createOperation();

    operation.changeNote({
      note: "現場確認待ち",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0207"
    });

    assert.equal(operation.note, "現場確認待ち");
    assert.equal(
      operation.peekDomainEvents()[0].eventType,
      PLANNED_OPERATION_EVENT_TYPE.NOTE_CHANGED
    );
  }
);

test(
  "toCapacityContextは診断に必要な計画条件だけを返す",
  () => {
    const operation = createOperation({
      shiftId: "S1",
      plannedStartTime: "08:00",
      plannedEndTime: "10:00",
      note: "診断には不要"
    });

    const context = operation.toCapacityContext();

    assert.equal(context.plannedOperationId, "POP-0001");
    assert.equal(context.diagnosisGranularity, DIAGNOSIS_GRANULARITY.TIME);
    assert.equal(context.plannedDurationMinutes, 120);
    assert.equal("note" in context, false);
    assert.equal(Object.isFrozen(context), true);
  }
);

test(
  "Snapshotを外部から変更できない",
  () => {
    const operation = createOperation();
    const snapshot = operation.toSnapshot();

    assert.equal(Object.isFrozen(snapshot), true);

    assert.throws(
      () => {
        snapshot.equipmentId = "F2-EQ-999";
      },
      TypeError
    );

    assert.equal(operation.equipmentId, "F2-EQ-001");
  }
);

test(
  "Event記録失敗時は設備状態を変更しない",
  () => {
    const collector = new DomainEventCollector();
    const operation = createOperation({}, { eventCollector: collector });

    operation.changeNote({
      note: "先行Event",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-DUPLICATE"
    });

    assert.throws(
      () => operation.changeEquipment({
        equipmentId: "F2-EQ-002",
        changedAt: CHANGED_AT,
        actor: USER_ACTOR,
        reason: "代替設備",
        eventId: "EVT-DUPLICATE"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.DUPLICATE_DOMAIN_EVENT
      )
    );

    assert.equal(operation.equipmentId, "F2-EQ-001");
    assert.equal(operation.getDomainEventCount(), 1);
  }
);


test(
  "実際の計画条件変更には理由を必要とし同値入力では理由を要求しない",
  () => {
    const operation = createOperation();

    assert.equal(
      operation.changeEquipment({
        equipmentId: "F2-EQ-001",
        changedAt: CHANGED_AT,
        actor: USER_ACTOR,
        eventId: "EVT-0220"
      }),
      false
    );

    assert.throws(
      () => operation.changeEquipment({
        equipmentId: "F2-EQ-002",
        changedAt: CHANGED_AT,
        actor: USER_ACTOR,
        reason: "  ",
        eventId: "EVT-0221"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_PLANNED_OPERATION_TEXT
      )
    );

    assert.equal(operation.equipmentId, "F2-EQ-001");
    assert.equal(operation.getDomainEventCount(), 0);
  }
);

test(
  "assertPlannedOperationは正式Entityだけを受け付ける",
  () => {
    const operation = createOperation();

    assert.equal(assertPlannedOperation(operation), operation);

    assert.throws(
      () => assertPlannedOperation({}),
      (error) => hasErrorCode(error, ERROR_CODES.INVALID_ARGUMENT)
    );
  }
);
