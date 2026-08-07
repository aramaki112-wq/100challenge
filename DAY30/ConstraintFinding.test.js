import test from "node:test";
import assert from "node:assert/strict";

import {
  CONSTRAINT_CATEGORY,
  CONSTRAINT_SEVERITY,
  DATA_CONFIDENCE,
  FINDING_CONFIRMATION_STATUS,
  FINDING_SOURCE_TYPE
} from "./DiagnosisCodes.js";

import { ERROR_CODES, hasErrorCode } from "./DiagnosisErrors.js";
import {
  ConstraintFinding,
  assertConstraintFinding
} from "./ConstraintFinding.js";

function createFinding(overrides = {}) {
  return new ConstraintFinding({
    findingId: "CF-0001",
    plannedOperationId: "POP-0001",
    category: CONSTRAINT_CATEGORY.CAPACITY,
    reasonCode: "CAPACITY_SHORTAGE",
    severity: CONSTRAINT_SEVERITY.HIGH,
    confirmationStatus: FINDING_CONFIRMATION_STATUS.CONFIRMED,
    title: "設備時間が不足しています",
    description: "必要時間に対して利用可能時間が不足しています。",
    blocking: true,
    preventsExecution: false,
    sourceType: FINDING_SOURCE_TYPE.CAPACITY_ALLOCATION,
    sourceId: "CAL-0001",
    observedAt: "2026-08-01T21:00:00+09:00",
    dataConfidence: DATA_CONFIDENCE.A,
    requiredValue: 480,
    availableValue: 420,
    shortageValue: 60,
    unit: "MINUTE",
    evidence: "Capacity Ledger",
    recommendedAction: "別Shiftへの移動を検討する",
    ...overrides
  });
}

test("Constraint Findingを不変Objectとして生成できる", () => {
  const finding = createFinding();
  assert.equal(finding.shortageValue, 60);
  assert.equal(finding.hasQuantifiedShortage(), true);
  assert.equal(finding.requiresImmediateAction(), true);
  assert.equal(Object.isFrozen(finding), true);
});

test("定量値を持たないConstraint Findingも生成できる", () => {
  const finding = createFinding({
    category: CONSTRAINT_CATEGORY.ROUTING,
    requiredValue: null,
    availableValue: null,
    shortageValue: null,
    unit: null
  });
  assert.equal(finding.hasQuantifiedShortage(), false);
});

test("不足値は必要値と利用可能値の差に一致しなければならない", () => {
  assert.throws(
    () => createFinding({ shortageValue: 59 }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_FINDING_METRICS)
  );
});

test("定量値は一部だけ指定できない", () => {
  assert.throws(
    () => createFinding({ unit: null }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_FINDING_METRICS)
  );
});

test("実行を妨げるFindingはblockingでなければならない", () => {
  assert.throws(
    () => createFinding({ blocking: false, preventsExecution: true }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_CONSTRAINT_FINDING)
  );
});

test("LOW Severityは即時Action対象にならない", () => {
  const finding = createFinding({ severity: CONSTRAINT_SEVERITY.LOW });
  assert.equal(finding.requiresImmediateAction(), false);
});

test("Identifierに空白を含められない", () => {
  assert.throws(
    () => createFinding({ findingId: "CF 0001" }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_CONSTRAINT_FINDING)
  );
});

test("正式でないSource Typeを拒否する", () => {
  assert.throws(
    () => createFinding({ sourceType: "SPREADSHEET_GUESS" }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_FINDING_SOURCE)
  );
});

test("Snapshotも変更できない", () => {
  const snapshot = createFinding().toSnapshot();
  assert.equal(Object.isFrozen(snapshot), true);
  assert.throws(() => {
    snapshot.shortageValue = 0;
  }, TypeError);
});

test("assertConstraintFindingは別Objectを拒否する", () => {
  assert.throws(
    () => assertConstraintFinding({}),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_CONSTRAINT_FINDING)
  );
});
