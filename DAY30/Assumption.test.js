import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTOR_TYPE,
  ASSUMPTION_CONFIDENCE,
  ASSUMPTION_EVIDENCE_TYPE,
  ASSUMPTION_IMPACT_LEVEL,
  ASSUMPTION_STATUS,
  ASSUMPTION_TARGET_TYPE,
  ASSUMPTION_TYPE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  DomainEventCollector
} from "./DomainEventCollector.js";

import {
  Assumption,
  ASSUMPTION_EVENT_TYPE,
  assertAssumption
} from "./Assumption.js";

const REGISTERED_AT = "2026-08-01T18:30:00+09:00";
const CHANGED_AT = "2026-08-01T19:00:00+09:00";
const CONFIRMED_AT = "2026-08-02T08:00:00+09:00";

const USER_ACTOR = Object.freeze({
  type: ACTOR_TYPE.USER,
  actorId: "USER-001",
  actorName: "Production Planner"
});

function createAssumptionData(overrides = {}) {
  return {
    assumptionId: "ASM-0001",
    assumptionType: ASSUMPTION_TYPE.MATERIAL_ARRIVAL,
    targetType: ASSUMPTION_TARGET_TYPE.PLANNED_OPERATION,
    targetId: "POP-0001",
    description: "材料が2026-08-03の始業前までに到着する",
    status: ASSUMPTION_STATUS.UNKNOWN,
    confidence: null,
    owner: "Material Control",
    confirmationDueDate: "2026-08-02",
    confirmedAt: null,
    confirmedBy: "",
    evidenceType: null,
    evidence: "",
    sourceUpdatedAt: null,
    validFrom: null,
    validTo: null,
    blocking: true,
    impactLevel: ASSUMPTION_IMPACT_LEVEL.CRITICAL,
    impactDescription: "未到着なら加工を開始できない",
    note: "",
    ...overrides
  };
}

function createAssumption(overrides = {}, options = {}) {
  return new Assumption(
    createAssumptionData(overrides),
    options
  );
}

function createConfirmedAssumption(overrides = {}) {
  return createAssumption({
    status: ASSUMPTION_STATUS.CONFIRMED,
    confirmedAt: CONFIRMED_AT,
    confirmedBy: "USER-002",
    evidenceType: ASSUMPTION_EVIDENCE_TYPE.SYSTEM_RECORD,
    evidence: "入荷予定確定記録",
    sourceUpdatedAt: CONFIRMED_AT,
    validFrom: "2026-08-02",
    validTo: "2026-08-05",
    ...overrides
  });
}

test(
  "UNKNOWN Assumptionを正しい初期状態から復元できる",
  () => {
    const assumption = createAssumption();

    assert.equal(assumption.assumptionId, "ASM-0001");
    assert.equal(assumption.status, ASSUMPTION_STATUS.UNKNOWN);
    assert.equal(assumption.blocking, true);
    assert.equal(assumption.hasDomainEvents(), false);
  }
);

test(
  "static createはASSUMPTION_REGISTERED Eventを記録する",
  () => {
    const assumption = Assumption.create(
      createAssumptionData(),
      {
        eventId: "EVT-0300",
        actor: USER_ACTOR,
        occurredAt: REGISTERED_AT,
        correlationId: "COR-0300"
      }
    );

    const [event] = assumption.peekDomainEvents();

    assert.equal(event.eventType, ASSUMPTION_EVENT_TYPE.REGISTERED);
    assert.equal(event.aggregateType, "ASSUMPTION");
    assert.equal(event.aggregateId, "ASM-0001");
    assert.equal(event.correlationId, "COR-0300");
    assert.deepEqual(event.payload, assumption.toSnapshot());
  }
);

test(
  "Assumption ID・Type・Target・Descriptionを厳密に検証する",
  () => {
    const cases = [
      [{ assumptionId: "" }, ERROR_CODES.INVALID_ASSUMPTION_ID],
      [{ assumptionId: "ASM 0001" }, ERROR_CODES.INVALID_ASSUMPTION_ID],
      [{ assumptionType: "MAYBE" }, ERROR_CODES.INVALID_ASSUMPTION_TYPE],
      [{ targetType: "MACHINE" }, ERROR_CODES.INVALID_ASSUMPTION_TARGET],
      [{ targetId: "" }, ERROR_CODES.INVALID_ASSUMPTION_TARGET],
      [{ description: "   " }, ERROR_CODES.INVALID_ASSUMPTION_TEXT]
    ];

    for (const [override, code] of cases) {
      assert.throws(
        () => createAssumption(override),
        (error) => hasErrorCode(error, code)
      );
    }
  }
);

test(
  "Evidence・Impact・Confidenceの未登録Codeを拒否する",
  () => {
    const cases = [
      [{ evidenceType: "PHONE" }, ERROR_CODES.INVALID_ASSUMPTION_EVIDENCE],
      [{ impactLevel: "VERY_HIGH" }, ERROR_CODES.INVALID_ASSUMPTION_IMPACT_LEVEL],
      [{ status: ASSUMPTION_STATUS.EXPECTED, confidence: "MAYBE" }, ERROR_CODES.INVALID_ASSUMPTION_CONFIDENCE]
    ];

    for (const [override, code] of cases) {
      assert.throws(
        () => createAssumption(override),
        (error) => hasErrorCode(error, code)
      );
    }
  }
);

test(
  "EXPECTEDにはConfidenceが必要でUNKNOWNにはConfidenceを持たせない",
  () => {
    assert.throws(
      () => createAssumption({
        status: ASSUMPTION_STATUS.EXPECTED,
        confidence: null
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_ASSUMPTION_STATE
      )
    );

    assert.throws(
      () => createAssumption({
        status: ASSUMPTION_STATUS.UNKNOWN,
        confidence: ASSUMPTION_CONFIDENCE.LOW
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_ASSUMPTION_STATE
      )
    );
  }
);

test(
  "CONFIRMEDとREJECTEDには判断日時と判断者が必要",
  () => {
    assert.throws(
      () => createAssumption({
        status: ASSUMPTION_STATUS.CONFIRMED
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.CONFIRMED_AT_REQUIRED
      )
    );

    assert.throws(
      () => createAssumption({
        status: ASSUMPTION_STATUS.REJECTED,
        confirmedAt: CONFIRMED_AT,
        confirmedBy: "USER-002",
        evidence: ""
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_ASSUMPTION_EVIDENCE
      )
    );
  }
);

test(
  "validFromがvalidToより後の場合を拒否する",
  () => {
    assert.throws(
      () => createAssumption({
        validFrom: "2026-08-05",
        validTo: "2026-08-04"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_VALIDITY_PERIOD
      )
    );
  }
);

test(
  "UNKNOWNからEXPECTEDへ変更し見込み情報を記録する",
  () => {
    const assumption = createAssumption();

    assumption.markExpected({
      confidence: ASSUMPTION_CONFIDENCE.HIGH,
      owner: "Purchasing",
      confirmationDueDate: "2026-08-02",
      evidenceType: ASSUMPTION_EVIDENCE_TYPE.EMAIL,
      evidence: "仕入先から出荷予定連絡あり",
      sourceUpdatedAt: CHANGED_AT,
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0301"
    });

    const [event] = assumption.peekDomainEvents();

    assert.equal(assumption.status, ASSUMPTION_STATUS.EXPECTED);
    assert.equal(assumption.confidence, ASSUMPTION_CONFIDENCE.HIGH);
    assert.equal(assumption.owner, "Purchasing");
    assert.equal(event.eventType, ASSUMPTION_EVENT_TYPE.EXPECTED);
    assert.equal(event.payload.previousStatus, ASSUMPTION_STATUS.UNKNOWN);
  }
);

test(
  "同じEXPECTED情報への更新はEventを作らない",
  () => {
    const assumption = createAssumption({
      status: ASSUMPTION_STATUS.EXPECTED,
      confidence: ASSUMPTION_CONFIDENCE.HIGH,
      evidenceType: ASSUMPTION_EVIDENCE_TYPE.EMAIL,
      evidence: "出荷予定",
      sourceUpdatedAt: CHANGED_AT
    });

    const changed = assumption.markExpected({
      confidence: ASSUMPTION_CONFIDENCE.HIGH,
      owner: "Material Control",
      confirmationDueDate: "2026-08-02",
      evidenceType: ASSUMPTION_EVIDENCE_TYPE.EMAIL,
      evidence: "出荷予定",
      sourceUpdatedAt: CHANGED_AT,
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-NOT-USED"
    });

    assert.equal(changed, false);
    assert.equal(assumption.getDomainEventCount(), 0);
  }
);

test(
  "EXPECTEDからCONFIRMEDへ変更しValidityとEvidenceを記録する",
  () => {
    const assumption = createAssumption({
      status: ASSUMPTION_STATUS.EXPECTED,
      confidence: ASSUMPTION_CONFIDENCE.MEDIUM
    });

    assumption.confirm({
      confirmedAt: CONFIRMED_AT,
      confirmedBy: "USER-002",
      evidenceType: ASSUMPTION_EVIDENCE_TYPE.SYSTEM_RECORD,
      evidence: "入荷予定確定",
      sourceUpdatedAt: CONFIRMED_AT,
      validFrom: "2026-08-02",
      validTo: "2026-08-05",
      actor: USER_ACTOR,
      eventId: "EVT-0302"
    });

    const [event] = assumption.peekDomainEvents();

    assert.equal(assumption.status, ASSUMPTION_STATUS.CONFIRMED);
    assert.equal(assumption.confidence, null);
    assert.equal(assumption.confirmedBy, "USER-002");
    assert.equal(assumption.validTo, "2026-08-05");
    assert.equal(event.eventType, ASSUMPTION_EVENT_TYPE.CONFIRMED);
  }
);

test(
  "UNKNOWNから証拠を得て直接CONFIRMEDにできる",
  () => {
    const assumption = createAssumption();

    assumption.confirm({
      confirmedAt: CONFIRMED_AT,
      confirmedBy: "USER-002",
      evidenceType: ASSUMPTION_EVIDENCE_TYPE.DOCUMENT,
      evidence: "受入票",
      actor: USER_ACTOR,
      eventId: "EVT-0303"
    });

    assert.equal(assumption.status, ASSUMPTION_STATUS.CONFIRMED);
  }
);

test(
  "CONFIRMEDへの変更に判断者がなければ状態を変更しない",
  () => {
    const assumption = createAssumption();

    assert.throws(
      () => assumption.confirm({
        confirmedAt: CONFIRMED_AT,
        confirmedBy: "",
        actor: USER_ACTOR,
        eventId: "EVT-0304"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_ASSUMPTION_TEXT
      )
    );

    assert.equal(assumption.status, ASSUMPTION_STATUS.UNKNOWN);
    assert.equal(assumption.getDomainEventCount(), 0);
  }
);

test(
  "UNKNOWNからREJECTEDへ変更し不成立根拠を必須とする",
  () => {
    const assumption = createAssumption();

    assumption.reject({
      rejectedAt: CONFIRMED_AT,
      rejectedBy: "USER-003",
      evidenceType: ASSUMPTION_EVIDENCE_TYPE.EXTERNAL_CONFIRMATION,
      evidence: "仕入先から納入不可の回答",
      impactDescription: "計画日には加工開始不可",
      actor: USER_ACTOR,
      eventId: "EVT-0305"
    });

    const [event] = assumption.peekDomainEvents();

    assert.equal(assumption.status, ASSUMPTION_STATUS.REJECTED);
    assert.equal(assumption.confirmedBy, "USER-003");
    assert.equal(event.eventType, ASSUMPTION_EVENT_TYPE.REJECTED);
  }
);

test(
  "REJECTEDのEvidenceを空欄へ変更できない",
  () => {
    const assumption = createAssumption({
      status: ASSUMPTION_STATUS.REJECTED,
      confirmedAt: CONFIRMED_AT,
      confirmedBy: "USER-003",
      evidenceType: ASSUMPTION_EVIDENCE_TYPE.EMAIL,
      evidence: "納入不可"
    });

    assert.throws(
      () => assumption.updateEvidence({
        evidenceType: null,
        evidence: "",
        changedAt: CHANGED_AT,
        actor: USER_ACTOR,
        eventId: "EVT-0306"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_ASSUMPTION_EVIDENCE
      )
    );

    assert.equal(assumption.evidence, "納入不可");
  }
);

test(
  "CONFIRMED AssumptionはValidity期間内だけ有効",
  () => {
    const assumption = createConfirmedAssumption();

    assert.equal(assumption.isEffectiveOn("2026-08-01"), false);
    assert.equal(assumption.isEffectiveOn("2026-08-02"), true);
    assert.equal(assumption.isEffectiveOn("2026-08-05"), true);
    assert.equal(assumption.isEffectiveOn("2026-08-06"), false);
  }
);

test(
  "EXPECTEDやREJECTEDはValidity範囲内でも有効な事実として扱わない",
  () => {
    const expected = createAssumption({
      status: ASSUMPTION_STATUS.EXPECTED,
      confidence: ASSUMPTION_CONFIDENCE.HIGH,
      validFrom: "2026-08-01",
      validTo: "2026-08-10"
    });

    const rejected = createAssumption({
      status: ASSUMPTION_STATUS.REJECTED,
      confirmedAt: CONFIRMED_AT,
      confirmedBy: "USER-003",
      evidence: "不成立"
    });

    assert.equal(expected.isEffectiveOn("2026-08-03"), false);
    assert.equal(rejected.isEffectiveOn("2026-08-03"), false);
  }
);

test(
  "CONFIRMEDとEXPECTEDをEXPIREDへ変更できる",
  () => {
    const confirmed = createConfirmedAssumption();
    const expected = createAssumption({
      assumptionId: "ASM-0002",
      status: ASSUMPTION_STATUS.EXPECTED,
      confidence: ASSUMPTION_CONFIDENCE.LOW
    });

    confirmed.markExpired({
      expiredAt: "2026-08-06T00:00:00+09:00",
      reason: "有効期間終了",
      actor: USER_ACTOR,
      eventId: "EVT-0307"
    });

    expected.markExpired({
      expiredAt: "2026-08-03T00:00:00+09:00",
      reason: "確認期限を過ぎたため",
      actor: USER_ACTOR,
      eventId: "EVT-0308"
    });

    assert.equal(confirmed.status, ASSUMPTION_STATUS.EXPIRED);
    assert.equal(expected.status, ASSUMPTION_STATUS.EXPIRED);
    assert.equal(
      confirmed.peekDomainEvents()[0].eventType,
      ASSUMPTION_EVENT_TYPE.EXPIRED
    );
  }
);

test(
  "UNKNOWNを直接EXPIREDへ変更できない",
  () => {
    const assumption = createAssumption();

    assert.throws(
      () => assumption.markExpired({
        expiredAt: CHANGED_AT,
        reason: "期限切れ",
        actor: USER_ACTOR,
        eventId: "EVT-0309"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_ASSUMPTION_TRANSITION
      )
    );
  }
);

test(
  "REJECTEDとEXPIREDをUNKNOWNへ再Openし旧判断Dataを現在状態から除く",
  () => {
    const rejected = createAssumption({
      status: ASSUMPTION_STATUS.REJECTED,
      confirmedAt: CONFIRMED_AT,
      confirmedBy: "USER-003",
      evidenceType: ASSUMPTION_EVIDENCE_TYPE.EMAIL,
      evidence: "不成立"
    });

    rejected.reopen({
      reopenedAt: "2026-08-03T09:00:00+09:00",
      reopenedBy: "USER-004",
      owner: "Purchasing",
      confirmationDueDate: "2026-08-04",
      reason: "仕入先が再調整を開始したため",
      actor: USER_ACTOR,
      eventId: "EVT-0310"
    });

    assert.equal(rejected.status, ASSUMPTION_STATUS.UNKNOWN);
    assert.equal(rejected.confirmedAt, null);
    assert.equal(rejected.confirmedBy, "");
    assert.equal(rejected.evidence, "");
    assert.equal(rejected.owner, "Purchasing");
    assert.equal(
      rejected.peekDomainEvents()[0].eventType,
      ASSUMPTION_EVENT_TYPE.REOPENED
    );
  }
);

test(
  "UNKNOWNをreopenできない",
  () => {
    const assumption = createAssumption();

    assert.throws(
      () => assumption.reopen({
        reopenedAt: CHANGED_AT,
        reopenedBy: "USER-004",
        reason: "再確認",
        actor: USER_ACTOR,
        eventId: "EVT-0311"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_ASSUMPTION_TRANSITION
      )
    );
  }
);

test(
  "EXPIRED Assumptionを新しい証拠で再CONFIRMEDにできる",
  () => {
    const assumption = createConfirmedAssumption();

    assumption.markExpired({
      expiredAt: "2026-08-06T00:00:00+09:00",
      reason: "期限終了",
      actor: USER_ACTOR,
      eventId: "EVT-0312"
    });
    assumption.pullDomainEvents();

    assumption.confirm({
      confirmedAt: "2026-08-06T08:00:00+09:00",
      confirmedBy: "USER-005",
      evidenceType: ASSUMPTION_EVIDENCE_TYPE.SYSTEM_RECORD,
      evidence: "新しい入荷確定記録",
      validFrom: "2026-08-06",
      validTo: "2026-08-08",
      actor: USER_ACTOR,
      eventId: "EVT-0313"
    });

    assert.equal(assumption.status, ASSUMPTION_STATUS.CONFIRMED);
    assert.equal(assumption.confirmedBy, "USER-005");
  }
);

test(
  "Ownerと確認期限を変更し期限超過を判定する",
  () => {
    const assumption = createAssumption();

    assumption.changeOwner({
      owner: "Purchasing",
      confirmationDueDate: "2026-08-03",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0314"
    });

    assert.equal(assumption.isConfirmationOverdue("2026-08-03"), false);
    assert.equal(assumption.isConfirmationOverdue("2026-08-04"), true);
    assert.equal(
      assumption.peekDomainEvents()[0].eventType,
      ASSUMPTION_EVENT_TYPE.OWNER_CHANGED
    );
  }
);

test(
  "CONFIRMED後は確認期限を過ぎてもOverdueにしない",
  () => {
    const assumption = createConfirmedAssumption({
      confirmationDueDate: "2026-08-01"
    });

    assert.equal(
      assumption.isConfirmationOverdue("2026-08-10"),
      false
    );
  }
);

test(
  "Blocking・Impactを理由付きで変更する",
  () => {
    const assumption = createAssumption({ blocking: false, impactLevel: null });

    assumption.changeBlocking({
      blocking: true,
      impactLevel: ASSUMPTION_IMPACT_LEVEL.HIGH,
      impactDescription: "成立しなければ全量を開始できない",
      reason: "計画成立の必須条件と判明",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0315"
    });

    const [event] = assumption.peekDomainEvents();

    assert.equal(assumption.blocking, true);
    assert.equal(assumption.impactLevel, ASSUMPTION_IMPACT_LEVEL.HIGH);
    assert.equal(event.eventType, ASSUMPTION_EVENT_TYPE.BLOCKING_CHANGED);
  }
);

test(
  "EvidenceとSource更新日時を変更する",
  () => {
    const assumption = createAssumption();

    assumption.updateEvidence({
      evidenceType: ASSUMPTION_EVIDENCE_TYPE.INTERVIEW,
      evidence: "担当者への確認結果",
      sourceUpdatedAt: CHANGED_AT,
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0316"
    });

    assert.equal(assumption.evidence, "担当者への確認結果");
    assert.equal(
      assumption.peekDomainEvents()[0].eventType,
      ASSUMPTION_EVENT_TYPE.EVIDENCE_UPDATED
    );
  }
);

test(
  "Validityを変更し不正な期間なら現在状態を維持する",
  () => {
    const assumption = createConfirmedAssumption();

    assert.throws(
      () => assumption.changeValidity({
        validFrom: "2026-08-10",
        validTo: "2026-08-09",
        changedAt: CHANGED_AT,
        actor: USER_ACTOR,
        eventId: "EVT-0317"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.INVALID_VALIDITY_PERIOD
      )
    );

    assert.equal(assumption.validFrom, "2026-08-02");
    assert.equal(assumption.getDomainEventCount(), 0);
  }
);

test(
  "DescriptionとNoteを個別に変更する",
  () => {
    const assumption = createAssumption();

    assumption.changeDescription({
      description: "材料が前日までに入荷する",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-0318"
    });

    assumption.changeNote({
      note: "朝会で再確認",
      changedAt: "2026-08-01T19:05:00+09:00",
      actor: USER_ACTOR,
      eventId: "EVT-0319"
    });

    assert.equal(assumption.description, "材料が前日までに入荷する");
    assert.equal(assumption.note, "朝会で再確認");
    assert.deepEqual(
      assumption.peekDomainEvents().map((event) => event.eventType),
      [
        ASSUMPTION_EVENT_TYPE.DESCRIPTION_CHANGED,
        ASSUMPTION_EVENT_TYPE.NOTE_CHANGED
      ]
    );
  }
);

test(
  "Snapshotは正規化され外部から変更できない",
  () => {
    const assumption = createAssumption({
      description: "  材料到着  ",
      note: "  確認待ち  "
    });
    const snapshot = assumption.toSnapshot();

    assert.equal(snapshot.description, "材料到着");
    assert.equal(snapshot.note, "確認待ち");
    assert.equal(Object.isFrozen(snapshot), true);

    assert.throws(
      () => {
        snapshot.status = ASSUMPTION_STATUS.CONFIRMED;
      },
      TypeError
    );

    assert.equal(assumption.status, ASSUMPTION_STATUS.UNKNOWN);
  }
);

test(
  "Event記録失敗時はStatusを変更しない",
  () => {
    const collector = new DomainEventCollector();
    const assumption = createAssumption({}, { eventCollector: collector });

    assumption.changeNote({
      note: "先行Event",
      changedAt: CHANGED_AT,
      actor: USER_ACTOR,
      eventId: "EVT-DUPLICATE"
    });

    assert.throws(
      () => assumption.markExpected({
        confidence: ASSUMPTION_CONFIDENCE.HIGH,
        changedAt: CHANGED_AT,
        actor: USER_ACTOR,
        eventId: "EVT-DUPLICATE"
      }),
      (error) => hasErrorCode(
        error,
        ERROR_CODES.DUPLICATE_DOMAIN_EVENT
      )
    );

    assert.equal(assumption.status, ASSUMPTION_STATUS.UNKNOWN);
    assert.equal(assumption.confidence, null);
  }
);

test(
  "pullDomainEventsはEventを返してCollectorを空にする",
  () => {
    const assumption = Assumption.create(
      createAssumptionData(),
      {
        eventId: "EVT-0320",
        actor: USER_ACTOR,
        occurredAt: REGISTERED_AT
      }
    );

    const events = assumption.pullDomainEvents();

    assert.equal(events.length, 1);
    assert.equal(assumption.hasDomainEvents(), false);
  }
);

test(
  "assertAssumptionはAssumptionだけを受け付ける",
  () => {
    const assumption = createAssumption();

    assert.equal(assertAssumption(assumption), assumption);

    assert.throws(
      () => assertAssumption({}),
      (error) => hasErrorCode(error, ERROR_CODES.INVALID_ARGUMENT)
    );
  }
);
