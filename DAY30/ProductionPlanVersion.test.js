import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTOR_TYPE,
  PLAN_VERSION_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  ProductionPlanVersion,
  PLAN_VERSION_EVENT_TYPE,
  assertProductionPlanVersion
} from "./ProductionPlanVersion.js";

const CREATED_AT = "2026-08-01T18:00:00+09:00";
const REVIEWED_AT = "2026-08-01T18:10:00+09:00";
const APPROVED_AT = "2026-08-01T18:20:00+09:00";
const SUPERSEDED_AT = "2026-08-02T08:00:00+09:00";
const ARCHIVED_AT = "2026-08-03T08:00:00+09:00";

const USER_ACTOR = Object.freeze({
  type: ACTOR_TYPE.USER,
  actorId: "USER-001",
  actorName: "Production Planner"
});

function createVersionData(overrides = {}) {
  return {
    planVersionId: "PV-0001",
    planId: "PLAN-0001",
    versionNumber: 1,
    versionName: "Initial Plan",
    status: PLAN_VERSION_STATUS.DRAFT,
    sourceVersionId: null,
    changeReason: "Initial creation",
    createdBy: "USER-001",
    createdAt: CREATED_AT,
    active: true,
    note: "",
    ...overrides
  };
}

function createVersion(overrides = {}) {
  return new ProductionPlanVersion(
    createVersionData(overrides)
  );
}

function moveToReview(version, eventId = "EVT-0100") {
  version.submitForReview({
    submittedAt: REVIEWED_AT,
    actor: USER_ACTOR,
    eventId
  });
}

function moveToApproved(version) {
  moveToReview(version, "EVT-0101");
  version.approve({
    approvedAt: APPROVED_AT,
    actor: USER_ACTOR,
    eventId: "EVT-0102"
  });
}

test(
  "Production Plan Versionを正しい状態から復元できる",
  () => {
    const version = createVersion();

    assert.equal(version.planVersionId, "PV-0001");
    assert.equal(version.planId, "PLAN-0001");
    assert.equal(version.versionNumber, 1);
    assert.equal(version.status, PLAN_VERSION_STATUS.DRAFT);
    assert.equal(version.active, true);
    assert.equal(version.hasDomainEvents(), false);
  }
);

test(
  "static createはPLAN_VERSION_CREATED Eventを記録する",
  () => {
    const version = ProductionPlanVersion.create(
      createVersionData(),
      {
        eventId: "EVT-0001",
        actor: USER_ACTOR,
        occurredAt: CREATED_AT,
        correlationId: "COR-0001"
      }
    );

    const [event] = version.peekDomainEvents();

    assert.equal(event.eventType, PLAN_VERSION_EVENT_TYPE.CREATED);
    assert.equal(event.aggregateType, "PLAN_VERSION");
    assert.equal(event.aggregateId, "PV-0001");
    assert.equal(event.correlationId, "COR-0001");
    assert.deepEqual(event.payload, version.toSnapshot());
  }
);

test(
  "ID・Version番号・名称・Statusを厳密に検証する",
  () => {
    const invalidCases = [
      [{ planVersionId: "" }, ERROR_CODES.INVALID_PLAN_VERSION_ID],
      [{ planVersionId: "PV 0001" }, ERROR_CODES.INVALID_PLAN_VERSION_ID],
      [{ planId: "" }, ERROR_CODES.INVALID_PLAN_ID],
      [{ versionNumber: 0 }, ERROR_CODES.INVALID_PLAN_VERSION_NUMBER],
      [{ versionNumber: 1.5 }, ERROR_CODES.INVALID_PLAN_VERSION_NUMBER],
      [{ versionName: "  " }, ERROR_CODES.INVALID_PLAN_VERSION_NAME],
      [{ status: "PUBLISHED" }, ERROR_CODES.INVALID_PLAN_VERSION_STATUS]
    ];

    for (const [override, expectedCode] of invalidCases) {
      assert.throws(
        () => createVersion(override),
        (error) => hasErrorCode(error, expectedCode)
      );
    }
  }
);

test(
  "Source Versionは自分自身を参照できない",
  () => {
    assert.throws(
      () => createVersion({ sourceVersionId: "PV-0001" }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.SOURCE_VERSION_SELF_REFERENCE
      )
    );
  }
);

test(
  "SUPERSEDEDとARCHIVEDはactive=trueで復元できない",
  () => {
    for (const status of [
      PLAN_VERSION_STATUS.SUPERSEDED,
      PLAN_VERSION_STATUS.ARCHIVED
    ]) {
      assert.throws(
        () => createVersion({ status, active: true }),
        (error) => hasErrorCode(
          error,
          ERROR_CODES.INVALID_PLAN_VERSION_STATE
        )
      );
    }
  }
);

test(
  "DRAFTとREVIEWは編集可能でAPPROVED以降は編集不可",
  () => {
    assert.equal(createVersion().isEditable(), true);
    assert.equal(
      createVersion({ status: PLAN_VERSION_STATUS.REVIEW }).isEditable(),
      true
    );

    for (const [status, active] of [
      [PLAN_VERSION_STATUS.APPROVED, true],
      [PLAN_VERSION_STATUS.SUPERSEDED, false],
      [PLAN_VERSION_STATUS.ARCHIVED, false]
    ]) {
      const version = createVersion({ status, active });

      assert.equal(version.isEditable(), false);
      assert.throws(
        () => version.assertEditable(),
        (error) => hasErrorCode(
          error,
          ERROR_CODES.PLAN_VERSION_NOT_EDITABLE
        )
      );
    }
  }
);

test(
  "DRAFTからREVIEWへ提出できる",
  () => {
    const version = createVersion();

    version.submitForReview({
      submittedAt: REVIEWED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0002"
    });

    const [event] = version.peekDomainEvents();

    assert.equal(version.status, PLAN_VERSION_STATUS.REVIEW);
    assert.equal(
      event.eventType,
      PLAN_VERSION_EVENT_TYPE.SUBMITTED_FOR_REVIEW
    );
    assert.equal(event.payload.previousStatus, PLAN_VERSION_STATUS.DRAFT);
    assert.equal(event.payload.status, PLAN_VERSION_STATUS.REVIEW);
  }
);

test(
  "REVIEWから理由付きでDRAFTへ差し戻せる",
  () => {
    const version = createVersion({ status: PLAN_VERSION_STATUS.REVIEW });

    version.returnToDraft({
      returnedAt: REVIEWED_AT,
      actor: USER_ACTOR,
      reason: "設備割当を再確認するため",
      eventId: "EVT-0003"
    });

    const [event] = version.peekDomainEvents();

    assert.equal(version.status, PLAN_VERSION_STATUS.DRAFT);
    assert.equal(
      event.eventType,
      PLAN_VERSION_EVENT_TYPE.RETURNED_TO_DRAFT
    );
    assert.equal(event.payload.reason, "設備割当を再確認するため");
  }
);

test(
  "差戻し理由が空欄なら状態を変更しない",
  () => {
    const version = createVersion({ status: PLAN_VERSION_STATUS.REVIEW });

    assert.throws(
      () => version.returnToDraft({
        returnedAt: REVIEWED_AT,
        actor: USER_ACTOR,
        reason: "  ",
        eventId: "EVT-0004"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_PLAN_VERSION_TEXT
      )
    );

    assert.equal(version.status, PLAN_VERSION_STATUS.REVIEW);
    assert.equal(version.getDomainEventCount(), 0);
  }
);

test(
  "REVIEWからAPPROVEDへ承認できる",
  () => {
    const version = createVersion({ status: PLAN_VERSION_STATUS.REVIEW });

    version.approve({
      approvedAt: APPROVED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0005"
    });

    const [event] = version.peekDomainEvents();

    assert.equal(version.status, PLAN_VERSION_STATUS.APPROVED);
    assert.equal(event.eventType, PLAN_VERSION_EVENT_TYPE.APPROVED);
    assert.equal(version.isEditable(), false);
  }
);

test(
  "DRAFTから直接APPROVEDへ変更できない",
  () => {
    const version = createVersion();

    assert.throws(
      () => version.approve({
        approvedAt: APPROVED_AT,
        actor: USER_ACTOR,
        eventId: "EVT-0006"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_PLAN_VERSION_TRANSITION
      )
    );

    assert.equal(version.status, PLAN_VERSION_STATUS.DRAFT);
    assert.equal(version.getDomainEventCount(), 0);
  }
);

test(
  "APPROVEDをReplacement Version付きでSUPERSEDEDにできる",
  () => {
    const version = createVersion({
      status: PLAN_VERSION_STATUS.APPROVED
    });

    version.markSuperseded({
      supersededAt: SUPERSEDED_AT,
      actor: USER_ACTOR,
      replacementVersionId: "PV-0002",
      eventId: "EVT-0007"
    });

    const [event] = version.peekDomainEvents();

    assert.equal(version.status, PLAN_VERSION_STATUS.SUPERSEDED);
    assert.equal(version.active, false);
    assert.equal(event.eventType, PLAN_VERSION_EVENT_TYPE.SUPERSEDED);
    assert.equal(event.payload.replacementVersionId, "PV-0002");
  }
);

test(
  "Replacement Versionに自分自身を指定できない",
  () => {
    const version = createVersion({
      status: PLAN_VERSION_STATUS.APPROVED
    });

    assert.throws(
      () => version.markSuperseded({
        supersededAt: SUPERSEDED_AT,
        actor: USER_ACTOR,
        replacementVersionId: "PV-0001",
        eventId: "EVT-0008"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.REPLACEMENT_VERSION_SELF_REFERENCE
      )
    );

    assert.equal(version.status, PLAN_VERSION_STATUS.APPROVED);
    assert.equal(version.active, true);
  }
);

test(
  "SUPERSEDEDを理由付きでARCHIVEDにできる",
  () => {
    const version = createVersion({
      status: PLAN_VERSION_STATUS.SUPERSEDED,
      active: false
    });

    version.archive({
      archivedAt: ARCHIVED_AT,
      actor: USER_ACTOR,
      reason: "監査保管へ移行",
      eventId: "EVT-0009"
    });

    const [event] = version.peekDomainEvents();

    assert.equal(version.status, PLAN_VERSION_STATUS.ARCHIVED);
    assert.equal(version.active, false);
    assert.equal(event.eventType, PLAN_VERSION_EVENT_TYPE.ARCHIVED);
    assert.equal(event.payload.reason, "監査保管へ移行");
  }
);

test(
  "正式経路以外のStatus遷移を拒否する",
  () => {
    const cases = [
      [PLAN_VERSION_STATUS.REVIEW, "submitForReview"],
      [PLAN_VERSION_STATUS.APPROVED, "returnToDraft"],
      [PLAN_VERSION_STATUS.DRAFT, "markSuperseded"],
      [PLAN_VERSION_STATUS.APPROVED, "archive"]
    ];

    for (const [status, method] of cases) {
      const version = createVersion({
        status,
        active: ![
          PLAN_VERSION_STATUS.SUPERSEDED,
          PLAN_VERSION_STATUS.ARCHIVED
        ].includes(status)
      });

      const calls = {
        submitForReview: () => version.submitForReview({
          submittedAt: REVIEWED_AT,
          actor: USER_ACTOR,
          eventId: `EVT-${status}-1`
        }),
        returnToDraft: () => version.returnToDraft({
          returnedAt: REVIEWED_AT,
          actor: USER_ACTOR,
          reason: "Invalid transition",
          eventId: `EVT-${status}-2`
        }),
        markSuperseded: () => version.markSuperseded({
          supersededAt: SUPERSEDED_AT,
          actor: USER_ACTOR,
          replacementVersionId: "PV-0002",
          eventId: `EVT-${status}-3`
        }),
        archive: () => version.archive({
          archivedAt: ARCHIVED_AT,
          actor: USER_ACTOR,
          reason: "Invalid transition",
          eventId: `EVT-${status}-4`
        })
      };

      assert.throws(
        calls[method],
        (error) => hasErrorCode(
          error,
          ERROR_CODES.INVALID_PLAN_VERSION_TRANSITION
        )
      );
    }
  }
);

test(
  "renameはDRAFTまたはREVIEWだけで許可する",
  () => {
    const draft = createVersion();

    assert.equal(draft.rename({
      versionName: "Revised Draft",
      changedAt: REVIEWED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0010"
    }), true);
    assert.equal(draft.versionName, "Revised Draft");

    const approved = createVersion({
      status: PLAN_VERSION_STATUS.APPROVED
    });

    assert.throws(
      () => approved.rename({
        versionName: "Renamed Approved",
        changedAt: APPROVED_AT,
        actor: USER_ACTOR,
        eventId: "EVT-0011"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.PLAN_VERSION_NOT_EDITABLE
      )
    );
  }
);

test(
  "同じ名称・Noteへの変更はEventを作らない",
  () => {
    const version = createVersion({ note: "Note" });

    assert.equal(version.rename({ versionName: "Initial Plan" }), false);
    assert.equal(version.changeNote({ note: " Note " }), false);
    assert.equal(version.getDomainEventCount(), 0);
  }
);

test(
  "承認後も監査NoteはEvent付きで追記できる",
  () => {
    const version = createVersion({
      status: PLAN_VERSION_STATUS.APPROVED
    });

    version.changeNote({
      note: "経営会議承認済み",
      changedAt: APPROVED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0012"
    });

    const [event] = version.peekDomainEvents();

    assert.equal(version.note, "経営会議承認済み");
    assert.equal(event.eventType, PLAN_VERSION_EVENT_TYPE.NOTE_CHANGED);
    assert.equal(event.payload.status, PLAN_VERSION_STATUS.APPROVED);
  }
);

test(
  "Event記録失敗時はStatusを変更しない",
  () => {
    const version = createVersion();

    version.submitForReview({
      submittedAt: REVIEWED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-DUPLICATE"
    });

    assert.throws(
      () => version.returnToDraft({
        returnedAt: APPROVED_AT,
        actor: USER_ACTOR,
        reason: "差戻し",
        eventId: "EVT-DUPLICATE"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.DUPLICATE_DOMAIN_EVENT
      )
    );

    assert.equal(version.status, PLAN_VERSION_STATUS.REVIEW);
    assert.equal(version.getDomainEventCount(), 1);
  }
);

test(
  "Snapshotは不変で現在状態を保持する",
  () => {
    const version = createVersion({
      sourceVersionId: "PV-0000",
      note: "Snapshot"
    });

    const snapshot = version.toSnapshot();

    assert.equal(snapshot.sourceVersionId, "PV-0000");
    assert.equal(Object.isFrozen(snapshot), true);

    assert.throws(
      () => {
        snapshot.status = PLAN_VERSION_STATUS.APPROVED;
      },
      TypeError
    );

    assert.equal(version.status, PLAN_VERSION_STATUS.DRAFT);
  }
);

test(
  "pullDomainEvents後は同じEventを再取得しない",
  () => {
    const version = createVersion();
    moveToReview(version, "EVT-0013");

    assert.equal(version.pullDomainEvents().length, 1);
    assert.equal(version.pullDomainEvents().length, 0);
    assert.equal(version.hasDomainEvents(), false);
  }
);

test(
  "assertProductionPlanVersionは正しい型だけを受け付ける",
  () => {
    const version = createVersion();

    assert.equal(assertProductionPlanVersion(version), version);

    assert.throws(
      () => assertProductionPlanVersion({}),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_ARGUMENT
      )
    );
  }
);
