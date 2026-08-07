import test from "node:test";
import assert from "node:assert/strict";

import {
  FIELD_IMPACT_CLASSIFICATION,
  RESULT_VALIDITY_STATUS,
  REVISION_CHANGE_TYPE,
  STALE_REASON_CODE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  StaleReasonDetector,
  assertStaleReasonDetection
} from "./StaleReasonDetector.js";

import {
  createValidityTestDiagnosisResult,
  currentValiditySources
} from "./DiagnosisValidityTestFixture.js";

function detect(overrides = {}) {
  return new StaleReasonDetector().detect({
    diagnosisResult: createValidityTestDiagnosisResult(),
    ...currentValiditySources(),
    ...overrides
  });
}

test("同じSource RevisionならCURRENTになる", () => {
  const result = detect();

  assert.equal(result.validityStatus, RESULT_VALIDITY_STATUS.CURRENT);
  assert.deepEqual(result.reasonCodes, []);
  assert.deepEqual(result.changes, []);
  assert.equal(result.requiresRediagnosis, false);
});

test("Capacity Revision変更をSTALEとして検出する", () => {
  const result = detect({
    currentCapacitySourceRevision: {
      capacity: 4,
      calendar: 5,
      assignment: 2,
      capacityRule: 4
    }
  });

  assert.equal(result.validityStatus, RESULT_VALIDITY_STATUS.STALE);
  assert.deepEqual(result.reasonCodes, [
    STALE_REASON_CODE.CAPACITY_REVISION_CHANGED
  ]);
  assert.equal(result.changes[0].key, "capacity");
  assert.equal(
    result.changes[0].changeType,
    REVISION_CHANGE_TYPE.VALUE_CHANGED
  );
});

test("Calendar・Assignment・Capacity Rule変更を個別Reasonへ変換する", () => {
  const result = detect({
    currentCapacitySourceRevision: {
      capacity: 3,
      calendar: 6,
      assignment: 3,
      capacityRule: 5
    }
  });

  assert.deepEqual(result.reasonCodes, [
    STALE_REASON_CODE.ASSIGNMENT_REVISION_CHANGED,
    STALE_REASON_CODE.CALENDAR_REVISION_CHANGED,
    STALE_REASON_CODE.CAPACITY_RULE_REVISION_CHANGED
  ]);
});

test("Plan・Assumption・Routing変更を個別Reasonへ変換する", () => {
  const result = detect({
    currentDiagnosisInputRevision: {
      plan: 8,
      assumption: 3,
      routing: 5,
      modelCoverage: 1
    }
  });

  assert.deepEqual(result.reasonCodes, [
    STALE_REASON_CODE.ASSUMPTION_CHANGED,
    STALE_REASON_CODE.PLAN_VERSION_CHANGED,
    STALE_REASON_CODE.ROUTING_CHANGED
  ]);
});

test("Scenario–Assumption接続変更をAssumption変更として扱う", () => {
  const diagnosisResult = createValidityTestDiagnosisResult({
    diagnosisInputRevision: {
      plan: 7,
      assumption: 2,
      routing: 4,
      modelCoverage: 1,
      scenarioAssumptionRelation: 1
    }
  });

  const result = new StaleReasonDetector().detect({
    diagnosisResult,
    ...currentValiditySources(),
    currentDiagnosisInputRevision: {
      plan: 7,
      assumption: 2,
      routing: 4,
      modelCoverage: 1,
      scenarioAssumptionRelation: 2
    }
  });

  assert.deepEqual(result.reasonCodes, [
    STALE_REASON_CODE.ASSUMPTION_CHANGED
  ]);
});

test("未知のRevision Key変更はSource別Generic Reasonにする", () => {
  const diagnosisResult = createValidityTestDiagnosisResult({
    capacitySourceRevision: {
      capacity: 3,
      customCapacitySource: 1
    },
    diagnosisInputRevision: {
      plan: 7,
      customInput: 2
    }
  });

  const result = new StaleReasonDetector().detect({
    diagnosisResult,
    currentCapacitySourceRevision: {
      capacity: 3,
      customCapacitySource: 2
    },
    currentDiagnosisInputRevision: {
      plan: 7,
      customInput: 3
    }
  });

  assert.deepEqual(result.reasonCodes, [
    STALE_REASON_CODE.CAPACITY_SOURCE_REVISION_CHANGED,
    STALE_REASON_CODE.DIAGNOSIS_INPUT_REVISION_CHANGED
  ]);
});

test("Presentation-only変更は記録するがSTALEにしない", () => {
  const result = detect({
    currentDiagnosisInputRevision: {
      plan: 8,
      assumption: 2,
      routing: 4,
      modelCoverage: 1
    },
    diagnosisInputRevisionImpactByKey: {
      plan: FIELD_IMPACT_CLASSIFICATION.PRESENTATION_ONLY
    }
  });

  assert.equal(result.validityStatus, RESULT_VALIDITY_STATUS.CURRENT);
  assert.deepEqual(result.reasonCodes, []);
  assert.equal(result.changes.length, 1);
  assert.equal(
    result.changes[0].impactClassification,
    FIELD_IMPACT_CLASSIFICATION.PRESENTATION_ONLY
  );
});

test("Source Identity変更は比較対象不一致のためINVALIDになる", () => {
  const result = detect({ currentPlanVersionId: "PV-0002" });

  assert.equal(result.validityStatus, RESULT_VALIDITY_STATUS.INVALID);
  assert.deepEqual(result.reasonCodes, [
    STALE_REASON_CODE.PLAN_VERSION_CHANGED
  ]);
  assert.equal(
    result.changes[0].changeType,
    REVISION_CHANGE_TYPE.IDENTITY_CHANGED
  );
});

test("Revision Key追加・削除はSchema変更としてINVALIDになる", () => {
  const added = detect({
    currentCapacitySourceRevision: {
      capacity: 3,
      calendar: 5,
      assignment: 2,
      capacityRule: 4,
      worker: 1
    }
  });
  assert.equal(added.validityStatus, RESULT_VALIDITY_STATUS.INVALID);
  assert.deepEqual(added.reasonCodes, [
    STALE_REASON_CODE.SOURCE_REVISION_SCHEMA_CHANGED
  ]);
  assert.equal(added.changes[0].changeType, REVISION_CHANGE_TYPE.KEY_ADDED);

  const removed = detect({
    currentDiagnosisInputRevision: {
      plan: 7,
      assumption: 2,
      routing: 4
    }
  });
  assert.equal(removed.validityStatus, RESULT_VALIDITY_STATUS.INVALID);
  assert.equal(
    removed.changes[0].changeType,
    REVISION_CHANGE_TYPE.KEY_REMOVED
  );
});

test("Revision後退はSource整合性不明のためINVALIDになる", () => {
  const result = detect({
    currentCapacitySourceRevision: {
      capacity: 2,
      calendar: 5,
      assignment: 2,
      capacityRule: 4
    }
  });

  assert.equal(result.validityStatus, RESULT_VALIDITY_STATUS.INVALID);
  assert.deepEqual(result.reasonCodes, [
    STALE_REASON_CODE.SOURCE_REVISION_REGRESSION
  ]);
});

test("Presentation-onlyのSchema変更は診断Validityを無効化しない", () => {
  const result = detect({
    currentDiagnosisInputRevision: {
      plan: 7,
      assumption: 2,
      routing: 4,
      modelCoverage: 1,
      dashboardLayout: 1
    },
    diagnosisInputRevisionImpactByKey: {
      dashboardLayout: FIELD_IMPACT_CLASSIFICATION.PRESENTATION_ONLY
    }
  });

  assert.equal(result.validityStatus, RESULT_VALIDITY_STATUS.CURRENT);
  assert.equal(result.changes.length, 1);
});

test("Revision・Impact Mapの不正値を拒否する", () => {
  assert.throws(
    () => detect({ currentCapacitySourceRevision: {} }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_SOURCE_REVISION)
  );

  assert.throws(
    () => detect({
      diagnosisInputRevisionImpactByKey: { plan: "MAYBE" }
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_REVISION_IMPACT_MAP)
  );
});

test("DetectionとSnapshotを外部から変更できない", () => {
  const result = detect({
    currentDiagnosisInputRevision: {
      plan: 8,
      assumption: 2,
      routing: 4,
      modelCoverage: 1
    }
  });
  const snapshot = result.toSnapshot();

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.reasonCodes), true);
  assert.equal(Object.isFrozen(result.changes), true);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.changes), true);
});

test("assertStaleReasonDetectionは正式Objectだけを受け付ける", () => {
  const result = detect();
  assert.equal(assertStaleReasonDetection(result), result);
  assert.throws(
    () => assertStaleReasonDetection({}),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_STALE_REASON_DETECTION
    )
  );
});
