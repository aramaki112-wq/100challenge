import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTOR_TYPE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  DomainEventCollector
} from "./DomainEventCollector.js";

import {
  ProductionPlan,
  PRODUCTION_PLAN_EVENT_TYPE,
  assertProductionPlan
} from "./ProductionPlan.js";

const CREATED_AT = "2026-08-01T17:55:00+09:00";
const CHANGED_AT = "2026-08-01T18:00:00+09:00";

const USER_ACTOR = Object.freeze({
  type: ACTOR_TYPE.USER,
  actorId: "USER-001",
  actorName: "Production Planner"
});

function createPlanData(overrides = {}) {
  return {
    planId: "PLAN-0001",
    name: "2026年8月 生産計画",
    targetMonth: "2026-08",
    primaryFactoryId: "F2",
    description: "DAY30診断対象",
    createdBy: "USER-001",
    createdAt: CREATED_AT,
    active: true,
    note: "Base Plan",
    ...overrides
  };
}

function createPlan(overrides = {}) {
  return new ProductionPlan(
    createPlanData(overrides)
  );
}

test(
  "Production Planを正しい初期状態から復元できる",
  () => {
    const plan = createPlan();

    assert.equal(plan.planId, "PLAN-0001");
    assert.equal(plan.name, "2026年8月 生産計画");
    assert.equal(plan.targetMonth, "2026-08");
    assert.equal(plan.primaryFactoryId, "F2");
    assert.equal(plan.active, true);
    assert.equal(plan.hasDomainEvents(), false);
  }
);

test(
  "static createはPRODUCTION_PLAN_CREATED Eventを一件記録する",
  () => {
    const plan = ProductionPlan.create(
      createPlanData(),
      {
        eventId: "EVT-0001",
        actor: USER_ACTOR,
        occurredAt: CREATED_AT,
        correlationId: "COR-0001"
      }
    );

    const events = plan.peekDomainEvents();

    assert.equal(events.length, 1);
    assert.equal(
      events[0].eventType,
      PRODUCTION_PLAN_EVENT_TYPE.CREATED
    );
    assert.equal(events[0].aggregateType, "PRODUCTION_PLAN");
    assert.equal(events[0].aggregateId, "PLAN-0001");
    assert.equal(events[0].correlationId, "COR-0001");
    assert.deepEqual(
      events[0].payload,
      plan.toSnapshot()
    );
  }
);

test(
  "Production PlanのID・名称・対象月・Primary Factoryを厳密に検証する",
  () => {
    const invalidCases = [
      [
        { planId: "" },
        ERROR_CODES.INVALID_PLAN_ID
      ],
      [
        { planId: "PLAN 0001" },
        ERROR_CODES.INVALID_PLAN_ID
      ],
      [
        { name: "   " },
        ERROR_CODES.INVALID_PLAN_NAME
      ],
      [
        { targetMonth: "2026-13" },
        ERROR_CODES.INVALID_TARGET_MONTH
      ],
      [
        { primaryFactoryId: "" },
        ERROR_CODES.INVALID_PRIMARY_FACTORY_ID
      ],
      [
        { primaryFactoryId: "FACTORY 2" },
        ERROR_CODES.INVALID_PRIMARY_FACTORY_ID
      ]
    ];

    for (const [override, expectedCode]
      of invalidCases) {
      assert.throws(
        () => createPlan(override),
        (error) => hasErrorCode(error, expectedCode)
      );
    }
  }
);

test(
  "createdAt・active・任意Textの不正値を拒否する",
  () => {
    const invalidCases = [
      [
        { createdAt: "2026-08-01T17:55:00" },
        ERROR_CODES.INVALID_DATE_TIME
      ],
      [
        { active: 1 },
        ERROR_CODES.INVALID_BOOLEAN
      ],
      [
        { description: null },
        ERROR_CODES.INVALID_PRODUCTION_PLAN_TEXT
      ],
      [
        { createdBy: [] },
        ERROR_CODES.INVALID_PRODUCTION_PLAN_TEXT
      ],
      [
        { note: 100 },
        ERROR_CODES.INVALID_PRODUCTION_PLAN_TEXT
      ]
    ];

    for (const [override, expectedCode]
      of invalidCases) {
      assert.throws(
        () => createPlan(override),
        (error) => hasErrorCode(error, expectedCode)
      );
    }
  }
);

test(
  "Snapshotは正規化され外部から変更できない",
  () => {
    const plan = createPlan({
      name: "  August Plan  ",
      description: "  Description  ",
      note: "  Note  "
    });

    const snapshot = plan.toSnapshot();

    assert.equal(snapshot.name, "August Plan");
    assert.equal(snapshot.description, "Description");
    assert.equal(snapshot.note, "Note");
    assert.equal(Object.isFrozen(snapshot), true);

    assert.throws(
      () => {
        snapshot.name = "Changed";
      },
      TypeError
    );

    assert.equal(plan.name, "August Plan");
  }
);

test(
  "renameは名称を変更して差分Eventを記録する",
  () => {
    const plan = createPlan();

    const changed = plan.rename({
      name: "2026年8月 生産計画 改訂",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0002"
    });

    assert.equal(changed, true);
    assert.equal(
      plan.name,
      "2026年8月 生産計画 改訂"
    );

    const [event] = plan.peekDomainEvents();

    assert.equal(
      event.eventType,
      PRODUCTION_PLAN_EVENT_TYPE.RENAMED
    );
    assert.deepEqual(event.payload, {
      previousName: "2026年8月 生産計画",
      name: "2026年8月 生産計画 改訂"
    });
  }
);

test(
  "同じ名称へのrenameは状態もEvent数も変更しない",
  () => {
    const plan = createPlan();

    const changed = plan.rename({
      name: "  2026年8月 生産計画  ",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-NOT-USED"
    });

    assert.equal(changed, false);
    assert.equal(plan.getDomainEventCount(), 0);
  }
);

test(
  "DescriptionとNoteを個別に変更し各Eventを記録する",
  () => {
    const plan = createPlan();

    plan.changeDescription({
      description: "Capacity診断を含む",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0003"
    });

    plan.changeNote({
      note: "管理者確認済み",
      changedAt: "2026-08-01T18:01:00+09:00",
      actor: USER_ACTOR,
      eventId: "EVT-0004"
    });

    const events = plan.peekDomainEvents();

    assert.equal(plan.description, "Capacity診断を含む");
    assert.equal(plan.note, "管理者確認済み");
    assert.deepEqual(
      events.map((event) => event.eventType),
      [
        PRODUCTION_PLAN_EVENT_TYPE.DESCRIPTION_CHANGED,
        PRODUCTION_PLAN_EVENT_TYPE.NOTE_CHANGED
      ]
    );
  }
);

test(
  "deactivateは理由を必須とし使用停止Eventを記録する",
  () => {
    const plan = createPlan();

    plan.deactivate({
      deactivatedAt: CHANGED_AT,
      actor: USER_ACTOR,
      reason: "新Versionへ移行するため",
      eventId: "EVT-0005"
    });

    const [event] = plan.peekDomainEvents();

    assert.equal(plan.active, false);
    assert.equal(
      event.eventType,
      PRODUCTION_PLAN_EVENT_TYPE.DEACTIVATED
    );
    assert.equal(
      event.payload.reason,
      "新Versionへ移行するため"
    );
  }
);

test(
  "deactivateの理由が空欄なら状態を変更しない",
  () => {
    const plan = createPlan();

    assert.throws(
      () => plan.deactivate({
        deactivatedAt: CHANGED_AT,
        actor: USER_ACTOR,
        reason: "  ",
        eventId: "EVT-0005"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_PRODUCTION_PLAN_TEXT
      )
    );

    assert.equal(plan.active, true);
    assert.equal(plan.getDomainEventCount(), 0);
  }
);

test(
  "inactive Planを再度deactivateできない",
  () => {
    const plan = createPlan({ active: false });

    assert.throws(
      () => plan.deactivate({
        deactivatedAt: CHANGED_AT,
        actor: USER_ACTOR,
        reason: "重複停止",
        eventId: "EVT-0006"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.PRODUCTION_PLAN_ALREADY_INACTIVE
      )
    );
  }
);

test(
  "inactive PlanをactivateしてEventを記録する",
  () => {
    const plan = createPlan({ active: false });

    plan.activate({
      activatedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0007"
    });

    const [event] = plan.peekDomainEvents();

    assert.equal(plan.active, true);
    assert.equal(
      event.eventType,
      PRODUCTION_PLAN_EVENT_TYPE.ACTIVATED
    );
  }
);

test(
  "active Planを再度activateできない",
  () => {
    const plan = createPlan();

    assert.throws(
      () => plan.activate({
        activatedAt: CHANGED_AT,
        actor: USER_ACTOR,
        eventId: "EVT-0008"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.PRODUCTION_PLAN_ALREADY_ACTIVE
      )
    );
  }
);

test(
  "pullDomainEventsはEventを返してCollectorを空にする",
  () => {
    const plan = ProductionPlan.create(
      createPlanData(),
      {
        eventId: "EVT-0009",
        actor: USER_ACTOR,
        occurredAt: CREATED_AT
      }
    );

    const pulled = plan.pullDomainEvents();

    assert.equal(pulled.length, 1);
    assert.equal(plan.hasDomainEvents(), false);
    assert.equal(plan.getDomainEventCount(), 0);
  }
);

test(
  "外部から渡したDomainEventCollectorへEventを蓄積できる",
  () => {
    const collector = new DomainEventCollector();

    const plan = ProductionPlan.create(
      createPlanData(),
      {
        eventId: "EVT-0010",
        actor: USER_ACTOR,
        occurredAt: CREATED_AT,
        eventCollector: collector
      }
    );

    assert.equal(plan.getDomainEventCount(), 1);
    assert.equal(collector.getEventCount(), 1);
  }
);

test(
  "targetMonthとprimaryFactoryIdは作成後に直接変更できない",
  () => {
    const plan = createPlan();

    assert.throws(
      () => {
        plan.targetMonth = "2026-09";
      },
      TypeError
    );

    assert.throws(
      () => {
        plan.primaryFactoryId = "F3";
      },
      TypeError
    );

    assert.equal(plan.targetMonth, "2026-08");
    assert.equal(plan.primaryFactoryId, "F2");
  }
);

test(
  "assertProductionPlanはProductionPlan以外を拒否する",
  () => {
    const plan = createPlan();

    assert.equal(assertProductionPlan(plan), plan);

    assert.throws(
      () => assertProductionPlan({}),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_ARGUMENT
      )
    );
  }
);

test(
  "Event生成に失敗したrenameは名称を変更しない",
  () => {
    const plan = createPlan();

    assert.throws(
      () => plan.rename({
        name: "変更されてはいけない名称",
        changedAt: CHANGED_AT,
        actor: USER_ACTOR,
        eventId: ""
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_EVENT_ID
      )
    );

    assert.equal(plan.name, "2026年8月 生産計画");
    assert.equal(plan.getDomainEventCount(), 0);
  }
);

test(
  "Event生成に失敗したdeactivateはactive状態を変更しない",
  () => {
    const plan = createPlan();

    assert.throws(
      () => plan.deactivate({
        deactivatedAt: CHANGED_AT,
        actor: { type: "UNKNOWN_ACTOR" },
        reason: "停止理由",
        eventId: "EVT-0011"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_EVENT_ACTOR
      )
    );

    assert.equal(plan.active, true);
    assert.equal(plan.getDomainEventCount(), 0);
  }
);

test(
  "Event記録に失敗した変更はEntity状態へ反映しない",
  () => {
    const plan = createPlan();

    plan.rename({
      name: "正式な改訂名",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-DUPLICATE"
    });

    assert.throws(
      () => plan.changeDescription({
        description: "変更されてはいけない説明",
        changedAt: "2026-08-01T18:01:00+09:00",
        actor: USER_ACTOR,
        eventId: "EVT-DUPLICATE"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.DUPLICATE_DOMAIN_EVENT
      )
    );

    assert.equal(plan.description, "DAY30診断対象");
    assert.equal(plan.getDomainEventCount(), 1);
  }
);
